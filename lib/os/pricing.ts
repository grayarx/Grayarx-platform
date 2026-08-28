/**
 * GrayArx Dealership OS — module map + premium packaging.
 * Positioning: AI-native operating system for the yard (sales, parts, service,
 * recovery, proof). Not a thin chatbot bolt-on.
 */

export type OsModuleId =
  | "sales_conversion"
  | "live_stock"
  | "parts"
  | "service"
  | "trade_in"
  | "missed_call"
  | "marketplace_ingest"
  | "monday_roi"
  | "showroom"
  | "crm_webhooks"
  | "multi_branch"
  | "finance_partner";

export type OsModule = {
  id: OsModuleId;
  name: string;
  job: string;
  status: "live" | "shipping" | "roadmap";
  beats: string[];
};

export const OS_MODULES: OsModule[] = [
  {
    id: "sales_conversion",
    name: "Sales (Nala)",
    job: "Answer buyers from live stock and book viewings 24/7",
    status: "live",
    beats: ["MotorX AI drafts", "DealershipIQ FAQ bots", "Privyr human alerts"],
  },
  {
    id: "live_stock",
    name: "Live stock truth",
    job: "One source of truth for available vehicles Nala can sell",
    status: "live",
    beats: ["Generic WhatsApp bots with stale PDFs"],
  },
  {
    id: "parts",
    name: "Parts desk",
    job: "Quote fitment parts, hold stock, book counter collection",
    status: "live",
    beats: ["Trinstel parts pitch", "Raimond auto+parts bot"],
  },
  {
    id: "service",
    name: "Service booking",
    job: "Book services, reminders, status updates on WhatsApp",
    status: "live",
    beats: ["Trinstel service workflows", "Agency after-sales sets"],
  },
  {
    id: "trade_in",
    name: "Trade-in intake",
    job: "Capture VIN/photos/condition → hand to appraiser",
    status: "live",
    beats: ["AI agency trade-in sets", "MotorX trade-in tool (human)"],
  },
  {
    id: "missed_call",
    name: "Missed-call recovery",
    job: "WhatsApp recovery in under 60s when the yard misses a call",
    status: "live",
    beats: ["CRM call logs that go cold", "Agency AI callers at R15k"],
  },
  {
    id: "marketplace_ingest",
    name: "Marketplace recovery",
    job: "AutoTrader / Cars.co.za leads → Nala → booked viewing",
    status: "shipping",
    beats: ["Leads sitting in MotorX/CarLeads overnight"],
  },
  {
    id: "monday_roi",
    name: "Monday ROI",
    job: "Proof: recovered leads, parts quotes, service books, viewings",
    status: "live",
    beats: ["Feature demos with no outcome report"],
  },
  {
    id: "showroom",
    name: "Branded showroom",
    job: "Buyer-facing stock + Nala embed on the dealer site",
    status: "shipping",
    beats: ["Adas website packages R3.3–9.8k standalone"],
  },
  {
    id: "crm_webhooks",
    name: "CRM / DMS sync",
    job: "Push booked work into MotorX, CarLeads, Adas — friend systems of record",
    status: "roadmap",
    beats: ["Rip-and-replace fear"],
  },
  {
    id: "multi_branch",
    name: "Multi-branch",
    job: "Stock pools, routing, group ROI",
    status: "roadmap",
    beats: ["MotorX multi-branch story"],
  },
  {
    id: "finance_partner",
    name: "Finance pre-qual",
    job: "Partner link + doc checklist — don't build a bank",
    status: "roadmap",
    beats: ["MotorX finance module depth without owning risk"],
  },
];

export type GrayArxPackage = {
  id: "pilot" | "starter" | "professional" | "enterprise";
  name: string;
  priceMonthlyZar: number | 0;
  priceLabel: string;
  target: string;
  includes: OsModuleId[];
  headline: string;
  vsMarket: string;
};

/**
 * Premium OS pricing — free pilot to hook, then priced as the yard OS
 * (above chatbots / nurture tools; at or above Raimond Pro for Professional).
 */
export const GRAYARX_OS_PACKAGES: GrayArxPackage[] = [
  {
    id: "pilot",
    name: "Pilot",
    priceMonthlyZar: 0,
    priceLabel: "R0 / 14 days",
    target: "Any yard — prove Monday numbers on their stock",
    includes: [
      "sales_conversion",
      "live_stock",
      "parts",
      "service",
      "trade_in",
      "monday_roi",
    ],
    headline: "Hook: full OS slice free, then decide on proof.",
    vsMarket: "No competitor gives a real multi-module pilot this clean.",
  },
  {
    id: "starter",
    name: "Starter OS",
    priceMonthlyZar: 5990,
    priceLabel: "R5,990/mo",
    target: "Single-yard independents replacing chatbot + nurture stack",
    includes: [
      "sales_conversion",
      "live_stock",
      "missed_call",
      "marketplace_ingest",
      "monday_roi",
    ],
    headline: "AI sales OS — live stock, recovery, Monday proof.",
    vsMarket:
      "Above Visio Scale (R5k templates) and Raimond Starter (R5k chats); still below agency typical R14.9k.",
  },
  {
    id: "professional",
    name: "Professional OS",
    priceMonthlyZar: 11990,
    priceLabel: "R11,990/mo",
    target: "Yards that want one OS for sales + parts + service",
    includes: [
      "sales_conversion",
      "live_stock",
      "parts",
      "service",
      "trade_in",
      "missed_call",
      "marketplace_ingest",
      "monday_roi",
      "showroom",
    ],
    headline: "Full AI dealership OS — sales, parts, service, trade-in.",
    vsMarket:
      "Above Raimond Pro (R10k chat bot) and Visio Scale; below / beside custom agency R14.9–26k with a fixed product.",
  },
  {
    id: "enterprise",
    name: "Enterprise OS",
    priceMonthlyZar: 19990,
    priceLabel: "From R19,990/mo",
    target: "Multi-yard groups / MotorX-class footprint",
    includes: [
      "sales_conversion",
      "live_stock",
      "parts",
      "service",
      "trade_in",
      "missed_call",
      "marketplace_ingest",
      "monday_roi",
      "showroom",
      "crm_webhooks",
      "multi_branch",
      "finance_partner",
    ],
    headline: "Group OS — branches, SLA, CRM sync, finance partner.",
    vsMarket:
      "Competes with MotorX Enterprise (custom) and complex agency R50k+ builds — productised, month-to-month.",
  },
];

export function packageById(id: GrayArxPackage["id"]): GrayArxPackage {
  const pkg = GRAYARX_OS_PACKAGES.find((p) => p.id === id);
  if (!pkg) throw new Error(`Unknown package ${id}`);
  return pkg;
}

export function liveModules(): OsModule[] {
  return OS_MODULES.filter((m) => m.status === "live");
}
