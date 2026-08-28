import { getSmartReply } from "@/lib/call-agent-playbook";
import {
  appendTranscript,
  getLiveCallSession,
  updateLiveCallSession,
} from "@/lib/call-session-store";
import { validateTwilioRequest } from "@/lib/twilio-client";
import { agentTurnTwiml, gatherSpeech, hangup, say, twimlDocument } from "@/lib/twiml";

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
    return twimlDocument(`${say("Sorry, this call session expired.")}${hangup()}`);
  }

  const session = getLiveCallSession(sessionId);
  if (!session) {
    return twimlDocument(`${say("Sorry, this call session expired.")}${hangup()}`);
  }

  const formData = await request.formData();
  const params = formDataToRecord(formData);

  if (!validateTwilioRequest(request, params)) {
    return new Response("Invalid Twilio signature.", { status: 403 });
  }

  const turnUrl = new URL(request.url).toString();
  const speechResult = params.SpeechResult?.trim() ?? "";

  if (!speechResult) {
    const emptyTurns = session.emptyTurns + 1;
    updateLiveCallSession(sessionId, { emptyTurns });

    if (emptyTurns >= 2) {
      const goodbye =
        "Sorry, I couldn't hear you clearly. I'll follow up another time. Goodbye.";
      appendTranscript(sessionId, { role: "agent", text: goodbye });
      updateLiveCallSession(sessionId, { status: "completed" });
      return twimlDocument(`${say(goodbye)}${hangup()}`);
    }

    const retry = "Sorry, I didn't catch that. Could you say that again?";
    appendTranscript(sessionId, { role: "agent", text: retry });
    return twimlDocument(`${say(retry)}${gatherSpeech(turnUrl)}`);
  }

  appendTranscript(sessionId, {
    role: "dealership",
    text: speechResult,
  });

  const result = getSmartReply(speechResult, session.lead, {
    stage: session.stage,
    intel: session.intel,
  });

  updateLiveCallSession(sessionId, {
    stage: result.nextStage,
    intel: result.intel,
    emptyTurns: 0,
    status: result.endCall ? "completed" : "in-progress",
  });

  appendTranscript(sessionId, {
    role: "agent",
    text: result.reply,
    intent: result.intent,
  });

  return agentTurnTwiml(result.reply, turnUrl, result.endCall);
}

export async function GET(request: Request) {
  return POST(request);
}
