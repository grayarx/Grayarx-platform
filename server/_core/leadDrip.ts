/**
 * Lead-drip cadence — Mia's Day 1 / Day 3 / Day 7 follow-up campaign.
 *
 * Architecture:
 *   1. When a new lead is captured, `scheduleFollowups()` writes three rows
 *      into `lead_followups` with future `dueAt` timestamps.
 *   2. A scheduled endpoint (`/api/scheduled/lead-followup-tick`) runs hourly
 *      and processes every `pending` row whose `dueAt <= now()`.
 *   3. For each due row, Mia drafts a stage-appropriate message, emails it via
 *      Resend when `RESEND_API_KEY` is set (or when `LEAD_DRIP_AUTO_SEND=1`),
 *      stores a preview, and marks the row `sent`.
 *   4. If the lead's status moves to converted/lost/contacted/qualified,
 *      remaining `pending` rows are cancelled.
 *
 * Override: set `LEAD_DRIP_AUTO_SEND=0` to keep draft-only mode (human review).
 */

import { getDb } from "../db";
import { leadFollowups, leads as leadsTable } from "../../drizzle/schema";
import { and, eq, lte, asc } from "drizzle-orm";
import { generateAgentReply } from "./agentPrompts";
import { logAgentActivity } from "../db";
import type { LanguageCode } from "@shared/languages";
import { LANGUAGES } from "@shared/languages";
import { isQuotaError } from "./agentResilience";
import { alertFounder } from "./founderAlert";
import { sendEmailViaResend } from "./resendEmailService";
import { buildHtmlEmail } from "./emailSignature";
import { ENV } from "./env";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DripStep = "day_1" | "day_3" | "day_7";

const STEP_DELAYS: Record<DripStep, number> = {
  day_1: 1 * DAY_MS,
  day_3: 3 * DAY_MS,
  day_7: 7 * DAY_MS,
};

const STEP_SUBJECTS: Record<DripStep, string> = {
  day_1: "Quick follow-up from GrayArx",
  day_3: "Still here if you need us — GrayArx",
  day_7: "Last check-in from GrayArx",
};

/** Fallback drip text when the LLM is unavailable (English template — always safe). */
const STEP_TEMPLATES: Record<DripStep, string> = {
  day_1:
    "Hi there, just a quick follow-up from the team — we're still here and happy to help. Would you prefer we send a brochure, or would a 30-minute demo suit you better? Reply any time.",
  day_3:
    "Hi, we noticed you haven't had a chance to get back to us yet — no worries at all. If you'd like a quick 15-minute walk-through call or to browse our live inventory at your own pace, just let us know. POPIA-compliant: your details are used only to assist you.",
  day_7:
    "This is our final check-in for now. No pressure — if the timing isn't right, we completely understand. You're welcome to join our quarterly newsletter so we can keep you in the loop. Just reply STOP if you'd prefer we don't contact you again.",
};

const STEP_PROMPTS: Record<DripStep, string> = {
  day_1:
    "You are Mia, the GrayArx Email Agent. The customer enquired yesterday and Mia already sent the welcome reply. Write a warm, plain-language follow-up message in their language. Confirm we are still here, surface ONE specific next step (book a 30-minute demo or send a brochure), and ask which they prefer. Keep it under 90 words and never invent specifics.",
  day_3:
    "You are Mia, the GrayArx Email Agent. The customer enquired three days ago and has not yet replied. Write a single short helpful nudge in their language. Offer two paths: (1) a 15-minute showroom walk-through call, (2) browsing the live inventory. Mention POPIA compliance briefly. Under 90 words.",
  day_7:
    "You are Mia, the GrayArx Email Agent. This is the final check-in seven days after the enquiry. Be warm, low-pressure, and explicit that you will pause emails after this one unless they reply. Offer to keep them on the quarterly newsletter. Under 90 words.",
};

/** True when Resend is configured and auto-send is not explicitly disabled. */
export function shouldAutoSendDrip(): boolean {
  if (process.env.LEAD_DRIP_AUTO_SEND === "0") return false;
  if (process.env.LEAD_DRIP_AUTO_SEND === "1") return Boolean(ENV.resendApiKey);
  // Default: send when Resend key exists
  return Boolean(ENV.resendApiKey);
}

