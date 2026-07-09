import { describe, it, expect } from "vitest";

/**
 * ROI Calculator Test Suite
 * Tests all ROI calculation logic and edge cases
 */

interface ROIData {
  monthlyLeads: number;
  conversionRate: number;
  averageSalePrice: number;
  currentMonthlyRevenue: number;
  currentMonthlySpend: number;
  grayarxMonthlyRevenue: number;
  grayarxMonthlySpend: number;
  monthlyProfit: number;
  annualProfit: number;
  roi: number;
  paybackMonths: number;
}

const TIER_PRICING = {
  starter: { base: 1500, lead: 50, booking: 200 },
  professional: { base: 3500, lead: 40, booking: 150 },
  enterprise: { base: 7500, lead: 30, booking: 100 },
};

function getTier(staff: number): keyof typeof TIER_PRICING {
  if (staff <= 5) return "starter";
  if (staff <= 15) return "professional";
  return "enterprise";
}

function calculateROI(
  staffCount: number,
  monthlyLeads: number,
  conversionRate: number,
  averageSalePrice: number,
  currentMonthlySpend: number
): ROIData {
  const tier = getTier(staffCount);
  const pricing = TIER_PRICING[tier];

  // Current situation (without GrayArx)
  const currentLeads = Math.max(5, monthlyLeads * 0.3); // Assume 30% of GrayArx leads
  const currentBookings = currentLeads * (conversionRate / 100) * 0.4;
  const currentSales = currentBookings * 0.5;
  const currentMonthlyRevenue = currentSales * averageSalePrice;
  const currentProfit = currentMonthlyRevenue - currentMonthlySpend;

  // With GrayArx
  const grayarxBookings = monthlyLeads * (conversionRate / 100) * 0.4;
  const grayarxSales = grayarxBookings * 0.5;
  const grayarxMonthlyRevenue = grayarxSales * averageSalePrice;

  // GrayArx costs
  const leadCharges = monthlyLeads * pricing.lead;
  const bookingCharges = grayarxBookings * pricing.booking;
  const grayarxMonthlySpend = pricing.base + leadCharges + bookingCharges;

  const grayarxProfit = grayarxMonthlyRevenue - grayarxMonthlySpend;
  const monthlyProfit = grayarxProfit - currentProfit;
  const annualProfit = monthlyProfit * 12;

  const paybackMonths = grayarxMonthlySpend > 0 ? Math.ceil(grayarxMonthlySpend / monthlyProfit) : 0;
  const roiPercent = monthlyProfit > 0 ? ((monthlyProfit / grayarxMonthlySpend) * 100).toFixed(0) : "0";

  return {
    monthlyLeads,
    conversionRate,
    averageSalePrice,
    currentMonthlyRevenue,
    currentMonthlySpend,
    grayarxMonthlyRevenue,
    grayarxMonthlySpend,
    monthlyProfit,
    annualProfit,
    roi: parseInt(roiPercent),
    paybackMonths: Math.max(1, paybackMonths),
  };
}

