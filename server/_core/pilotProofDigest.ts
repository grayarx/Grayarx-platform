/**
 * Pilot proof digest — weekly founder email with real ops numbers
 * (leads, bookings, pre-approvals, after-hours Bongi activity).
 * Used for demos and "still in a contract" follow-ups.
 */
import { gte, sql, count } from "drizzle-orm";
import { getDb, getPlatformOpsSnapshot, getKagisoSnapshot, listAgentActivity } from "../db";
import { testDriveBookings, preApprovals } from "../../drizzle/schema";
import { alertFounder } from "./founderAlert";

export type PilotProofDigest = {
  periodDays: number;
  leadsLast7d: number;
  leadsToday: number;
  testDrivesPending: number;
  testDrivesConfirmed: number;
  testDrivesLast7d: number;
  preApprovalsPending: number;
  preApprovalsLast7d: number;
  afterHoursRepliesLast7d: number;
  dealershipsActive: number;
  generatedAt: string;
  talkingPoints: string[];
};

function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export async function buildPilotProofDigest(periodDays = 7): Promise<PilotProofDigest> {
  const ops = await getPlatformOpsSnapshot();
  const kagiso = await getKagisoSnapshot();
  const since = startOfDaysAgo(periodDays);
  const db = await getDb();

  let testDrivesLast7d = 0;
  let preApprovalsLast7d = 0;
  let preApprovalsPending = Number(
    (kagiso as { preApprovalsPending?: number }).preApprovalsPending ?? 0,
  );

  if (db) {
    const [tdRow] = await db
      .select({ c: count() })
      .from(testDriveBookings)
      .where(gte(testDriveBookings.createdAt, since));
    testDrivesLast7d = Number(tdRow?.c ?? 0);

    const [paWeek] = await db
      .select({ c: count() })
      .from(preApprovals)
      .where(gte(preApprovals.createdAt, since));
    preApprovalsLast7d = Number(paWeek?.c ?? 0);

    const [paPending] = await db
      .select({ c: count() })
      .from(preApprovals)
      .where(
        sql`${preApprovals.status} IN ('submitted', 'in_review')`,
      );
    preApprovalsPending = Number(paPending?.c ?? preApprovalsPending);
  }

  const activity = await listAgentActivity({ limit: 400 });
  const afterHoursRepliesLast7d = activity.filter((a) => {
    if (a.agentId !== "fallback") return false;
    if (a.action !== "fallback_replied" && a.action !== "after_hours_reply") return false;
    const ts = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    return ts >= since.getTime();
  }).length;

  const talkingPoints: string[] = [];
  if (ops.leadsLast7d > 0) {
    talkingPoints.push(`${ops.leadsLast7d} leads captured in the last ${periodDays} days.`);
  }
  if (afterHoursRepliesLast7d > 0) {
    talkingPoints.push(
      `${afterHoursRepliesLast7d} after-hours replies handled by Bongi (silence your competitors leave on the table).`,
    );
  }
  if (testDrivesLast7d > 0) {
    talkingPoints.push(`${testDrivesLast7d} test-drive requests created this week.`);
  }
  if (preApprovalsLast7d > 0) {
    talkingPoints.push(
      `${preApprovalsLast7d} finance pre-approval forms started — F&I queue, bank still decides.`,
    );
  }
  if (talkingPoints.length === 0) {
    talkingPoints.push(
      "Pilot still warming up — push WhatsApp + showroom traffic, then re-run this digest for demo proof.",
    );
  }

  return {
    periodDays,
    leadsLast7d: ops.leadsLast7d,
    leadsToday: ops.leadsToday,
    testDrivesPending: ops.testDrivesPending,
    testDrivesConfirmed: ops.testDrivesConfirmed,
    testDrivesLast7d,
    preApprovalsPending,
    preApprovalsLast7d,
    afterHoursRepliesLast7d,
    dealershipsActive: ops.activeDealerships,
    generatedAt: new Date().toISOString(),
    talkingPoints,
  };
}

export function formatPilotProofDigestText(d: PilotProofDigest): string {
  return [
    `GrayArx pilot proof — last ${d.periodDays} days`,
    ``,
    `Leads: ${d.leadsLast7d} (today ${d.leadsToday})`,
    `Test drives: ${d.testDrivesLast7d} new · ${d.testDrivesPending} pending · ${d.testDrivesConfirmed} confirmed`,
    `Pre-approvals: ${d.preApprovalsLast7d} new · ${d.preApprovalsPending} awaiting human F&I`,
    `After-hours (Bongi): ${d.afterHoursRepliesLast7d} replies`,
    `Active dealerships: ${d.dealershipsActive}`,
    ``,
    `Talking points for demos:`,
    ...d.talkingPoints.map((t) => `• ${t}`),
    ``,
    `Generated ${d.generatedAt}`,
  ].join("\n");
}

export async function sendPilotProofDigestEmail(): Promise<{
  ok: boolean;
  digest: PilotProofDigest;
  emailSent: boolean;
}> {
  const digest = await buildPilotProofDigest(7);
  const content = formatPilotProofDigestText(digest);
  const result = await alertFounder({
    title: "Weekly pilot proof digest",
    content,
    category: "ops",
    actionUrl: "https://www.grayarx.com/admin/ops",
  });
  return { ok: true, digest, emailSent: result.emailSent };
}
