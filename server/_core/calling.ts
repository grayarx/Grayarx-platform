/**
 * Themba — GrayArx sales caller.
 *
 * Places an outbound voice call to a dealership Sipho has scored, to invite
 * them onto GrayArx. Founder-side BD only: yards never get Themba, and he
 * never calls their car buyers.
 *
 * Script content comes from salesCallScript.ts (dealer Q&A playbook).
 *
 * Gracefully degrades when secrets are missing: returns `{ skipped: true }`
 * so status updates and DB logging still work.
 *
 * Required env:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN  (or legacy TWILIO_API_KEY)
 *   TWILIO_FROM_NUMBER (or legacy TWILIO_PHONE_NUMBER) — E.164
 *
 * Optional:
 *   TWILIO_TWIML_URL — override TwiML URL (defaults to playbook Echo TwiML)
 *   ENABLE_OUTBOUND_SALES_CALLS — set to "false" to force queue-only
 */

import {
  buildSalesTwiml,
  type SalesProspectContext,
} from "./salesCallScript";

type PlaceCallInput = {
  toNumber: string; // E.164 preferred (+27...). We'll normalize SA local numbers.
  prospectName?: string;
  rationale?: string;
  /** Richer Sipho context — preferred over legacy name/rationale fields. */
  prospect?: SalesProspectContext;
};

type PlaceCallResult =
  | { ok: true; sid: string; status: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

function normalizeToE164(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("27") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.length >= 9 && digits.length <= 12) return `+27${digits}`;
  return null;
}

function buildTwimlUrl(prospect: SalesProspectContext): string {
  const twiml = buildSalesTwiml(prospect);
  return `https://twimlets.com/echo?Twiml=${encodeURIComponent(twiml)}`;
}

export async function placeOutboundCall(input: PlaceCallInput): Promise<PlaceCallResult> {
  if (process.env.ENABLE_OUTBOUND_SALES_CALLS === "false") {
    return {
      ok: false,
      skipped: true,
      reason: "Outbound sales calls disabled (ENABLE_OUTBOUND_SALES_CALLS=false).",
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_KEY;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      ok: false,
      skipped: true,
      reason:
        "Twilio credentials missing (need TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN/API_KEY + TWILIO_FROM_NUMBER/PHONE_NUMBER) — call queued but not placed.",
    };
  }

  const to = normalizeToE164(input.toNumber);
  if (!to) return { ok: false, error: `Invalid destination number: ${input.toNumber}` };

  const prospect: SalesProspectContext = input.prospect ?? {
    dealershipName: input.prospectName ?? "your dealership",
    rationale: input.rationale ?? null,
  };

  const twimlUrl = process.env.TWILIO_TWIML_URL || buildTwimlUrl(prospect);

  const body = new URLSearchParams({
    To: to,
    From: fromNumber,
    Url: twimlUrl,
  });

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Twilio request failed");
    return { ok: false, error: `Twilio ${res.status}: ${errText.slice(0, 240)}` };
  }

  const json = (await res.json()) as { sid?: string; status?: string };
  return { ok: true, sid: json.sid ?? "unknown", status: json.status ?? "initiated" };
}

export { normalizeToE164, buildTwimlUrl };
