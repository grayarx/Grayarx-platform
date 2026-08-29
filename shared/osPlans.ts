/**
 * Billable Dealership OS plans for invoices (ZAR / month).
 * Keep in sync with docs/PRICING.md and server/_core/nalaOs/os/unit-economics.ts.
 * Pilot is R0 — do not invoice it.
 *
 * Also the source of truth for public list prices (TIER_PRICES_ZAR / TIER_DISPLAY_NAMES).
 */
export const OS_INVOICE_PLANS = [
  {
    id: "starter",
    name: "Starter OS",
    priceMonthlyZar: 7990,
    lineItem: "GrayArx Starter OS — monthly",
  },
  {
    id: "professional",
    name: "Professional OS",
    priceMonthlyZar: 14990,
    lineItem: "GrayArx Professional OS — monthly",
  },
  {
    id: "enterprise",
    name: "Enterprise OS",
    priceMonthlyZar: 29990,
    lineItem: "GrayArx Enterprise OS — monthly",
  },
] as const;

export type OsInvoicePlanId = (typeof OS_INVOICE_PLANS)[number]["id"];

/** Short SKU names for dealer-console UI (internal IDs stay starter/professional/enterprise). */
export const OS_TIER_DISPLAY_NAMES: Record<OsInvoicePlanId, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export const OS_TIER_PRICES_ZAR: Record<OsInvoicePlanId, number> = {
  starter: OS_INVOICE_PLANS[0].priceMonthlyZar,
  professional: OS_INVOICE_PLANS[1].priceMonthlyZar,
  enterprise: OS_INVOICE_PLANS[2].priceMonthlyZar,
};

/** Pre-OS Showroom / Growth / Multi-site list prices — never bill these. */
export const LEGACY_SKU_AMOUNTS_ZAR = new Set([3999, 7999, 11999]);

export function osInvoicePlanById(id: string) {
  return OS_INVOICE_PLANS.find((p) => p.id === id);
}

/**
 * Amount to put on a subscription invoice.
 * Remaps leftover Showroom/Growth/Multi-site SKUs (R3,999 / R7,999 / R11,999)
 * to the dealership's OS plan list price so invoices cannot go out at the old ladder.
 * Custom negotiated amounts that are not legacy SKUs are kept.
 * Returns 0 for Pilot (caller must not invoice).
 */
export function billedOsAmountZar(
  planId: string | null | undefined,
  storedMonthlyZar?: number | string | null,
): number {
  const plan = osInvoicePlanById(planId ?? "") ?? OS_INVOICE_PLANS[1];
  const stored = storedMonthlyZar == null || storedMonthlyZar === ""
    ? NaN
    : Number(storedMonthlyZar);
  if (!Number.isFinite(stored) || stored <= 0) {
    return 0;
  }
  const n = Math.round(stored);
  if (LEGACY_SKU_AMOUNTS_ZAR.has(n)) return plan.priceMonthlyZar;
  return n;
}

export function invoiceLineForSubtotal(subtotal: number, dealershipName: string): string {
  const plan = OS_INVOICE_PLANS.find((p) => p.priceMonthlyZar === subtotal);
  const yard = dealershipName.trim() || "Dealership";
  if (plan) return `${plan.lineItem} · ${yard}`;
  return `GrayArx Dealership OS — monthly · ${yard}`;
}
