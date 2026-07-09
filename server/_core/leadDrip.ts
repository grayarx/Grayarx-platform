/**
 * Lead-drip cadence — Mia's Day 1 / Day 3 / Day 7 follow-up campaign.
 *
 * Architecture:
 *   1. When a new lead is captured, `scheduleFollowups()` writes three rows
 *      into `lead_followups` with future `dueAt` timestamps.
 *   2. A scheduled endpoint (`/api/scheduled/lead-followup-tick`) runs hourly
 *      and processes every `pending` row whose `dueAt <= now()`.
 *   3. For each due row, we look up the lead, ask Mia (the Email Agent) to
 *      draft a stage-appropriate message in the lead's language, persist a
 *      preview, and mark the row `sent`.
 *   4. If the lead's status moves to `converted`, all remaining `pending`
 *      rows for that lead are flipped to `cancelled` — we never spam buyers
 *      who already converted.
 *
 * Why we store a draft preview instead of actually sending right now:
 *   - The platform does not have outbound SMTP wired yet. When SendGrid (or
 *     SES, or Postmark) is connected, the only change is to swap the
 *     "preview-only" branch in `dispatchFollowup` for an actual send.
 *   - In the meantime, the dealer sees Mia's drafted follow-ups in the Leads
 *     view and can ship them with one tap, which is also useful behaviour for
 *     POPIA-cautious dealerships that want a human review pass.
 */

import { getDb } from "../db";
import { leadFollowups, leads as leadsTable } from "../../drizzle/schema";
import { and, eq, lte, asc } from "drizzle-orm";
import { generateAgentReply } from "./agentPrompts";
import { logAgentActivity } from "../db";
import type { LanguageCode } from "@shared/languages";
import { LANGUAGES } from "@shared/languages";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DripStep = "day_1" | "day_3" | "day_7";

const STEP_DELAYS: Record<DripStep, number> = {
  day_1: 1 * DAY_MS,
  day_3: 3 * DAY_MS,
  day_7: 7 * DAY_MS,
};

const STEP_PROMPTS: Record<DripStep, string> = {
  day_1:
    "You are Mia, the GrayArx Email Agent. The customer enquired yesterday and Mia already sent the welcome reply. Write a warm, plain-language follow-up message in their language. Confirm we are still here, surface ONE specific next step (book a 30-minute demo or send a brochure), and ask which they prefer. Keep it under 90 words and never invent specifics.",
  day_3:
    "You are Mia, the GrayArx Email Agent. The customer enquired three days ago and has not yet replied. Write a single short helpful nudge in their language. Offer two paths: (1) a 15-minute showroom walk-through call, (2) browsing the live inventory. Mention POPIA compliance briefly. Under 90 words.",
  day_7:
    "You are Mia, the GrayArx Email Agent. This is the final check-in seven days after the enquiry. Be warm, low-pressure, and explicit that you will pause emails after this one unless they reply. Offer to keep them on the quarterly newsletter. Under 90 words.",
};

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
  failed: number;
  cancelled: number;
}> {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, failed: 0, cancelled: 0 };

  const due = await db
    .select()
    .from(leadFollowups)
    .where(and(eq(leadFollowups.status, "pending"), lte(leadFollowups.dueAt, now)))
    .orderBy(asc(leadFollowups.dueAt))
    .limit(100);

  let sent = 0;
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
      // Lead deleted — cancel.
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

    try {
      const drafted = await generateAgentReply({
        agentId: "email",
        language: lang,
        customerMessage,
        context: systemPrompt,
      });
      await db
        .update(leadFollowups)
        .set({
          status: "sent",
          sentAt: new Date(),
          draftPreview: drafted.reply.slice(0, 4000),
        })
        .where(eq(leadFollowups.id, row.id));
      await logAgentActivity({
        agentId: "email",
        action: `followup_${row.step}_drafted`,
        subjectType: "lead",
        subjectId: row.leadId,
        summary: `Mia drafted the ${row.step.replace("_", " ")} follow-up for ${leadRow.contactName} in ${langName}.`,
        payload: { followupId: row.id, language: lang },
      });
      sent++;
    } catch (err) {
      await db
        .update(leadFollowups)
        .set({
          status: "failed",
          errorMessage: String(err).slice(0, 1000),
        })
        .where(eq(leadFollowups.id, row.id));
      failed++;
    }
  }

  return { processed: due.length, sent, failed, cancelled };
}
