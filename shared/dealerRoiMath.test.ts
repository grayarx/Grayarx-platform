import { describe, expect, it } from "vitest";
import {
  computeDealerRoi,
  defaultDealerRoiProof,
  formatZar,
  ROI_DEFAULT_GROSS_PROFIT_ZAR,
  ROI_DEFAULT_MONTHLY_COST_ZAR,
} from "./dealerRoiMath";

describe("dealerRoiMath", () => {
  it("default proof: one recovered close pays for the month", () => {
    const r = defaultDealerRoiProof();
    expect(r.monthlyCostZar).toBe(ROI_DEFAULT_MONTHLY_COST_ZAR);
    expect(r.grossProfitPerSaleZar).toBe(ROI_DEFAULT_GROSS_PROFIT_ZAR);
    expect(r.oneClosePaysMonth).toBe(true);
    expect(r.closesToPayMonth).toBe(1);
    expect(r.monthsCoveredByOneClose).toBeGreaterThan(2);
    expect(r.headline.toLowerCase()).toContain("one recovered lead");
  });

  it("computes closes needed when GP is below monthly cost", () => {
    const r = computeDealerRoi({
      grossProfitPerSaleZar: 2000,
      monthlyCostZar: 3999,
      missedLeadsPerMonth: 4,
      closeRate: 0.25,
    });
    expect(r.oneClosePaysMonth).toBe(false);
    expect(r.closesToPayMonth).toBe(2);
  });

  it("projects expected monthly GP from missed leads", () => {
    const r = computeDealerRoi({
      grossProfitPerSaleZar: 10_000,
      monthlyCostZar: 3999,
      missedLeadsPerMonth: 8,
      closeRate: 0.25,
    });
    expect(r.expectedSalesPerMonth).toBe(2);
    expect(r.expectedMonthlyGpZar).toBe(20_000);
    expect(r.netMonthlyZar).toBe(20_000 - 3999);
  });

  it("formats ZAR for SA dealers", () => {
    expect(formatZar(3999)).toBe("R 3,999");
    expect(formatZar(12000, { compact: true })).toBe("R 12k");
  });
});
