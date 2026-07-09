import { describe, it, expect } from "vitest";

/**
 * Pricing Simulator Test Suite
 * Tests pricing calculations and tier assignments
 */

interface PricingTier {
  name: string;
  basePrice: number;
  leadPrice: number;
  bookingPrice: number;
  salePrice: number;
}

const PRICING_TIERS: Record<string, PricingTier> = {
  starter: {
    name: "Starter",
    basePrice: 1500,
    leadPrice: 50,
    bookingPrice: 200,
    salePrice: 0,
  },
  professional: {
    name: "Professional",
    basePrice: 3500,
    leadPrice: 40,
    bookingPrice: 150,
    salePrice: 500,
  },
  enterprise: {
    name: "Enterprise",
    basePrice: 7500,
    leadPrice: 30,
    bookingPrice: 100,
    salePrice: 300,
  },
};

function getTier(staffCount: number): string {
  if (staffCount <= 5) return "starter";
  if (staffCount <= 15) return "professional";
  return "enterprise";
}

function calculatePricing(
  staffCount: number,
  monthlyLeads: number,
  conversionRate: number,
  bookingRate: number,
  saleRate: number,
  averageSalePrice: number
) {
  const tierKey = getTier(staffCount);
  const tier = PRICING_TIERS[tierKey];

  const bookings = monthlyLeads * (conversionRate / 100) * (bookingRate / 100);
  const sales = bookings * (saleRate / 100);

  const leadCharges = monthlyLeads * tier.leadPrice;
  const bookingCharges = bookings * tier.bookingPrice;
  const saleCharges = sales * tier.salePrice;

  const totalMonthlyPrice = tier.basePrice + leadCharges + bookingCharges + saleCharges;
  const revenue = sales * averageSalePrice;
  const roi = revenue > 0 ? ((revenue - totalMonthlyPrice) / totalMonthlyPrice) * 100 : 0;

  return {
    tier: tierKey,
    bookings,
    sales,
    leadCharges,
    bookingCharges,
    saleCharges,
    totalMonthlyPrice,
    revenue,
    roi,
    annualPrice: totalMonthlyPrice * 12,
    annualRevenue: revenue * 12,
  };
}

