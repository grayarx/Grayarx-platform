import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateKPIMetrics, calculateROIMetrics, getDashboardData } from "./dashboardService";
import { getDb } from "./db";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateKPIMetrics", () => {
    it("should calculate KPI metrics for a dealership", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { id: 1, dealershipId: 1, score: 85, convertedToBooking: true, responseTime: 500, createdAt: new Date() },
          { id: 2, dealershipId: 1, score: 65, convertedToBooking: false, responseTime: 1000, createdAt: new Date() },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const kpis = await calculateKPIMetrics("1", "month");

      expect(kpis).toBeDefined();
      expect(kpis.totalLeads).toBeGreaterThanOrEqual(0);
      expect(kpis.qualificationRate).toBeGreaterThanOrEqual(0);
      expect(kpis.qualificationRate).toBeLessThanOrEqual(100);
      expect(kpis.conversionRate).toBeGreaterThanOrEqual(0);
      expect(kpis.conversionRate).toBeLessThanOrEqual(100);
      expect(kpis.averageLeadScore).toBeGreaterThanOrEqual(0);
      expect(kpis.averageLeadScore).toBeLessThanOrEqual(100);
    });

    it("should handle different time periods", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const periods = ["today", "week", "month", "quarter", "year"] as const;

      for (const period of periods) {
        const kpis = await calculateKPIMetrics("1", period);
        expect(kpis).toBeDefined();
        expect(kpis.totalLeads).toBeGreaterThanOrEqual(0);
      }
    });

    it("should calculate response time percentiles", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { id: 1, dealershipId: 1, score: 50, convertedToBooking: false, responseTime: 100, createdAt: new Date() },
          { id: 2, dealershipId: 1, score: 50, convertedToBooking: false, responseTime: 200, createdAt: new Date() },
          { id: 3, dealershipId: 1, score: 50, convertedToBooking: false, responseTime: 300, createdAt: new Date() },
          { id: 4, dealershipId: 1, score: 50, convertedToBooking: false, responseTime: 400, createdAt: new Date() },
          { id: 5, dealershipId: 1, score: 50, convertedToBooking: false, responseTime: 500, createdAt: new Date() },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const kpis = await calculateKPIMetrics("1", "month");

      expect(kpis.averageResponseTime).toBeGreaterThan(0);
      expect(kpis.responseTimeP95).toBeGreaterThanOrEqual(kpis.averageResponseTime);
      expect(kpis.responseTimeP99).toBeGreaterThanOrEqual(kpis.responseTimeP95);
    });

    it("should calculate lead trends", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const kpis = await calculateKPIMetrics("1", "month");

      expect(kpis.leadTrend).toBeDefined();
      expect(typeof kpis.leadTrend).toBe("number");
    });
  });

  describe("calculateROIMetrics", () => {
    it("should calculate ROI metrics for a dealership", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { id: 1, dealershipId: 1, score: 80, convertedToBooking: true, responseTime: 500, createdAt: new Date() },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const roi = await calculateROIMetrics("1", "professional");

      expect(roi).toBeDefined();
      expect(roi.monthlySubscriptionCost).toBe(14990);
      expect(roi.estimatedMonthlyRevenue).toBeGreaterThanOrEqual(0);
      expect(roi.netMonthlyProfit).toBeDefined();
      expect(roi.profitMargin).toBeGreaterThanOrEqual(-100);
      expect(roi.profitMargin).toBeLessThanOrEqual(100);
    });

    it("should handle different subscription tiers", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const tiers = ["starter", "professional", "enterprise"] as const;

      for (const tier of tiers) {
        const roi = await calculateROIMetrics("1", tier);
        expect(roi).toBeDefined();
        expect(roi.monthlySubscriptionCost).toBeGreaterThan(0);
      }
    });

    it("should calculate cost per lead and cost per conversion", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { id: 1, dealershipId: 1, score: 80, convertedToBooking: true, responseTime: 500, createdAt: new Date() },
          { id: 2, dealershipId: 1, score: 60, convertedToBooking: false, responseTime: 1000, createdAt: new Date() },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const roi = await calculateROIMetrics("1", "professional");

      expect(roi.costPerLead).toBeGreaterThanOrEqual(0);
      expect(roi.costPerConversion).toBeGreaterThanOrEqual(0);
    });

    it("should calculate payback period", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const roi = await calculateROIMetrics("1", "professional");

      expect(roi.paybackPeriod).toBeGreaterThanOrEqual(0);
      expect(typeof roi.paybackPeriod).toBe("number");
    });

    it("should calculate annual projected revenue", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { id: 1, dealershipId: 1, score: 80, convertedToBooking: true, responseTime: 500, createdAt: new Date() },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const roi = await calculateROIMetrics("1", "professional");

      expect(roi.annualProjectedRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getDashboardData", () => {
    it("should return combined KPI and ROI data", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const dashboard = await getDashboardData("1", "month", "professional");

      expect(dashboard).toBeDefined();
      expect(dashboard.kpis).toBeDefined();
      expect(dashboard.roi).toBeDefined();
      expect(dashboard.period).toBe("month");
      expect(dashboard.generatedAt).toBeDefined();
    });

    it("should include KPI and ROI statistics", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const dashboard = await getDashboardData("1", "month", "professional");

      expect(dashboard.kpis.totalLeads).toBeDefined();
      expect(dashboard.kpis.conversionRate).toBeDefined();
      expect(dashboard.roi.estimatedMonthlyRevenue).toBeDefined();
      expect(dashboard.roi.profitMargin).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero leads gracefully", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const kpis = await calculateKPIMetrics("1", "month");

      expect(kpis.totalLeads).toBe(0);
      expect(kpis.qualificationRate).toBe(0);
      expect(kpis.conversionRate).toBe(0);
      expect(kpis.averageLeadScore).toBe(0);
    });

    it("should calculate metrics for different dealerships independently", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const kpis1 = await calculateKPIMetrics("1", "month");
      const kpis2 = await calculateKPIMetrics("2", "month");

      expect(kpis1).toBeDefined();
      expect(kpis2).toBeDefined();
      expect(kpis1.totalLeads).toBeGreaterThanOrEqual(0);
      expect(kpis2.totalLeads).toBeGreaterThanOrEqual(0);
    });
  });
});
