import { describe, expect, it } from "vitest";
import { computeIcpRoi, ICP_ROI_DEFAULTS, formatZarWhole } from "../shared/icpRoi";
import { buildSitemapXml } from "./_core/sitemap";
import { SEO_PAGES } from "../shared/seo";

describe("ICP ROI no-brainer math", () => {
  it("anchors cover threshold to cheapest plan (Showroom / pilot R3999)", () => {
    expect(ICP_ROI_DEFAULTS.coversMonthBelowZar).toBe(3999);
    expect(ICP_ROI_DEFAULTS.pilotBillZar).toBe(3999);
    expect(ICP_ROI_DEFAULTS.growthListZar).toBe(7999);
  });

  it("flags no-brainer when leakage and one deal cover the month", () => {
    const r = computeIcpRoi({ ...ICP_ROI_DEFAULTS });
    expect(r.monthlyLeakageZar).toBeGreaterThan(ICP_ROI_DEFAULTS.coversMonthBelowZar);
    expect(r.noBrainer).toBe(true);
    // One default deal (R12k) covers Showroom and Growth list
    expect(r.oneDealCoversMonth).toBe(true);
    expect(ICP_ROI_DEFAULTS.grossProfitPerDealZar).toBeGreaterThan(ICP_ROI_DEFAULTS.growthListZar);
    expect(formatZarWhole(12000)).toBe("R12\u00a0000");
  });

  it("seo + sitemap expose /for-dealers", () => {
    expect(SEO_PAGES.forDealers.path).toBe("/for-dealers");
    const xml = buildSitemapXml("https://www.grayarx.com", []);
    expect(xml).toContain("/for-dealers");
  });
});
