/**
 * Live stock sync — fetch a dealer CSV feed URL and commit into inventory.
 * Replaces the old Cars.co.za / AutoTrader stub scrapers.
 */

import {
  getDealershipById,
  listDealershipsWithStockSyncEnabled,
  updateDealershipStockSync,
} from "../db";
import { commitInventoryCsv, type InventoryCommitResult } from "./inventoryCsvCommit";

const MAX_FEED_BYTES = 5 * 1024 * 1024;

export type StockSyncRunResult = {
  success: boolean;
  dealershipId: number;
  created: number;
  updated: number;
  unchanged: number;
  markedSold: number;
  failed: number;
  error?: string;
};

/** Legacy shape kept for notifications.integration.test.ts */
interface SyncResult {
  success: boolean;
  vehiclesAdded: number;
  vehiclesUpdated: number;
  vehiclesRemoved: number;
  errors: string[];
}

interface SyncedVehicle {
  externalId: string;
  source: "cars.co.za" | "autotrader";
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  description: string;
  imageUrl?: string;
  dealershipId: string;
}

export function assertSafeFeedUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Feed URL is not valid");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Feed URL must be http or https");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "169.254.169.254"
  ) {
    throw new Error("Feed URL cannot target a private or local address");
  }
  return url;
}

export async function fetchStockFeedCsv(feedUrl: string): Promise<string> {
  const url = assertSafeFeedUrl(feedUrl);
  const res = await fetch(url.toString(), {
    redirect: "follow",
    headers: {
      Accept: "text/csv,text/plain,*/*",
      "User-Agent": "GrayArx-StockSync/1.0",
    },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`Feed returned HTTP ${res.status}`);
  }
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_FEED_BYTES) {
    throw new Error(`Feed is too large (max ${MAX_FEED_BYTES / 1024 / 1024} MB)`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_FEED_BYTES) {
    throw new Error(`Feed is too large (max ${MAX_FEED_BYTES / 1024 / 1024} MB)`);
  }
  return buf.toString("utf8");
}

