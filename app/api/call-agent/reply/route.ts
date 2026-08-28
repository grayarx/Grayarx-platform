import { NextResponse } from "next/server";
import { getSmartReply } from "@/lib/call-agent-playbook";
import { DEFAULT_LEAD, type LeadContext } from "@/lib/sales-templates";

type ReplyRequest = {
  message?: unknown;
  lead?: Partial<Record<keyof LeadContext, unknown>>;
};

function buildLead(input: ReplyRequest["lead"]): LeadContext {
  const lead = { ...DEFAULT_LEAD };

  if (!input || typeof input !== "object") {
    return lead;
  }

  for (const key of Object.keys(lead) as Array<keyof LeadContext>) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) {
      lead[key] = value.trim();
    }
  }

  return lead;
}

export async function POST(request: Request) {
  let body: ReplyRequest;

  try {
    body = (await request.json()) as ReplyRequest;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json(
      { error: "A non-empty dealership message is required." },
      { status: 400 },
    );
  }

  const result = getSmartReply(body.message, buildLead(body.lead));
  const requiresHuman =
    result.intent === "unknown" || result.intent === "privacy";

  return NextResponse.json({
    intent: result.intent,
    response: result.reply,
    action: result.endCall
      ? "speak_farewell_then_end"
      : requiresHuman
        ? "speak_then_escalate"
        : "speak_then_listen",
    nextStep: result.nextStep,
    intelNote: result.intelNote ?? null,
    suppressContact: result.intent === "do-not-call",
  });
}
