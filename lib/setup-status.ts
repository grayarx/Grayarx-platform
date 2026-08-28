import twilio from "twilio";
import { getTwilioStatus } from "@/lib/twilio-status";
import { getWebhookBaseUrl } from "@/lib/twilio-voice";

export type SetupStatus = {
  twilio: {
    accountSidSet: boolean;
    authTokenSet: boolean;
    fromNumberSet: boolean;
    fromNumber?: string;
    webhookBaseUrlSet: boolean;
    webhookBaseUrl?: string;
    readyToDial: boolean;
    message: string;
  };
  regulatory: {
    note: string;
  };
  nextSteps: string[];
};

export async function getSetupStatus(request?: Request): Promise<SetupStatus> {
  const status = getTwilioStatus();
  const webhookResolved =
    getWebhookBaseUrl(request) ?? status.webhookBaseUrl ?? undefined;

  const accountSidSet = Boolean(process.env.TWILIO_ACCOUNT_SID);
  const authTokenSet = Boolean(
    process.env.TWILIO_AUTH_TOKEN ?? process.env.TWILIO_API_KEY,
  );
  const fromNumberSet = Boolean(status.fromNumber);
  const webhookBaseUrlSet = Boolean(webhookResolved);

  const readyToDial =
    accountSidSet &&
    authTokenSet &&
    fromNumberSet &&
    webhookBaseUrlSet &&
    status.configured;

  const nextSteps: string[] = [];

  if (!accountSidSet || !authTokenSet) {
    nextSteps.push("Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env.local");
  }
  if (!webhookBaseUrlSet) {
    nextSteps.push(
      "Set TWILIO_WEBHOOK_BASE_URL to your public HTTPS URL (e.g. https://grayarx.com)",
    );
  }
  if (!fromNumberSet) {
    nextSteps.push(
      "Wait for Gray Ox regulatory bundle approval, then buy your +27 mobile number",
    );
    nextSteps.push("Add TWILIO_FROM_NUMBER=+27... to .env.local after purchase");
  }
  if (readyToDial) {
    nextSteps.push("Open /admin/prospector and click Hand off to Themba");
  }

  return {
    twilio: {
      accountSidSet,
      authTokenSet,
      fromNumberSet,
      fromNumber: status.fromNumber,
      webhookBaseUrlSet,
      webhookBaseUrl: webhookResolved,
      readyToDial,
      message: status.message,
    },
    regulatory: {
      note:
        "South Africa mobile numbers need your Gray Ox bundle approved before purchase.",
    },
    nextSteps,
  };
}

export async function verifyTwilioConnection(): Promise<{
  ok: boolean;
  accountName?: string;
  balance?: string;
  error?: string;
}> {
  const status = getTwilioStatus();
  if (!status.accountSid || !status.authToken) {
    return { ok: false, error: "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN" };
  }

  try {
    const client = twilio(status.accountSid, status.authToken);
    const account = await client.api.accounts(status.accountSid).fetch();
    const balance = await client.balance.fetch();
    return {
      ok: true,
      accountName: account.friendlyName ?? "Twilio account",
      balance: `${balance.balance} ${balance.currency}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Twilio connection failed",
    };
  }
}
