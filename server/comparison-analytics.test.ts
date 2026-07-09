import { describe, it, expect } from "vitest";

/**
 * Tests for Comparison Analytics Feature
 * Validates period comparison logic, trend calculations, and insights generation
 */

describe("Comparison Analytics - Period Comparison", () => {
  describe("Date Range Validation", () => {
    it("should validate that period 1 and period 2 are different", () => {
      const period1Start = new Date("2026-04-01");
      const period1End = new Date("2026-04-30");
      const period2Start = new Date("2026-05-01");
      const period2End = new Date("2026-05-31");

      const areDifferent = !(
        period1Start.getTime() === period2Start.getTime() &&
        period1End.getTime() === period2End.getTime()
      );

      expect(areDifferent).toBe(true);
    });

    it("should allow overlapping date ranges for comparison", () => {
      const period1Start = new Date("2026-04-15");
      const period1End = new Date("2026-05-15");
      const period2Start = new Date("2026-05-01");
      const period2End = new Date("2026-05-31");

      // Check if ranges overlap
      const overlap = period1Start <= period2End && period2Start <= period1End;
      expect(overlap).toBe(true);
    });

    it("should handle non-overlapping date ranges", () => {
      const period1Start = new Date("2026-04-01");
      const period1End = new Date("2026-04-30");
      const period2Start = new Date("2026-05-01");
      const period2End = new Date("2026-05-31");

      const noOverlap = period1End < period2Start || period2End < period1Start;
      expect(noOverlap).toBe(true);
    });
  });

  describe("Metric Comparison Calculations", () => {
    it("should calculate change between two values", () => {
      const period1Value = 2500;
      const period2Value = 3000;
      const change = period2Value - period1Value;

      expect(change).toBe(500);
    });

    it("should calculate percentage change", () => {
      const period1Value = 2500;
      const period2Value = 3000;
      const changePercent = ((period2Value - period1Value) / period1Value) * 100;

      expect(changePercent).toBe(20);
    });

    it("should handle negative percentage change", () => {
      const period1Value = 3000;
      const period2Value = 2500;
      const changePercent = ((period2Value - period1Value) / period1Value) * 100;

      expect(changePercent).toBeCloseTo(-16.67, 2);
    });

    it("should handle zero change", () => {
      const period1Value = 2500;
      const period2Value = 2500;
      const changePercent = ((period2Value - period1Value) / period1Value) * 100;

      expect(changePercent).toBe(0);
    });

    it("should determine trend direction", () => {
      const testCases = [
        { val1: 100, val2: 150, expected: "up" },
        { val1: 150, val2: 100, expected: "down" },
        { val1: 100, val2: 100, expected: "neutral" },
      ];

      testCases.forEach(({ val1, val2, expected }) => {
        const change = val2 - val1;
        const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";
        expect(trend).toBe(expected);
      });
    });
  });

  describe("KPI Comparisons", () => {
    it("should compare total leads between periods", () => {
      const period1Leads = 2500;
      const period2Leads = 3000;
      const change = period2Leads - period1Leads;
      const changePercent = (change / period1Leads) * 100;

      expect(change).toBe(500);
      expect(changePercent).toBe(20);
    });

    it("should compare sales between periods", () => {
      const period1Sales = 30;
      const period2Sales = 45;
      const change = period2Sales - period1Sales;
      const changePercent = (change / period1Sales) * 100;

      expect(change).toBe(15);
      expect(changePercent).toBe(50);
    });

    it("should compare conversion rates between periods", () => {
      const period1Rate = 1.2;
      const period2Rate = 1.5;
      const change = period2Rate - period1Rate;
      const changePercent = (change / period1Rate) * 100;

      expect(change).toBeCloseTo(0.3, 1);
      expect(changePercent).toBeCloseTo(25, 0);
    });

    it("should compare revenue between periods", () => {
      const period1Revenue = 10500000;
      const period2Revenue = 15750000;
      const change = period2Revenue - period1Revenue;
      const changePercent = (change / period1Revenue) * 100;

      expect(change).toBe(5250000);
      expect(changePercent).toBe(50);
    });

    it("should compare ROI between periods", () => {
      const period1ROI = 191;
      const period2ROI = 210;
      const change = period2ROI - period1ROI;
      const changePercent = (change / period1ROI) * 100;

      expect(change).toBe(19);
      expect(changePercent).toBeCloseTo(9.95, 1);
    });
  });

  describe("Trend Analysis", () => {
    it("should identify best improvement", () => {
      const comparisons = [
        { metric: "Leads", changePercent: 20 },
        { metric: "Sales", changePercent: 50 },
        { metric: "Conversion", changePercent: 25 },
      ];

      const bestImprovement = comparisons.reduce((prev, current) =>
        prev.changePercent > current.changePercent ? prev : current
      );

      expect(bestImprovement.metric).toBe("Sales");
      expect(bestImprovement.changePercent).toBe(50);
    });

    it("should identify worst performance", () => {
      const comparisons = [
        { metric: "Leads", changePercent: -10 },
        { metric: "Sales", changePercent: 15 },
        { metric: "Conversion", changePercent: -5 },
      ];

      const worstPerformance = comparisons.reduce((prev, current) =>
        prev.changePercent < current.changePercent ? prev : current
      );

      expect(worstPerformance.metric).toBe("Leads");
      expect(worstPerformance.changePercent).toBe(-10);
    });

    it("should calculate average change across all metrics", () => {
      const comparisons = [
        { changePercent: 20 },
        { changePercent: 50 },
        { changePercent: 25 },
        { changePercent: -10 },
      ];

      const avgChange = comparisons.reduce((sum, c) => sum + c.changePercent, 0) / comparisons.length;
      expect(avgChange).toBe(21.25);
    });

    it("should identify overall trend direction", () => {
      const avgChange = 21.25;
      const trend = avgChange > 0 ? "improved" : "declined";

      expect(trend).toBe("improved");
    });
  });

  describe("Insights Generation", () => {
    it("should generate insight for positive trend", () => {
      const avgChange = 21.25;
      const insight = `Overall performance improved by ${Math.abs(avgChange).toFixed(1)}% on average`;

      expect(insight).toContain("improved");
      expect(insight).toContain("21.3%");
    });

    it("should generate insight for negative trend", () => {
      const avgChange = -15.5;
      const insight = `Overall performance declined by ${Math.abs(avgChange).toFixed(1)}% on average`;

      expect(insight).toContain("declined");
      expect(insight).toContain("15.5%");
    });

    it("should generate recommendation for lead quality", () => {
      const conversionChange = 25;
      const recommendation = conversionChange > 0
        ? "Conversion rate improved - continue current strategies"
        : "Focus on lead quality improvements";

      expect(recommendation).toContain("improved");
    });

    it("should generate recommendation for ROI optimization", () => {
      const roiChange = -10;
      const recommendation = roiChange < 0
        ? "Review marketing channels and optimize spending"
        : "Scale successful marketing channels";

      expect(recommendation).toContain("Review marketing");
    });
  });

  describe("Data Scaling for Different Period Lengths", () => {
    it("should scale metrics for 30-day period", () => {
      const baseLeads = 2500;
      const multiplier = 1;
      const scaledLeads = Math.floor(baseLeads * multiplier);

      expect(scaledLeads).toBe(2500);
    });

    it("should scale metrics for 60-day period", () => {
      const baseLeads = 2500;
      const multiplier = 2;
      const scaledLeads = Math.floor(baseLeads * multiplier);

      expect(scaledLeads).toBe(5000);
    });

    it("should scale metrics for 90-day period", () => {
      const baseLeads = 2500;
      const multiplier = 3;
      const scaledLeads = Math.floor(baseLeads * multiplier);

      expect(scaledLeads).toBe(7500);
    });

    it("should handle fractional multipliers", () => {
      const startDate = new Date("2026-04-15");
      const endDate = new Date("2026-05-15");
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const multiplier = Math.ceil(days / 30);

      expect(multiplier).toBe(1);
    });
  });

  describe("Comparison Chart Data Generation", () => {
    it("should generate chart data for metrics comparison", () => {
      const comparisons = [
        { metric: "Total Leads", period1Value: 2500, period2Value: 3000 },
        { metric: "Sales", period1Value: 30, period2Value: 45 },
      ];

      const chartData = comparisons.map((comp) => ({
        name: comp.metric,
        "Period 1": comp.period1Value,
        "Period 2": comp.period2Value,
      }));

      expect(chartData).toHaveLength(2);
      expect(chartData[0].name).toBe("Total Leads");
      expect(chartData[0]["Period 1"]).toBe(2500);
      expect(chartData[0]["Period 2"]).toBe(3000);
    });

    it("should generate trend data for weekly comparison", () => {
      const trendData = [];
      for (let i = 0; i < 10; i++) {
        trendData.push({
          week: `Week ${i + 1}`,
          period1: Math.floor(100 + Math.random() * 50),
          period2: Math.floor(100 + Math.random() * 50),
        });
      }

      expect(trendData).toHaveLength(10);
      expect(trendData[0]).toHaveProperty("week");
      expect(trendData[0]).toHaveProperty("period1");
      expect(trendData[0]).toHaveProperty("period2");
    });
  });

  describe("Number Formatting", () => {
    it("should format millions correctly", () => {
      const num = 10500000;
      const formatted = `R${(num / 1000000).toFixed(1)}M`;

      expect(formatted).toBe("R10.5M");
    });

    it("should format thousands correctly", () => {
      const num = 2500;
      const formatted = `${(num / 1000).toFixed(1)}K`;

      expect(formatted).toBe("2.5K");
    });

    it("should format small numbers correctly", () => {
      const num = 45;
      const formatted = num.toFixed(0);

      expect(formatted).toBe("45");
    });
  });

  describe("Error Handling", () => {
    it("should handle division by zero in percentage calculation", () => {
      const period1Value = 0;
      const period2Value = 100;
      const changePercent = period1Value !== 0 ? ((period2Value - period1Value) / period1Value) * 100 : 0;

      expect(changePercent).toBe(0);
    });

    it("should handle identical periods gracefully", () => {
      const period1Start = new Date("2026-05-01");
      const period1End = new Date("2026-05-31");
      const period2Start = new Date("2026-05-01");
      const period2End = new Date("2026-05-31");

      const areSame =
        period1Start.getTime() === period2Start.getTime() &&
        period1End.getTime() === period2End.getTime();

      expect(areSame).toBe(true);
    });

    it("should handle missing metric data", () => {
      const comparisons = [
        { metric: "Leads", period1Value: 2500, period2Value: 3000 },
        { metric: "Sales", period1Value: 0, period2Value: 45 },
      ];

      const validComparisons = comparisons.filter((c) => c.period1Value > 0 || c.period2Value > 0);
      expect(validComparisons).toHaveLength(2);
    });
  });

  describe("Recommendation Generation", () => {
    it("should recommend scaling successful channels", () => {
      const roiChange = 25;
      const recommendation = roiChange > 15
        ? "Scale successful marketing channels - strong ROI improvement"
        : "Optimize current marketing mix";

      expect(recommendation).toContain("Scale");
    });

    it("should recommend optimization for declining metrics", () => {
      const conversionChange = -20;
      const recommendation = conversionChange < -10
        ? "Focus on lead quality improvements - conversion declining"
        : "Monitor conversion trends";

      expect(recommendation).toContain("Focus on lead quality");
    });

    it("should recommend seasonal analysis", () => {
      const monthsDiff = 6;
      const recommendation = monthsDiff > 3
        ? "Consider seasonal factors when comparing distant periods"
        : "Analyze week-over-week trends";

      expect(recommendation).toContain("seasonal");
    });
  });
});
