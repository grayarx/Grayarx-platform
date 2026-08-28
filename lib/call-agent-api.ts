import type { CallIntel } from "@/lib/call-intel";
import type { CallStage } from "@/lib/call-stages";
import type { LeadContext } from "@/lib/sales-templates";

export type CallAgentReplyRequest = {
  message: string;
  lead: LeadContext;
  context?: {
    stage?: CallStage;
    intel?: Partial<CallIntel>;
  };
};

export type CallAgentReplyResponse = {
  intent: string;
  response: string;
  action: "speak_then_listen" | "speak_then_escalate" | "speak_farewell_then_end";
  nextStep: string;
  nextStage: CallStage;
  intel: Partial<CallIntel>;
  intelNote: string | null;
  suppressContact: boolean;
};

export async function fetchCallAgentReply(
  payload: CallAgentReplyRequest,
): Promise<CallAgentReplyResponse> {
  const response = await fetch("/api/call-agent/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Call agent reply failed.");
  }

  return response.json() as Promise<CallAgentReplyResponse>;
}
