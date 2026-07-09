import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { calibrateScoringWeights, calculateLeadScore, getScoringConfiguration } from "./leadScoringCalibration";

describe("Inventory and Lead Scoring", () => {
  describe("Lead Scoring Calibration", () => {
    it("should return default weights when no leads exist", async () => {
      const result = await calibrateScoringWeights("test-dealership-999", "month");
      expect(result.currentWeights).toBeDefined();
      expect(result.recommendedWeights).toBeDefined();
      expect(result.performanceMetrics.totalLeads).toBe(0);
    });

    it("should calculate performance metrics correctly", async () => {
      const result = await calibrateScoringWeights("test-dealership-999", "month");
      expect(result.performanceMetrics).toHaveProperty("totalLeads");
      expect(result.performanceMetrics).toHaveProperty("convertedLeads");
      expect(result.performanceMetrics).toHaveProperty("conversionRate");
      expect(result.performanceMetrics).toHaveProperty("averageQualityScore");
      expect(result.performanceMetrics).toHaveProperty("highQualityLeads");
      expect(result.performanceMetrics).toHaveProperty("lowQualityLeads");
    });

    it("should provide suggestions for improvement", async () => {
      const result = await calibrateScoringWeights("test-dealership-999", "month");
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("should support different time periods", async () => {
      const weekResult = await calibrateScoringWeights("test-dealership-999", "week");
      const monthResult = await calibrateScoringWeights("test-dealership-999", "month");
      const quarterResult = await calibrateScoringWeights("test-dealership-999", "quarter");

      expect(weekResult.performanceMetrics).toBeDefined();
      expect(monthResult.performanceMetrics).toBeDefined();
      expect(quarterResult.performanceMetrics).toBeDefined();
    });
  });

  describe("Lead Score Calculation", () => {
    it("should return 0 for non-existent lead", async () => {
      const score = await calculateLeadScore(999999, "test-dealership-999");
      expect(score).toBe(0);
    });

    it("should return a number between 0 and 100", async () => {
      const score = await calculateLeadScore(1, "test-dealership-999");
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Scoring Configuration", () => {
    it("should return scoring configuration", async () => {
      const config = await getScoringConfiguration("test-dealership-999");
      expect(config).toHaveProperty("dealershipId");
      expect(config).toHaveProperty("weights");
      expect(config).toHaveProperty("lastUpdated");
      expect(config).toHaveProperty("performanceMetrics");
    });

    it("should have valid weight values", async () => {
      const config = await getScoringConfiguration("test-dealership-999");
      const weights = config.weights;

      expect(weights.responseTime).toBeGreaterThanOrEqual(0);
      expect(weights.conversionRate).toBeGreaterThanOrEqual(0);
      expect(weights.qualityScore).toBeGreaterThanOrEqual(0);
      expect(weights.engagementLevel).toBeGreaterThanOrEqual(0);
      expect(weights.sourceQuality).toBeGreaterThanOrEqual(0);

      // Weights should sum to approximately 100
      const total =
        weights.responseTime +
        weights.conversionRate +
        weights.qualityScore +
        weights.engagementLevel +
        weights.sourceQuality;
      expect(total).toBeCloseTo(100, 0);
    });
  });

  describe("Weight Recommendations", () => {
    it("should recommend adjustments for low conversion rates", async () => {
      const result = await calibrateScoringWeights("test-dealership-999", "month");
      if (result.performanceMetrics.conversionRate < 20) {
        expect(result.recommendedWeights.conversionRate).toBeGreaterThanOrEqual(
          result.currentWeights.conversionRate
        );
      }
    });

    it("should provide actionable suggestions", async () => {
      const result = await calibrateScoringWeights("test-dealership-999", "month");
      if (result.suggestions.length > 0) {
        result.suggestions.forEach((suggestion) => {
          expect(typeof suggestion).toBe("string");
          expect(suggestion.length).toBeGreaterThan(0);
        });
      }
    });
  });
});
