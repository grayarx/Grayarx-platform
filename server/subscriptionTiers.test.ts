import { describe, it, expect } from "vitest";
import {
  TIER_PRICES_ZAR,
  TIER_DISPLAY_NAMES,
  tierAtLeast,
  contributionMargin,
  PILOT_PARTNER,
  formatPriceDisplay,
  PILOT_PRICING_HIDDEN,
} from "../shared/subscriptionTiers";

describe("subscriptionTiers", () => {
  it("uses R3,999 / R7,999 / R11,999 floor", () => {
    expect(TIER_PRICES_ZAR.starter).toBe(3999);
    expect(TIER_PRICES_ZAR.professional).toBe(7999);
    expect(TIER_PRICES_ZAR.enterprise).toBe(11999);
  });

  it("maps internal IDs to marketing names", () => {
    expect(TIER_DISPLAY_NAMES.starter).toBe("Showroom");
    expect(TIER_DISPLAY_NAMES.professional).toBe("Growth");
    expect(TIER_DISPLAY_NAMES.enterprise).toBe("Group");
  });

  it("orders tiers correctly", () => {
    expect(tierAtLeast("professional", "starter")).toBe(true);
    expect(tierAtLeast("starter", "professional")).toBe(false);
    expect(tierAtLeast("enterprise", "professional")).toBe(true);
  });

  it("pilot unlocks Growth features", () => {
    expect(PILOT_PARTNER.featureTier).toBe("professional");
    expect(PILOT_PARTNER.monthlyPriceZar).toBe(3999);
  });

  it("hides public prices during pilot", () => {
    expect(PILOT_PRICING_HIDDEN).toBe(true);
    expect(formatPriceDisplay("starter")).toBe("Pilot pricing");
  });

  it("has positive contribution margin on all tiers", () => {
    for (const tier of ["starter", "professional", "enterprise"] as const) {
      expect(contributionMargin(tier, true)).toBeGreaterThan(3000);
    }
  });
});
