import { newId, readJsonFile, writeJsonFile } from "@/lib/conversion/store";
import type { Vehicle } from "@/lib/conversion/stock";
import { getStock } from "@/lib/conversion/stock";

export type StockImportRow = {
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  colour?: string;
  status?: "available" | "reserved" | "sold";
};

const FILE = "stock.json";

/** CSV: stockNumber,make,model,year,price,mileage,colour,status */
export function parseStockCsv(csv: string): StockImportRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);
  const str = (cols: string[], name: string) => {
    const i = idx(name);
    return i >= 0 ? cols[i]?.trim() || undefined : undefined;
  };
  const num = (cols: string[], name: string) => {
    const v = str(cols, name);
    if (!v) return undefined;
    const n = Number(v.replace(/\s/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      stockNumber: str(cols, "stocknumber") || str(cols, "stock") || "",
      make: str(cols, "make") || "",
      model: str(cols, "model") || "",
      year: num(cols, "year") || 0,
      price: num(cols, "price") || 0,
      mileage: num(cols, "mileage") ?? num(cols, "km"),
      colour: str(cols, "colour") || str(cols, "color"),
      status: (str(cols, "status") as StockImportRow["status"]) || "available",
    };
  });
}

export function importStockCatalog(input: {
  dealershipId?: string;
  rows: StockImportRow[];
}): {
  imported: number;
  updated: number;
  skipped: Array<{ stockNumber: string; reason: string }>;
  vehicles: Vehicle[];
} {
  const dealershipId = input.dealershipId ?? "demo-yard";
  const state = getStock();
  let imported = 0;
  let updated = 0;
  const skipped: Array<{ stockNumber: string; reason: string }> = [];
  const now = new Date().toISOString();

  for (const row of input.rows) {
    if (!row.stockNumber || !row.make || !row.model || !row.year || !row.price) {
      skipped.push({
        stockNumber: row.stockNumber || "(blank)",
        reason: "Need stockNumber, make, model, year, price",
      });
      continue;
    }

    const existing = state.vehicles.find(
      (v) =>
        v.dealershipId === dealershipId &&
        v.stockNumber.toLowerCase() === row.stockNumber.toLowerCase(),
    );

    if (existing) {
      existing.make = row.make;
      existing.model = row.model;
      existing.year = row.year;
      existing.price = row.price;
      existing.mileage = row.mileage ?? existing.mileage;
      existing.colour = row.colour ?? existing.colour;
      existing.status = row.status ?? existing.status;
      existing.updatedAt = now;
      updated += 1;
    } else {
      state.vehicles.push({
        id: newId("veh"),
        stockNumber: row.stockNumber,
        make: row.make,
        model: row.model,
        year: row.year,
        price: row.price,
        mileage: row.mileage ?? 0,
        colour: row.colour ?? "—",
        status: row.status ?? "available",
        dealershipId,
        updatedAt: now,
      });
      imported += 1;
    }
  }

  writeJsonFile(FILE, state);
  return {
    imported,
    updated,
    skipped,
    vehicles: state.vehicles.filter((v) => v.dealershipId === dealershipId),
  };
}

export const STOCK_CSV_TEMPLATE =
  "stockNumber,make,model,year,price,mileage,colour,status";
