import { NextResponse } from "next/server";
import type { CallSessionState } from "@/lib/prospector-types";

type SaveIntelRequest = {
  prospectId?: unknown;
  session?: unknown;
};

export async function POST(request: Request) {
  let body: SaveIntelRequest;

  try {
    body = (await request.json()) as SaveIntelRequest;
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

  if (!body.session || typeof body.session !== "object") {
    return NextResponse.json(
      { error: "session object is required." },
      { status: 400 },
    );
  }

  const session = body.session as CallSessionState;

  // Grayarx-Final should persist to DB here. This reference app acknowledges the write.
  return NextResponse.json({
    saved: true,
    prospectId: body.prospectId.trim(),
    stage: session.stage,
    intel: session.intel,
    transcriptLength: session.transcript?.length ?? 0,
  });
}
