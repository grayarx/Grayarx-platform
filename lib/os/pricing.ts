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
    status: "live",
    beats: ["Leads sitting in MotorX/CarLeads overnight"],
  },
  {
    id: "monday_roi",
    name: "Monday ROI",
    job: "Proof: recovered leads, parts quotes, service books, viewings — emailed",
    status: "live",
    beats: ["Feature demos with no outcome report"],
  },
  {
    id: "showroom",
    name: "Branded showroom",
    job: "Buyer-facing stock + Nala embed on the dealer site",
    status: "live",
    beats: ["Adas website packages R3.3–9.8k standalone"],
  },
  {
    id: "crm_webhooks",
    name: "CRM / DMS sync",
    job: "Push booked work into MotorX, CarLeads, Adas — friend systems of record",
    status: "live",
    beats: ["Rip-and-replace fear"],
  },
  {
    id: "multi_branch",
    name: "Multi-branch",
    job: "Stock pools, routing, group ROI",
    status: "live",
    beats: ["MotorX multi-branch story"],
  },
  {
    id: "finance_partner",
    name: "Finance pre-qual",
    job: "Partner link + doc checklist — don't build a bank",
    status: "live",
    beats: ["MotorX finance module depth without owning risk"],
  },
];

export type { SellPackage as GrayArxPackage } from "@/lib/os/unit-economics";
export {
  GRAYARX_OS_PACKAGES,
  packageById,
  pricingEconomicsSummary,
  MONTHLY_COGS_LINES,
  sumCogs,
} from "@/lib/os/unit-economics";

export function liveModules(): OsModule[] {
  return OS_MODULES.filter((m) => m.status === "live");
}
