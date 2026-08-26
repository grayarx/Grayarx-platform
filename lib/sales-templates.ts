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
 * Spoken call opener — sounds like a real salesperson, not a feature list.
 */
export function buildCallScript(lead: LeadContext): string {
  return [
    `Hi, it's ${lead.agentName} from GrayArx — how are you?`,
    "",
    `I'll be brief. ${lead.callReason}`,
    "",
    "Here's the problem we solve: a buyer finds the right car at eight o'clock, sends an enquiry and, by the time someone gets back to them the next morning, they've already messaged three other dealerships.",
    "",
    "GrayArx closes that gap. We put your live stock into a polished, branded showroom, respond to buyers after hours, qualify the serious ones and help get the test drive booked. The opportunity goes straight to your team, so they start the day with warm customers — not a list of cold follow-ups.",
    "",
    "And we don't replace your website, AutoTrader or DMS. GrayArx works alongside them. We can prove it with a free pilot on your own stock, with no credit card required.",
    "",
    "Out of interest, what normally happens when a WhatsApp enquiry comes in after hours?",
    "",
    "[Listen to their answer]",
    "",
    "That makes sense — and that's exactly the gap we'd like to help you close. Rather than talk you through a long pitch, let me show you what it looks like using your own vehicles. Would a quick 15-minute walk-through suit you better on Tuesday or Wednesday?",
    "",
    `If neither works: No problem — what day suits you? You can also reach me directly on ${lead.phoneNumber}.`,
  ].join("\n");
}
