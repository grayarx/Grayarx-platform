import { NextResponse } from "next/server";
import { getSmartReply } from "@/lib/call-agent-playbook";
import type { CallContext } from "@/lib/call-intents";
import type { CallIntel } from "@/lib/call-intel";
import { defaultStage, type CallStage } from "@/lib/call-stages";
import { DEFAULT_LEAD, type LeadContext } from "@/lib/sales-templates";

type ReplyRequest = {
  message?: unknown;
  lead?: Partial<Record<keyof LeadContext, unknown>>;
  context?: {
    stage?: unknown;
    intel?: unknown;
  };
};

const VALID_STAGES = new Set<CallStage>([
  "opening",
  "qualifying",
  "discovering",
  "presenting",
  "closing",
  "ended",
]);

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

function buildContext(input: ReplyRequest["context"]): CallContext {
  if (!input || typeof input !== "object") {
    return { stage: defaultStage(), intel: {} };
  }

  const stage =
    typeof input.stage === "string" && VALID_STAGES.has(input.stage as CallStage)
      ? (input.stage as CallStage)
      : defaultStage();

  const intel =
    input.intel && typeof input.intel === "object"
      ? (input.intel as Partial<CallIntel>)
      : {};

  return { stage, intel };
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

  const lead = buildLead(body.lead);
  const context = buildContext(body.context);
  const result = getSmartReply(body.message, lead, context);
  const requiresHuman =
    result.intent === "unknown" ||
    result.intent === "privacy" ||
    result.intent === "already-customer";

  return NextResponse.json({
    intent: result.intent,
    response: result.reply,
    action: result.endCall
      ? "speak_farewell_then_end"
      : requiresHuman
        ? "speak_then_escalate"
        : "speak_then_listen",
    nextStep: result.nextStep,
    nextStage: result.nextStage,
    intel: result.intel,
    intelNote: result.intelNote ?? null,
    suppressContact:
      result.intent === "do-not-call" || result.intent === "hostile",
  });
}
