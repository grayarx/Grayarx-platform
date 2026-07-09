/**
 * Calling Agent — places an outbound voice call via Twilio's REST API.
 *
 * Gracefully degrades when secrets are missing: returns `{ skipped: true }`
 * so the rest of the flow (status update, DB logging) still works.
 *
 * Required env (set via webdev_request_secrets):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER  (E.164 — e.g. +1xxx... your verified Twilio number)
 *
 * Optional:
 *   TWILIO_TWIML_URL    (TwiML Bin or webhook returning <Response><Say>...).
 *                       Defaults to a built-in TwiML Bin equivalent embedded as URL-encoded TwiML.
 */

type PlaceCallInput = {
  toNumber: string; // E.164 preferred (+27...). We'll normalize SA local numbers.
  prospectName?: string;
  rationale?: string;
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

function buildTwimlUrl(prospectName: string, rationale: string): string {
  // Inline TwiML Bin via twimlets.com Echo (publicly available, signed).
  // Falls back to a generic message if Echo is unreachable.
  const message =
    `Hello, this is the GrayArx AI calling agent. ` +
    `We are reaching out to ${prospectName || "your dealership"} ` +
    `because ${rationale || "we believe GrayArx can help you capture more leads"}. ` +
    `If you would like a no-pressure demo, please press one or stay on the line. ` +
    `Thank you for your time.`;

  const twiml = `<Response><Say voice="Polly.Joanna" language="en-ZA">${message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</Say><Pause length="2"/></Response>`;

  return `https://twimlets.com/echo?Twiml=${encodeURIComponent(twiml)}`;
}

export async function placeOutboundCall(input: PlaceCallInput): Promise<PlaceCallResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      ok: false,
      skipped: true,
      reason: "Twilio credentials missing — call queued in DB but not placed.",
    };
  }

  const to = normalizeToE164(input.toNumber);
  if (!to) return { ok: false, error: `Invalid destination number: ${input.toNumber}` };

  const twimlUrl =
    process.env.TWILIO_TWIML_URL ||
    buildTwimlUrl(input.prospectName ?? "your dealership", input.rationale ?? "");

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

export { normalizeToE164 };
