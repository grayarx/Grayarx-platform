import { NextResponse } from "next/server";
import { findProspect, startThembaCall } from "@/lib/place-outbound-call";
import { getTwilioStatus } from "@/lib/twilio-status";
import { getWebhookBaseUrl } from "@/lib/twilio-voice";
import type { LeadContext } from "@/lib/sales-templates";

type QueueCallRequest = {
  prospectId?: unknown;
  toPhone?: unknown;
  lead?: Partial<Record<keyof LeadContext, unknown>>;
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
  const webhookBaseUrl = getWebhookBaseUrl(request) ?? twilio.webhookBaseUrl ?? null;

  if (!twilio.configured || !webhookBaseUrl) {
    return NextResponse.json({
      queued: true,
      placed: false,
      prospectId: body.prospectId.trim(),
      twilioConfigured: false,
      twilioMessage: twilio.message,
      error:
        "Twilio not fully configured. Set credentials and TWILIO_WEBHOOK_BASE_URL to your public HTTPS URL.",
    });
  }

  const prospect = findProspect(body.prospectId.trim());
  const toPhone =
    (typeof body.toPhone === "string" && body.toPhone.trim()) ||
    prospect?.phone;

  if (!toPhone) {
    return NextResponse.json(
      { error: "A dealership phone number (toPhone) is required." },
      { status: 400 },
    );
  }

  const leadOverride: Partial<LeadContext> = {};
  if (body.lead && typeof body.lead === "object") {
    for (const [key, value] of Object.entries(body.lead)) {
      if (typeof value === "string" && value.trim()) {
        leadOverride[key as keyof LeadContext] = value.trim();
      }
    }
  }

  try {
    const call = await startThembaCall({
      prospectId: body.prospectId.trim(),
      toPhone,
      lead: leadOverride,
      webhookBaseUrl,
    });

    return NextResponse.json({
      queued: true,
      placed: true,
      prospectId: body.prospectId.trim(),
      sessionId: call.sessionId,
      callSid: call.callSid,
      toPhone: call.toPhone,
      twilioConfigured: true,
      twilioMessage: `Dialling ${call.toPhone} — Themba will run the discovery funnel on connect.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        queued: true,
        placed: false,
        error:
          error instanceof Error ? error.message : "Failed to place Twilio call.",
        twilioConfigured: twilio.configured,
        twilioMessage: twilio.message,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const twilio = getTwilioStatus();
  const webhookBaseUrl = getWebhookBaseUrl(request) ?? twilio.webhookBaseUrl;
  return NextResponse.json({
    ...twilio,
    webhookBaseUrlResolved: webhookBaseUrl ?? null,
  });
}
