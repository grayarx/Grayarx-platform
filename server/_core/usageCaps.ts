/**
 * Enforce subscription usage caps before expensive OpenAI / WhatsApp paths.
 * Soft-block with a friendly message; log overage for future billing.
 */

import { and, count, eq, gte } from "drizzle-orm";
import {
  TIER_USAGE_CAPS,
  tierAtLeast,
  type SubscriptionTierId,
  type TierUsageCaps,
} from "../../shared/subscriptionTiers";
import {
  chatbotConversations,
  dealerships,
  whatsappConversations,
  whatsappMessages,
} from "../../drizzle/schema";
import { getDb } from "../db";

export type UsageCheckKind = "ai_session" | "whatsapp_message" | "whatsapp_cloud";

export type UsageSnapshot = {
  tier: SubscriptionTierId;
  caps: TierUsageCaps;
  aiSessionsUsed: number;
  whatsappMessagesUsed: number;
  aiSessionsExceeded: boolean;
  whatsappMessagesExceeded: boolean;
  cloudWhatsAppAllowed: boolean;
};

export type SoftBlockResult = {
  blocked: boolean;
  kind?: UsageCheckKind;
  /** Customer-facing friendly reply when soft-blocked */
  message?: string;
  snapshot: UsageSnapshot;
};

function monthStartUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

function normalizeTier(plan: string | null | undefined): SubscriptionTierId {
  if (plan === "professional" || plan === "enterprise" || plan === "starter") {
    return plan;
  }
  return "starter";
}

/** In-memory overage log for later billing / founder review. */
const overageLog: Array<{
  at: string;
  dealershipId: number;
  kind: UsageCheckKind;
  tier: SubscriptionTierId;
  used: number;
  limit: number;
}> = [];

export function getOverageLogSnapshot(limit = 50) {
  return overageLog.slice(-limit);
}

function logOverage(
  dealershipId: number,
  kind: UsageCheckKind,
  tier: SubscriptionTierId,
  used: number,
  limit: number,
) {
  const entry = {
    at: new Date().toISOString(),
    dealershipId,
    kind,
    tier,
    used,
    limit,
  };
  overageLog.push(entry);
  if (overageLog.length > 500) overageLog.splice(0, overageLog.length - 500);
  console.warn(
    `[UsageCap] OVERAGE dealership=${dealershipId} kind=${kind} tier=${tier} used=${used} limit=${limit}`,
  );
}

export async function resolveDealershipTier(
  dealershipId: number,
): Promise<SubscriptionTierId> {
  const db = await getDb();
  if (!db || !dealershipId) return "starter";
  const [row] = await db
    .select({ plan: dealerships.plan })
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId))
    .limit(1);
  return normalizeTier(row?.plan);
}

