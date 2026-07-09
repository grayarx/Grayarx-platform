/**
 * In-memory cache of live market guide overrides (refreshed weekly).
 */

import { TRADE_IN_GUIDES } from "@shared/saMarketGuides";

export type LiveGuideEntry = {
  guideKey: string;
  year: number;
  tradeInValueZar: number;
  confidence: "high" | "medium" | "low";
  source: string;
  updatedAt: Date;
};

let cache: Map<string, LiveGuideEntry> = new Map();
let lastLoadedAt: Date | null = null;

function cacheKey(guideKey: string, year: number): string {
  return `${guideKey}|${year}`;
}

export function setLiveGuideCache(entries: LiveGuideEntry[]): void {
  cache = new Map(entries.map((e) => [cacheKey(e.guideKey, e.year), e]));
  lastLoadedAt = new Date();
}

export function getLiveGuideOverride(
  guideKey: string,
  year: number,
): LiveGuideEntry | null {
  return cache.get(cacheKey(guideKey, year)) ?? null;
}

export function getLiveGuideCacheStats(): {
  entries: number;
  lastLoadedAt: string | null;
  guideKeys: number;
} {
  const keys = new Set([...cache.values()].map((e) => e.guideKey));
  return {
    entries: cache.size,
    lastLoadedAt: lastLoadedAt?.toISOString() ?? null,
    guideKeys: keys.size,
  };
}

/** All guide keys in rotation order */
export function listGuideKeysForRefresh(): string[] {
  return Object.keys(TRADE_IN_GUIDES).sort();
}

export function pickRepresentativeYears(table: Record<number, number>): number[] {
  const years = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return [];
  if (years.length <= 3) return years;
  const mid = years[Math.floor(years.length / 2)]!;
  return [years[0]!, mid, years[years.length - 1]!];
}
