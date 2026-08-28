/**
 * Per-dealership plan metering.
 *
 * Two meters (priced into packages):
 * 1) WhatsApp conversations — unique buyer phone per dealership per calendar month
 *    (Meta-aligned “conversation” style allotment dealers understand as reply volume).
 * 2) LLM polish credits — optional OpenAI rewrite of the template reply.
 *    When polish is exhausted (or OPENAI missing/quota), Nala keeps working on templates.
 *
 * Pilot: hard stop when WA included is hit (no overage).
 * Paid: continue sending; overage accrues at package rate.
 */

import { newId, readJsonFile, writeJsonFile } from "@/lib/conversion/store";
import {
  GRAYARX_OS_PACKAGES,
  packageById,
  type SellPackage,
} from "@/lib/os/unit-economics";
import {
  getDealershipSettings,
  updateDealershipSettings,
} from "@/lib/dealership/settings";

export type PlanId = SellPackage["id"];

export type UsageEvent = {
  id: string;
  dealershipId: string;
  kind: "whatsapp_conversation" | "llm_polish" | "template_reply";
  buyerPhone?: string;
  monthKey: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

type UsageState = {
  events: UsageEvent[];
};

const FILE = "usage.json";

export function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function load(): UsageState {
  return readJsonFile(FILE, { events: [] });
}

function save(state: UsageState) {
  writeJsonFile(FILE, state);
}

export function getDealershipPlan(dealershipId: string): PlanId {
  const s = getDealershipSettings(dealershipId);
  return s.planId ?? "pilot";
}

export function setDealershipPlan(
  dealershipId: string,
  planId: PlanId,
): { settings: ReturnType<typeof getDealershipSettings>; package: SellPackage } {
  if (!GRAYARX_OS_PACKAGES.some((p) => p.id === planId)) {
    throw new Error(`Unknown plan ${planId}`);
  }
  const settings = updateDealershipSettings(dealershipId, { planId });
  return { settings, package: packageById(planId) };
}

export function planLimits(planId: PlanId): {
  includedWhatsApp: number;
  includedLlmPolish: number;
  overagePerConversationZar: number;
  hardStopWhatsApp: boolean;
} {
  const pkg = packageById(planId);
  return {
    includedWhatsApp: pkg.includedWhatsAppConversations,
    // 1:1 with WA allotment — polish is the expensive layer we protect first
    includedLlmPolish: pkg.includedWhatsAppConversations,
    overagePerConversationZar: pkg.overagePerConversationZar,
    hardStopWhatsApp: planId === "pilot",
  };
}

function eventsFor(
  dealershipId: string,
  kind: UsageEvent["kind"],
  month = monthKey(),
): UsageEvent[] {
  return load().events.filter(
    (e) =>
      e.dealershipId === dealershipId &&
      e.kind === kind &&
      e.monthKey === month,
  );
}

/** Unique buyer phones messaged this month = billed conversations */
export function countWhatsAppConversations(
  dealershipId: string,
  month = monthKey(),
): number {
  const phones = new Set(
    eventsFor(dealershipId, "whatsapp_conversation", month)
      .map((e) => e.buyerPhone?.replace(/\D/g, ""))
      .filter(Boolean),
  );
  return phones.size;
}

export function countLlmPolish(
  dealershipId: string,
  month = monthKey(),
): number {
  return eventsFor(dealershipId, "llm_polish", month).length;
}

export function countTemplateReplies(
  dealershipId: string,
  month = monthKey(),
): number {
  return eventsFor(dealershipId, "template_reply", month).length;
}

function alreadyCountedConversation(
  dealershipId: string,
  buyerPhone: string,
  month = monthKey(),
): boolean {
  const digits = buyerPhone.replace(/\D/g, "");
  return eventsFor(dealershipId, "whatsapp_conversation", month).some(
    (e) => e.buyerPhone?.replace(/\D/g, "") === digits,
  );
}

export type WhatsAppGate =
  | {
      allowed: true;
      isNewConversation: boolean;
      overage: boolean;
      overageZar: number;
      used: number;
      included: number;
      remaining: number;
      planId: PlanId;
    }
  | {
      allowed: false;
      reason: string;
      used: number;
      included: number;
      planId: PlanId;
    };

export function gateWhatsAppSend(input: {
  dealershipId: string;
  buyerPhone: string;
}): WhatsAppGate {
  const planId = getDealershipPlan(input.dealershipId);
  const limits = planLimits(planId);
  const used = countWhatsAppConversations(input.dealershipId);
  const isNew = !alreadyCountedConversation(
    input.dealershipId,
    input.buyerPhone,
  );
  const projected = isNew ? used + 1 : used;
  const remaining = Math.max(0, limits.includedWhatsApp - used);

  if (isNew && projected > limits.includedWhatsApp) {
    if (limits.hardStopWhatsApp) {
      return {
        allowed: false,
        reason: `Pilot WhatsApp cap reached (${limits.includedWhatsApp}/mo). Upgrade to Starter+ to keep converting — overage is paid on paid plans.`,
        used,
        included: limits.includedWhatsApp,
        planId,
      };
    }
    const overageUnits = projected - limits.includedWhatsApp;
    return {
      allowed: true,
      isNewConversation: true,
      overage: true,
      overageZar: overageUnits * limits.overagePerConversationZar,
      used,
      included: limits.includedWhatsApp,
      remaining: 0,
      planId,
    };
  }

  return {
    allowed: true,
    isNewConversation: isNew,
    overage: false,
    overageZar: 0,
    used,
    included: limits.includedWhatsApp,
    remaining,
    planId,
  };
}

export function recordWhatsAppConversation(input: {
  dealershipId: string;
  buyerPhone: string;
}): UsageEvent | null {
  if (alreadyCountedConversation(input.dealershipId, input.buyerPhone)) {
    return null;
  }
  const state = load();
  const event: UsageEvent = {
    id: newId("use"),
    dealershipId: input.dealershipId,
    kind: "whatsapp_conversation",
    buyerPhone: input.buyerPhone,
    monthKey: monthKey(),
    createdAt: new Date().toISOString(),
  };
  state.events.unshift(event);
  save(state);
  return event;
}

export type ReplyMode = {
  mode: "llm_polish" | "template";
  reason: string;
  polishUsed: number;
  polishIncluded: number;
  planId: PlanId;
};

/**
 * Decide whether this reply may burn an OpenAI polish credit.
 * Templates always work — polish is an upgrade when budget remains + API key OK.
 */
export function decideReplyMode(dealershipId: string): ReplyMode {
  const planId = getDealershipPlan(dealershipId);
  const limits = planLimits(planId);
  const polishUsed = countLlmPolish(dealershipId);
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (!hasKey) {
    return {
      mode: "template",
      reason: "No OPENAI_API_KEY — Nala uses locked templates (safe + free).",
      polishUsed,
      polishIncluded: limits.includedLlmPolish,
      planId,
    };
  }
  if (polishUsed >= limits.includedLlmPolish) {
    return {
      mode: "template",
      reason: `LLM polish credits exhausted (${limits.includedLlmPolish}/mo on ${planId}). Auto-swapped to templates so the yard keeps answering without burning margin.`,
      polishUsed,
      polishIncluded: limits.includedLlmPolish,
      planId,
    };
  }
  return {
    mode: "llm_polish",
    reason: "Polish credit available — attempt OpenAI rewrite of template.",
    polishUsed,
    polishIncluded: limits.includedLlmPolish,
    planId,
  };
}

export function recordLlmPolish(dealershipId: string): UsageEvent {
  const state = load();
  const event: UsageEvent = {
    id: newId("use"),
    dealershipId,
    kind: "llm_polish",
    monthKey: monthKey(),
    createdAt: new Date().toISOString(),
  };
  state.events.unshift(event);
  save(state);
  return event;
}

export function recordTemplateReply(dealershipId: string): UsageEvent {
  const state = load();
  const event: UsageEvent = {
    id: newId("use"),
    dealershipId,
    kind: "template_reply",
    monthKey: monthKey(),
    createdAt: new Date().toISOString(),
  };
  state.events.unshift(event);
  save(state);
  return event;
}

export function usageSnapshot(dealershipId: string) {
  const planId = getDealershipPlan(dealershipId);
  const pkg = packageById(planId);
  const limits = planLimits(planId);
  const waUsed = countWhatsAppConversations(dealershipId);
  const polishUsed = countLlmPolish(dealershipId);
  const templates = countTemplateReplies(dealershipId);
  const overageUnits = Math.max(0, waUsed - limits.includedWhatsApp);
  const overageZar = overageUnits * limits.overagePerConversationZar;
  const replyMode = decideReplyMode(dealershipId);

  return {
    dealershipId,
    month: monthKey(),
    planId,
    package: {
      name: pkg.name,
      priceLabel: pkg.priceLabel,
      priceMonthlyZar: pkg.priceMonthlyZar,
    },
    whatsapp: {
      used: waUsed,
      included: limits.includedWhatsApp,
      remaining: Math.max(0, limits.includedWhatsApp - waUsed),
      overageUnits,
      overageZar: Math.round(overageZar * 100) / 100,
      overageRateZar: limits.overagePerConversationZar,
      hardStop: limits.hardStopWhatsApp,
    },
    llmPolish: {
      used: polishUsed,
      included: limits.includedLlmPolish,
      remaining: Math.max(0, limits.includedLlmPolish - polishUsed),
      currentMode: replyMode.mode,
      modeReason: replyMode.reason,
    },
    templateReplies: templates,
    howItWorks: [
      "Dealer picks Pilot / Starter / Professional / Enterprise → caps load automatically from that package.",
      "Each unique buyer WhatsApped in the calendar month counts as 1 conversation against the plan.",
      "Nala always builds a deterministic template reply first (stock/parts/service truth).",
      "If polish credits remain AND OPENAI_API_KEY works, we optionally polish the template.",
      "If polish credits are used up, OpenAI quota fails, or no key — auto-swap to templates. Buyer still gets answered.",
      "Pilot hard-stops at included WA. Paid plans keep sending and accrue overage at the package rate.",
    ],
  };
}

/** Test helper: bulk-seed WA conversations without N file writes */
export function seedWhatsAppConversationsForTests(
  dealershipId: string,
  count: number,
) {
  const state = load();
  const mk = monthKey();
  for (let i = 0; i < count; i++) {
    state.events.push({
      id: newId("use"),
      dealershipId,
      kind: "whatsapp_conversation",
      buyerPhone: `+2782${String(10000000 + i)}`,
      monthKey: mk,
      createdAt: new Date().toISOString(),
    });
  }
  save(state);
}

/** Test helper: bulk-seed LLM polish burns */
export function seedLlmPolishForTests(dealershipId: string, count: number) {
  const state = load();
  const mk = monthKey();
  for (let i = 0; i < count; i++) {
    state.events.push({
      id: newId("use"),
      dealershipId,
      kind: "llm_polish",
      monthKey: mk,
      createdAt: new Date().toISOString(),
    });
  }
  save(state);
}
