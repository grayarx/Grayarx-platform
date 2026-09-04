/**
 * Segmented pilot outreach emails — table-safe HTML, no internal labels.
 */

import {
  grayArxAppUrl,
  grayArxEmailButton,
  grayArxEmailBullet,
  grayArxEmailLayout,
  grayArxPilotFromEmail,
} from "../../shared/emailBranding";
import { CASH_CTAS, CASH_EMAIL_SCARCITY, CASH_EMAIL_SEGMENTS } from "../../shared/cashvertising";
import {
  PILOT_SEGMENT_SUBJECTS,
  type PilotOutreachSegment,
} from "../../shared/pilotProspectSegments";

export { grayArxPilotFromEmail, PILOT_SEGMENT_SUBJECTS };

type TemplateVars = {
  dealershipName: string;
  contactName: string;
  city?: string;
  segment: PilotOutreachSegment;
  brands?: string;
  estimatedVolume?: number;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function segmentBody(segment: PilotOutreachSegment): { headline: string; bullets: string[]; hook: string } {
  const copy = CASH_EMAIL_SEGMENTS[segment];
  return {
    headline: copy.headline,
    hook: copy.hook,
    bullets: [...copy.bullets],
  };
}

export function generateSegmentPilotEmailHTML(vars: TemplateVars): string {
  const { headline, bullets, hook } = segmentBody(vars.segment);
  const appUrl = grayArxAppUrl();
  const cityBit = vars.city ? ` in ${escapeHtml(vars.city)}` : "";
  const name = escapeHtml(vars.contactName);
  const dealer = escapeHtml(vars.dealershipName);

  const volumeLine = vars.estimatedVolume
    ? `We noticed <strong>${dealer}</strong>${cityBit} moves approximately <strong>${vars.estimatedVolume} vehicles a month</strong> — that's exactly the scale where GrayArx's AI agents make a measurable difference.`
    : `We'd love to invite <strong>${dealer}</strong>${cityBit} to a <strong style="color:#111827;">14-day Pilot</strong> — Nala answers after-hours WhatsApp from your live stock. No card.`;

  const brandsLine = vars.brands
    ? `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#6b7280;">Brands we've seen you carry: <strong style="color:#374151;">${escapeHtml(vars.brands)}</strong> — our AI agents are trained to answer stock, spec, and finance questions for each of these.</p>`
    : "";

  const body = `
<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111827;">Hi <strong>${name}</strong>,</p>
<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#4b5563;">
  ${volumeLine}
</p>
${brandsLine}
<p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#4b5563;">
  We're inviting independent yards${cityBit} that already bleed after-hours WhatsApp to a <strong style="color:#111827;">14-day Pilot</strong> — prove one recovered path on your stock, then this week's numbers decide.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#0a0a0c;margin-bottom:28px;">
  <tr>
    <td style="width:4px;background-color:#d4af37;font-size:0;line-height:0;">&nbsp;</td>
    <td style="padding:22px 24px;">
      <p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.35;color:#d4af37;font-weight:700;">${escapeHtml(headline)}</p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#d1d5db;">${escapeHtml(hook)}</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111827;">What ${dealer} gets in the pilot:</p>
${bullets.map((b) => grayArxEmailBullet(escapeHtml(b))).join("")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#fffbeb;border:1px solid #fde68a;margin:28px 0;">
  <tr>
    <td align="center" style="padding:14px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#92400e;font-weight:600;">
      ${CASH_EMAIL_SCARCITY}
    </td>
  </tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:32px 0 28px;">
  <tr>
    <td align="center">${grayArxEmailButton(CASH_CTAS.applyPilot, `${appUrl}/onboarding`)}</td>
  </tr>
</table>
<p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#6b7280;">
  Questions? Reply to this email or WhatsApp <a href="https://wa.me/27794915187" style="color:#7a5a00;text-decoration:none;font-weight:600;">079 491 5187</a>.
</p>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
  Best regards,<br />
  <strong style="color:#111827;">Henrique Marx</strong><br />
  <span style="font-size:13px;color:#6b7280;">Founder, GrayArx</span>
</p>`;

  return grayArxEmailLayout(body, "Dealership Operating System", {
    marketingUnsubscribe: true,
  });
}

export function generateSegmentPilotEmailText(vars: TemplateVars): string {
  const { headline, bullets, hook } = segmentBody(vars.segment);
  const appUrl = grayArxAppUrl();
  const cityBit = vars.city ? ` in ${vars.city}` : "";
  const volumeLine = vars.estimatedVolume
    ? `We noticed ${vars.dealershipName}${cityBit} moves approximately ${vars.estimatedVolume} vehicles a month — that's exactly the scale where GrayArx's AI agents make a measurable difference.`
    : `We'd love to invite ${vars.dealershipName}${cityBit} to a 14-day Pilot — Nala on your live stock, no card.`;
  const brandsLine = vars.brands ? `\nBrands: ${vars.brands}\n` : "";
  return `GrayArx Pilot Programme

Hi ${vars.contactName},

${volumeLine}${brandsLine}

We're inviting independent yards that already bleed after-hours WhatsApp to a 14-day Pilot.

${headline}
${hook}

What you get:
${bullets.map((b) => `• ${b}`).join("\n")}

${CASH_EMAIL_SCARCITY}
Apply: ${appUrl}/onboarding

Questions: reply here or WhatsApp 079 491 5187.

Henrique Marx
Founder, GrayArx
${appUrl}

---
GrayArx (Pty) Ltd · POPIA compliant
Privacy: ${appUrl}/privacy-policy · Terms: ${appUrl}/terms
Unsubscribe from pilot outreach: reply "unsubscribe" or email hello@grayarx.com`;
}

export function subjectForSegment(segment: PilotOutreachSegment): string {
  return PILOT_SEGMENT_SUBJECTS[segment];
}

/** @deprecated Use generateSegmentPilotEmailHTML */
export function generatePilotEmailHTML(dealershipName: string, contactName: string): string {
  return generateSegmentPilotEmailHTML({
    dealershipName,
    contactName,
    segment: "basic_website_no_showroom",
  });
}

/** @deprecated Use generateSegmentPilotEmailText */
export function generatePilotEmailText(dealershipName: string, contactName: string): string {
  return generateSegmentPilotEmailText({
    dealershipName,
    contactName,
    segment: "basic_website_no_showroom",
  });
}
