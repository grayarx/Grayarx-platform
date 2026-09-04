export type LeadContext = {
  dealershipName: string;
  location: string;
  agentName: string;
  phoneNumber: string;
  /** Short personal hook for WhatsApp — curiosity, not product. */
  researchNote: string;
  /** Why you picked this yard — spoken, one line, no jargon. */
  callReason: string;
};

export const DEFAULT_LEAD: LeadContext = {
  dealershipName: "Sandton Audi Prestige",
  location: "Sandton, Gauteng",
  agentName: "Themba",
  phoneNumber: "079 491 5187",
  researchNote:
    "I had a look at your stock online and had one question about after-hours enquiries",
  callReason:
    "I noticed strong stock on your site — I'm curious what happens when a buyer enquires after your team has gone home.",
};

/**
 * WhatsApp / email follow-up — PAS in three beats. No feature lists. No fake stats.
 */
export function buildWhatsAppFollowUp(lead: LeadContext): string {
  return [
    `Hi ${lead.dealershipName} — ${lead.agentName} from GrayArx. ${lead.researchNote}.`,
    "",
    "When a buyer messages on a Sunday evening, does someone get back to them that night — or does it wait until Monday? That silence is a decision. The next yard that replies gets the drive.",
    "",
    "We put Nala on your live CSV so those 9pm WhatsApps become booked test drives. Runs next to how you already list stock — nothing to cancel. 14-day Pilot is R0.",
    "",
    `Give me 14 days on your stock? Reply YES or call ${lead.phoneNumber}.`,
  ].join("\n");
}

/**
 * First spoken line on connect — permission only, then listen.
 */
export function buildCallOpenerSpeech(lead: LeadContext): string {
  return `Hi, it's ${lead.agentName} from GrayArx. Did I catch you at a bad time, or do you have sixty seconds?`;
}

/**
 * Spoken call opener — permission, qualify, stop. Discovery comes next turn.
 */
export function buildCallScript(lead: LeadContext): string {
  return [
    `Hi, it's ${lead.agentName} from GrayArx — did I catch you at a bad time, or do you have sixty seconds?`,
    "",
    "[STOP AND LISTEN]",
    "",
    `I'm trying to reach whoever handles online enquiries for ${lead.dealershipName}. Would that be you?`,
    "",
    "[STOP AND LISTEN — use smart reply; diagnose before prescribing]",
    "",
    `If yes — ${lead.callReason} What actually happens to a 9pm WhatsApp tonight?`,
  ].join("\n");
}
