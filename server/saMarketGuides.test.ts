import { describe, it, expect } from "vitest";
import {
  scoreListingDeal,
  estimateRetailMarketMid,
  getTradeInGuideValue,
  phonesMatch,
  resolveGuideKey,
} from "../shared/saMarketGuides";

describe("SA price intelligence", () => {
  it("scores a below-market Hilux as a great deal", () => {
    const score = scoreListingDeal(520_000, {
      make: "Toyota",
      model: "Hilux",
      year: 2022,
      mileageKm: 45_000,
    });
    expect(score).not.toBeNull();
    expect(score!.rating).toBe("great");
    expect(score!.deltaZar).toBeGreaterThan(0);
  });

  it("scores an overpriced Corolla as above market", () => {
    const score = scoreListingDeal(750_000, {
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      mileageKm: 90_000,
    });
    expect(score).not.toBeNull();
    expect(["above", "premium"]).toContain(score!.rating);
  });

  it("returns retail guide for Polo Vivo", () => {
    const guide = estimateRetailMarketMid({
      make: "Volkswagen",
      model: "Polo Vivo",
      year: 2018,
      mileageKm: 80_000,
    });
    expect(guide.mid).toBeGreaterThan(200_000);
    expect(guide.confidence).toBe("high");
  });

  it("resolves BMW 3 series from title", () => {
    const key = resolveGuideKey("BMW", "320i M Sport", "2021 BMW 320i M Sport");
    expect(key).toBe("bmw|3 series");
    const guide = getTradeInGuideValue("BMW", "320i", 2021);
    expect(guide?.value).toBeGreaterThan(450_000);
  });

  it("matches SA phone numbers with different formats", () => {
    expect(phonesMatch("0821234567", "+27821234567")).toBe(true);
    expect(phonesMatch("27821234567", "082 123 4567")).toBe(true);
    expect(phonesMatch("0821234567", "0831234567")).toBe(false);
  });
});
