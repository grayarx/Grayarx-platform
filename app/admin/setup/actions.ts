"use server";

import { verifyTwilioConnection, getSetupStatus } from "@/lib/setup-status";
import {
  maskSid,
  sanitizeCredential,
  saveTwilioEnv,
} from "@/lib/twilio-env";

export type SaveTwilioResult = {
  ok: boolean;
  message: string;
  verifyOk: boolean;
  accountName?: string;
  balance?: string;
  accountSidPreview?: string;
  tokenLength?: number;
};

export async function saveTwilioCredentials(formData: FormData): Promise<SaveTwilioResult> {
  const accountSid = sanitizeCredential(String(formData.get("accountSid") ?? ""));
  const authToken = sanitizeCredential(String(formData.get("authToken") ?? ""));
  const webhookBaseUrl = sanitizeCredential(
    String(formData.get("webhookBaseUrl") ?? "https://grayarx.com"),
  ).replace(/\/$/, "");

  if (!accountSid) {
    return { ok: false, message: "Paste your Account SID first.", verifyOk: false };
  }
  if (!accountSid.startsWith("AC")) {
    return {
      ok: false,
      message:
        "Wrong field — copy Account SID from Twilio (starts with AC, not SK).",
      verifyOk: false,
    };
  }
  if (!authToken) {
    return { ok: false, message: "Paste your Auth Token first.", verifyOk: false };
  }

  saveTwilioEnv({
    accountSid,
    authToken,
    webhookBaseUrl: webhookBaseUrl || "https://grayarx.com",
    fromNumber: sanitizeCredential(String(formData.get("fromNumber") ?? "")) || undefined,
  });

  const verify = await verifyTwilioConnection({ accountSid, authToken });
  await getSetupStatus();

  if (verify.ok) {
    return {
      ok: true,
      verifyOk: true,
      message: `Connected to ${verify.accountName}. Balance: ${verify.balance}. You're set — waiting on Gray Ox bundle for phone number.`,
      accountName: verify.accountName,
      balance: verify.balance,
      accountSidPreview: maskSid(accountSid),
      tokenLength: authToken.length,
    };
  }

  return {
    ok: true,
    verifyOk: false,
    message: `Saved on server but Twilio said: ${verify.error}. Copy Account SID + Auth Token again from Twilio home (click Show on token).`,
    accountSidPreview: maskSid(accountSid),
    tokenLength: authToken.length,
  };
}

export async function getTwilioSetupState(): Promise<{
  connected: boolean;
  accountName?: string;
  balance?: string;
  error?: string;
  hasSid: boolean;
  hasToken: boolean;
}> {
  const verify = await verifyTwilioConnection();
  const { loadTwilioEnv } = await import("@/lib/twilio-env");
  const env = loadTwilioEnv();
  return {
    connected: verify.ok,
    accountName: verify.accountName,
    balance: verify.balance,
    error: verify.error,
    hasSid: Boolean(env.accountSid),
    hasToken: Boolean(env.authToken),
  };
}
