/**
 * Shareable showroom URL filters — keep buyer WhatsApp links in sync with UI.
 */

export type ShowroomUrlFilters = {
  dealershipId?: number;
  shortcode?: string;
  search?: string;
  fuel?: string;
  transmission?: string;
  sort?: "default" | "best_deals";
  maxPrice?: number;
};

export function parseShowroomQuery(search: string): ShowroomUrlFilters {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const out: ShowroomUrlFilters = {};

  const rawId = params.get("dealershipId") ?? params.get("dealerId");
  if (rawId && Number(rawId) > 0) out.dealershipId = Number(rawId);

  const shortcode = params.get("shortcode")?.trim() || params.get("d")?.trim();
  if (shortcode) out.shortcode = shortcode;

  const q = params.get("q")?.trim() || params.get("search")?.trim();
  if (q) out.search = q;

  const fuel = params.get("fuel")?.trim();
  if (fuel && fuel.toLowerCase() !== "all") out.fuel = fuel;

  const transmission = params.get("transmission")?.trim();
  if (transmission && transmission.toLowerCase() !== "all") {
    out.transmission = transmission;
  }

  if (params.get("sort") === "best_deals") out.sort = "best_deals";

  const max = params.get("maxPrice");
  if (max && Number(max) > 0) out.maxPrice = Number(max);

  return out;
}

/** Build query string (no leading ?). Omits empty / default values. */
export function buildShowroomQuery(filters: ShowroomUrlFilters): string {
  const params = new URLSearchParams();
  if (filters.dealershipId && filters.dealershipId > 0) {
    params.set("dealershipId", String(filters.dealershipId));
  }
  if (filters.shortcode?.trim()) {
    params.set("shortcode", filters.shortcode.trim());
  }
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.fuel && filters.fuel !== "all") params.set("fuel", filters.fuel);
  if (filters.transmission && filters.transmission !== "all") {
    params.set("transmission", filters.transmission);
  }
  if (filters.sort === "best_deals") params.set("sort", "best_deals");
  if (filters.maxPrice && filters.maxPrice > 0) {
    params.set("maxPrice", String(Math.round(filters.maxPrice)));
  }
  return params.toString();
}