async function dispatchFollowupEmail(opts: {
  to: string;
  contactName: string;
  step: DripStep;
  body: string;
  language: LanguageCode;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const subject = STEP_SUBJECTS[opts.step];
  const html = buildHtmlEmail({
    agentId: "email",
    bodyPlainText: opts.body,
    language: opts.language,
    subject,
  });
  const result = await sendEmailViaResend({
    to: opts.to,
    subject,
    html,
    from: "Mia at GrayArx <mia@grayarx.com>",
    replyTo: "hello@grayarx.com",
  });
  return { ok: result.success, error: result.error, id: result.id };
}

/** Insert three pending rows for a fresh lead. */
export async function scheduleFollowups(
  leadId: number,
  language: LanguageCode = "en",
  now: Date = new Date(),
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const rows = (["day_1", "day_3", "day_7"] as DripStep[]).map((step) => ({
    leadId,
    step,
    dueAt: new Date(now.getTime() + STEP_DELAYS[step]),
    status: "pending" as const,
    language,
  }));
  await db.insert(leadFollowups).values(rows);
}

/** Cancel all remaining drip rows for a lead — used on conversion / opt-out. */
export async function cancelFollowupsForLead(leadId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const before = await db
    .select({ id: leadFollowups.id })
    .from(leadFollowups)
    .where(and(eq(leadFollowups.leadId, leadId), eq(leadFollowups.status, "pending")));
  if (before.length === 0) return 0;
  await db
    .update(leadFollowups)
    .set({ status: "cancelled" })
    .where(and(eq(leadFollowups.leadId, leadId), eq(leadFollowups.status, "pending")));
  return before.length;
}

/** Process every pending row whose dueAt <= now. Idempotent + safe to re-run. */
export async function tickFollowups(now: Date = new Date()): Promise<{
  processed: number;
  sent: number;
  drafted: number;
  failed: number;
  cancelled: number;
  autoSend: boolean;
}> {
  const db = await getDb();
  if (!db) {
    console.error("[Mia/leadDrip] DB unavailable — tickFollowups returning zero counts (silent success risk)");
    return { processed: 0, sent: 0, drafted: 0, failed: 0, cancelled: 0, autoSend: false };
  }

  const autoSend = shouldAutoSendDrip();

  const due = await db
    .select()
    .from(leadFollowups)
    .where(and(eq(leadFollowups.status, "pending"), lte(leadFollowups.dueAt, now)))
    .orderBy(asc(leadFollowups.dueAt))
    .limit(100);

  let sent = 0;
  let drafted = 0;
  let failed = 0;
  let cancelled = 0;

  for (const row of due) {
    const lead = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, row.leadId))
      .limit(1);
    const leadRow = lead[0];
    if (!leadRow) {
      await db
        .update(leadFollowups)
        .set({ status: "cancelled", errorMessage: "lead_deleted" })
        .where(eq(leadFollowups.id, row.id));
      cancelled++;
      continue;
    }
    if (leadRow.status === "converted" || leadRow.status === "lost") {
      await db
        .update(leadFollowups)
        .set({ status: "cancelled", errorMessage: `lead_status=${leadRow.status}` })
        .where(eq(leadFollowups.id, row.id));
      cancelled++;
      continue;
    }

    const lang = (row.language as LanguageCode) ?? "en";
    const langName = LANGUAGES[lang]?.englishName ?? "English";
    const systemPrompt = STEP_PROMPTS[row.step as DripStep];
    const customerMessage = `Lead snapshot:
- Dealership: ${leadRow.dealershipName}
- Contact: ${leadRow.contactName}
- Email: ${leadRow.email}
- Phone: ${leadRow.phone}
- Notes: ${leadRow.notes ?? "(none)"}
- Original enquiry language: ${langName}

Compose the ${row.step.replace("_", " ")} follow-up.`;

    let bodyText = "";
    try {
      const draftedReply = await generateAgentReply({
        agentId: "email",
        language: lang,
        customerMessage,
        context: systemPrompt,
      });
      bodyText = draftedReply.reply.slice(0, 4000);
    } catch (err) {
      const step = row.step as DripStep;
      const quota = isQuotaError(err);

      if (quota) {
        bodyText = STEP_TEMPLATES[step];
        console.warn(
          `[Mia] Quota error on lead ${row.leadId} step ${step} — using template fallback`,
          err instanceof Error ? err.message : String(err),
        );
      } else {
        const retryAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        console.warn(
          `[Mia] LLM failed for lead ${row.leadId} step ${step} — rescheduling in 2h`,
          err instanceof Error ? err.message : String(err),
        );
        await db
          .update(leadFollowups)
          .set({
            dueAt: retryAt,
            errorMessage: `retry_pending:${String(err).slice(0, 200)}`,
          })
          .where(eq(leadFollowups.id, row.id));
        failed++;
        continue;
      }
    }

    if (autoSend && leadRow.email?.includes("@")) {
      const mail = await dispatchFollowupEmail({
        to: leadRow.email,
        contactName: leadRow.contactName,
        step: row.step as DripStep,
        body: bodyText,
        language: lang,
      });
      if (!mail.ok) {
        const retryAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        await db
          .update(leadFollowups)
          .set({
            dueAt: retryAt,
            draftPreview: bodyText,
            errorMessage: `resend_failed:${(mail.error ?? "unknown").slice(0, 200)}`,
          })
          .where(eq(leadFollowups.id, row.id));
        failed++;
        continue;
      }
      await db
        .update(leadFollowups)
        .set({
          status: "sent",
          sentAt: new Date(),
          draftPreview: bodyText,
          errorMessage: mail.id ? `resend:${mail.id}` : null,
        })
        .where(eq(leadFollowups.id, row.id));
      await logAgentActivity({
        agentId: "email",
        action: `followup_${row.step}_sent`,
        subjectType: "lead",
        subjectId: row.leadId,
        summary: `Mia emailed the ${row.step.replace("_", " ")} follow-up to ${leadRow.contactName} in ${langName}.`,
        payload: { followupId: row.id, language: lang, resendId: mail.id },
      });
      sent++;
    } else {
      await db
        .update(leadFollowups)
        .set({
          status: "sent",
          sentAt: new Date(),
          draftPreview: bodyText,
          errorMessage: autoSend ? "no_email" : "draft_only",
        })
        .where(eq(leadFollowups.id, row.id));
      await logAgentActivity({
        agentId: "email",
        action: `followup_${row.step}_drafted`,
        subjectType: "lead",
        subjectId: row.leadId,
        summary: `Mia drafted the ${row.step.replace("_", " ")} follow-up for ${leadRow.contactName} in ${langName}${autoSend ? "" : " (auto-send off)"}.`,
        payload: { followupId: row.id, language: lang, autoSend },
      });
      drafted++;
      sent++; // keep "sent" counter meaning "processed successfully" for cron dashboards
    }
  }

  if (failed >= 3) {
    alertFounder({
      title: "Mia drip: systemic failures",
      content: `tickFollowups processed ${due.length} rows and encountered ${failed} failures in a single tick — check OpenAI quota or Resend.`,
      category: "ops",
      actionUrl: "https://www.grayarx.com/admin/ops",
    }).catch(() => {});
  }

  return { processed: due.length, sent, drafted, failed, cancelled, autoSend };
}

/** Manually email a drafted follow-up (dealer one-tap send). */
export async function sendFollowupNow(followupId: number): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { ok: false, error: "Database unavailable" };

  const rows = await db
    .select()
    .from(leadFollowups)
    .where(eq(leadFollowups.id, followupId))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Follow-up not found" };

  const lead = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, row.leadId))
    .limit(1);
  const leadRow = lead[0];
  if (!leadRow?.email) return { ok: false, error: "Lead has no email" };

  const body =
    row.draftPreview?.trim() ||
    STEP_TEMPLATES[(row.step as DripStep) ?? "day_1"];
  const lang = (row.language as LanguageCode) ?? "en";

  if (!ENV.resendApiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const mail = await dispatchFollowupEmail({
    to: leadRow.email,
    contactName: leadRow.contactName,
    step: row.step as DripStep,
    body,
    language: lang,
  });
  if (!mail.ok) return { ok: false, error: mail.error ?? "Send failed" };

  await db
    .update(leadFollowups)
    .set({
      status: "sent",
      sentAt: new Date(),
      draftPreview: body.slice(0, 4000),
      errorMessage: mail.id ? `resend:${mail.id}` : "manual_send",
    })
    .where(eq(leadFollowups.id, row.id));

  return { ok: true };
}