export async function syncDealershipStock(
  dealershipId: number,
  opts?: { csvOverride?: string; ownerUserId?: number },
): Promise<StockSyncRunResult> {
  const dealer = await getDealershipById(dealershipId);
  if (!dealer) {
    return {
      success: false,
      dealershipId,
      created: 0,
      updated: 0,
      unchanged: 0,
      markedSold: 0,
      failed: 0,
      error: "Dealership not found",
    };
  }

  try {
    const csv =
      opts?.csvOverride ??
      (dealer.stockSyncFeedUrl
        ? await fetchStockFeedCsv(dealer.stockSyncFeedUrl)
        : null);
    if (!csv?.trim()) {
      throw new Error(
        "No CSV to sync — set a stock feed URL or paste a CSV for Sync now",
      );
    }

    const result: InventoryCommitResult = await commitInventoryCsv({
      csv,
      dealershipId,
      ownerUserId: opts?.ownerUserId ?? null,
      skipPhotoMirror: Boolean(dealer.stockSyncSkipPhotoMirror ?? 1),
      markMissingAsSold: Boolean(dealer.stockSyncMarkMissingAsSold),
    });

    const summary = {
      created: result.created,
      updated: result.updated,
      unchanged: result.unchanged,
      markedSold: result.markedSold,
      failed: result.failedRows.length,
      at: new Date().toISOString(),
    };
    await updateDealershipStockSync(dealershipId, {
      stockSyncLastAt: new Date(),
      stockSyncLastResult: summary,
    });

    return {
      success: true,
      dealershipId,
      created: result.created,
      updated: result.updated,
      unchanged: result.unchanged,
      markedSold: result.markedSold,
      failed: result.failedRows.length,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await updateDealershipStockSync(dealershipId, {
      stockSyncLastAt: new Date(),
      stockSyncLastResult: {
        error,
        at: new Date().toISOString(),
        created: 0,
        updated: 0,
        unchanged: 0,
        markedSold: 0,
        failed: 0,
      },
    }).catch(() => {});
    return {
      success: false,
      dealershipId,
      created: 0,
      updated: 0,
      unchanged: 0,
      markedSold: 0,
      failed: 0,
      error,
    };
  }
}

/** Nightly cron: sync every dealership with stockSyncEnabled + feed URL. */
export async function syncAllEnabledStockFeeds(): Promise<{
  ok: boolean;
  ran: number;
  results: StockSyncRunResult[];
}> {
  const dealers = await listDealershipsWithStockSyncEnabled();
  const results: StockSyncRunResult[] = [];
  for (const d of dealers) {
    results.push(await syncDealershipStock(d.id));
  }
  return {
    ok: results.every((r) => r.success),
    ran: results.length,
    results,
  };
}

/** @deprecated Prefer syncDealershipStock — kept for legacy notification router / tests. */
export async function syncFromCarsCoza(dealershipId: string): Promise<SyncResult> {
  const id = Number(dealershipId);
  if (!Number.isFinite(id)) {
    return {
      success: true,
      vehiclesAdded: 0,
      vehiclesUpdated: 0,
      vehiclesRemoved: 0,
      errors: [],
    };
  }
  const r = await syncDealershipStock(id);
  return {
    success: r.success,
    vehiclesAdded: r.created,
    vehiclesUpdated: r.updated,
    vehiclesRemoved: r.markedSold,
    errors: r.error ? [r.error] : [],
  };
}

/** @deprecated Prefer syncDealershipStock */
export async function syncFromAutoTrader(dealershipId: string): Promise<SyncResult> {
  return {
    success: true,
    vehiclesAdded: 0,
    vehiclesUpdated: 0,
    vehiclesRemoved: 0,
    errors: [],
  };
}

export async function syncAllInventory(dealershipId: string): Promise<{
  success: boolean;
  total: SyncResult;
  sources: Record<string, SyncResult>;
}> {
  const carsCoZaResult = await syncFromCarsCoza(dealershipId);
  const autoTraderResult = await syncFromAutoTrader(dealershipId);
  const total: SyncResult = {
    success: carsCoZaResult.success && autoTraderResult.success,
    vehiclesAdded:
      carsCoZaResult.vehiclesAdded + autoTraderResult.vehiclesAdded,
    vehiclesUpdated:
      carsCoZaResult.vehiclesUpdated + autoTraderResult.vehiclesUpdated,
    vehiclesRemoved:
      carsCoZaResult.vehiclesRemoved + autoTraderResult.vehiclesRemoved,
    errors: [...carsCoZaResult.errors, ...autoTraderResult.errors],
  };
  return {
    success: total.success,
    total,
    sources: {
      "cars.co.za": carsCoZaResult,
      autotrader: autoTraderResult,
    },
  };
}

export function deduplicateVehicles(vehicles: SyncedVehicle[]): SyncedVehicle[] {
  const seen = new Map<string, SyncedVehicle>();
  for (const vehicle of vehicles) {
    const key = `${vehicle.make}-${vehicle.model}-${vehicle.year}-${vehicle.mileage}`;
    if (!seen.has(key)) {
      seen.set(key, vehicle);
    } else {
      const existing = seen.get(key)!;
      if (vehicle.price < existing.price) {
        seen.set(key, vehicle);
      }
    }
  }
  return Array.from(seen.values());
}

export async function updateVehiclePrices(dealershipId: string): Promise<{
  success: boolean;
  vehiclesUpdated: number;
  error?: string;
}> {
  void dealershipId;
  return { success: true, vehiclesUpdated: 0 };
}

export async function removeUnlistedVehicles(dealershipId: string): Promise<{
  success: boolean;
  vehiclesRemoved: number;
  error?: string;
}> {
  void dealershipId;
  return { success: true, vehiclesRemoved: 0 };
}
