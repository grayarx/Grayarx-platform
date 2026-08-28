import { loadTwilioEnv } from "@nalaOs/twilio-env";

export function getTwilioStatus(): {
  configured: boolean;
  message: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  webhookBaseUrl?: string;
} {
  const env = loadTwilioEnv();
  const sid = env.accountSid;
  const token = env.authToken;
  const from = env.fromNumber;
  const webhookBaseUrl = env.webhookBaseUrl?.replace(/\/$/, "");

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
  if (!token) missing.push("TWILIO_AUTH_TOKEN");
  if (!from) missing.push("TWILIO_FROM_NUMBER");
  if (!webhookBaseUrl) missing.push("TWILIO_WEBHOOK_BASE_URL");

  return {
    configured: false,
    accountSid: sid,
    authToken: token,
    fromNumber: from,
    webhookBaseUrl,
    message: sid && token && webhookBaseUrl
      ? `Twilio connected — still need phone number (${missing.join(", ")})`
      : `Twilio not ready (need ${missing.join(" + ")})`,
  };
}
