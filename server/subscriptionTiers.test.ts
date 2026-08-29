import { describe, it, expect } from "vitest";
import {
  TIER_PRICES_ZAR,
  TIER_DISPLAY_NAMES,
  TIER_USAGE_CAPS,
  tierAtLeast,
  contributionMargin,
  PILOT_PARTNER,
  formatPriceDisplay,
  PILOT_PRICING_HIDDEN,
} from "../shared/subscriptionTiers";

describe("subscriptionTiers", () => {
  it("uses OS list prices Starter R7,990 / Professional R14,990 / Enterprise R29,990", () => {
    expect(TIER_PRICES_ZAR.starter).toBe(7990);
    expect(TIER_PRICES_ZAR.professional).toBe(14990);
    expect(TIER_PRICES_ZAR.enterprise).toBe(29990);
    expect([3999, 7999, 11999].some((n) => Object.values(TIER_PRICES_ZAR).includes(n))).toBe(
      false,
    );
  });

  it("maps internal IDs to OS display names", () => {
    expect(TIER_DISPLAY_NAMES.starter).toBe("Starter");
    expect(TIER_DISPLAY_NAMES.professional).toBe("Professional");
    expect(TIER_DISPLAY_NAMES.enterprise).toBe("Enterprise");
  });

  it("orders tiers correctly", () => {
    expect(tierAtLeast("professional", "starter")).toBe(true);
    expect(tierAtLeast("starter", "professional")).toBe(false);
    expect(tierAtLeast("enterprise", "professional")).toBe(true);
  });

  it("pilot unlocks Professional features at R0 (not invoiced)", () => {
    expect(PILOT_PARTNER.featureTier).toBe("professional");
    expect(PILOT_PARTNER.monthlyPriceZar).toBe(0);
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

  it("enforces OS WhatsApp conversation caps and Cloud API on Starter+", () => {
    expect(TIER_USAGE_CAPS.starter.cloudWhatsApp).toBe(true);
    expect(TIER_USAGE_CAPS.starter.smsEnabled).toBe(false);
    expect(TIER_USAGE_CAPS.starter.aiSessionsPerMonth).toBe(1000);
    expect(TIER_USAGE_CAPS.starter.whatsappMessagesPerMonth).toBe(1000);
    expect(TIER_USAGE_CAPS.professional.cloudWhatsApp).toBe(true);
    expect(TIER_USAGE_CAPS.professional.aiSessionsPerMonth).toBe(3500);
    expect(TIER_USAGE_CAPS.professional.whatsappMessagesPerMonth).toBe(3500);
    expect(TIER_USAGE_CAPS.enterprise.aiSessionsPerMonth).toBe(12000);
    expect(TIER_USAGE_CAPS.enterprise.whatsappMessagesPerMonth).toBe(12000);
  });
});
