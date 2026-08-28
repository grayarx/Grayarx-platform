import { NextResponse } from "next/server";
import { getTwilioStatus } from "@/lib/twilio-status";

type QueueCallRequest = {
  prospectId?: unknown;
};

export async function POST(request: Request) {
  let body: QueueCallRequest;

  try {
    body = (await request.json()) as QueueCallRequest;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof body.prospectId !== "string" || !body.prospectId.trim()) {
    return NextResponse.json(
      { error: "prospectId is required." },
      { status: 400 },
    );
  }

  const twilio = getTwilioStatus();

  return NextResponse.json({
    queued: true,
    placed: twilio.configured,
    prospectId: body.prospectId.trim(),
    twilioConfigured: twilio.configured,
    twilioMessage: twilio.message,
  });
}

export async function GET() {
  const twilio = getTwilioStatus();
  return NextResponse.json(twilio);
}
