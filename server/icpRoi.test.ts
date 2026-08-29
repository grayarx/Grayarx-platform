import { describe, expect, it } from "vitest";
import { computeIcpRoi, ICP_ROI_DEFAULTS, formatZarWhole } from "../shared/icpRoi";
import { buildSitemapXml } from "./_core/sitemap";
import { SEO_PAGES } from "../shared/seo";

describe("ICP ROI no-brainer math", () => {
  it("anchors cover threshold to cheapest billed plan (Starter OS R7990)", () => {
    expect(ICP_ROI_DEFAULTS.coversMonthBelowZar).toBe(7990);
    expect(ICP_ROI_DEFAULTS.pilotBillZar).toBe(0);
    expect(ICP_ROI_DEFAULTS.growthListZar).toBe(14990);
  });

  it("flags no-brainer when leakage and one deal cover the month", () => {
    const r = computeIcpRoi({ ...ICP_ROI_DEFAULTS });
    expect(r.monthlyLeakageZar).toBeGreaterThan(ICP_ROI_DEFAULTS.coversMonthBelowZar);
    expect(r.noBrainer).toBe(true);
    // One default deal (R12k) covers Starter OS; Professional is the usual close
    expect(r.oneDealCoversMonth).toBe(true);
    expect(ICP_ROI_DEFAULTS.grossProfitPerDealZar).toBeGreaterThan(ICP_ROI_DEFAULTS.coversMonthBelowZar);
    expect(formatZarWhole(12000)).toBe("R12\u00a0000");
  });

  it("seo + sitemap expose /for-dealers", () => {
    expect(SEO_PAGES.forDealers.path).toBe("/for-dealers");
    const xml = buildSitemapXml("https://www.grayarx.com", []);
    expect(xml).toContain("/for-dealers");
  });
});
