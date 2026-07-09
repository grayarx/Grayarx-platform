/**
 * Tiny, dependency-free CSV parser tuned for AutoTrader / Cars.co.za / dealer
 * spreadsheet exports. We deliberately don't pull in a CSV library because:
 *  - the rows are small (<5000)
 *  - we want full control over header alias resolution
 *  - keeping the dependency footprint small reduces cold-start time
 *
 * Supports: quoted fields, embedded commas inside quotes, escaped quotes ("").
 */

import { parseMultiPhotoField } from "../../shared/imagePipeline";
import { validatePhotoSet } from "../../shared/photoStandards";

export type ParsedVehicleRow = {
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  location: string | null;
  imageUrl: string | null;
  /** Pipe- or semicolon-separated photo URLs from CSV */
  imageUrls: string[];
  description: string | null;
  /** Source registration / vin / stock number used for dedupe. */
  externalRef: string | null;
  photoScore: number;
  photoWarnings: string[];
};

export type ImportPreview = {
  totalRows: number;
  validRows: ParsedVehicleRow[];
  skippedRows: Array<{ index: number; reason: string }>;
  duplicateRefs: string[];
  photoSummary: {
    avgScore: number;
    rowsWithoutPhotos: number;
    rowsBelowRecommended: number;
  };
};

const HEADER_ALIASES: Record<keyof ParsedVehicleRow, string[]> = {
  title: ["title", "vehicle", "listing", "name", "listing title", "vehicle title", "advert title"],
  make: ["make", "manufacturer", "brand"],
  model: ["model", "variant", "series"],
  year: ["year", "model year", "year_of_manufacture", "yr"],
  price: [
    "price",
    "price zar",
    "price in zar",
    "asking price",
    "selling price",
    "list price",
    "retail price",
    "amount",
    "amount zar",
    "priced at",
    "vehicle price",
    "sale price",
  ],
  km: ["km", "kms", "mileage", "mileage km", "odometer", "odometer km", "odo"],
  fuel: ["fuel", "fuel type", "fueltype"],
  transmission: ["transmission", "gearbox"],
  location: ["location", "city", "branch", "dealership location"],
  imageUrl: ["image", "image url", "imageurl", "photo", "photo url", "photos", "photos url", "photo urls", "primary photo", "thumbnail", "img", "picture", "main image"],
  imageUrls: ["image urls", "photo urls", "photos urls", "gallery", "images"],
  description: ["description", "notes", "comments", "details"],
  externalRef: ["stock", "stock id", "stock no", "stock number", "stock code", "stock_id", "vin", "vin number", "registration", "reg", "reg no", "ref", "reference", "listing id", "id"],
  photoScore: ["photo score", "photography score"],
  photoWarnings: ["photo warnings", "photo issues"],
};

/** Split a single CSV line respecting quotes. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function normaliseHeader(h: string) {
  return h.toLowerCase().replace(/[_\-]/g, " ").trim();
}

function resolveColumn(headerCells: string[], aliases: string[]): number | null {
  for (let i = 0; i < headerCells.length; i++) {
    const h = normaliseHeader(headerCells[i]);
    if (aliases.includes(h)) return i;
  }
  return null;
}

function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Handle SA formats: "R 329 900", "329k", "329,900"
  const lower = trimmed.toLowerCase();
  const hasK = /\d\s*k\b/i.test(lower) || /\d+k\b/i.test(lower);
  const cleaned = trimmed.replace(/[r\s,]/gi, "").replace(/[^\d.\-k]/gi, "");
  if (!cleaned) return null;
  const withoutK = cleaned.replace(/k$/i, "");
  const n = Number(withoutK);
  if (!Number.isFinite(n)) return null;
  const resolved = hasK && n < 10000 ? n * 1000 : n;
  return resolved > 0 ? resolved : null;
}

export function parseInventoryCsv(csv: string): ImportPreview {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      totalRows: 0,
      validRows: [],
      skippedRows: [],
      duplicateRefs: [],
      photoSummary: { avgScore: 0, rowsWithoutPhotos: 0, rowsBelowRecommended: 0 },
    };
  }

  const header = splitCsvLine(lines[0]);
  const colIndex: Partial<Record<keyof ParsedVehicleRow, number>> = {};
  (Object.keys(HEADER_ALIASES) as Array<keyof ParsedVehicleRow>).forEach((key) => {
    const idx = resolveColumn(header, HEADER_ALIASES[key]);
    if (idx !== null) colIndex[key] = idx;
  });

  // Title is mandatory for a usable vehicle row, but we can synthesise it
  // from make+model+year if missing.
  const hasTitle = colIndex.title !== undefined;
  const hasMakeModel = colIndex.make !== undefined && colIndex.model !== undefined;
  if (!hasTitle && !hasMakeModel) {
    return {
      totalRows: lines.length - 1,
      validRows: [],
      skippedRows: [
        {
          index: 0,
          reason:
            "CSV is missing both a Title column and a Make+Model pair. Add one of: 'title', or both 'make' and 'model'.",
        },
      ],
      duplicateRefs: [],
      photoSummary: { avgScore: 0, rowsWithoutPhotos: 0, rowsBelowRecommended: 0 },
    };
  }

  const validRows: ParsedVehicleRow[] = [];
  const skippedRows: Array<{ index: number; reason: string }> = [];
  const seenRefs = new Set<string>();
  const duplicateRefs: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const get = (key: keyof ParsedVehicleRow) => {
      const idx = colIndex[key];
      return idx === undefined ? undefined : cells[idx];
    };

    const make = get("make")?.trim() || null;
    const model = get("model")?.trim() || null;
    const yearNum = toNumber(get("year"));
    let title = get("title")?.trim() || null;
    if (!title) {
      title = [yearNum, make, model].filter(Boolean).join(" ").trim();
    }
    if (!title) {
      skippedRows.push({ index: i, reason: "No title and no make/model" });
      continue;
    }

    const priceNum = toNumber(get("price"));
    if (priceNum === null) {
      skippedRows.push({ index: i, reason: "Missing or invalid price" });
      continue;
    }

    const rawImage = get("imageUrl")?.trim() || null;
    const imageUrls = parseMultiPhotoField(rawImage);
    const imageUrl = imageUrls[0] ?? null;
    const photoCheck = validatePhotoSet(imageUrls);

    const externalRef = get("externalRef")?.trim() || null;
    if (externalRef) {
      const refLower = externalRef.toLowerCase();
      if (seenRefs.has(refLower)) {
        duplicateRefs.push(externalRef);
        continue;
      }
      seenRefs.add(refLower);
    }

    validRows.push({
      title,
      make,
      model,
      year: yearNum,
      price: priceNum,
      km: toNumber(get("km")),
      fuel: get("fuel")?.trim() || null,
      transmission: get("transmission")?.trim() || null,
      location: get("location")?.trim() || null,
      imageUrl,
      imageUrls,
      description: get("description")?.trim() || null,
      externalRef,
      photoScore: photoCheck.score,
      photoWarnings: photoCheck.warnings,
    });
  }

  const scores = validRows.map((r) => r.photoScore);
  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    totalRows: lines.length - 1,
    validRows,
    skippedRows,
    duplicateRefs,
    photoSummary: {
      avgScore,
      rowsWithoutPhotos: validRows.filter((r) => r.imageUrls.length === 0).length,
      rowsBelowRecommended: validRows.filter((r) => r.imageUrls.length > 0 && r.imageUrls.length < 8).length,
    },
  };
}
