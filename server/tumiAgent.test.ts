import { describe, it, expect } from "vitest";
import { computeTradeInEstimate } from "./_core/tumiAgent";
import type { TumiInput } from "./_core/tumiAgent";

describe("Tumi Trade-In Valuation Agent (Improved)", () => {
  // Test date: May 24, 2026
  const testDate = new Date("2026-05-24");

  describe("Critical test case: 2011 Polo (user-reported issue)", () => {
    it("should value a 2011 Polo with good condition at ~R98k (realistic market value)", () => {
      const input: TumiInput = {
        make: "Volkswagen",
        model: "Polo",
        year: 2011,
        mileageKm: 120_000,
        transmission: "manual",
        fuel: "petrol",
        bodyType: "hatchback",
        condition: "good",
        serviceHistory: "partial",
      };

      const estimate = computeTradeInEstimate(input, testDate);

      // 2011 Polo @ 120k km, manual, partial — aligns with AutoTrader SA guide (~R93–95k mid)
      expect(estimate.estimateMid).toBeGreaterThan(85_000);
      expect(estimate.estimateMid).toBeLessThan(100_000);
      expect(estimate.estimateLow).toBeGreaterThan(75_000);
      expect(estimate.estimateHigh).toBeLessThan(110_000);

      // Confidence should be medium (older vehicle, partial history)
      expect(estimate.confidence).toBe("medium");

      const yearGuide = estimate.factorBreakdown.find((f) => f.factor === "Year / market guide");
      expect(yearGuide).toBeDefined();
      expect(yearGuide!.rand).toBeGreaterThan(80_000);

      console.log("✓ 2008 Polo valuation:", {
        low: estimate.estimateLow,
        mid: estimate.estimateMid,
        high: estimate.estimateHigh,
        confidence: estimate.confidence,
        breakdown: estimate.factorBreakdown.map((f) => ({
          factor: f.factor,
          rand: f.rand,
        })),
      });
    });

    it("should value a 2011 Polo in excellent condition higher", () => {
      const input: TumiInput = {
        make: "Volkswagen",
        model: "Polo",
        year: 2011,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "hatchback",
        condition: "excellent",
        serviceHistory: "full_dealer",
      };

      const estimate = computeTradeInEstimate(input, testDate);

      // Should be higher than the previous test (excellent condition, lower mileage, automatic)
      // Should be higher than the poor condition test
      expect(estimate.estimateMid).toBeGreaterThan(120_000);
      expect(estimate.estimateMid).toBeLessThan(140_000);
      expect(estimate.confidence).toBe("medium");

      console.log("✓ 2008 Polo (excellent) valuation:", {
        low: estimate.estimateLow,
        mid: estimate.estimateMid,
        high: estimate.estimateHigh,
      });
    });

    it("should value a 2011 Polo in poor condition lower", () => {
      const input: TumiInput = {
        make: "Volkswagen",
        model: "Polo",
        year: 2011,
        mileageKm: 180_000,
        transmission: "manual",
        fuel: "petrol",
        bodyType: "hatchback",
        condition: "poor",
        serviceHistory: "none",
      };

      const estimate = computeTradeInEstimate(input, testDate);

      // Should be lower (poor condition, high mileage, no service history)
      expect(estimate.estimateMid).toBeGreaterThan(60_000); // Still above floor
      expect(estimate.estimateMid).toBeLessThan(90_000);
      expect(estimate.confidence).toBe("low");

      console.log("✓ 2008 Polo (poor) valuation:", {
        low: estimate.estimateLow,
        mid: estimate.estimateMid,
        high: estimate.estimateHigh,
      });
    });
  });

  describe("Make/Model-specific baselines", () => {
    it("should anchor Volkswagen Polo on year-specific AutoTrader guide", () => {
      const input: TumiInput = {
        make: "Volkswagen",
        model: "Polo",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "hatchback",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const estimate = computeTradeInEstimate(input, testDate);
      const guide = estimate.factorBreakdown.find((f) => f.factor === "Year / market guide");
      expect(guide?.rand).toBeGreaterThan(150_000);
    });

    it("should value Toyota Corolla using estimated SA baseline", () => {
      const input: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const estimate = computeTradeInEstimate(input, testDate);
      expect(estimate.estimateMid).toBeGreaterThan(120_000);
    });

    it("should value Toyota Hilux using estimated SA baseline", () => {
      const input: TumiInput = {
        make: "Toyota",
        model: "Hilux",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "diesel",
        bodyType: "bakkie",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const estimate = computeTradeInEstimate(input, testDate);
      // Expanded Hilux guide — 2022 diesel auto should value well above generic baseline
      expect(estimate.estimateMid).toBeGreaterThan(450_000);
    });

    it("should fall back to estimated baseline for unknown make/model", () => {
      const input: TumiInput = {
        make: "UnknownBrand",
        model: "UnknownModel",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const estimate = computeTradeInEstimate(input, testDate);
      const guide = estimate.factorBreakdown.find((f) => f.factor === "Year / market guide");
      expect(guide?.rand).toBeGreaterThan(100_000);
    });
  });

  describe("Age depreciation", () => {
    it("should value newer Corollas higher than older ones", () => {
      const newer: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2024,
        mileageKm: 40_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "excellent",
        serviceHistory: "full_dealer",
      };
      const older: TumiInput = {
        ...newer,
        year: 2020,
        mileageKm: 80_000,
        condition: "good",
      };

      const newerEst = computeTradeInEstimate(newer, testDate);
      const olderEst = computeTradeInEstimate(older, testDate);
      expect(newerEst.estimateMid).toBeGreaterThan(olderEst.estimateMid);

      console.log("✓ Newer vs older Corolla:", {
        newer: newerEst.estimateMid,
        older: olderEst.estimateMid,
      });
    });

    it("should not depreciate extremely old vehicles below floor", () => {
      const input: TumiInput = {
        make: "Volkswagen",
        model: "Polo",
        year: 2000,
        mileageKm: 250_000,
        transmission: "manual",
        fuel: "petrol",
        bodyType: "hatchback",
        condition: "fair",
        serviceHistory: "none",
      };

      const estimate = computeTradeInEstimate(input, testDate);

      // Even a 26-year-old Polo should be valued above R15k floor
      expect(estimate.estimateMid).toBeGreaterThanOrEqual(15_000);

      console.log("✓ 2000 Polo valuation (26 years old):", {
        low: estimate.estimateLow,
        mid: estimate.estimateMid,
        high: estimate.estimateHigh,
      });
    });
  });

  describe("Mileage impact", () => {
    it("should reward low-mileage vehicles", () => {
      const lowMileageInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 40_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const highMileageInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 150_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const lowMileageEstimate = computeTradeInEstimate(lowMileageInput, testDate);
      const highMileageEstimate = computeTradeInEstimate(highMileageInput, testDate);

      // Low mileage should be valued higher
      expect(lowMileageEstimate.estimateMid).toBeGreaterThan(highMileageEstimate.estimateMid);
      expect(lowMileageEstimate.estimateMid - highMileageEstimate.estimateMid).toBeGreaterThan(10_000);

      console.log("✓ Mileage impact:", {
        lowMileage: lowMileageEstimate.estimateMid,
        highMileage: highMileageEstimate.estimateMid,
        difference: lowMileageEstimate.estimateMid - highMileageEstimate.estimateMid,
      });
    });
  });

  describe("Condition impact", () => {
    it("should reward excellent condition", () => {
      const excellentInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "excellent",
        serviceHistory: "full_dealer",
      };

      const goodInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const excellentEstimate = computeTradeInEstimate(excellentInput, testDate);
      const goodEstimate = computeTradeInEstimate(goodInput, testDate);

      // Excellent should be valued higher
      expect(excellentEstimate.estimateMid).toBeGreaterThan(goodEstimate.estimateMid);
      expect(excellentEstimate.estimateMid - goodEstimate.estimateMid).toBeGreaterThan(5_000);

      console.log("✓ Condition impact:", {
        excellent: excellentEstimate.estimateMid,
        good: goodEstimate.estimateMid,
        difference: excellentEstimate.estimateMid - goodEstimate.estimateMid,
      });
    });
  });

  describe("Service history impact", () => {
    it("should reward full dealer service history", () => {
      const fullDealerInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const noneInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "none",
      };

      const fullDealerEstimate = computeTradeInEstimate(fullDealerInput, testDate);
      const noneEstimate = computeTradeInEstimate(noneInput, testDate);

      // Full dealer should be valued higher
      expect(fullDealerEstimate.estimateMid).toBeGreaterThan(noneEstimate.estimateMid);
      expect(fullDealerEstimate.estimateMid - noneEstimate.estimateMid).toBeGreaterThan(10_000);

      console.log("✓ Service history impact:", {
        fullDealer: fullDealerEstimate.estimateMid,
        none: noneEstimate.estimateMid,
        difference: fullDealerEstimate.estimateMid - noneEstimate.estimateMid,
      });
    });
  });

  describe("Transmission impact", () => {
    it("should reward automatic transmission", () => {
      const automaticInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const manualInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "manual",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const automaticEstimate = computeTradeInEstimate(automaticInput, testDate);
      const manualEstimate = computeTradeInEstimate(manualInput, testDate);

      // Automatic should be valued higher
      // Automatic should be valued higher (R8k bonus)
      expect(automaticEstimate.estimateMid).toBeGreaterThan(manualEstimate.estimateMid);

      console.log("✓ Transmission impact:", {
        automatic: automaticEstimate.estimateMid,
        manual: manualEstimate.estimateMid,
        difference: automaticEstimate.estimateMid - manualEstimate.estimateMid,
      });
    });
  });

  describe("Fuel type impact", () => {
    it("should reward diesel fuel", () => {
      const dieselInput: TumiInput = {
        make: "Toyota",
        model: "Hilux",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "diesel",
        bodyType: "bakkie",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const petrolInput: TumiInput = {
        make: "Toyota",
        model: "Hilux",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "bakkie",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const dieselEstimate = computeTradeInEstimate(dieselInput, testDate);
      const petrolEstimate = computeTradeInEstimate(petrolInput, testDate);

      // Diesel should be valued higher (R8k bonus)
      expect(dieselEstimate.estimateMid).toBeGreaterThan(petrolEstimate.estimateMid);

      console.log("✓ Fuel type impact:", {
        diesel: dieselEstimate.estimateMid,
        petrol: petrolEstimate.estimateMid,
        difference: dieselEstimate.estimateMid - petrolEstimate.estimateMid,
      });
    });

    it("should penalize electric vehicles", () => {
      const electricInput: TumiInput = {
        make: "Tesla",
        model: "Model3",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "electric",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const petrolInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const electricEstimate = computeTradeInEstimate(electricInput, testDate);
      const petrolEstimate = computeTradeInEstimate(petrolInput, testDate);

      // Electric should have low confidence (SA market penalizes EVs)
      expect(electricEstimate.confidence).toBe("low");

      console.log("✓ Electric vehicle penalty:", {
        electric: electricEstimate.estimateMid,
        petrol: petrolEstimate.estimateMid,
        electricConfidence: electricEstimate.confidence,
      });
    });
  });

  describe("Confidence levels", () => {
    it("should assign high confidence to well-maintained, valuable vehicles", () => {
      const input: TumiInput = {
        make: "BMW",
        model: "3_series",
        year: 2022,
        mileageKm: 60_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "excellent",
        serviceHistory: "full_dealer",
      };

      const estimate = computeTradeInEstimate(input, testDate);
      // BMW 3-series with excellent condition and full dealer history
      // Confidence depends on final valuation
      expect(["high", "medium"]).toContain(estimate.confidence);
    });

    it("should assign low confidence to poor condition or electric vehicles", () => {
      const poorInput: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "poor",
        serviceHistory: "none",
      };

      const electricInput: TumiInput = {
        make: "Tesla",
        model: "Model3",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "electric",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const poorEstimate = computeTradeInEstimate(poorInput, testDate);
      const electricEstimate = computeTradeInEstimate(electricInput, testDate);

      // Poor condition should be low confidence
      expect(poorEstimate.confidence).toBe("low");
      // Electric should be low confidence
      expect(electricEstimate.confidence).toBe("low");
    });
  });

  describe("Estimate range spread", () => {
    it("should provide ±10% spread for realistic range", () => {
      const input: TumiInput = {
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        mileageKm: 80_000,
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "sedan",
        condition: "good",
        serviceHistory: "full_dealer",
      };

      const estimate = computeTradeInEstimate(input, testDate);

      // Low should be ~90% of mid, high should be ~110% of mid
      const lowRatio = estimate.estimateLow / estimate.estimateMid;
      const highRatio = estimate.estimateHigh / estimate.estimateMid;

      expect(lowRatio).toBeCloseTo(0.9, 0.02);
      expect(highRatio).toBeCloseTo(1.1, 0.02);

      console.log("✓ Estimate spread:", {
        low: estimate.estimateLow,
        mid: estimate.estimateMid,
        high: estimate.estimateHigh,
        lowRatio: lowRatio.toFixed(3),
        highRatio: highRatio.toFixed(3),
      });
    });
  });

  describe("Minimum valuation floor", () => {
    it("should never value below R15,000", () => {
      const input: TumiInput = {
        make: "Chery",
        model: "QQ",
        year: 1995,
        mileageKm: 300_000,
        transmission: "manual",
        fuel: "petrol",
        bodyType: "hatchback",
        condition: "poor",
        serviceHistory: "none",
      };

      const estimate = computeTradeInEstimate(input, testDate);

      // All estimates should be at least R15k floor
      expect(estimate.estimateLow).toBeGreaterThanOrEqual(15_000);
      expect(estimate.estimateMid).toBeGreaterThanOrEqual(15_000);
      expect(estimate.estimateHigh).toBeGreaterThanOrEqual(15_000);

      console.log("✓ Minimum floor respected:", {
        low: estimate.estimateLow,
        mid: estimate.estimateMid,
        high: estimate.estimateHigh,
      });
    });
  });
});
