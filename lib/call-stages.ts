import type { CallIntent } from "@/lib/call-intents";

export type CallStage =
  | "opening"
  | "qualifying"
  | "discovering"
  | "presenting"
  | "closing"
  | "ended";

export const CALL_STAGES: CallStage[] = [
  "opening",
  "qualifying",
  "discovering",
  "presenting",
  "closing",
  "ended",
];

export const STAGE_LABELS: Record<CallStage, string> = {
  opening: "1 · Permission",
  qualifying: "2 · Qualify DM",
  discovering: "3 · Diagnose",
  presenting: "4 · Offer pilot",
  closing: "5 · Book / nurture",
  ended: "Ended",
};

const TERMINAL_INTENTS = new Set<CallIntent>([
  "not-interested",
  "do-not-call",
]);

const PRESENTING_INTENTS = new Set<CallIntent>([
  "discovery-gap",
  "discovery-strong",
  "volume-high",
  "volume-low",
  "weekend-gap",
  "hesitation",
  "objection-trust",
  "objection-contract",
  "objection-no-budget",
  "objection-no-need",
  "already-tried-ai",
  "competitor-named",
  "needs-owner",
  "pilot-terms",
  "demo-details",
  "pricing",
  "pricing-tiers",
  "existing-tools",
  "current-process",
  "ai-question",
]);

const CLOSING_INTENTS = new Set<CallIntent>([
  "book-demo",
  "callback-confirmed",
  "send-information",
  "not-now",
  "think-about-it",
]);

export function nextStage(
  current: CallStage,
  intent: CallIntent,
): CallStage {
  if (TERMINAL_INTENTS.has(intent)) return "ended";
  if (intent === "busy" && current === "opening") return "closing";
  if (intent === "wrong-dealership") return "ended";

  switch (current) {
    case "opening":
      if (intent === "permission-granted" || intent === "busy") {
        return "qualifying";
      }
      if (intent === "decision-maker" || intent === "gatekeeper") {
        return intent === "decision-maker" ? "discovering" : "qualifying";
      }
      return "opening";

    case "qualifying":
      if (intent === "decision-maker") return "discovering";
      if (intent === "gatekeeper" || intent === "needs-owner") {
        return "qualifying";
      }
      if (PRESENTING_INTENTS.has(intent) || CLOSING_INTENTS.has(intent)) {
        return intent === "book-demo" ? "closing" : "discovering";
      }
      return "qualifying";

    case "discovering":
      if (intent === "book-demo" || CLOSING_INTENTS.has(intent)) {
        return "closing";
      }
      if (
        PRESENTING_INTENTS.has(intent) ||
        intent === "discovery-gap" ||
        intent === "discovery-strong"
      ) {
        return "presenting";
      }
      return "discovering";

    case "presenting":
      if (intent === "book-demo" || CLOSING_INTENTS.has(intent)) {
        return "closing";
      }
      return "presenting";

    case "closing":
      if (intent === "book-demo" || intent === "callback-confirmed") {
        return "closing";
      }
      return "closing";

    case "ended":
      return "ended";

    default:
      return current;
  }
}

export function defaultStage(): CallStage {
  return "opening";
}