export async function getUsageSnapshot(
  dealershipId: number,
): Promise<UsageSnapshot> {
  const tier = await resolveDealershipTier(dealershipId);
  const caps = TIER_USAGE_CAPS[tier];
  const db = await getDb();
  const start = monthStartUtc();

  let aiSessionsUsed = 0;
  let whatsappMessagesUsed = 0;

  if (db && dealershipId > 0) {
    try {
      const [webSessions] = await db
        .select({ n: count() })
        .from(chatbotConversations)
        .where(
          and(
            eq(chatbotConversations.dealershipId, dealershipId),
            gte(chatbotConversations.updatedAt, start),
          ),
        );
      aiSessionsUsed += Number(webSessions?.n ?? 0);

      const [waSessions] = await db
        .select({ n: count() })
        .from(whatsappConversations)
        .where(
          and(
            eq(whatsappConversations.dealershipId, dealershipId),
            gte(whatsappConversations.lastMessageAt, start),
          ),
        );
      // WhatsApp threads count toward AI sessions when Cloud API is in play
      if (caps.cloudWhatsApp) {
        aiSessionsUsed += Number(waSessions?.n ?? 0);
      }

      const [waMsgs] = await db
        .select({ n: count() })
        .from(whatsappMessages)
        .innerJoin(
          whatsappConversations,
          eq(whatsappMessages.conversationId, whatsappConversations.id),
        )
        .where(
          and(
            eq(whatsappConversations.dealershipId, dealershipId),
            gte(whatsappMessages.createdAt, start),
          ),
        );
      whatsappMessagesUsed = Number(waMsgs?.n ?? 0);
    } catch (err) {
      console.warn(
        "[UsageCap] count failed — allowing request:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return {
    tier,
    caps,
    aiSessionsUsed,
    whatsappMessagesUsed,
    aiSessionsExceeded:
      caps.aiSessionsPerMonth > 0 &&
      aiSessionsUsed >= caps.aiSessionsPerMonth,
    whatsappMessagesExceeded:
      caps.whatsappMessagesPerMonth > 0 &&
      whatsappMessagesUsed >= caps.whatsappMessagesPerMonth,
    cloudWhatsAppAllowed: caps.cloudWhatsApp,
  };
}

const AI_SOFT_BLOCK =
  "Thanks for chatting — we've hit this month's AI chat allowance for this showroom. A team member can still help you on the lot, or try again next month. For anything urgent, reply with your name and number and we'll make sure someone follows up.";

const WA_MSG_SOFT_BLOCK =
  "Thanks for your message — this dealership has reached its WhatsApp message allowance for the month. Please try again next month, or visit the showroom / website to continue. We've logged your interest.";

const WA_STARTER_BLOCK =
  "WhatsApp AI (Cloud API) is available on the Growth plan and above. This showroom uses click-to-chat / web chat on Showroom. Please visit the dealership website to chat with Nala, or ask the dealer about upgrading.";

/**
 * Check before OpenAI polish / heavy AI paths.
 * Soft-blocks when over AI session cap (templates may still run in caller).
 */
export async function checkAiSessionCap(
  dealershipId: number | undefined | null,
): Promise<SoftBlockResult> {
  if (!dealershipId || dealershipId <= 0) {
    const tier: SubscriptionTierId = "starter";
    return {
      blocked: false,
      snapshot: {
        tier,
        caps: TIER_USAGE_CAPS[tier],
        aiSessionsUsed: 0,
        whatsappMessagesUsed: 0,
        aiSessionsExceeded: false,
        whatsappMessagesExceeded: false,
        cloudWhatsAppAllowed: false,
      },
    };
  }

  const snapshot = await getUsageSnapshot(dealershipId);
  if (snapshot.aiSessionsExceeded) {
    logOverage(
      dealershipId,
      "ai_session",
      snapshot.tier,
      snapshot.aiSessionsUsed,
      snapshot.caps.aiSessionsPerMonth,
    );
    return { blocked: true, kind: "ai_session", message: AI_SOFT_BLOCK, snapshot };
  }
  return { blocked: false, snapshot };
}

/**
 * Check before WhatsApp Cloud API bot handling.
 * Blocks Starter entirely; soft-blocks when message cap exceeded.
 */
export async function checkWhatsAppUsageCap(
  dealershipId: number,
): Promise<SoftBlockResult> {
  const snapshot = await getUsageSnapshot(dealershipId);

  if (!snapshot.cloudWhatsAppAllowed) {
    console.info(
      `[UsageCap] Cloud WhatsApp blocked for dealership=${dealershipId} tier=${snapshot.tier} (Showroom = click-to-chat only)`,
    );
    return {
      blocked: true,
      kind: "whatsapp_cloud",
      message: WA_STARTER_BLOCK,
      snapshot,
    };
  }

  if (snapshot.whatsappMessagesExceeded) {
    logOverage(
      dealershipId,
      "whatsapp_message",
      snapshot.tier,
      snapshot.whatsappMessagesUsed,
      snapshot.caps.whatsappMessagesPerMonth,
    );
    return {
      blocked: true,
      kind: "whatsapp_message",
      message: WA_MSG_SOFT_BLOCK,
      snapshot,
    };
  }

  // Also soft-block AI polish path when AI sessions exhausted (still allow
  // template replies until WhatsApp message cap — caller decides).
  return { blocked: false, snapshot };
}

/** Whether plan may use WhatsApp Cloud API bot (Growth+). */
export function planAllowsCloudWhatsApp(tier: SubscriptionTierId): boolean {
  return tierAtLeast(tier, "professional");
}

/** Expose for health / admin debug. */
export function usageCapSqlMonthStart(): string {
  return monthStartUtc().toISOString();
}
