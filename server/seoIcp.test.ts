import { describe, expect, it } from "vitest";
import { buildSitemapXml } from "./_core/sitemap";
import { SEO_PAGES, buildHomeJsonLd, absoluteUrl } from "../shared/seo";

describe("ICP SEO", () => {
  it("home copy targets SA dealership principals", () => {
    expect(SEO_PAGES.home.title.toLowerCase()).toMatch(/whatsapp|dealer/);
    expect(SEO_PAGES.home.description.toLowerCase()).toContain("after-hours");
    expect(SEO_PAGES.onboarding.path).toBe("/onboarding");
  });

  it("builds Organization + SoftwareApplication JSON-LD", () => {
    const ld = buildHomeJsonLd();
    const graph = ld["@graph"] as Array<Record<string, unknown>>;
    expect(graph.some((n) => n["@type"] === "Organization")).toBe(true);
    expect(graph.some((n) => n["@type"] === "SoftwareApplication")).toBe(true);
    expect(absoluteUrl("/onboarding")).toBe("https://www.grayarx.com/onboarding");
  });

  it("sitemap includes onboarding and legal", () => {
    const xml = buildSitemapXml("https://www.grayarx.com", []);
    expect(xml).toContain("https://www.grayarx.com/onboarding");
    expect(xml).toContain("https://www.grayarx.com/legal");
    expect(xml).toContain("https://www.grayarx.com/");
  });
});
