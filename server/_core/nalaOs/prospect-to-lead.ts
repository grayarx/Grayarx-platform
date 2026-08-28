import type { Prospect } from "@nalaOs/prospector-types";
import { DEFAULT_LEAD, type LeadContext } from "@nalaOs/sales-templates";

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
