import { createLiveCallSession, updateLiveCallSession } from "@/lib/call-session-store";
import { MOCK_PROSPECTS } from "@/lib/prospector-data";
import { prospectToLead } from "@/lib/prospect-to-lead";
import type { Prospect } from "@/lib/prospector-types";
import { getTwilioClient } from "@/lib/twilio-client";
import { getTwilioStatus } from "@/lib/twilio-status";
import { normalizeZaPhone } from "@/lib/twilio-voice";
import type { LeadContext } from "@/lib/sales-templates";

export function findProspect(prospectId: string): Prospect | undefined {
  return MOCK_PROSPECTS.find((item) => item.id === prospectId);
}

export async function startThembaCall(input: {
  prospectId: string;
  toPhone: string;
  lead?: Partial<LeadContext>;
  webhookBaseUrl: string;
}): Promise<{
  sessionId: string;
  callSid: string;
  toPhone: string;
}> {
  const prospect = findProspect(input.prospectId);
  const lead = {
    ...prospectToLead(
      prospect ?? {
        id: input.prospectId,
        name: input.lead?.dealershipName ?? "Dealership",
        location: input.lead?.location ?? "South Africa",
        regionId: "ZA",
        city: "Johannesburg",
        score: 0,
        status: "queued_for_call",
        segment: "volume_used",
        abilityToPay: "medium",
        researchNote:
          input.lead?.researchNote ??
          "I had a look at your stock online and had one question about after-hours enquiries",
        callReason:
          input.lead?.callReason ??
          "I'm curious what happens when a buyer enquires after your team has gone home.",
      },
    ),
    ...input.lead,
  };

  const toPhone = normalizeZaPhone(input.toPhone);
  const session = createLiveCallSession({
    prospectId: input.prospectId,
    toPhone,
    lead,
  });

  const twilio = getTwilioStatus();
  const client = getTwilioClient();
  const base = input.webhookBaseUrl.replace(/\/$/, "");

  const call = await client.calls.create({
    to: toPhone,
    from: twilio.fromNumber!,
    url: `${base}/api/twilio/voice/outbound?sessionId=${session.id}`,
    statusCallback: `${base}/api/twilio/voice/status?sessionId=${session.id}`,
    statusCallbackEvent: [
      "initiated",
      "ringing",
      "answered",
      "completed",
      "busy",
      "failed",
      "no-answer",
      "canceled",
    ],
    statusCallbackMethod: "POST",
  });

  updateLiveCallSession(session.id, {
    callSid: call.sid,
    status: "ringing",
  });

  return {
    sessionId: session.id,
    callSid: call.sid,
    toPhone,
  };
}
