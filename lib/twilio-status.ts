export function getTwilioStatus(): {
  configured: boolean;
  message: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  webhookBaseUrl?: string;
} {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token =
    process.env.TWILIO_AUTH_TOKEN ?? process.env.TWILIO_API_KEY;
  const from =
    process.env.TWILIO_FROM_NUMBER ?? process.env.TWILIO_PHONE_NUMBER;
  const webhookBaseUrl = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "");

  if (sid && token && from && webhookBaseUrl) {
    return {
      configured: true,
      accountSid: sid,
      authToken: token,
      fromNumber: from,
      webhookBaseUrl,
      message:
        "Twilio ready — outbound calls will dial and run the Themba playbook.",
    };
  }

  const missing: string[] = [];
  if (!sid) missing.push("TWILIO_ACCOUNT_SID");
  if (!token) missing.push("TWILIO_AUTH_TOKEN or TWILIO_API_KEY");
  if (!from) missing.push("TWILIO_FROM_NUMBER or TWILIO_PHONE_NUMBER");
  if (!webhookBaseUrl) {
    missing.push("TWILIO_WEBHOOK_BASE_URL (public HTTPS, e.g. https://grayarx.com)");
  }

  return {
    configured: false,
    accountSid: sid,
    authToken: token,
    fromNumber: from,
    webhookBaseUrl,
    message: `Twilio not ready (need ${missing.join(" + ")}) — playbook modal still works for manual calls.`,
  };
}
