import { describe, expect, it } from "vitest";
import {
  LIVE_MARKET_IDS,
  buildMarketDirectoryUrls,
  inferLiveMarketFromWebsite,
  liveMarketSearchLocation,
  resolveLiveMarket,
} from "../shared/liveMarkets";
import { poolEntryCountry, pickNextProspectsForResearch, SA_PROSPECT_POOL, _clearResearchCooldownsForTests } from "./_core/saProspectPool";

describe("live-market prospector", () => {
  it("infers market from dealer TLDs", () => {
    expect(inferLiveMarketFromWebsite("https://mgmotors.com.au")).toBe("AU");
    expect(inferLiveMarketFromWebsite("https://www.cargiant.co.uk")).toBe("GB");
    expect(inferLiveMarketFromWebsite("https://www.turners.co.nz")).toBe("NZ");
    expect(inferLiveMarketFromWebsite("https://jubileemotors.co.za")).toBe("ZA");
    expect(inferLiveMarketFromWebsite("https://alnaboodaselect.com")).toBeNull();
    expect(resolveLiveMarket({ website: "https://imdmotorsinc.com", region: "Texas, United States" })).toBe(
      "US",
    );
  });

  it("builds AU / UK directories, not only ZA", () => {
    const au = buildMarketDirectoryUrls({
      market: "AU",
      dealershipName: "M&G Motors",
      city: "Melbourne",
    });
    expect(au.some((u) => u.includes("yellowpages.com.au"))).toBe(true);
    const gb = buildMarketDirectoryUrls({
      market: "GB",
      dealershipName: "Cargiant",
      city: "London",
    });
    expect(gb.some((u) => u.includes("yell.com"))).toBe(true);
    expect(liveMarketSearchLocation("AU", "Melbourne")).toContain("Australia");
  });

  it("research pool covers every live market GrayArx sells into", () => {
    const countries = new Set(SA_PROSPECT_POOL.map((p) => poolEntryCountry(p)));
    for (const id of LIVE_MARKET_IDS) {
      expect(countries.has(id), `missing pool rows for ${id}`).toBe(true);
    }
  });

  it("Generate batch round-robins markets instead of ZA-only", () => {
    _clearResearchCooldownsForTests();
    const { batch } = pickNextProspectsForResearch([], 6);
    const countries = new Set(batch.map((p) => poolEntryCountry(p)));
    expect(countries.size).toBeGreaterThanOrEqual(4);
    expect(countries.has("ZA")).toBe(true);
  });
});
