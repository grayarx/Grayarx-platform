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
  researchNote: "Sipho flagged your yard as a strong fit for what we do",
  callReason:
    "The reason I'm calling you specifically: Sipho flagged you from our dealer research — your yard looked like a strong fit.",
};

/**
 * WhatsApp / email follow-up — dealership outcomes, no product jargon.
 */
export function buildWhatsAppFollowUp(lead: LeadContext): string {
  return [
    `Hi ${lead.dealershipName} — ${lead.agentName} from GrayArx. ${lead.researchNote}.`,
    "",
    "GrayArx helps yards capture every enquiry — leads update your CRM straight away, viewings get booked without the back-and-forth, and buyers browse your live stock on a branded showroom. Warm leads land in your inbox, even after close.",
    "",
    "Stock uploads via CSV, shortcodes for campaigns, and simple invoicing — pay by card or EFT. Runs alongside what you already use — no need to cancel anything. Free pilot.",
    "",
    `15-min demo? Reply YES or call ${lead.phoneNumber}.`,
  ].join("\n");
}

/**
 * Spoken call opener — sounds like a real salesperson, not a feature list.
 */
export function buildCallScript(lead: LeadContext): string {
  return [
    `Hello, this is ${lead.agentName} from GrayArx. I'm reaching out to ${lead.dealershipName} in ${lead.location}.`,
    "",
    "Quick version — GrayArx is built for car yards. When someone enquires — on your site, on WhatsApp, or from a missed call — we capture it, update your CRM, help book the viewing, and send them through your branded showroom with live stock. Warm leads hit your inbox; you're not chasing voicemails at nine at night.",
    "",
    lead.callReason,
    "",
    "GrayArx runs alongside your current tools — nothing to cancel. Pilot agreement and POPIA consent before go-live — dealer agreement and consent form on grayarx.com/legal. Month-to-month with 30 days' notice; we also offer a 12-month commit with founder rate lock if you want that locked in.",
    "",
    "Would you have 15 minutes this week for a quick walk-through?",
  ].join("\n");
}
