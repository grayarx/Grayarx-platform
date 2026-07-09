import type { ParsedVehicleRow } from "./csvInventory";
import {
  bulkUpdateVehiclePrices,
  listVehiclesForPriceRepair,
} from "../db";

export type PriceRepairResult = {
  updated: number;
  notFound: number;
  alreadyCorrect: number;
};

type RepairVehicle = Awaited<ReturnType<typeof listVehiclesForPriceRepair>>[number];

/** True when a stored price is missing, invalid, or the R1 import placeholder. */
export function isR1Price(price: string | number | null | undefined): boolean {
  if (price === null || price === undefined || price === "") return true;
  const n = typeof price === "string" ? Number(price) : price;
  return !Number.isFinite(n) || n <= 1;
}

function mmyKey(make: string, model: string, year: number) {
  return `${make.trim().toLowerCase()}|${model.trim().toLowerCase()}|${year}`;
}

function buildRepairLookups(inventory: RepairVehicle[]) {
  const byRef = new Map<string, RepairVehicle>();
  const byMmy = new Map<string, RepairVehicle[]>();
  const byTitle = new Map<string, RepairVehicle[]>();

  for (const v of inventory) {
    if (v.externalRef) {
      byRef.set(v.externalRef.trim().toLowerCase(), v);
    }
    if (v.make && v.model && v.year != null) {
      const key = mmyKey(v.make, v.model, v.year);
      const list = byMmy.get(key) ?? [];
      list.push(v);
      byMmy.set(key, list);
    }
    const titleKey = v.title.trim().toLowerCase();
    const titleList = byTitle.get(titleKey) ?? [];
    titleList.push(v);
    byTitle.set(titleKey, titleList);
  }

  return { byRef, byMmy, byTitle };
}

function matchFromLookups(
  row: ParsedVehicleRow,
  lookups: ReturnType<typeof buildRepairLookups>,
  usedIds: Set<number>,
): RepairVehicle | undefined {
  if (row.externalRef) {
    const hit = lookups.byRef.get(row.externalRef.trim().toLowerCase());
    if (hit && !usedIds.has(hit.id)) return hit;
  }
  if (row.make && row.model && row.year != null) {
    const candidates = lookups.byMmy.get(mmyKey(row.make, row.model, row.year)) ?? [];
    const hit = candidates.find((c) => !usedIds.has(c.id));
    if (hit) return hit;
  }
  const titleCandidates = lookups.byTitle.get(row.title.trim().toLowerCase()) ?? [];
  return titleCandidates.find((c) => !usedIds.has(c.id));
}

/** Bulk-repair vehicles stuck at R1 using prices from parsed CSV rows. */
export async function repairPricesFromRows(
  rows: ParsedVehicleRow[],
): Promise<PriceRepairResult> {
  const started = Date.now();
  const inventory = await listVehiclesForPriceRepair(2000);
  const lookups = buildRepairLookups(inventory);
  const usedIds = new Set<number>();
  const updates: Array<{ id: number; price: string }> = [];
  let notFound = 0;
  let alreadyCorrect = 0;

  for (const row of rows) {
    if (!row.price || row.price <= 1) continue;

    const vehicle = matchFromLookups(row, lookups, usedIds);
    if (!vehicle) {
      notFound++;
      continue;
    }

    if (!isR1Price(vehicle.price)) {
      alreadyCorrect++;
      continue;
    }

    usedIds.add(vehicle.id);
    updates.push({ id: vehicle.id, price: String(row.price) });
  }

  await bulkUpdateVehiclePrices(updates);
  console.log(
    `[PriceRepair] ${updates.length} updated, ${notFound} not found, ${alreadyCorrect} already correct — ${Date.now() - started}ms`,
  );

  return { updated: updates.length, notFound, alreadyCorrect };
}