describe("ROI Calculator", () => {
  describe("Tier Assignment", () => {
    it("should assign Starter tier for 1-5 staff", () => {
      expect(getTier(1)).toBe("starter");
      expect(getTier(3)).toBe("starter");
      expect(getTier(5)).toBe("starter");
    });

    it("should assign Professional tier for 6-15 staff", () => {
      expect(getTier(6)).toBe("professional");
      expect(getTier(10)).toBe("professional");
      expect(getTier(15)).toBe("professional");
    });

    it("should assign Enterprise tier for 15+ staff", () => {
      expect(getTier(16)).toBe("enterprise");
      expect(getTier(25)).toBe("enterprise");
      expect(getTier(50)).toBe("enterprise");
    });
  });

  describe("ROI Calculation - Professional Tier", () => {
    it("should calculate correct ROI for average dealership", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);

      expect(roi.monthlyLeads).toBe(40);
      expect(roi.conversionRate).toBe(25);
      expect(roi.averageSalePrice).toBe(350000);
      expect(roi.grayarxMonthlySpend).toBeGreaterThan(0);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
      expect(roi.annualProfit).toBeGreaterThan(0);
      expect(roi.roi).toBeGreaterThan(0);
    });

    it("should have positive monthly profit", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });

    it("should have reasonable payback period", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.paybackMonths).toBeLessThanOrEqual(12);
    });

    it("should calculate annual profit as 12x monthly profit", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.annualProfit).toBe(roi.monthlyProfit * 12);
    });
  });

  describe("ROI Calculation - Edge Cases", () => {
    it("should handle low lead volume", () => {
      const roi = calculateROI(3, 5, 20, 300000, 20000);
      expect(roi.grayarxMonthlySpend).toBeGreaterThan(0);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });

    it("should handle high lead volume", () => {
      const roi = calculateROI(20, 100, 30, 400000, 100000);
      expect(roi.grayarxMonthlySpend).toBeGreaterThan(0);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });

    it("should handle high conversion rate", () => {
      const roi = calculateROI(8, 40, 50, 350000, 50000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });

    it("should handle low conversion rate", () => {
      const roi = calculateROI(8, 40, 5, 350000, 50000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });

    it("should handle high average sale price", () => {
      const roi = calculateROI(8, 40, 25, 1000000, 50000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });

    it("should handle low average sale price", () => {
      const roi = calculateROI(8, 40, 25, 100000, 50000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });
  });

  describe("Cost Breakdown", () => {
    it("should include base subscription in costs", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.grayarxMonthlySpend).toBeGreaterThanOrEqual(3500); // Professional base
    });

    it("should include lead charges in costs", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      const leadCharges = 40 * 40; // 40 leads * R40
      expect(roi.grayarxMonthlySpend).toBeGreaterThanOrEqual(3500 + leadCharges);
    });

    it("should include booking charges in costs", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      const bookings = 40 * 0.25 * 0.4; // leads * conversion * booking rate
      const bookingCharges = bookings * 150; // R150 per booking
      expect(roi.grayarxMonthlySpend).toBeGreaterThanOrEqual(3500 + 40 * 40 + bookingCharges);
    });
  });

  describe("Comparison Logic", () => {
    it("should show GrayArx revenue higher than current", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.grayarxMonthlyRevenue).toBeGreaterThan(roi.currentMonthlyRevenue);
    });

    it("should show GrayArx spend lower than current", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.grayarxMonthlySpend).toBeLessThan(roi.currentMonthlySpend);
    });

    it("should show positive profit improvement", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
    });
  });

  describe("ROI Percentage", () => {
    it("should calculate ROI as percentage of spend", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      // Allow for rounding differences due to toFixed(0) vs Math.floor
      const expectedROI = Math.round((roi.monthlyProfit / roi.grayarxMonthlySpend) * 100);
      expect(Math.abs(roi.roi - expectedROI)).toBeLessThanOrEqual(1);
    });

    it("should have high ROI for typical dealership", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.roi).toBeGreaterThan(100); // At least 100% ROI
    });
  });

  describe("Payback Period", () => {
    it("should calculate payback in months", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      const expectedPayback = Math.ceil(roi.grayarxMonthlySpend / roi.monthlyProfit);
      expect(roi.paybackMonths).toBe(expectedPayback);
    });

    it("should have reasonable payback period", () => {
      const roi = calculateROI(8, 40, 25, 350000, 50000);
      expect(roi.paybackMonths).toBeGreaterThanOrEqual(1);
      expect(roi.paybackMonths).toBeLessThanOrEqual(6);
    });
  });

  describe("Starter Tier ROI", () => {
    it("should calculate positive ROI for starter tier", () => {
      const roi = calculateROI(3, 20, 20, 300000, 20000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
      expect(roi.roi).toBeGreaterThan(0);
    });
  });

  describe("Enterprise Tier ROI", () => {
    it("should calculate positive ROI for enterprise tier", () => {
      const roi = calculateROI(20, 80, 30, 400000, 100000);
      expect(roi.monthlyProfit).toBeGreaterThan(0);
      expect(roi.roi).toBeGreaterThan(0);
    });
  });

  describe("Consistency Tests", () => {
    it("should produce consistent results for same input", () => {
      const roi1 = calculateROI(8, 40, 25, 350000, 50000);
      const roi2 = calculateROI(8, 40, 25, 350000, 50000);

      expect(roi1.monthlyProfit).toBe(roi2.monthlyProfit);
      expect(roi1.roi).toBe(roi2.roi);
      expect(roi1.paybackMonths).toBe(roi2.paybackMonths);
    });

    it("should scale profit with lead volume", () => {
      const roi1 = calculateROI(8, 40, 25, 350000, 50000);
      const roi2 = calculateROI(8, 80, 25, 350000, 50000);

      expect(roi2.monthlyProfit).toBeGreaterThan(roi1.monthlyProfit);
    });

    it("should scale profit with conversion rate", () => {
      const roi1 = calculateROI(8, 40, 25, 350000, 50000);
      const roi2 = calculateROI(8, 40, 50, 350000, 50000);

      expect(roi2.monthlyProfit).toBeGreaterThan(roi1.monthlyProfit);
    });

    it("should scale profit with sale price", () => {
      const roi1 = calculateROI(8, 40, 25, 350000, 50000);
      const roi2 = calculateROI(8, 40, 25, 700000, 50000);

      expect(roi2.monthlyProfit).toBeGreaterThan(roi1.monthlyProfit);
    });
  });
});
