/**
 * Pilot bulk email campaign — segment-aware sends via Resend.
 */

import {
  groupProspectsBySegment,
  mailableProspects,
  PILOT_PROSPECTS,
  type PilotOutreachSegment,
  type PilotProspect,
} from "../../shared/pilotProspectSegments";
import { sendEmailViaResend } from "./resendEmailService";
import { isPilotGmailConfigured, sendEmailViaPilotGmail } from "./gmailPilotSender";
import {
  generateSegmentPilotEmailHTML,
  generateSegmentPilotEmailText,
  grayArxPilotFromEmail,
  subjectForSegment,
} from "./pilotEmailTemplate";
import {
  recordPilotEmailSend,
  refreshPilotEmailSendMap,
} from "./pilotEmailSendLog";
import { grayArxLogoIconUrl } from "../../shared/emailBranding";

const SEND_DELAY_MS = 600;

export type SegmentSendResult = {
  segment: PilotOutreachSegment;
  subject: string;
  attempted: number;
  sent: number;
  failed: number;
  results: Array<{
    prospectId: string;
    dealershipName: string;
    email: string;
    success: boolean;
    resendId?: string;
    error?: string;
  }>;
};

export type BulkPilotSendSummary = {
  dryRun: boolean;
  segments: SegmentSendResult[];
  totalAttempted: number;
  totalSent: number;
  totalFailed: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendToProspect(
  prospect: PilotProspect,
  dryRun: boolean,
): Promise<SegmentSendResult["results"][0]> {
  const email = prospect.email!.trim();
  if (dryRun) {
    return {
      prospectId: prospect.id,
      dealershipName: prospect.dealershipName,
      email,
      success: true,
      resendId: "dry-run",
    };
  }

  const html = generateSegmentPilotEmailHTML({
    dealershipName: prospect.dealershipName,
    contactName: prospect.contactName,
    city: prospect.city,
    segment: prospect.segment,
  });
  const text = generateSegmentPilotEmailText({
    dealershipName: prospect.dealershipName,
    contactName: prospect.contactName,
    city: prospect.city,
    segment: prospect.segment,
  });

  const result = await sendEmailViaResend({
    to: email,
    subject: subjectForSegment(prospect.segment),
    html,
    from: grayArxPilotFromEmail(),
    replyTo: "hello@grayarx.com",
  });

  return {
    prospectId: prospect.id,
    dealershipName: prospect.dealershipName,
    email,
    success: result.success,
    resendId: result.id,
    error: result.error,
  };
}

/** Send one segment batch — all recipients get the same template. */
export async function sendPilotSegmentBatch(input: {
  segment: PilotOutreachSegment;
  dryRun?: boolean;
  prospects?: PilotProspect[];
  /** When false (default), skip addresses already recorded as emailed. */
  includeAlreadySent?: boolean;
}): Promise<SegmentSendResult> {
  const sentMap = await refreshPilotEmailSendMap();
  const list = mailableProspects(input.prospects ?? PILOT_PROSPECTS, input.segment).filter(
    (p) =>
      input.includeAlreadySent ||
      !sentMap.has(p.email!.trim().toLowerCase()),
  );
  const dryRun = input.dryRun ?? false;
  const results: SegmentSendResult["results"] = [];

  for (const prospect of list) {
    const row = await sendToProspect(prospect, dryRun);
    results.push(row);
    if (!dryRun && row.success) {
      recordPilotEmailSend({
        email: row.email,
        prospectId: prospect.id,
        dealershipName: prospect.dealershipName,
        segment: input.segment,
        resendId: row.resendId,
      });
    }
    if (!dryRun) await sleep(SEND_DELAY_MS);
  }

  return {
    segment: input.segment,
    subject: subjectForSegment(input.segment),
    attempted: list.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/** Send all segments (or one) — grouped bulk outreach. */
export async function sendPilotBulkCampaign(input?: {
  segments?: PilotOutreachSegment[];
  dryRun?: boolean;
  prospects?: PilotProspect[];
}): Promise<BulkPilotSendSummary> {
  const dryRun = input?.dryRun ?? false;
  const allSegments: PilotOutreachSegment[] = input?.segments ?? [
    "no_website_social_only",
    "basic_website_no_showroom",
    "after_hours_leak",
    "whatsapp_manual",
  ];

  const segments: SegmentSendResult[] = [];
  for (const segment of allSegments) {
    const batch = await sendPilotSegmentBatch({
      segment,
      dryRun,
      prospects: input?.prospects,
    });
    if (batch.attempted > 0) segments.push(batch);
  }

  return {
    dryRun,
    segments,
    totalAttempted: segments.reduce((s, x) => s + x.attempted, 0),
    totalSent: segments.reduce((s, x) => s + x.sent, 0),
    totalFailed: segments.reduce((s, x) => s + x.failed, 0),
  };
}

export async function previewPilotCampaign() {
  const sentMap = await refreshPilotEmailSendMap();
  const groups = groupProspectsBySegment();
  return (Object.keys(groups) as PilotOutreachSegment[]).map((segment) => {
    const mailable = mailableProspects(PILOT_PROSPECTS, segment);
    const prospects = mailable.map((p) => {
      const prior = sentMap.get(p.email!.trim().toLowerCase());
      return {
        id: p.id,
        name: p.dealershipName,
        city: p.city,
        email: p.email,
        emailVerified: true as const,
        phone: p.phone,
        alreadyEmailed: Boolean(prior),
        lastEmailedAt: prior?.sentAt ?? null,
      };
    });
    const alreadyEmailed = prospects.filter((p) => p.alreadyEmailed).length;
    const remaining = prospects.filter((p) => !p.alreadyEmailed).length;
    const sample = mailable[0] ?? groups[segment][0];

    // Preview always uses hosted HTTPS logo (cid: breaks in browser iframes).
    const rawHtml = generateSegmentPilotEmailHTML({
      dealershipName: sample?.dealershipName ?? "Your Dealership",
      contactName: sample?.contactName ?? "there",
      city: sample?.city,
      segment,
    });
    const hosted = grayArxLogoIconUrl();
    const sampleHtml = rawHtml
      .replace(/src="cid:[^"]+"/gi, `src="${hosted}"`)
      .replace(/src='cid:[^']+'/gi, `src='${hosted}'`);

    return {
      segment,
      label: subjectForSegment(segment),
      mailable: mailable.length,
      remaining,
      alreadyEmailed,
      /** Research total (includes unverified) — for internal stats only */
      totalResearched: groups[segment].length,
      /** UI list: verified emails only */
      total: mailable.length,
      prospects,
      sampleHtml,
    };
  });
}

export async function sendPilotTestEmail(
  to: string,
  segment: PilotOutreachSegment = "basic_website_no_showroom",
  opts?: { via?: "resend" | "gmail" | "auto" },
) {
  const sample = mailableProspects(PILOT_PROSPECTS, segment)[0] ?? PILOT_PROSPECTS.find((p) => p.emailVerified)!;
  const subject = `[TEST] ${subjectForSegment(segment)}`;
  const html = generateSegmentPilotEmailHTML({
    dealershipName: sample.dealershipName,
    contactName: sample.contactName,
    city: sample.city,
    segment,
  });

  const preferGmail =
    opts?.via === "gmail" || (opts?.via !== "resend" && process.env.PILOT_SEND_VIA === "gmail");

  if (preferGmail && isPilotGmailConfigured()) {
    const result = await sendEmailViaPilotGmail({
      to,
      subject,
      html,
      replyTo: "hello@grayarx.com",
    });
    return {
      success: result.success,
      id: result.messageId,
      error: result.error,
      via: "gmail" as const,
    };
  }

  const result = await sendEmailViaResend({
    to,
    subject,
    html,
    from: grayArxPilotFromEmail(),
    replyTo: "hello@grayarx.com",
  });
  return { ...result, via: "resend" as const };
}
