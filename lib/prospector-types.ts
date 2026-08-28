import type { CallIntel } from "@/lib/call-intel";
import type { CallStage } from "@/lib/call-stages";

export type ProspectStatus =
  | "scouted"
  | "emailed"
  | "queued_for_call"
  | "called"
  | "demo_booked"
  | "not_interested"
  | "do_not_contact";

export type Prospect = {
  id: string;
  name: string;
  location: string;
  score: number;
  status: ProspectStatus;
  researchNote: string;
  callReason: string;
  contactName?: string;
  phone?: string;
  emailedAt?: string;
  lastCallAt?: string;
  callIntel?: Partial<CallIntel>;
  callStage?: CallStage;
};

export type QueuedCallResult = {
  queued: boolean;
  twilioConfigured: boolean;
  twilioMessage: string;
  prospectId: string;
};

export type CallSessionState = {
  stage: CallStage;
  intel: Partial<CallIntel>;
  transcript: Array<{
    role: "agent" | "dealership";
    text: string;
    intent?: string;
  }>;
};
