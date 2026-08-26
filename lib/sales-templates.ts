export type LeadContext = {
  dealershipName: string;
  location: string;
  agentName: string;
  phoneNumber: string;
  researchNote: string;
  callReason: string;
};

export const DEFAULT_LEAD: LeadContext = {
  dealershipName: "Sandton Audi Prestige",
  location: "Sandton, Gauteng",
  agentName: "Themba",
  phoneNumber: "079 491 5187",
  researchNote:
    "I've had a look at your yard and thought this was worth putting in front of you",
  callReason:
    "I've had a look at your yard, and I think you're exactly the kind of dealership we built this for.",
};

/**
 * WhatsApp / email follow-up — dealership outcomes, no product jargon.
 */
export function buildWhatsAppFollowUp(lead: LeadContext): string {
  return [
    `Hi ${lead.dealershipName} — ${lead.agentName} here from GrayArx. ${lead.researchNote}.`,
    "",
    "We help dealerships turn after-hours enquiries into booked test drives. Your live stock is presented in a polished, branded showroom; buyers get an immediate response; and serious enquiries go straight to your sales team — while the interest is still hot.",
    "",
    "It works alongside your current website, AutoTrader and DMS, so there is nothing to replace. We can set up a free pilot using your own vehicles, with no credit card required.",
    "",
    `Worth a quick 15-minute look? Reply YES and I'll arrange it, or call me on ${lead.phoneNumber}.`,
  ].join("\n");
}

/**
 * Spoken call opener — only the first turn. The agent must wait for an answer
 * and use the smart-reply playbook instead of reading a monologue.
 */
export function buildCallScript(lead: LeadContext): string {
  return [
    `Hi, it's ${lead.agentName} from GrayArx — how are you?`,
    "",
    "[STOP AND LISTEN]",
    "",
    `I'm trying to reach the person who looks after sales or online enquiries for ${lead.dealershipName}. Would that be you?`,
    "",
    "[STOP AND LISTEN — choose the matching smart reply below]",
  ].join("\n");
}
