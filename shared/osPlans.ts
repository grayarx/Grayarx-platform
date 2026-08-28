/**
 * Billable Dealership OS plans for invoices (ZAR / month).
 * Keep in sync with docs/PRICING.md and server/_core/nalaOs/os/unit-economics.ts.
 * Pilot is R0 — do not invoice it.
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

export function osInvoicePlanById(id: string) {
  return OS_INVOICE_PLANS.find((p) => p.id === id);
}

export function invoiceLineForSubtotal(subtotal: number, dealershipName: string): string {
  const plan = OS_INVOICE_PLANS.find((p) => p.priceMonthlyZar === subtotal);
  const yard = dealershipName.trim() || "Dealership";
  if (plan) return `${plan.lineItem} · ${yard}`;
  return `GrayArx Dealership OS — monthly · ${yard}`;
}
