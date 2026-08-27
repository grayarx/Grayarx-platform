/**
 * Themba — GrayArx outbound sales call scripts for Sipho prospects.
 *
 * Uses the dealer Q&A playbook so the spoken opener and any follow-up
 * WhatsApp/email stay aligned with founder-approved answers.
 *
 * Note: Twilio TwiML `<Say>` is one-way. Interactive Q&A on a live call
 * needs ConversationRelay / a voice webhook — until then Themba opens,
 * states the value, and asks for a demo callback while the playbook
 * powers founder Agent Chat + post-call follow-ups.
 */
import { DEALER_QA_ENTRIES } from "../../shared/dealerQaPlaybook";

export type SalesProspectContext = {
  dealershipName: string;
  city?: string | null;
  region?: string | null;
  rationale?: string | null;
  score?: number | null;
  brands?: string | null;
};

function elevatorLine(): string {
  const entry = DEALER_QA_ENTRIES.find((e) => e.id === "elevator");
  return (
    entry?.answer ??
    "GrayArx gives your yard a 24/7 AI assistant on webchat and WhatsApp that answers from your live stock, books viewings, and drops warm leads in your inbox."
  );
}

function contractLine(): string {
  const entry =
    DEALER_QA_ENTRIES.find((e) => e.id === "q23_contract") ??
    DEALER_QA_ENTRIES.find((e) =>
      e.keywords?.some((k) => /contract|month.to.month|commit/i.test(k)),
    );
  return (
    entry?.answer ??
    "Pilots are no-commitment. After that you can stay month-to-month or lock a 12-month founder rate — we confirm terms before billing goes live."
  );
}

/** Spoken opener for Twilio <Say> (keep short — TTS patience is low). */
export function buildThembaSalesSayScript(prospect: SalesProspectContext): string {
  const name = prospect.dealershipName || "your dealership";
  const where = [prospect.city, prospect.region].filter(Boolean).join(", ");
  const why =
    prospect.rationale?.trim() ||
    "we help independent yards catch after-hours WhatsApp and website leads they currently miss";

  return [
    `Hello, this is Themba, the GrayArx calling agent.`,
    `I'm reaching out to ${name}${where ? ` in ${where}` : ""}.`,
    `${elevatorLine()}`,
    `The reason I'm calling you specifically: ${why}.`,
    `This is a business call to your dealership, not to your customers.`,
    `GrayArx runs alongside your current tools — no cancel needed.`,
    `${contractLine()}`,
    `If you'd like a free fifteen minute demo on your own stock, stay on the line or call us back on zero seven nine, four nine one, five one eight seven.`,
    `Thank you for your time.`,
  ].join(" ");
}

/** WhatsApp / SMS follow-up after a call attempt (or when Twilio is offline). */
export function buildThembaSalesFollowUpText(prospect: SalesProspectContext): string {
  const name = prospect.dealershipName || "there";
  return [
    `Hi ${name} — Themba from GrayArx.`,
    `Sipho flagged your yard as a strong fit.`,
    elevatorLine(),
    `Works alongside your current contract. Free pilot, no cancel needed.`,
    `15-min demo? Reply YES or call 079 491 5187.`,
  ].join(" ");
}

export function buildSalesTwiml(prospect: SalesProspectContext): string {
  const message = buildThembaSalesSayScript(prospect)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Gather gives the dealer a path to request a callback without full voice AI yet.
  return (
    `<Response>` +
    `<Say voice="Polly.Amy" language="en-GB">${message}</Say>` +
    `<Gather input="dtmf speech" timeout="4" numDigits="1">` +
    `<Say voice="Polly.Amy" language="en-GB">Press 1 or say yes if you want Henrique to call you back for a demo.</Say>` +
    `</Gather>` +
    `<Say voice="Polly.Amy" language="en-GB">No problem. We will follow up on WhatsApp. Goodbye.</Say>` +
    `</Response>`
  );
}
