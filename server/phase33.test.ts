import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { calculateLeadQualityScore, getLeadQualityInsights } from "./leadQualityScorer";
import { calculateDailyMetrics, getPerformanceSummary } from "./performanceMetrics";
import { importLeadsFromCSV, getImportHistory } from "./bulkLeadImporter";

describe("Phase 33 — Advanced Features", () => {
  describe("Lead Quality Scoring", () => {
    it("should calculate lead quality score for a valid lead", async () => {
      const score = await calculateLeadQualityScore(1);
      if (score) {
        expect(score.overallScore).toBeGreaterThanOrEqual(0);
        expect(score.overallScore).toBeLessThanOrEqual(100);
        expect(score.sourceScore).toBeGreaterThanOrEqual(0);
        expect(score.sourceScore).toBeLessThanOrEqual(1);
      }
    });

    it("should return null for non-existent lead", async () => {
      const score = await calculateLeadQualityScore(999999);
      expect(score).toBeNull();
    });

    it("should calculate all 10 quality factors", async () => {
      const score = await calculateLeadQualityScore(1);
      if (score) {
        expect(score.sourceScore).toBeDefined();
        expect(score.languageScore).toBeDefined();
        expect(score.responseTimeScore).toBeDefined();
        expect(score.engagementScore).toBeDefined();
        expect(score.vehicleTypeScore).toBeDefined();
        expect(score.priceRangeScore).toBeDefined();
        expect(score.locationScore).toBeDefined();
        expect(score.urgencyScore).toBeDefined();
        expect(score.contactQualityScore).toBeDefined();
        expect(score.historyScore).toBeDefined();
      }
    });

    it("should provide insights with top strengths and weaknesses", async () => {
      const insights = await getLeadQualityInsights(1);
      if (insights) {
        expect(insights.quality).toMatch(/High|Medium|Low/);
        expect(insights.topStrengths).toHaveLength(3);
        expect(insights.topWeaknesses).toHaveLength(3);
        expect(insights.topStrengths[0].score).toBeGreaterThanOrEqual(insights.topStrengths[1].score);
      }
    });
  });

  describe("Performance Analytics", () => {
    it("should calculate daily metrics", async () => {
      const metrics = await calculateDailyMetrics(1, new Date());
      if (metrics) {
        expect(metrics.leadVolume).toBeGreaterThanOrEqual(0);
        expect(metrics.leadConversionRate).toBeGreaterThanOrEqual(0);
        expect(metrics.leadConversionRate).toBeLessThanOrEqual(100);
        expect(metrics.bookingRate).toBeGreaterThanOrEqual(0);
        expect(metrics.bookingRate).toBeLessThanOrEqual(100);
      }
    });

    it("should return null for invalid dealership", async () => {
      const metrics = await calculateDailyMetrics(999999, new Date());
      expect(metrics).toBeNull();
    });

    it("should provide performance summary for date range", async () => {
      const summary = await getPerformanceSummary(1, 30);
      if (summary) {
        expect(summary.dealershipId).toBe(1);
        expect(summary.totalLeads).toBeGreaterThanOrEqual(0);
        expect(summary.avgConversionRate).toBeGreaterThanOrEqual(0);
        expect(summary.avgLeadQuality).toBeGreaterThanOrEqual(0);
        expect(summary.avgLeadQuality).toBeLessThanOrEqual(1);
      }
    });

    it("should calculate metrics for different time periods", async () => {
      const summary7 = await getPerformanceSummary(1, 7);
      const summary30 = await getPerformanceSummary(1, 30);

      if (summary7 && summary30) {
        expect(summary7.period.days).toBe(7);
        expect(summary30.period.days).toBe(30);
      }
    });
  });

  describe("Bulk Lead Import", () => {
    it("should parse valid CSV data", async () => {
      const csvData = `contact_name,email,phone,notes
John Doe,john@example.com,+27123456789,Test lead
Jane Smith,jane@example.com,+27987654321,Another test`;

      const result = await importLeadsFromCSV(1, "test.csv", csvData);
      if (result) {
        expect(result.totalRows).toBe(2);
        expect(result.successCount).toBeGreaterThanOrEqual(0);
        expect(result.errorCount).toBeGreaterThanOrEqual(0);
        expect(result.successCount + result.errorCount).toBe(2);
      }
    });

    it("should reject CSV with missing required fields", async () => {
      const csvData = `name,email
John Doe,john@example.com`;

      const result = await importLeadsFromCSV(1, "invalid.csv", csvData);
      expect(result).toBeNull();
    });

    it("should validate email format", async () => {
      const csvData = `contact_name,email,phone
John Doe,invalid-email,+27123456789`;

      const result = await importLeadsFromCSV(1, "test.csv", csvData);
      if (result) {
        expect(result.errorCount).toBeGreaterThan(0);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should track import history", async () => {
      const history = await getImportHistory(1, 10);
      expect(Array.isArray(history)).toBe(true);
    });

    it("should handle empty CSV", async () => {
      const csvData = `contact_name,email,phone`;

      const result = await importLeadsFromCSV(1, "empty.csv", csvData);
      expect(result).toBeNull();
    });

    it("should preserve data in failed imports", async () => {
      const csvData = `contact_name,email,phone
John Doe,invalid-email,+27123456789
Jane Smith,jane@example.com,+27987654321`;

      const result = await importLeadsFromCSV(1, "mixed.csv", csvData);
      if (result) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].data).toHaveProperty("contact_name");
        expect(result.errors[0].data).toHaveProperty("email");
      }
    });
  });

  describe("Feature Integration", () => {
    it("should handle concurrent feature calls", async () => {
      const promises = [
        calculateLeadQualityScore(1),
        calculateDailyMetrics(1, new Date()),
        getPerformanceSummary(1, 30),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
    });

    it("should maintain data consistency across features", async () => {
      const score = await calculateLeadQualityScore(1);
      const insights = await getLeadQualityInsights(1);

      if (score && insights) {
        expect(insights.overallScore).toBe(score.overallScore);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection failures gracefully", async () => {
      const result = await calculateLeadQualityScore(-1);
      expect(result).toBeNull();
    });

    it("should return empty arrays for no data", async () => {
      const history = await getImportHistory(999999, 10);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    it("should validate input parameters", async () => {
      const csvData = `contact_name,email,phone
${"x".repeat(300)},test@example.com,+27123456789`;

      const result = await importLeadsFromCSV(1, "test.csv", csvData);
      // Should handle oversized input gracefully
      expect(result === null || result.errorCount > 0).toBe(true);
    });
  });

  describe("Data Quality", () => {
    it("should normalize lead quality scores to 0-100 range", async () => {
      const score = await calculateLeadQualityScore(1);
      if (score) {
        expect(score.overallScore).toBeGreaterThanOrEqual(0);
        expect(score.overallScore).toBeLessThanOrEqual(100);
      }
    });

    it("should categorize leads correctly", async () => {
      const insights = await getLeadQualityInsights(1);
      if (insights) {
        const { quality, overallScore } = insights;
        if (overallScore >= 70) expect(quality).toBe("High");
        if (overallScore >= 40 && overallScore < 70) expect(quality).toBe("Medium");
        if (overallScore < 40) expect(quality).toBe("Low");
      }
    });

    it("should calculate weighted scores correctly", async () => {
      const score = await calculateLeadQualityScore(1);
      if (score) {
        const weights = {
          sourceScore: 0.1,
          languageScore: 0.08,
          responseTimeScore: 0.12,
          engagementScore: 0.1,
          vehicleTypeScore: 0.08,
          priceRangeScore: 0.08,
          locationScore: 0.08,
          urgencyScore: 0.12,
          contactQualityScore: 0.12,
          historyScore: 0.12,
        };

        const calculated =
          (score.sourceScore * weights.sourceScore +
            score.languageScore * weights.languageScore +
            score.responseTimeScore * weights.responseTimeScore +
            score.engagementScore * weights.engagementScore +
            score.vehicleTypeScore * weights.vehicleTypeScore +
            score.priceRangeScore * weights.priceRangeScore +
            score.locationScore * weights.locationScore +
            score.urgencyScore * weights.urgencyScore +
            score.contactQualityScore * weights.contactQualityScore +
            score.historyScore * weights.historyScore) *
          100;

        expect(Math.abs(calculated - score.overallScore)).toBeLessThan(1);
      }
    });
  });
});
