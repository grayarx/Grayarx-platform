/**
 * Live markets GrayArx already sells into.
 * Sipho researches named@dealer-domain inboxes in all of these — not ZA-only.
 */

export type LiveMarketId = "ZA" | "AU" | "GB" | "AE" | "US" | "NZ";

export const LIVE_MARKET_IDS: LiveMarketId[] = ["ZA", "AU", "GB", "AE", "US", "NZ"];

export const LIVE_MARKET_NAME: Record<LiveMarketId, string> = {
  ZA: "South Africa",
  AU: "Australia",
  GB: "United Kingdom",
  AE: "United Arab Emirates",
  US: "United States",
  NZ: "New Zealand",
};

type DirectoryFn = (name: string, city?: string | null) => string[];

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const DIRECTORY_URLS: Record<LiveMarketId, DirectoryFn> = {
  ZA: (name, city) => {
    const q = encodeURIComponent(name.trim());
    const cityQ = city?.trim() ? encodeURIComponent(city.trim()) : "";
    return [
      `https://www.brabys.com/search?q=${q}`,
      `https://www.cylex.co.za/s?q=${q}`,
      `https://www.hotfrog.co.za/search/${slug(name)}`,
      `https://www.yellosa.co.za/search?what=${q}${cityQ ? `&where=${cityQ}` : ""}`,
    ];
  },
  AU: (name, city) => {
    const q = encodeURIComponent(name.trim());
    const loc = encodeURIComponent((city ?? "Australia").trim());
    return [
      `https://www.yellowpages.com.au/search/listings?clue=${q}&locationClue=${loc}`,
      `https://www.truelocal.com.au/search/${encodeURIComponent(name.trim())}/${loc}`,
      `https://www.hotfrog.com.au/search/${slug(name)}`,
    ];
  },
  GB: (name, city) => {
    const q = encodeURIComponent(name.trim());
    const loc = encodeURIComponent((city ?? "United Kingdom").trim());
    return [
      `https://www.yell.com/ucs/UcsSearchAction.do?keywords=${q}&location=${loc}`,
      `https://www.thomsonlocal.com/search/${q}/${loc}`,
      `https://www.hotfrog.co.uk/search/${slug(name)}`,
    ];
  },
  AE: (name) => {
    const q = encodeURIComponent(name.trim());
    return [
      `https://www.yellowpages.ae/search?q=${q}`,
      `https://www.hotfrog.ae/search/${slug(name)}`,
    ];
  },
  US: (name, city) => {
    const q = encodeURIComponent(name.trim());
    const loc = encodeURIComponent((city ?? "United States").trim());
    return [
      `https://www.yellowpages.com/search?search_terms=${q}&geo_location_terms=${loc}`,
      `https://www.bbb.org/search?find_text=${q}&find_loc=${loc}`,
      `https://www.hotfrog.com/search/${slug(name)}`,
    ];
  },
  NZ: (name, city) => {
    const q = encodeURIComponent(name.trim());
    const loc = city?.trim() ? encodeURIComponent(city.trim()) : "";
    return [
      `https://yellow.co.nz/search?what=${q}${loc ? `&where=${loc}` : ""}`,
      `https://www.hotfrog.co.nz/search/${slug(name)}`,
    ];
  },
};

const TLD_MARKET: Array<{ test: RegExp; market: LiveMarketId }> = [
  { test: /\.co\.za$|\.org\.za$|\.net\.za$/i, market: "ZA" },
  { test: /\.com\.au$|\.net\.au$|\.org\.au$/i, market: "AU" },
  { test: /\.co\.uk$|\.org\.uk$|\.uk$/i, market: "GB" },
  { test: /\.co\.nz$|\.org\.nz$|\.nz$/i, market: "NZ" },
  { test: /\.ae$/i, market: "AE" },
];

export function hostFromWebsite(website: string | null | undefined): string | null {
  const raw = (website ?? "").trim();
  if (!raw) return null;
  try {
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(href).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function inferLiveMarketFromWebsite(
  website: string | null | undefined,
): LiveMarketId | null {
  const host = hostFromWebsite(website);
  if (!host) return null;
  for (const row of TLD_MARKET) {
    if (row.test.test(host)) return row.market;
  }
  return null;
}

export function resolveLiveMarket(input: {
  country?: LiveMarketId | null;
  website?: string | null;
  region?: string | null;
}): LiveMarketId {
  if (input.country && LIVE_MARKET_IDS.includes(input.country)) return input.country;
  const fromSite = inferLiveMarketFromWebsite(input.website);
  if (fromSite) return fromSite;
  const blob = `${input.region ?? ""}`.toLowerCase();
  if (/\baustralia\b|\bvic\b|\bnsw\b|\bqld\b/.test(blob)) return "AU";
  if (/\bunited kingdom\b|\bengland\b|\bscotland\b|\bwales\b/.test(blob)) return "GB";
  if (/\buae\b|\bdubai\b|\babu dhabi\b/.test(blob)) return "AE";
  if (/\bunited states\b|\busa\b|\btexas\b|\bflorida\b|\bcalifornia\b/.test(blob)) {
    return "US";
  }
  if (/\bnew zealand\b/.test(blob)) return "NZ";
  if (/\bsouth africa\b|\bgauteng\b|\bwestern cape\b/.test(blob)) return "ZA";
  return "ZA";
}

export function liveMarketSearchLocation(
  market: LiveMarketId,
  city?: string | null,
): string {
  const country = LIVE_MARKET_NAME[market];
  const loc = city?.trim();
  return loc ? `"${loc}" "${country}"` : `"${country}"`;
}

export function buildMarketDirectoryUrls(input: {
  market: LiveMarketId;
  dealershipName: string;
  city?: string | null;
}): string[] {
  return DIRECTORY_URLS[input.market](input.dealershipName, input.city);
}

export function marketDirectorySiteQueries(
  market: LiveMarketId,
  dealershipName: string,
): string[] {
  const name = `"${dealershipName}"`;
  switch (market) {
    case "ZA":
      return [
        `site:brabys.com ${name}`,
        `site:cylex.co.za ${name}`,
        `site:hotfrog.co.za ${name}`,
        `site:yellosa.co.za ${name}`,
      ];
    case "AU":
      return [
        `site:yellowpages.com.au ${name}`,
        `site:truelocal.com.au ${name}`,
        `site:hotfrog.com.au ${name}`,
      ];
    case "GB":
      return [
        `site:yell.com ${name}`,
        `site:thomsonlocal.com ${name}`,
        `site:hotfrog.co.uk ${name}`,
      ];
    case "AE":
      return [`site:yellowpages.ae ${name}`, `site:hotfrog.ae ${name}`];
    case "US":
      return [
        `site:yellowpages.com ${name}`,
        `site:bbb.org ${name}`,
        `site:hotfrog.com ${name}`,
      ];
    case "NZ":
      return [`site:yellow.co.nz ${name}`, `site:hotfrog.co.nz ${name}`];
  }
}
