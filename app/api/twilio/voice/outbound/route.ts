import {
  appendTranscript,
  getLiveCallSession,
  updateLiveCallSession,
} from "@/lib/call-session-store";
import { buildCallOpenerSpeech } from "@/lib/sales-templates";
import { validateTwilioRequest } from "@/lib/twilio-client";
import { agentTurnTwiml, gatherSpeech, say, twimlDocument } from "@/lib/twiml";

function formDataToRecord(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") params[key] = value;
  }
  return params;
}

export async function POST(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return twimlDocument(`${say("Sorry, this call session expired.")}<Hangup/>`);
  }

  const session = getLiveCallSession(sessionId);
  if (!session) {
    return twimlDocument(`${say("Sorry, this call session expired.")}<Hangup/>`);
  }

  const formData = await request.formData();
  const params = formDataToRecord(formData);

  if (!validateTwilioRequest(request, params)) {
    return new Response("Invalid Twilio signature.", { status: 403 });
  }

  const callSid = params.CallSid;
  if (callSid) {
    updateLiveCallSession(sessionId, { callSid, status: "in-progress" });
  }

  const opener = buildCallOpenerSpeech(session.lead);
  appendTranscript(sessionId, { role: "agent", text: opener });

  const turnUrl = new URL(request.url);
  turnUrl.pathname = turnUrl.pathname.replace("/outbound", "/turn");

  return twimlDocument(`${say(opener)}${gatherSpeech(turnUrl.toString())}`);
}

export async function GET(request: Request) {
  return POST(request);
}
