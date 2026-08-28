/**
 * GrayArx unit economics + sell packages.
 * Costs in ZAR / dealership / month (conservative mid-volume).
 * Gross margin target ~45–55% after variable usage.
 */

export type CostLine = {
  item: string;
  starter: number;
  professional: number;
  enterprise: number;
  notes: string;
};

/** Estimated COGS we pay so the product actually runs */
export const MONTHLY_COGS_LINES: CostLine[] = [
  {
    item: "LLM (Nala replies)",
    starter: 1200,
    professional: 2800,
    enterprise: 6000,
    notes: "OpenAI/compatible — volume scales with enquiries",
  },
  {
    item: "WhatsApp (Meta Cloud)",
    starter: 800,
    professional: 2000,
    enterprise: 5000,
    notes: "Conversation fees ZA; marketing templates higher",
  },
  {
    item: "Twilio (missed-call + voice)",
    starter: 400,
    professional: 800,
    enterprise: 2000,
    notes: "Inbound recovery + Themba outbound minutes",
  },
  {
    item: "Hosting / infra",
    starter: 200,
    professional: 350,
    enterprise: 1000,
    notes: "App, storage, backups allocated per tenant",
  },
  {
    item: "Email (Monday ROI)",
    starter: 50,
    professional: 80,
    enterprise: 200,
    notes: "Resend / transactional",
  },
  {
    item: "Support allocation",
    starter: 800,
    professional: 1200,
    enterprise: 3000,
    notes: "Onboarding + WhatsApp support amortized",
  },
  {
    item: "Contingency (15%)",
    starter: 520,
    professional: 1080,
    enterprise: 2580,
    notes: "Spike usage, FX, failed sends retries",
  },
];

export function sumCogs(
  tier: "starter" | "professional" | "enterprise",
): number {
  return MONTHLY_COGS_LINES.reduce((acc, line) => acc + line[tier], 0);
}

export type SellPackage = {
  id: "pilot" | "starter" | "professional" | "enterprise";
  name: string;
  priceMonthlyZar: number;
  priceLabel: string;
  includedWhatsAppConversations: number;
  overagePerConversationZar: number;
  estimatedCogsZar: number;
  grossMarginPercent: number;
  target: string;
  includes: string[];
  headline: string;
  vsMarket: string;
  profitNote: string;
};

function margin(price: number, cogs: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cogs) / price) * 1000) / 10;
}

const starterCogs = sumCogs("starter");
const proCogs = sumCogs("professional");
const entCogs = sumCogs("enterprise");

/**
 * Sell prices chosen to:
 * 1) Stay above Visio/Raimond chatbots on value (OS, not chat count)
 * 2) Stay at/under custom agency R14.9–26k for Professional
 * 3) Clear ~45%+ gross margin after COGS + contingency
 * 4) Protect profit with conversation caps + overage
 */
