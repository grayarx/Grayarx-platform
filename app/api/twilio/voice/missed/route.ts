import { NextResponse } from "next/server";
import { recoverMissedCall } from "@/lib/recovery/missed-call";
import { validateTwilioRequest } from "@/lib/twilio-client";

/**
 * Twilio hits this when an inbound call to the yard number is missed / no-answer.
 * Recovers via WhatsApp. Also accepts JSON for local testing without Twilio signature.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      callerPhone?: string;
      callerName?: string;
      dealershipId?: string;
    };
    if (!body.callerPhone) {
      return NextResponse.json({ error: "callerPhone required" }, { status: 400 });
    }
    const result = await recoverMissedCall({
      callerPhone: body.callerPhone,
      callerName: body.callerName,
      dealershipId: body.dealershipId,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") params[key] = value;
  }

  // Allow unsigned in non-production / when Twilio not configured (local mock)
  const twilioReady = Boolean(
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_ACCOUNT_SID?.trim(),
  );
  if (twilioReady && !validateTwilioRequest(request, params)) {
    return new Response("Invalid Twilio signature.", { status: 403 });
  }

  const callerPhone = params.From || params.Caller;
  if (!callerPhone) {
    return new Response("Missing From", { status: 400 });
  }

  const callStatus = (params.CallStatus || params.DialCallStatus || "").toLowerCase();
  const shouldRecover =
    !callStatus ||
    ["no-answer", "busy", "failed", "canceled", "completed"].includes(callStatus);

  if (!shouldRecover) {
    return new Response("OK");
  }

  await recoverMissedCall({
    callerPhone,
    dealershipId:
      new URL(request.url).searchParams.get("dealershipId") ?? undefined,
  });

  // Empty TwiML — call already ended / voicemail path
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } },
  );
}
