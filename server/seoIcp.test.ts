import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildSitemapXml } from "./_core/sitemap";
import {
  SEO_PAGES,
  SEO_OS_OFFERS,
  SEO_AREA_SERVED,
  buildHomeJsonLd,
  absoluteUrl,
} from "../shared/seo";

const CLIENT_INDEX = join(dirname(fileURLToPath(import.meta.url)), "../client/index.html");

describe("ICP SEO", () => {
  it("home copy targets dealership OS principals", () => {
    expect(SEO_PAGES.home.title.toLowerCase()).toMatch(/whatsapp|dealer/);
    expect(SEO_PAGES.home.title.toLowerCase()).toContain("os");
    expect(SEO_PAGES.home.description.toLowerCase()).toContain("after-hours");
    expect(SEO_PAGES.home.description).toContain("14-day");
    expect(SEO_PAGES.home.description).toContain("R14,990");
    expect(SEO_PAGES.onboarding.path).toBe("/onboarding");
    expect(SEO_PAGES.forDealers.description).toContain("R7,990");
  });

  it("keeps titles and descriptions in practical SERP bounds", () => {
    for (const page of Object.values(SEO_PAGES)) {
      expect(page.title.length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeLessThanOrEqual(155);
    }
  });

  it("builds Organization + SoftwareApplication JSON-LD with OS offers", () => {
    const ld = buildHomeJsonLd();
    const graph = ld["@graph"] as Array<Record<string, unknown>>;
    expect(graph.some((n) => n["@type"] === "Organization")).toBe(true);
    expect(graph.some((n) => n["@type"] === "SoftwareApplication")).toBe(true);
    expect(absoluteUrl("/onboarding")).toBe("https://www.grayarx.com/onboarding");

    const org = graph.find((n) => n["@type"] === "Organization")!;
    expect(org.areaServed).toEqual([...SEO_AREA_SERVED]);

    const app = graph.find((n) => n["@type"] === "SoftwareApplication")!;
    expect(app.alternateName).toBe("Nala Dealership OS");
    const offers = app.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("AggregateOffer");
    expect(offers.lowPrice).toBe("0");
    expect(offers.highPrice).toBe("29990");
    expect((offers.offers as unknown[]).length).toBe(SEO_OS_OFFERS.length);
    expect(JSON.stringify(app.featureList)).toContain("This week's numbers");
    expect(JSON.stringify(app.featureList)).toContain("Parts desk");
  });

  it("index.html shell matches home SEO + JSON-LD", () => {
    const html = readFileSync(CLIENT_INDEX, "utf8");
    expect(html).toContain(`<title>${SEO_PAGES.home.title}</title>`);
    expect(html).toContain(`content="${SEO_PAGES.home.description}"`);
    expect(html).toContain(SEO_PAGES.home.keywords!);
    expect(html).toContain(JSON.stringify(buildHomeJsonLd()));
    expect(html).toContain('og:locale:alternate" content="en_AU"');
  });

  it("sitemap includes onboarding and legal", () => {
    const xml = buildSitemapXml("https://www.grayarx.com", []);
    expect(xml).toContain("https://www.grayarx.com/onboarding");
    expect(xml).toContain("https://www.grayarx.com/legal");
    expect(xml).toContain("https://www.grayarx.com/");
    expect(xml).toContain("https://www.grayarx.com/for-dealers");
  });
});
