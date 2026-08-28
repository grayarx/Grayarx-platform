import { NextResponse } from "next/server";
import { bookViewing } from "@/lib/conversion/leads";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const viewingAt =
    typeof body.viewingAt === "string" ? body.viewingAt : "";

  if (!leadId || !viewingAt) {
    return NextResponse.json(
      { error: "leadId and viewingAt are required." },
      { status: 400 },
    );
  }

  const result = bookViewing({ leadId, viewingAt });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}
