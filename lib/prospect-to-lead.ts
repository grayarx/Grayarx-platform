import type { Prospect } from "@/lib/prospector-types";
import { DEFAULT_LEAD, type LeadContext } from "@/lib/sales-templates";

export function prospectToLead(prospect: Prospect): LeadContext {
  return {
    dealershipName: prospect.name,
    location: prospect.location,
    agentName: DEFAULT_LEAD.agentName,
    phoneNumber: DEFAULT_LEAD.phoneNumber,
    researchNote: prospect.researchNote,
    callReason: prospect.callReason,
  };
}
