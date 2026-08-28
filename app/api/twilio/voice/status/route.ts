import {
  getLiveCallSession,
  getLiveCallSessionByCallSid,
  updateLiveCallSession,
} from "@/lib/call-session-store";
import { validateTwilioRequest } from "@/lib/twilio-client";

function formDataToRecord(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") params[key] = value;
  }
  return params;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const params = formDataToRecord(formData);

  if (!validateTwilioRequest(request, params)) {
    return new Response("Invalid Twilio signature.", { status: 403 });
  }

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const callSid = params.CallSid;
  const callStatus = params.CallStatus;

  const session =
    (sessionId ? getLiveCallSession(sessionId) : undefined) ??
    (callSid ? getLiveCallSessionByCallSid(callSid) : undefined);

  if (!session) {
    return new Response("OK");
  }

  if (callStatus === "completed") {
    updateLiveCallSession(session.id, { status: "completed" });
  } else if (
    callStatus === "failed" ||
    callStatus === "busy" ||
    callStatus === "no-answer" ||
    callStatus === "canceled"
  ) {
    updateLiveCallSession(session.id, { status: "failed" });
  } else if (callStatus === "ringing" || callStatus === "in-progress") {
    updateLiveCallSession(session.id, {
      status: callStatus === "ringing" ? "ringing" : "in-progress",
      callSid,
    });
  }

  return new Response("OK");
}
