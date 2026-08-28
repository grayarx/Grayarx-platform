import twilio from "twilio";
import { getTwilioStatus } from "@nalaOs/twilio-status";
import { loadTwilioEnv } from "@nalaOs/twilio-env";

export function getTwilioClient() {
  const status = getTwilioStatus();
  if (!status.configured || !status.accountSid || !status.authToken) {
    throw new Error(status.message);
  }

  return twilio(status.accountSid, status.authToken);
}

export function validateTwilioRequest(
  request: Request,
  params: Record<string, string>,
): boolean {
  const env = loadTwilioEnv();
  const authToken = env.authToken;
  if (!authToken) return false;

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return process.env.NODE_ENV !== "production";

  const requestUrl = new URL(request.url);
  const publicBase = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  const url = publicBase
    ? `${publicBase}${requestUrl.pathname}${requestUrl.search}`
    : request.url;

  return twilio.validateRequest(authToken, signature, url, params);
}
