export function getTwilioStatus(): {
  configured: boolean;
  message: string;
} {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token =
    process.env.TWILIO_AUTH_TOKEN ?? process.env.TWILIO_API_KEY;
  const from =
    process.env.TWILIO_FROM_NUMBER ?? process.env.TWILIO_PHONE_NUMBER;

  if (sid && token && from) {
    return {
      configured: true,
      message: "Twilio configured — outbound calls can be placed.",
    };
  }

  const missing: string[] = [];
  if (!sid) missing.push("TWILIO_ACCOUNT_SID");
  if (!token) missing.push("TWILIO_AUTH_TOKEN or TWILIO_API_KEY");
  if (!from) missing.push("TWILIO_FROM_NUMBER or TWILIO_PHONE_NUMBER");

  return {
    configured: false,
    message: `Twilio credentials missing (need ${missing.join(" + ")}) — call queued but not placed.`,
  };
}