export const GRAYARX_OS_PACKAGES: SellPackage[] = [
  {
    id: "pilot",
    name: "Pilot",
    priceMonthlyZar: 0,
    priceLabel: "R0 / 14 days",
    includedWhatsAppConversations: 150,
    overagePerConversationZar: 0,
    estimatedCogsZar: Math.round(starterCogs * 0.35),
    grossMarginPercent: 0,
    target: "Any yard — prove Monday numbers on their stock",
    includes: [
      "Nala sales + optional parts/service/trade-in",
      "Live stock + showroom",
      "Missed-call recovery demo",
      "Monday ROI report",
      "Capped at 150 WhatsApp conversations (anti-abuse)",
    ],
    headline: "Hook: full OS slice free, then decide on proof.",
    vsMarket: "No competitor gives a real multi-module pilot this clean.",
    profitNote:
      "We absorb ~R1.4k COGS for 14 days to win the account — only extend if Monday proof is shown.",
  },
  {
    id: "starter",
    name: "Starter OS",
    priceMonthlyZar: 7990,
    priceLabel: "R7,990/mo",
    includedWhatsAppConversations: 1000,
    overagePerConversationZar: 0.85,
    estimatedCogsZar: starterCogs,
    grossMarginPercent: margin(7990, starterCogs),
    target: "Single-yard independents — sales + recovery focus",
    includes: [
      "AI sales from live stock",
      "Marketplace + missed-call recovery",
      "Showroom link",
      "Monday ROI email",
      "1,000 WhatsApp conversations included",
      "Overage R0.85 / conversation",
    ],
    headline: "AI sales OS — live stock, recovery, Monday proof.",
    vsMarket:
      "Above Visio Scale (R5k) and Raimond Starter (R5k); still under Raimond Pro (R10k).",
    profitNote: `Est. COGS ~R${starterCogs.toLocaleString("en-ZA")} → ~${margin(7990, starterCogs)}% gross margin before overage.`,
  },
  {
    id: "professional",
    name: "Professional OS",
    priceMonthlyZar: 14990,
    priceLabel: "R14,990/mo",
    includedWhatsAppConversations: 3500,
    overagePerConversationZar: 0.75,
    estimatedCogsZar: proCogs,
    grossMarginPercent: margin(14990, proCogs),
    target: "Full AI dealership OS — sales + parts + service + trade-in",
    includes: [
      "Everything in Starter",
      "Parts desk (their catalog + prices)",
      "Service calendar + booking",
      "Trade-in intake + photos",
      "Finance partner pre-qual",
      "CRM webhooks (MotorX / CarLeads / Adas)",
      "3,500 WhatsApp conversations included",
      "Overage R0.75 / conversation",
    ],
    headline: "Full AI dealership OS — the no-brainer hero plan.",
    vsMarket:
      "Above Raimond Pro (R10k); at custom-agency typical (~R14.9k) with a fixed product + free pilot.",
    profitNote: `Est. COGS ~R${proCogs.toLocaleString("en-ZA")} → ~${margin(14990, proCogs)}% gross margin; overage protects spike months.`,
  },
  {
    id: "enterprise",
    name: "Enterprise OS",
    priceMonthlyZar: 29990,
    priceLabel: "From R29,990/mo",
    includedWhatsAppConversations: 12000,
    overagePerConversationZar: 0.55,
    estimatedCogsZar: entCogs,
    grossMarginPercent: margin(29990, entCogs),
    target: "Multi-yard groups / MotorX-class footprint",
    includes: [
      "Everything in Professional",
      "Multi-branch stock + routing",
      "Group Monday ROI",
      "SLA + named success contact",
      "12,000 WhatsApp conversations included",
      "Custom finance partner + CRM mapping",
    ],
    headline: "Group OS — branches, SLA, volume pricing.",
    vsMarket:
      "Competes with MotorX Enterprise (custom) and agency R50k+ builds — productised.",
    profitNote: `Est. COGS ~R${entCogs.toLocaleString("en-ZA")} → ~${margin(29990, entCogs)}% gross margin at floor price.`,
  },
];

export function packageById(id: SellPackage["id"]): SellPackage {
  const pkg = GRAYARX_OS_PACKAGES.find((p) => p.id === id);
  if (!pkg) throw new Error(`Unknown package ${id}`);
  return pkg;
}

export function pricingEconomicsSummary() {
  return {
    cogsLines: MONTHLY_COGS_LINES,
    packages: GRAYARX_OS_PACKAGES.map((p) => ({
      id: p.id,
      price: p.priceMonthlyZar,
      cogs: p.estimatedCogsZar,
      marginPercent: p.grossMarginPercent,
      includedConversations: p.includedWhatsAppConversations,
      overage: p.overagePerConversationZar,
      profitNote: p.profitNote,
    })),
    rules: [
      "Pilot is free but capped (150 WA) so we don't bleed on tire-kickers.",
      "Paid tiers price for ~45%+ gross margin after LLM + WhatsApp + Twilio + support.",
      "Overage on conversations protects profit when a yard spikes volume.",
      "Never discount below Starter list without cutting included conversations.",
      "One recovered car/month (GP ~R18k) still beats Professional fee.",
    ],
  };
}
