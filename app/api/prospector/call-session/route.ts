import { NextResponse } from "next/server";
import { getLiveCallSession } from "@/lib/call-session-store";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId query parameter is required." },
      { status: 400 },
    );
  }

  const session = getLiveCallSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: session.id,
    prospectId: session.prospectId,
    callSid: session.callSid,
    status: session.status,
    stage: session.stage,
    intel: session.intel,
    transcript: session.transcript,
    toPhone: session.toPhone,
  });
}
