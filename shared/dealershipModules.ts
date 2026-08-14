/**
 * Per-dealership module catalogue.
 *
 * Each entry describes a feature module the GrayArx platform offers. The
 * founder can flip individual modules on/off per dealership from
 * `/admin/dealerships/:id`. Missing keys in `dealerships.modulesEnabled`
 * default to **enabled** so existing dealerships are not silently broken
 * when a new module is added.
 *
 * Mutating this list?
 *   1. Add the entry below.
 *   2. The admin UI auto-renders the new toggle on next page load.
 *   3. Gate the feature in code with `isModuleEnabled(dealership, "moduleId")`.
 */

export type DealershipModuleId =
  | "showroom"
  | "trade_in"
  | "finance_calculator"
  | "comparison_tool"
  | "lead_drip"
  | "weekly_brief"
  | "aftercare"
  | "dealer_referral"
  | "whatsapp"
  | "voice_agent"
  | "prospector"
  | "accountant"
  | "fallback"
  | "agents_page"
  | "public_network";

export interface DealershipModuleSpec {
  id: DealershipModuleId;
  title: string;
  description: string;
  category: "buyer-facing" | "operations" | "agents";
  /** If false, founder cannot turn it off — protects critical infra. */
  toggleable: boolean;
}

export const DEALERSHIP_MODULES: DealershipModuleSpec[] = [
  {
    id: "showroom",
    title: "Public Showroom",
    description: "Buyer-facing /showroom inventory grid and vehicle detail pages.",
    category: "buyer-facing",
    toggleable: true,
  },
  {
    id: "trade_in",
    title: "Trade-In Estimator (Tumi)",
    description: "Eight-factor SA valuation tool at /trade-in.",
    category: "buyer-facing",
    toggleable: true,
  },
  {
    id: "finance_calculator",
    title: "Finance Calculator",
    description: "Affordability + monthly-instalment calculator with handoff to pre-approval.",
    category: "buyer-facing",
    toggleable: true,
  },
  {
    id: "comparison_tool",
    title: "Comparison Tool",
    description: "Side-by-side comparison of up to three vehicles.",
    category: "buyer-facing",
    toggleable: true,
  },
  {
    id: "lead_drip",
    title: "Lead Follow-up Drip (Mia)",
    description: "Day 1 / 3 / 7 cadence drafting and sending follow-up emails.",
    category: "operations",
    toggleable: true,
  },
  {
    id: "weekly_brief",
    title: "Weekly DP Brief",
    description: "Monday email to the dealership contact with after-hours, leads, bookings, and Mia follow-ups.",
    category: "operations",
    toggleable: true,
  },
  {
    id: "aftercare",
    title: "Aftercare & Review Ask",
    description: "Post-sale check-in drafts and Google review ask templates for recently sold stock.",
    category: "operations",
    toggleable: true,
  },
  {
    id: "dealer_referral",
    title: "Dealer Invite Link",
    description: "Shareable /onboarding?ref=shortcode attribution for referring peer yards.",
    category: "operations",
    toggleable: true,
  },
  {
    id: "whatsapp",
    title: "WhatsApp Agent (Bongi)",
    description: "After-hours WhatsApp triage drafts shown in the dealer console.",
    category: "agents",
    toggleable: true,
  },
  {
    id: "voice_agent",
    title: "Voice Agent (Themba)",
    description: "Future opt-in — outbound AI calling. Disabled during pilot.",
    category: "agents",
    toggleable: true,
  },
  {
    id: "prospector",
    title: "Prospector (Sipho)",
    description: "Nightly autonomous prospect scouting across SA provinces.",
    category: "agents",
    toggleable: true,
  },
  {
    id: "accountant",
    title: "Accountant (Thandi)",
    description: "Invoicing, VAT, and reconciliation workflows.",
    category: "operations",
    toggleable: true,
  },
  {
    id: "fallback",
    title: "Fallback Inbox (Lerato)",
    description: "Catch-all queue for messages no other agent handled.",
    category: "operations",
    toggleable: true,
  },
  {
    id: "agents_page",
    title: "Public Agents Page",
    description: "Buyer-facing /agents marketing page explaining the AI team.",
    category: "buyer-facing",
    toggleable: true,
  },
  {
    id: "public_network",
    title: "Public Dealer Network",
    description: "Public listing of partner dealerships at /network.",
    category: "buyer-facing",
    toggleable: true,
  },
];

/** Default to enabled when key missing. Founder flip = explicit `false`. */
export function isModuleEnabled(
  modulesEnabled: unknown,
  moduleId: DealershipModuleId,
): boolean {
  if (!modulesEnabled || typeof modulesEnabled !== "object") return true;
  const map = modulesEnabled as Record<string, unknown>;
  if (!(moduleId in map)) return true;
  return Boolean(map[moduleId]);
}
