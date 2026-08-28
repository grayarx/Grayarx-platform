import twilio from "twilio";
import { getTwilioStatus } from "@nalaOs/twilio-status";
import { getWebhookBaseUrl } from "@nalaOs/twilio-voice";
import { loadTwilioEnv, maskSid } from "@nalaOs/twilio-env";

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
    accountSidPreview?: string;
  };
  regulatory: { note: string };
  nextSteps: string[];
};

export async function getSetupStatus(request?: Request): Promise<SetupStatus> {
  const env = loadTwilioEnv();
  const status = getTwilioStatus();
  const webhookResolved =
    getWebhookBaseUrl(request) ?? status.webhookBaseUrl ?? undefined;

  const accountSidSet = Boolean(env.accountSid);
  const authTokenSet = Boolean(env.authToken);
  const fromNumberSet = Boolean(env.fromNumber);
  const webhookBaseUrlSet = Boolean(webhookResolved);

  const readyToDial =
    accountSidSet &&
    authTokenSet &&
    fromNumberSet &&
    webhookBaseUrlSet &&
    status.configured;

  const nextSteps: string[] = [];

  if (!accountSidSet || !authTokenSet) {
    nextSteps.push("Paste Account SID and Auth Token on /admin/setup");
  }
  if (!webhookBaseUrlSet) {
    nextSteps.push("Set webhook URL to https://grayarx.com");
  }
  if (!fromNumberSet) {
    nextSteps.push("Wait for Gray Ox bundle → buy +27 number → save again");
  }
  if (readyToDial) {
    nextSteps.push("Open /admin/prospector → Hand off to Themba");
  }

  return {
    twilio: {
      accountSidSet,
      authTokenSet,
      fromNumberSet,
      fromNumber: env.fromNumber,
      webhookBaseUrlSet,
      webhookBaseUrl: webhookResolved,
      readyToDial,
      message: status.message,
      accountSidPreview: env.accountSid ? maskSid(env.accountSid) : undefined,
    },
    regulatory: {
      note:
        "South Africa mobile numbers need your Gray Ox bundle approved before purchase.",
    },
    nextSteps,
  };
}

export async function verifyTwilioConnection(credentials?: {
  accountSid: string;
  authToken: string;
}): Promise<{
  ok: boolean;
  accountName?: string;
  balance?: string;
  error?: string;
}> {
  const env = credentials ?? loadTwilioEnv();
  const accountSid = credentials?.accountSid ?? env.accountSid;
  const authToken = credentials?.authToken ?? env.authToken;

  if (!accountSid || !authToken) {
    return { ok: false, error: "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN" };
  }

  try {
    const client = twilio(accountSid, authToken);
    const account = await client.api.accounts(accountSid).fetch();
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
