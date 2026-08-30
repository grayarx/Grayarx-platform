/**
 * This week's numbers — email each active dealership their yard desk numbers.
 */
import { eq } from "drizzle-orm";
import { getDb, getDashboardStats, getDealershipById, listAllDealerships } from "../db";
import { dealerships } from "../../drizzle/schema";
import { isModuleEnabled } from "../../shared/dealershipModules";
import {
  buildDealerWeeklyBrief,
  formatDealerWeeklyBriefText,
  type DealerWeeklyBrief,
} from "../../shared/dealerWeeklyBrief";
import { sendEmailViaResend } from "./resendEmailService";

export async function buildDealerWeeklyBriefForId(
  dealershipId: number,
): Promise<DealerWeeklyBrief | null> {
  const row = await getDealershipById(dealershipId);
  if (!row) return null;
  const stats = await getDashboardStats({ dealershipId });
  return buildDealerWeeklyBrief({
    dealershipName: row.name,
    leadsLast7Days: stats.leadsLast7Days,
    bookingsLast7Days: stats.bookingsLast7Days,
    afterHoursRepliesLast7Days: stats.afterHoursRepliesLast7Days,
    overdueFollowups: stats.overdueFollowups,
    pendingFollowups: stats.pendingFollowups,
    availableVehicles: stats.availableVehicles,
    soldVehicles: stats.soldVehicles,
  });
}

export async function sendDealerWeeklyBriefEmail(
  dealershipId: number,
): Promise<{ ok: boolean; emailed: boolean; reason?: string; brief?: DealerWeeklyBrief }> {
  const row = await getDealershipById(dealershipId);
  if (!row) return { ok: false, emailed: false, reason: "not_found" };
  if (!isModuleEnabled(row.modulesEnabled, "weekly_brief")) {
    return { ok: true, emailed: false, reason: "module_disabled" };
  }
  const to = row.contactEmail?.trim();
  if (!to) return { ok: true, emailed: false, reason: "no_contact_email" };

  const brief = await buildDealerWeeklyBriefForId(dealershipId);
  if (!brief) return { ok: false, emailed: false, reason: "build_failed" };

  const text = formatDealerWeeklyBriefText(brief);
  const html = `<pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.5;white-space:pre-wrap">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;

  const result = await sendEmailViaResend({
    to,
    subject: `This week's numbers — ${brief.dealershipName}`,
    html,
  });

  return {
    ok: true,
    emailed: Boolean(result.success),
    reason: result.success ? undefined : result.error,
    brief,
  };
}

/** Cron: email every active dealership with weekly_brief enabled + contact email. */
export async function sendAllDealerWeeklyBriefs(): Promise<{
  attempted: number;
  emailed: number;
  skipped: number;
}> {
  const all = await listAllDealerships();
  let attempted = 0;
  let emailed = 0;
  let skipped = 0;
  for (const d of all) {
    if (d.status !== "active" && d.status !== "onboarding") continue;
    attempted += 1;
    const result = await sendDealerWeeklyBriefEmail(d.id);
    if (result.emailed) emailed += 1;
    else skipped += 1;
  }
  return { attempted, emailed, skipped };
}

export async function updateDealershipGoogleReviewUrl(
  id: number,
  googleReviewUrl: string | null,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const cleaned = googleReviewUrl?.trim() || null;
  await db
    .update(dealerships)
    .set({ googleReviewUrl: cleaned })
    .where(eq(dealerships.id, id));
}
