import { mapCsvRows, parseFlexibleNumber } from "@shared/smartCsv";
import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";
import type { Vehicle } from "@nalaOs/conversion/stock";
import { getStock } from "@nalaOs/conversion/stock";

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

const STOCK_CSV_FIELDS: Record<string, readonly string[]> = {
  stockNumber: ["stocknumber", "stock number", "stock", "stock no", "stock code", "stock id"],
  make: ["make", "manufacturer", "brand"],
  model: ["model", "series"],
  year: ["year", "model year", "yr"],
  price: ["price", "retail", "asking", "amount"],
  mileage: ["mileage", "km", "kms", "odometer"],
  colour: ["colour", "color"],
  status: ["status", "availability"],
};

/** CSV: stockNumber,make,model,year,price,mileage,colour,status */
export function parseStockCsv(csv: string): StockImportRow[] {
  return mapCsvRows(csv, STOCK_CSV_FIELDS, {
    defaultOrder: ["stockNumber", "make", "model", "year", "price", "mileage", "colour", "status"],
  }).map((row) => ({
    stockNumber: row.stockNumber || "",
    make: row.make || "",
    model: row.model || "",
    year: parseFlexibleNumber(row.year) || 0,
    price: parseFlexibleNumber(row.price) || 0,
    mileage: parseFlexibleNumber(row.mileage),
    colour: row.colour || undefined,
    status: (row.status as StockImportRow["status"]) || "available",
  }));
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
