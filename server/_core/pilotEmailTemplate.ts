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
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function segmentBody(segment: PilotOutreachSegment): { headline: string; bullets: string[]; hook: string } {
  switch (segment) {
    case "no_website_social_only":
      return {
        headline: "Turn Facebook stock into a proper showroom",
        hook: "You're already posting cars on Facebook — GrayArx gives you a branded digital showroom that captures leads 24/7 without replacing how you sell today.",
        bullets: [
          "Live inventory page buyers can browse (linked from your Facebook bio)",
          "Nala on WhatsApp + web — answers in 11 SA languages",
          "Lerato books test drives; Tumi handles trade-in enquiries",
          "No DMS change — we sit alongside Facebook & WhatsApp",
        ],
      };
    case "basic_website_no_showroom":
      return {
        headline: "Add an AI showroom — no website rebuild",
        hook: "Your site lists cars, but buyers still phone instead of self-serving. GrayArx plugs in an AI showroom layer on top of what you already have.",
        bullets: [
          "Vehicle chat on every listing (colour, price, finance, availability)",
          "WhatsApp auto-replies with specialist routing (booking vs trade-in)",
          "Lead inbox with reference numbers — nothing falls through",
          "30-day pilot — features only, pricing discussed on call",
        ],
      };
    case "after_hours_leak":
      return {
        headline: "Stop losing buyers after 5pm",
        hook: "Most test-drive enquiries arrive evenings and weekends. GrayArx's Bongi agent replies after hours with a reference and books callbacks for morning.",
        bullets: [
          "After-hours fallback with reference numbers (POPIA-safe)",
          "Morning summary for your sales team",
          "Same AI stack during business hours — Nala, Lerato, Tumi",
          "Pilot limited to 5 Gauteng dealerships",
        ],
      };
    case "whatsapp_manual":
      return {
        headline: "WhatsApp that books test drives for you",
        hook: "You're already on WhatsApp — GrayArx connects Meta Cloud API so Lerato pencils test drives and Nala answers vehicle questions while you sleep.",
        bullets: [
          "Intent routing: booking → Lerato, trade-in → Tumi, general → Nala",
          "Uses your existing business number (Meta Cloud API)",
          "Multilingual — Afrikaans, Zulu, English + 8 more",
          "Founder-led pilot setup — we do the heavy lifting",
        ],
      };
  }
}

export function generateSegmentPilotEmailHTML(vars: TemplateVars): string {
  const { headline, bullets, hook } = segmentBody(vars.segment);
  const appUrl = grayArxAppUrl();
  const cityBit = vars.city ? ` in ${escapeHtml(vars.city)}` : "";
  const name = escapeHtml(vars.contactName);
  const dealer = escapeHtml(vars.dealershipName);

  const body = `
<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111827;">Hi <strong>${name}</strong>,</p>
<p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#4b5563;">
  We're inviting a small group of dealerships${cityBit} to the GrayArx <strong style="color:#111827;">pilot programme</strong> — a free 30-day trial of our AI sales team for your showroom.
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
      Only 5 pilot spots in Gauteng · First come, first served
    </td>
  </tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:32px 0 28px;">
  <tr>
    <td align="center">${grayArxEmailButton("Apply for pilot access", `${appUrl}/onboarding/form`)}</td>
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
  return `GrayArx Pilot Programme

Hi ${vars.contactName},

We're inviting ${vars.dealershipName}${cityBit} to GrayArx's pilot programme.

${headline}
${hook}

What you get:
${bullets.map((b) => `• ${b}`).join("\n")}

Only 5 pilot spots — apply: ${appUrl}/onboarding/form

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
