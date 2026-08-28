import { NextResponse } from "next/server";
import {
  getPilot,
  startPilot,
  updatePilotChecklist,
} from "@/lib/conversion/pilot";

export async function GET() {
  return NextResponse.json({ pilot: getPilot() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "start") {
    const name =
      typeof body.dealershipName === "string"
        ? body.dealershipName
        : "Demo Yard";
    return NextResponse.json({ ok: true, pilot: startPilot(name) });
  }

  if (body.action === "checklist") {
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    const done = Boolean(body.done);
    const pilot = updatePilotChecklist(itemId, done);
    if (!pilot) {
      return NextResponse.json(
        { error: "Pilot not started or checklist item missing." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, pilot });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
