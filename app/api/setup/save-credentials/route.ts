import { NextResponse } from "next/server";
import { verifyTwilioConnection, getSetupStatus } from "@/lib/setup-status";
import {
  maskSid,
  sanitizeCredential,
  saveTwilioEnv,
} from "@/lib/twilio-env";

type SaveCredentialsRequest = {
  accountSid?: unknown;
  authToken?: unknown;
  webhookBaseUrl?: unknown;
  fromNumber?: unknown;
};

export async function POST(request: Request) {
  let body: SaveCredentialsRequest;

  try {
    body = (await request.json()) as SaveCredentialsRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const accountSid = sanitizeCredential(
    typeof body.accountSid === "string" ? body.accountSid : "",
  );
  const authToken = sanitizeCredential(
    typeof body.authToken === "string" ? body.authToken : "",
  );
  const webhookBaseUrl = sanitizeCredential(
    typeof body.webhookBaseUrl === "string" ? body.webhookBaseUrl : "",
  ).replace(/\/$/, "");
  const fromNumber = sanitizeCredential(
    typeof body.fromNumber === "string" ? body.fromNumber : "",
  );

  if (!accountSid.startsWith("AC")) {
    return NextResponse.json(
      {
        error: `Account SID must start with AC. Got: "${accountSid.slice(0, 10)}…" (${accountSid.length} chars)`,
      },
      { status: 400 },
    );
  }
  if (accountSid.length !== 34) {
    return NextResponse.json(
      {
        error: `Account SID should be 34 characters. Yours is ${accountSid.length}. Copy the full Account SID from Twilio home.`,
      },
      { status: 400 },
    );
  }
  if (!authToken || authToken.length < 20) {
    return NextResponse.json(
      {
        error: `Auth Token looks too short (${authToken.length} chars). Click Show on Twilio and copy the full token.`,
      },
      { status: 400 },
    );
  }
  if (!webhookBaseUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "Webhook URL must start with https://" },
      { status: 400 },
    );
  }

  const paths = saveTwilioEnv({
    accountSid,
    authToken,
    webhookBaseUrl,
    fromNumber: fromNumber || undefined,
  });

  // Verify exactly what was pasted — not stale cached env
  const verify = await verifyTwilioConnection({ accountSid, authToken });
  const status = await getSetupStatus(request);

  return NextResponse.json({
    saved: true,
    verify,
    status,
    debug: {
      accountSidPreview: maskSid(accountSid),
      authTokenLength: authToken.length,
      savedTo: paths.envPath,
      serverTime: new Date().toISOString(),
    },
  });
}
