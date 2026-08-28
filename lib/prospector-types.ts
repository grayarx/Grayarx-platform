import type { RegionId } from "@/lib/regions/config";
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

/** Who can pay + needs after-hours conversion */
export type IcpSegment =
  | "premium_independent"
  | "franchise_dealer"
  | "volume_used"
  | "multi_branch_group"
  | "specialty_import";

export type Prospect = {
  id: string;
  name: string;
  location: string;
  /** Country / region for pricing + compliance */
  regionId: RegionId;
  city: string;
  score: number;
  status: ProspectStatus;
  segment: IcpSegment;
  /** Why they can afford Professional+ */
  abilityToPay: "high" | "medium" | "enterprise";
  researchNote: string;
  callReason: string;
  contactName?: string;
  /** Fill from AutoTrader / website — never invent live numbers */
  phone?: string;
  email?: string;
  website?: string;
  stockHint?: string;
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