describe("Pricing Simulator", () => {
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

    it("should assign Enterprise tier for 16+ staff", () => {
      expect(getTier(16)).toBe("enterprise");
      expect(getTier(25)).toBe("enterprise");
      expect(getTier(50)).toBe("enterprise");
    });
  });

  describe("Pricing Calculations", () => {
    it("should calculate base pricing correctly", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing.tier).toBe("professional");
      expect(pricing.totalMonthlyPrice).toBeGreaterThan(PRICING_TIERS.professional.basePrice);
    });

    it("should include all cost components", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      const expectedTotal =
        PRICING_TIERS.professional.basePrice +
        pricing.leadCharges +
        pricing.bookingCharges +
        pricing.saleCharges;

      expect(pricing.totalMonthlyPrice).toBe(expectedTotal);
    });

    it("should calculate bookings correctly", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);
      const expectedBookings = 40 * 0.25 * 0.4;

      expect(pricing.bookings).toBe(expectedBookings);
    });

    it("should calculate sales correctly", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);
      const expectedBookings = 40 * 0.25 * 0.4;
      const expectedSales = expectedBookings * 0.5;

      expect(pricing.sales).toBe(expectedSales);
    });
  });

  describe("Revenue Calculations", () => {
    it("should calculate monthly revenue", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      const expectedSales = 40 * 0.25 * 0.4 * 0.5;
      const expectedRevenue = expectedSales * 350000;

      expect(pricing.revenue).toBe(expectedRevenue);
    });

    it("should calculate annual revenue", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing.annualRevenue).toBe(pricing.revenue * 12);
    });

    it("should calculate annual price", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing.annualPrice).toBe(pricing.totalMonthlyPrice * 12);
    });
  });

  describe("ROI Calculations", () => {
    it("should calculate positive ROI", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing.roi).toBeGreaterThan(0);
    });

    it("should calculate ROI as percentage", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);
      const expectedROI = ((pricing.revenue - pricing.totalMonthlyPrice) / pricing.totalMonthlyPrice) * 100;

      expect(pricing.roi).toBe(expectedROI);
    });

    it("should handle zero revenue", () => {
      const pricing = calculatePricing(8, 0, 0, 0, 0, 350000);

      expect(pricing.roi).toBe(0);
    });
  });

  describe("Starter Tier", () => {
    it("should calculate starter tier pricing", () => {
      const pricing = calculatePricing(3, 20, 20, 40, 50, 300000);

      expect(pricing.tier).toBe("starter");
      expect(pricing.totalMonthlyPrice).toBeGreaterThanOrEqual(PRICING_TIERS.starter.basePrice);
    });

    it("should not include sale charges for starter", () => {
      const pricing = calculatePricing(3, 20, 20, 40, 50, 300000);

      expect(pricing.saleCharges).toBe(0);
    });
  });

  describe("Professional Tier", () => {
    it("should calculate professional tier pricing", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing.tier).toBe("professional");
      expect(pricing.totalMonthlyPrice).toBeGreaterThanOrEqual(PRICING_TIERS.professional.basePrice);
    });

    it("should include sale charges for professional", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing.saleCharges).toBeGreaterThan(0);
    });
  });

  describe("Enterprise Tier", () => {
    it("should calculate enterprise tier pricing", () => {
      const pricing = calculatePricing(20, 80, 30, 40, 50, 400000);

      expect(pricing.tier).toBe("enterprise");
      expect(pricing.totalMonthlyPrice).toBeGreaterThanOrEqual(PRICING_TIERS.enterprise.basePrice);
    });

    it("should have lower per-unit costs", () => {
      const pricing = calculatePricing(20, 80, 30, 40, 50, 400000);

      expect(PRICING_TIERS.enterprise.leadPrice).toBeLessThan(PRICING_TIERS.professional.leadPrice);
      expect(PRICING_TIERS.enterprise.bookingPrice).toBeLessThan(PRICING_TIERS.professional.bookingPrice);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero leads", () => {
      const pricing = calculatePricing(8, 0, 25, 40, 50, 350000);

      expect(pricing.bookings).toBe(0);
      expect(pricing.sales).toBe(0);
      expect(pricing.leadCharges).toBe(0);
    });

    it("should handle zero conversion rate", () => {
      const pricing = calculatePricing(8, 40, 0, 40, 50, 350000);

      expect(pricing.bookings).toBe(0);
      expect(pricing.sales).toBe(0);
    });

    it("should handle zero booking rate", () => {
      const pricing = calculatePricing(8, 40, 25, 0, 50, 350000);

      expect(pricing.bookings).toBe(0);
      expect(pricing.sales).toBe(0);
    });

    it("should handle zero sale rate", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 0, 350000);

      expect(pricing.sales).toBe(0);
      expect(pricing.revenue).toBe(0);
    });

    it("should handle high volume", () => {
      const pricing = calculatePricing(20, 200, 50, 100, 100, 500000);

      expect(pricing.revenue).toBeGreaterThan(0);
      expect(pricing.roi).toBeGreaterThan(0);
    });
  });

  describe("Consistency", () => {
    it("should produce consistent results", () => {
      const pricing1 = calculatePricing(8, 40, 25, 40, 50, 350000);
      const pricing2 = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing1.totalMonthlyPrice).toBe(pricing2.totalMonthlyPrice);
      expect(pricing1.revenue).toBe(pricing2.revenue);
      expect(pricing1.roi).toBe(pricing2.roi);
    });

    it("should scale linearly with leads", () => {
      const pricing1 = calculatePricing(8, 40, 25, 40, 50, 350000);
      const pricing2 = calculatePricing(8, 80, 25, 40, 50, 350000);

      expect(pricing2.leadCharges).toBe(pricing1.leadCharges * 2);
    });

    it("should scale linearly with sale price", () => {
      const pricing1 = calculatePricing(8, 40, 25, 40, 50, 350000);
      const pricing2 = calculatePricing(8, 40, 25, 40, 50, 700000);

      expect(pricing2.revenue).toBe(pricing1.revenue * 2);
    });
  });

  describe("Conversion Scenarios", () => {
    it("should handle low conversion", () => {
      const pricing = calculatePricing(8, 40, 5, 40, 50, 350000);

      expect(pricing.bookings).toBeLessThan(10);
      expect(pricing.roi).toBeGreaterThan(0);
    });

    it("should handle high conversion", () => {
      const pricing = calculatePricing(8, 40, 50, 100, 100, 350000);

      expect(pricing.bookings).toBeGreaterThan(15);
      expect(pricing.roi).toBeGreaterThan(0);
    });

    it("should handle realistic dealership scenario", () => {
      const pricing = calculatePricing(8, 40, 25, 40, 50, 350000);

      expect(pricing.tier).toBe("professional");
      expect(pricing.totalMonthlyPrice).toBeGreaterThan(0);
      expect(pricing.revenue).toBeGreaterThan(0);
      expect(pricing.roi).toBeGreaterThan(100); // Should have >100% ROI
    });
  });
});
