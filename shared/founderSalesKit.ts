/**
 * Founder sales kit — structured for /admin/sales-kit.
 * Markdown twin: docs/FOUNDER_SALES_KIT.md (keep in sync).
 */

import { formatZar, ROI_DEFAULT_GROSS_PROFIT_ZAR } from "./dealerRoiMath";
import { PILOT_PARTNER, TIER_DISPLAY_NAMES, TIER_PRICES_ZAR } from "./subscriptionTiers";

export type SalesKitSection = {
  id: string;
  title: string;
  body: string[];
  /** Paste-ready lines (WhatsApp / SMS). */
  paste?: string[];
};

const floor = formatZar(PILOT_PARTNER.monthlyPriceZar);
const listShowroom = formatZar(TIER_PRICES_ZAR.starter);
const listGrowth = formatZar(TIER_PRICES_ZAR.professional);
const gp = formatZar(ROI_DEFAULT_GROSS_PROFIT_ZAR);

export const FOUNDER_SALES_KIT_META = {
  title: "Founder sales kit",
  audience: "Founder / admin only — not shown to dealerships",
  contact: "Henrique Marx · 079 491 5187 · hello@grayarx.com",
  moneyFloorZar: PILOT_PARTNER.monthlyPriceZar,
  moneyAskLine: `Pilot Partner: ${TIER_DISPLAY_NAMES.professional} features at ${floor}/mo after free pilot (Showroom list). Full ${TIER_DISPLAY_NAMES.professional} list is ${listGrowth}/mo — you lock the founder floor in writing before billing.`,
};

/** Pre-call checklist before dialling / demos. */
export const SALES_KIT_PRECALL: SalesKitSection = {
  id: "precall",
  title: "Pre-call (5 minutes)",
  body: [
    "Open Prospector card: dealership name, city, brands, Sipho rationale, named principal email if any.",
    "Check their WhatsApp / website — is stock live? After-hours reply?",
    "Have shortcode demo ready (CSV already imported on a yard they can recognise).",
    "Legal pack ready: /legal (Dealer Agreement + POPIA) — don’t send bank details in chat.",
    "Decide money ask: Pilot Partner floor vs full Growth list. Default = floor.",
  ],
  paste: [
    `Hi [Name] — Henrique from GrayArx. Sipho flagged [Yard]. We catch after-hours WhatsApp on your live stock and book drives. Free pilot, no card. 15 min on your cars? 079 491 5187`,
  ],
};

export const SALES_KIT_OPENER: SalesKitSection = {
  id: "opener",
  title: "Opener (30 seconds)",
  body: [
    "GrayArx gives your yard a 24/7 assistant on webchat and WhatsApp that answers from your live inventory, books viewings, and drops warm leads in your inbox.",
    "We sit beside AutoTrader / DMS / Meta — no cancel needed.",
    "Free pilot on your stock. Pricing confirmed in writing before any billing.",
  ],
  paste: [
    "GrayArx = after-hours WhatsApp + CSV showroom + booked drives on YOUR cars. Free pilot. Alongside your current tools.",
  ],
};

export const SALES_KIT_MONEY_ASK: SalesKitSection = {
  id: "money",
  title: "Money ask (say this)",
  body: [
    `Default close: “Pilot Partner — you get ${TIER_DISPLAY_NAMES.professional} features (showroom, CSV, WhatsApp Nala, Mia drip, leads). Free until we confirm terms. Then ${floor}/mo — same as ${TIER_DISPLAY_NAMES.starter} list — not the ${listGrowth} Growth list. Month-to-month with 30 days’ notice, or 12-month founder lock.”`,
    `ROI bridge: “One recovered close at ~${gp} gross pays for ${floor}/mo several times over. We’re not asking you to believe a dashboard — prove it on your yard.”`,
    "If they push: stay month-to-month; never invent a lower public site price. Exceptions = founder only, written.",
    "Card or EFT when billing starts. No credit card for the free pilot.",
  ],
  paste: [
    `Pilot = Growth features. Free until written confirm. Then ${floor}/mo (Showroom list) · month-to-month · cancel with 30 days.`,
    `One recovered lead at ~${gp} GP covers ${floor}/mo.`,
  ],
};

export const SALES_KIT_OBJECTIONS: SalesKitSection[] = [
  {
    id: "obj-contract",
    title: "“We’re still in a contract”",
    body: [
      "Perfect — no cancel needed. GrayArx is a second layer for after-hours capture and stock-aware chat.",
      "Pilot now; diary a deeper rollout when their renewals hit if they want.",
    ],
    paste: [
      "Stay in your current contract. GrayArx runs alongside — free pilot, no rip-and-replace.",
    ],
  },
  {
    id: "obj-cars",
    title: "“Why not just Cars.co.za?”",
    body: [
      "Keep the classifieds spend. We convert the conversation once they message you or hit your showroom.",
    ],
  },
  {
    id: "obj-ai",
    title: "“What if AI is wrong?”",
    body: [
      "Answers from your inventory DB. Stale stock is the usual fail — fix the row. Dicey paths → human queue.",
    ],
  },
  {
    id: "obj-wa",
    title: "“Do we need a new WhatsApp number?”",
    body: [
      "Prefer existing WhatsApp Business on Meta Cloud API. Until linked: Growth webchat + click-to-chat still on — not a Showroom downgrade.",
    ],
  },
  {
    id: "obj-price",
    title: "“Too expensive / send pricing”",
    body: [
      `Public site keeps full tier table soft. Soft floor: from ${listShowroom}/mo after pilot for Pilot Partners.`,
      "Send /pricing + ROI line. Close on call with written confirm before invoice.",
    ],
  },
  {
    id: "obj-team",
    title: "“Will this replace my team?”",
    body: [
      "Replaces silence after hours — not closers. Floor still owns trade-in, finance, handshake.",
    ],
  },
];

export const SALES_KIT_CLOSE: SalesKitSection = {
  id: "close",
  title: "Close + next steps",
  body: [
    "Book: 15-min demo on THEIR CSV / stock photos.",
    "Apply path: grayarx.com/#lead-capture or /onboarding (ref= shortcode if peer referral).",
    "Same day: provision dealership, Growth pilot tier, shortcode, import ≥10 units.",
    "Legal: Dealer Agreement + POPIA before go-live.",
    "Success metric week 1: ≥1 after-hours reply path + ≥1 booking or qualified lead they recognise.",
  ],
  paste: [
    "Next step: 15-min on your stock → free pilot live → we confirm ${floor}/mo in writing before billing. Deal?",
  ],
};

export const SALES_KIT_SECTIONS: SalesKitSection[] = [
  SALES_KIT_PRECALL,
  SALES_KIT_OPENER,
  SALES_KIT_MONEY_ASK,
  ...SALES_KIT_OBJECTIONS,
  SALES_KIT_CLOSE,
];

/** Related docs for the admin page footer. */
export const SALES_KIT_RELATED_DOCS = [
  { path: "docs/FOUNDER_SALES_KIT.md", label: "This kit (markdown)" },
  { path: "docs/DEALER_QA_PLAYBOOK.md", label: "Full Q&A playbook" },
  { path: "docs/FOUNDER_SALES_AGENTS.md", label: "Sipho → Themba flow" },
  { path: "docs/STILL_IN_CONTRACT_FOLLOWUP.md", label: "Contract objection sequence" },
  { path: "docs/PILOT_SLA.md", label: "Pilot SLA (honest)" },
  { path: "docs/DEALER_CRM_PITCH_EMAIL.md", label: "Email / CRM pitch" },
];
