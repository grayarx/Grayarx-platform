import { NextResponse } from "next/server";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { verifyTwilioConnection, getSetupStatus } from "@/lib/setup-status";

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

  const accountSid =
    typeof body.accountSid === "string" ? body.accountSid.trim() : "";
  const authToken =
    typeof body.authToken === "string" ? body.authToken.trim() : "";
  const webhookBaseUrl =
    typeof body.webhookBaseUrl === "string"
      ? body.webhookBaseUrl.trim().replace(/\/$/, "")
      : "";
  const fromNumber =
    typeof body.fromNumber === "string" ? body.fromNumber.trim() : "";

  if (!accountSid.startsWith("AC")) {
    return NextResponse.json(
      { error: "Account SID must start with AC" },
      { status: 400 },
    );
  }
  if (!authToken) {
    return NextResponse.json(
      { error: "Auth Token is required." },
      { status: 400 },
    );
  }
  if (!webhookBaseUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "Webhook URL must start with https://" },
      { status: 400 },
    );
  }

  const lines = [
    "# GrayArx Twilio — saved from /admin/setup",
    `TWILIO_ACCOUNT_SID=${accountSid}`,
    `TWILIO_AUTH_TOKEN=${authToken}`,
    `TWILIO_WEBHOOK_BASE_URL=${webhookBaseUrl}`,
  ];

  if (fromNumber) {
    lines.push(`TWILIO_FROM_NUMBER=${fromNumber}`);
  }

  const envPath = join(process.cwd(), ".env.local");
  writeFileSync(envPath, `${lines.join("\n")}\n`, "utf8");

  process.env.TWILIO_ACCOUNT_SID = accountSid;
  process.env.TWILIO_AUTH_TOKEN = authToken;
  process.env.TWILIO_WEBHOOK_BASE_URL = webhookBaseUrl;
  if (fromNumber) process.env.TWILIO_FROM_NUMBER = fromNumber;

  const verify = await verifyTwilioConnection();
  const status = await getSetupStatus(request);

  return NextResponse.json({
    saved: true,
    verify,
    status,
  });
}
