import twilio from "twilio";
import { getTwilioStatus } from "@/lib/twilio-status";

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
  const status = getTwilioStatus();
  if (!status.authToken) return false;

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return process.env.NODE_ENV !== "production";

  const requestUrl = new URL(request.url);
  const publicBase = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  const url = publicBase
    ? `${publicBase}${requestUrl.pathname}${requestUrl.search}`
    : request.url;

  return twilio.validateRequest(status.authToken, signature, url, params);
}
