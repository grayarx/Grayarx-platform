export type CallIntent =
  | "permission-granted"
  | "decision-maker"
  | "gatekeeper"
  | "busy"
  | "discovery-gap"
  | "discovery-strong"
  | "weekend-gap"
  | "volume-high"
  | "volume-low"
  | "what-is-grayarx"
  | "send-information"
  | "pricing"
  | "pricing-tiers"
  | "existing-tools"
  | "current-process"
  | "competitor-named"
  | "not-now"
  | "think-about-it"
  | "ai-question"
  | "already-tried-ai"
  | "privacy"
  | "objection-trust"
  | "objection-contract"
  | "objection-no-budget"
  | "objection-no-need"
  | "needs-owner"
  | "hesitation"
  | "pilot-terms"
  | "demo-details"
  | "book-demo"
  | "callback-confirmed"
  | "already-customer"
  | "wrong-dealership"
  | "hostile"
  | "not-interested"
  | "do-not-call"
  | "unknown";

export type SmartReply = {
  intent: CallIntent;
  situation: string;
  reply: string;
  nextStep: string;
  endCall: boolean;
};

export type SmartReplyResult = SmartReply & {
  nextStage: import("@nalaOs/call-stages").CallStage;
  intel: Partial<import("@nalaOs/call-intel").CallIntel>;
  intelNote?: string;
};

export type CallContext = {
  stage?: import("@nalaOs/call-stages").CallStage;
  intel?: Partial<import("@nalaOs/call-intel").CallIntel>;
};

export type ReplyBundle = Omit<SmartReply, "intent"> & {
  intel?: Partial<import("@nalaOs/call-intel").CallIntel>;
};
