import { describe, expect, it } from "vitest";
import {
  OS_INVOICE_PLANS,
  OS_TIER_PRICES_ZAR,
  billedOsAmountZar,
  LEGACY_SKU_AMOUNTS_ZAR,
} from "../shared/osPlans";
import { TIER_PRICES_ZAR } from "../shared/subscriptionTiers";

describe("osPlans billed amounts", () => {
  it("invoices Starter / Professional / Enterprise at OS list prices", () => {
    expect(OS_TIER_PRICES_ZAR.starter).toBe(7990);
    expect(OS_TIER_PRICES_ZAR.professional).toBe(14990);
    expect(OS_TIER_PRICES_ZAR.enterprise).toBe(29990);
    expect(OS_INVOICE_PLANS.map((p) => p.priceMonthlyZar)).toEqual([7990, 14990, 29990]);
  });

  it("keeps dealer-console TIER_PRICES_ZAR in lockstep with invoices", () => {
    expect(TIER_PRICES_ZAR).toEqual(OS_TIER_PRICES_ZAR);
    expect([3999, 7999, 11999].some((n) => Object.values(TIER_PRICES_ZAR).includes(n))).toBe(
      false,
    );
  });

  it("does not invoice Pilot (stored 0)", () => {
    expect(billedOsAmountZar("professional", 0)).toBe(0);
    expect(billedOsAmountZar("starter", null)).toBe(0);
  });

  it("remaps leftover Showroom/Growth/Multi-site SKUs to the dealership OS plan", () => {
    expect(LEGACY_SKU_AMOUNTS_ZAR.has(3999)).toBe(true);
    expect(billedOsAmountZar("starter", 3999)).toBe(7990);
    expect(billedOsAmountZar("professional", 7999)).toBe(14990);
    expect(billedOsAmountZar("enterprise", 11999)).toBe(29990);
  });

  it("keeps custom negotiated amounts that are not legacy SKUs", () => {
    expect(billedOsAmountZar("professional", 14990)).toBe(14990);
    expect(billedOsAmountZar("professional", 12000)).toBe(12000);
  });
});
