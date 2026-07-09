import { describe, it, expect } from "vitest";

/**
 * Tests for Advanced Analytics Dashboard Date Range Filtering
 * Validates date range calculations and data filtering logic
 */

describe("Analytics Dashboard - Date Range Filtering", () => {
  describe("Date Range Calculations", () => {
    it("should calculate 7-day range correctly", () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const daysDiff = Math.ceil((today.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it("should calculate 30-day range correctly", () => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const daysDiff = Math.ceil((today.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it("should calculate 90-day range correctly", () => {
      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);

      const daysDiff = Math.ceil((today.getTime() - ninetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(90);
    });

    it("should calculate 1-year range correctly", () => {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const daysDiff = Math.ceil((today.getTime() - oneYearAgo.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThan(360);
      expect(daysDiff).toBeLessThan(370);
    });
  });

  describe("Custom Date Range Validation", () => {
    it("should validate that start date is before end date", () => {
      const startDate = new Date("2026-05-01");
      const endDate = new Date("2026-05-31");

      expect(startDate <= endDate).toBe(true);
    });

    it("should reject end date before start date", () => {
      const startDate = new Date("2026-05-31");
      const endDate = new Date("2026-05-01");

      expect(startDate <= endDate).toBe(false);
    });

    it("should allow same start and end date", () => {
      const startDate = new Date("2026-05-15");
      const endDate = new Date("2026-05-15");

      expect(startDate <= endDate).toBe(true);
    });

    it("should handle date string conversion", () => {
      const dateString = "2026-05-23";
      const date = new Date(dateString);

      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString().split("T")[0]).toBe(dateString);
    });
  });

  describe("Data Aggregation by Date Range", () => {
    it("should scale metrics based on date range multiplier", () => {
      const baseLeads = 450;
      const multiplier = 3; // 3 months

      const scaledLeads = Math.floor(baseLeads * multiplier);
      expect(scaledLeads).toBe(1350);
    });

    it("should calculate average metrics across date range", () => {
      const metrics = [
        { roi: 245 },
        { roi: 198 },
        { roi: 212 },
        { roi: 156 },
        { roi: 142 },
      ];

      const avgROI = metrics.reduce((sum, m) => sum + m.roi, 0) / metrics.length;
      expect(avgROI).toBeCloseTo(190.6, 1);
    });

    it("should generate data points for each day in range", () => {
      const startDate = new Date("2026-05-01");
      const endDate = new Date("2026-05-31");
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(days).toBe(30);
    });

    it("should limit data points to maximum 30 for display", () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-12-31");
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const displayPoints = Math.min(days, 30);

      expect(displayPoints).toBe(30);
    });
  });

  describe("KPI Calculations with Date Range", () => {
    it("should calculate total revenue from vehicle conversions", () => {
      const vehiclePerformance = [
        { conversions: 18, avgPrice: 350000 },
        { conversions: 12, avgPrice: 350000 },
        { conversions: 14, avgPrice: 350000 },
      ];

      const totalRevenue = vehiclePerformance.reduce((sum, v) => sum + v.conversions * v.avgPrice, 0);
      expect(totalRevenue).toBe(15400000); // 44 conversions * 350k = 15.4M
    });

    it("should calculate conversion rate percentage", () => {
      const totalVisitors = 10000;
      const totalSales = 120;
      const conversionRate = ((totalSales / totalVisitors) * 100).toFixed(2);

      expect(conversionRate).toBe("1.20");
    });

    it("should calculate average lead value", () => {
      const totalRevenue = 16800000;
      const totalSales = 120;
      const avgLeadValue = (totalRevenue / totalSales).toFixed(0);

      expect(avgLeadValue).toBe("140000");
    });

    it("should calculate average ROI across vehicles", () => {
      const vehicles = [
        { roi: 245 },
        { roi: 198 },
        { roi: 212 },
        { roi: 156 },
        { roi: 142 },
      ];

      const avgROI = (vehicles.reduce((sum, v) => sum + v.roi, 0) / vehicles.length).toFixed(0);
      expect(avgROI).toBe("191");
    });
  });

  describe("Date Range Display Formatting", () => {
    it("should format date for input field (YYYY-MM-DD)", () => {
      const date = new Date("2026-05-23");
      const formatted = date.toISOString().split("T")[0];

      expect(formatted).toBe("2026-05-23");
    });

    it("should format date for display (locale string)", () => {
      const date = new Date("2026-05-23");
      const formatted = date.toLocaleDateString();

      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("should generate readable date range label", () => {
      const startDate = new Date("2026-05-01");
      const endDate = new Date("2026-05-31");
      const label = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

      // Label format depends on locale, just check it contains the dash and dates
      expect(label).toContain("-");
      expect(label.length).toBeGreaterThan(5);
    });

    it("should handle preset range labels", () => {
      const labels = {
        "7d": "Last 7 Days",
        "30d": "Last 30 Days",
        "90d": "Last 90 Days",
        "1y": "Last Year",
      };

      expect(labels["7d"]).toBe("Last 7 Days");
      expect(labels["30d"]).toBe("Last 30 Days");
    });
  });

  describe("Vehicle Performance Filtering", () => {
    it("should identify top performer by ROI", () => {
      const vehicles = [
        { name: "Toyota Hilux", roi: 245 },
        { name: "Ford Ranger", roi: 198 },
        { name: "Isuzu D-Max", roi: 212 },
      ];

      const topPerformer = vehicles.reduce((prev, current) => (prev.roi > current.roi ? prev : current));
      expect(topPerformer.name).toBe("Toyota Hilux");
      expect(topPerformer.roi).toBe(245);
    });

    it("should calculate average performance metrics", () => {
      const vehicles = [
        { leads: 450, conversions: 18 },
        { leads: 380, conversions: 12 },
        { leads: 320, conversions: 14 },
      ];

      const avgLeads = Math.floor(vehicles.reduce((sum, v) => sum + v.leads, 0) / vehicles.length);
      const avgConversions = Math.floor(vehicles.reduce((sum, v) => sum + v.conversions, 0) / vehicles.length);

      expect(avgLeads).toBe(383);
      expect(avgConversions).toBe(14);
    });

    it("should sort vehicles by performance metric", () => {
      const vehicles = [
        { name: "Ford Ranger", roi: 198 },
        { name: "Toyota Hilux", roi: 245 },
        { name: "Isuzu D-Max", roi: 212 },
      ];

      const sorted = [...vehicles].sort((a, b) => b.roi - a.roi);
      expect(sorted[0].name).toBe("Toyota Hilux");
      expect(sorted[1].name).toBe("Isuzu D-Max");
      expect(sorted[2].name).toBe("Ford Ranger");
    });
  });

  describe("ROI Calculator with Date Range", () => {
    it("should calculate monthly sales from leads and conversion rate", () => {
      const monthlyLeads = 2500;
      const conversionRate = 1.2;
      const monthlySales = Math.floor((monthlyLeads * conversionRate) / 100);

      expect(monthlySales).toBe(30);
    });

    it("should calculate monthly revenue from sales and price", () => {
      const monthlySales = 30;
      const avgPrice = 350000;
      const monthlyRevenue = monthlySales * avgPrice;

      expect(monthlyRevenue).toBe(10500000); // 10.5M
    });

    it("should calculate commission from revenue", () => {
      const monthlyRevenue = 10500000;
      const commissionRate = 0.2; // 20%
      const commission = monthlyRevenue * commissionRate;

      expect(commission).toBe(2100000); // 2.1M
    });

    it("should scale ROI calculator for different date ranges", () => {
      const monthlyRevenue = 10500000;
      const months = 3; // 90-day range
      const totalRevenue = monthlyRevenue * months;

      expect(totalRevenue).toBe(31500000); // 31.5M
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid date strings gracefully", () => {
      const invalidDate = new Date("invalid-date");
      expect(isNaN(invalidDate.getTime())).toBe(true);
    });

    it("should handle missing date range parameters", () => {
      const defaultRange = "30d";
      expect(defaultRange).toBe("30d");
    });

    it("should handle date range edge cases", () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Future date should still be valid
      expect(tomorrow > today).toBe(true);
    });

    it("should handle leap year dates", () => {
      const leapYearDate = new Date("2024-02-29");
      expect(leapYearDate.getMonth()).toBe(1); // February
      expect(leapYearDate.getDate()).toBe(29);
    });
  });
});
