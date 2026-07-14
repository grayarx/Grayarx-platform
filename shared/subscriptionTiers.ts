/**
 * GrayArx subscription tiers — single source of truth.
 * Internal IDs (starter/professional/enterprise) match the DB schema.
 */

export type SubscriptionTierId = "starter" | "professional" | "enterprise";

/** Hide list prices on public pages and upgrade UI during pilot. */
export const PILOT_PRICING_HIDDEN = true;

export const TIER_ORDER: SubscriptionTierId[] = ["starter", "professional", "enterprise"];

export const TIER_DISPLAY_NAMES: Record<SubscriptionTierId, string> = {
  starter: "Showroom",
  professional: "Growth",
  /** Multi-branch / multi-site independents. A separate "Group" SKU stays future (needs enum migration). */
  enterprise: "Multi-site",
};

/** Monthly list price in ZAR (cents not used — whole rand for billing). */
export const TIER_PRICES_ZAR: Record<SubscriptionTierId, number> = {
  starter: 3999,
  professional: 7999,
  enterprise: 11999,
};

/** Pilot partners get Growth features at Showroom price. */
export const PILOT_PARTNER = {
  maxDealers: 20,
  /** Feature tier unlocked during pilot */
  featureTier: "professional" as SubscriptionTierId,
  /** Internal billing reference — not shown publicly while PILOT_PRICING_HIDDEN */
  monthlyPriceZar: 3999,
  label: "Pilot Partner",
};

export type TierFeatureRow = {
  key: string;
  label: string;
  /** Which tiers include this (working features only) */
  tiers: SubscriptionTierId[];
};

/** Features we can honestly sell today — aligned with product audit Jul 2026 */
export const TIER_FEATURE_ROWS: TierFeatureRow[] = [
  { key: "showroom", label: "Public showroom + themes", tiers: ["starter", "professional", "enterprise"] },
  { key: "inventory", label: "Inventory + CSV import", tiers: ["starter", "professional", "enterprise"] },
  { key: "studio_photos", label: "Studio photo frame on listings", tiers: ["starter", "professional", "enterprise"] },
  { key: "leads", label: "Lead pipeline (kanban)", tiers: ["starter", "professional", "enterprise"] },
  { key: "bookings", label: "Test-drive bookings", tiers: ["starter", "professional", "enterprise"] },
  { key: "web_nala", label: "Web chat Nala on showroom", tiers: ["starter", "professional", "enterprise"] },
  { key: "deal_scores", label: "Deal-score badges", tiers: ["professional", "enterprise"] },
  { key: "whatsapp_api", label: "WhatsApp Nala (Cloud API)", tiers: ["professional", "enterprise"] },
  { key: "photo_angles", label: "8-angle photo uploader", tiers: ["professional", "enterprise"] },
  { key: "trade_network", label: "Trade-in dealer network", tiers: ["professional", "enterprise"] },
  { key: "priority_support", label: "Priority support", tiers: ["professional", "enterprise"] },
  { key: "dedicated_onboarding", label: "Dedicated onboarding", tiers: ["enterprise"] },
  { key: "phone_support", label: "Phone + named contact", tiers: ["enterprise"] },
];

export const TIER_LIMITS: Record<
  SubscriptionTierId,
  { vehicles: string; aiSessions: string; whatsapp: string; users: string; emails: string }
> = {
  starter: {
    vehicles: "150",
    aiSessions: "400/mo",
    whatsapp: "Click-to-chat only",
    users: "3",
    emails: "300/mo",
  },
  professional: {
    vehicles: "500",
    aiSessions: "1,200/mo",
    whatsapp: "2,000 msgs/mo",
    users: "10",
    emails: "1,500/mo",
  },
  enterprise: {
    vehicles: "Unlimited*",
    aiSessions: "3,500/mo",
    whatsapp: "8,000 msgs/mo",
    users: "Unlimited",
    emails: "5,000/mo",
  },
};

/**
 * Numeric caps enforced in server/_core/usageCaps.ts before OpenAI / WhatsApp.
 * Display strings in TIER_LIMITS stay human-readable for UI.
 */
export type TierUsageCaps = {
  vehicles: number | null; // null = unlimited
  aiSessionsPerMonth: number;
  /** 0 = no Cloud API WhatsApp bot (Showroom click-to-chat only) */
  whatsappMessagesPerMonth: number;
  emailsPerMonth: number;
  users: number | null;
  cloudWhatsApp: boolean;
  smsEnabled: boolean;
};

export const TIER_USAGE_CAPS: Record<SubscriptionTierId, TierUsageCaps> = {
  starter: {
    vehicles: 150,
    aiSessionsPerMonth: 400,
    whatsappMessagesPerMonth: 0,
    emailsPerMonth: 300,
    users: 3,
    cloudWhatsApp: false,
    smsEnabled: false,
  },
  professional: {
    vehicles: 500,
    aiSessionsPerMonth: 1200,
    whatsappMessagesPerMonth: 2000,
    emailsPerMonth: 1500,
    users: 10,
    cloudWhatsApp: true,
    smsEnabled: true,
  },
  enterprise: {
    vehicles: null,
    aiSessionsPerMonth: 3500,
    whatsappMessagesPerMonth: 8000,
    emailsPerMonth: 5000,
    users: null,
    cloudWhatsApp: true,
    smsEnabled: true,
  },
};

export const TIER_MARKETING_BLURBS: Record<SubscriptionTierId, string> = {
  starter: "Single-location independent — own your showroom and leads.",
  professional: "Full dealer OS — stock, AI, WhatsApp, and trade-ins.",
  enterprise: "Multi-branch yards — groupKey, branch switcher, volume WhatsApp.",
};

export function tierIndex(tier: SubscriptionTierId): number {
  return TIER_ORDER.indexOf(tier);
}

export function tierAtLeast(current: SubscriptionTierId, required: SubscriptionTierId): boolean {
  return tierIndex(current) >= tierIndex(required);
}

export function formatTierPrice(tier: SubscriptionTierId, opts?: { showCents?: boolean }): string {
  const amount = TIER_PRICES_ZAR[tier];
  if (opts?.showCents) {
    return `R ${amount.toLocaleString("en-ZA")}.99`;
  }
  return `R ${amount.toLocaleString("en-ZA")}`;
}

export function formatPriceDisplay(tier: SubscriptionTierId): string {
  if (PILOT_PRICING_HIDDEN) {
    return "Pilot pricing";
  }
  return `${formatTierPrice(tier, { showCents: true })}/mo`;
}

/** Variable cost estimates for internal P&L (ZAR per dealer per month) */
export const TIER_VARIABLE_COST_ZAR: Record<SubscriptionTierId, { low: number; high: number }> = {
  starter: { low: 120, high: 180 },
  professional: { low: 280, high: 450 },
  enterprise: { low: 500, high: 750 },
};

export function contributionMargin(tier: SubscriptionTierId, useHighCost = false): number {
  const price = TIER_PRICES_ZAR[tier];
  const cost = useHighCost ? TIER_VARIABLE_COST_ZAR[tier].high : TIER_VARIABLE_COST_ZAR[tier].low;
  const stripe = Math.round(price * 0.029);
  return price - cost - stripe;
}
