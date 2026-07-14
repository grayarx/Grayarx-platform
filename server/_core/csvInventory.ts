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
import { validateVin } from "../../shared/validateVin";

export type ParsedVehicleRow = {
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  /** null means price was missing/invalid — vehicle still imports at R 0, fix in inventory */
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
  /** Normalized VIN when a VIN column is present and valid; null otherwise. */
  vin: string | null;
  /** Vehicle status: available | sold | pending | reserved */
  status: string | null;
  photoScore: number;
  photoWarnings: string[];
  /** Non-photo data warnings (price missing, field truncated, etc.) */
  dataWarnings: string[];
};

export type ImportPreview = {
  totalRows: number;
  validRows: ParsedVehicleRow[];
  /** Rows skipped entirely (no title AND no make+model — truly un-importable) */
  skippedRows: Array<{ index: number; reason: string }>;
  duplicateRefs: string[];
  /** Rows that will import but have fixable issues (price=0, no photos, etc.) */
  warningRows: number;
  photoSummary: {
    avgScore: number;
    rowsWithoutPhotos: number;
    rowsBelowRecommended: number;
  };
};

const HEADER_ALIASES: Partial<Record<keyof ParsedVehicleRow, string[]>> & Record<string, string[]> = {
  title: ["title", "vehicle", "listing", "name", "listing title", "vehicle title", "advert title"],
  make: ["make", "manufacturer", "brand"],
  model: ["model", "variant", "series"],
  year: ["year", "model year", "year_of_manufacture", "yr"],
  price: [
    "price",
    "price zar",
    "price in zar",
    "price_zar",
    "price (zar)",
    "price usd",
    "price (usd)",
    "price inc vat",
    "price incl vat",
    "price including vat",
    "price ex vat",
    "web price",
    "advertised price",
    "asking price",
    "selling price",
    "list price",
    "retail price",
    "retail",
    "amount",
    "amount zar",
    "priced at",
    "vehicle price",
    "sale price",
    "total price",
    "value",
  ],
  km: ["km", "kms", "mileage", "mileage km", "odometer", "odometer km", "odo"],
  fuel: ["fuel", "fuel type", "fueltype"],
  transmission: ["transmission", "gearbox"],
  location: ["location", "city", "branch", "dealership location"],
  imageUrl: ["image", "image url", "imageurl", "photo", "photo url", "photos", "photos url", "photo urls", "primary photo", "thumbnail", "img", "picture", "main image",
    "photo 1", "photo 1 (front angle)", "front angle", "photo 1 front angle"],
  imageUrls: ["image urls", "photo urls", "photos urls", "gallery", "images"],
  description: ["description", "notes", "comments", "details"],
  // Dedicated VIN column → vehicles.vin; also kept under externalRef aliases for dedupe when no stock#.
  vin: ["vin", "vin number", "vin no", "vehicle identification number"],
  externalRef: ["stock", "stock id", "stock no", "stock number", "stock code", "stock_id", "vin", "vin number", "vin no", "registration", "reg", "reg no", "ref", "reference", "listing id", "id"],
  status: ["status", "availability", "stock status", "listing status"],
  photoScore: ["photo score", "photography score"],
  photoWarnings: ["photo warnings", "photo issues"],
  dataWarnings: [],
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

/** Parse vehicle price — rejects POA placeholders and R1 junk values. */
function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (
    /^(poa|p\.o\.a\.?|tba|tbc|n\/a|na|nil|none|ask|enquire|inquire|contact|call|negotiable)$/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  const n = toNumber(raw);
  if (n === null || n <= 1) return null;
  return n;
}

/**
 * Validate a single photo URL and return a human-readable reason if it is
 * unsuitable for the showroom, or null if it looks fine.
 */
function photoUrlIssue(url: string): string | null {
  if (!url || !url.trim()) return "URL is empty";
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return `Not a valid URL: "${trimmed.slice(0, 40)}"`;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return `Must be an http/https URL (got ${parsed.protocol})`;
  }
  // Bare domain — no path beyond "/"
  if (parsed.pathname === "/" && !parsed.search) {
    return `Bare domain only — needs a full image path (e.g. pinterest.com/pin/…/image.jpg)`;
  }
  // Known non-image hosting sites that are commonly pasted by mistake
  const badHosts = ["pinterest.com", "www.pinterest.com", "facebook.com", "instagram.com", "twitter.com", "x.com"];
  if (badHosts.includes(parsed.hostname)) {
    return `${parsed.hostname} blocks direct image embedding — use a direct .jpg/.png link or Unsplash`;
  }
  return null; // looks OK
}

function inferPriceColumnIndex(header: string[], sampleRows: string[][]): number | null {
  if (sampleRows.length === 0) return null;
  let bestIdx: number | null = null;
  let bestScore = 0;
  for (let col = 0; col < header.length; col++) {
    let hits = 0;
    for (const row of sampleRows) {
      const p = parsePrice(row[col]);
      if (p !== null && p >= 10_000) hits++;
    }
    if (hits > bestScore) {
      bestScore = hits;
      bestIdx = col;
    }
  }
  return bestScore >= Math.max(1, Math.floor(sampleRows.length * 0.4)) ? bestIdx : null;
}

export function parseInventoryCsv(csv: string): ImportPreview {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    // Strip comment lines (lines starting with #) — used in template files
    .filter((l) => l.length > 0 && !l.startsWith("#"));

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
    const aliases = HEADER_ALIASES[key];
    if (!aliases || aliases.length === 0) return;
    const idx = resolveColumn(header, aliases);
    if (idx !== null) colIndex[key] = idx;
  });

  // Detect numbered photo columns: "Photo 1", "Photo 2 (Rear Angle)", etc.
  // Collect all their column indices so we can merge them per row.
  const numberedPhotoColIndices: number[] = [];
  for (let i = 0; i < header.length; i++) {
    const h = normaliseHeader(header[i]);
    // Match "photo N" or "photo N (anything)" or "image N"
    if (/^(photo|image)\s*\d+/.test(h)) {
      // Don't double-count if already resolved as primary imageUrl
      if (i !== colIndex.imageUrl) {
        numberedPhotoColIndices.push(i);
      }
    }
  }

  const sampleRows = lines.slice(1, Math.min(lines.length, 12)).map((l) => splitCsvLine(l));
  if (colIndex.price === undefined) {
    const inferred = inferPriceColumnIndex(header, sampleRows);
    if (inferred !== null) colIndex.price = inferred;
  }

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

    const dataWarnings: string[] = [];

    const make = get("make")?.trim() || null;
    const model = get("model")?.trim() || null;
    const yearNum = toNumber(get("year"));
    let title = get("title")?.trim() || null;
    if (!title) {
      title = [yearNum, make, model].filter(Boolean).join(" ").trim();
    }
    // Truly un-importable — no identity at all
    if (!title) {
      skippedRows.push({ index: i, reason: "No title and no make/model — cannot identify this vehicle" });
      continue;
    }

    // Price: warn but still import at R 0 so the dealer can fix it in inventory
    const rawPrice = get("price");
    const priceNum = parsePrice(rawPrice);
    if (priceNum === null) {
      if (!rawPrice || !rawPrice.trim()) {
        dataWarnings.push("Price is missing — vehicle will import at R 0. Update in Inventory.");
      } else if (/^(poa|p\.o\.a|tba|tbc|n\/a|negotiable|contact|call)/i.test(rawPrice.trim())) {
        dataWarnings.push(`Price is "${rawPrice.trim()}" (not a number) — set to R 0. Update in Inventory.`);
      } else {
        dataWarnings.push(`Price "${rawPrice.trim()}" could not be parsed — confirm currency is ZAR, remove $ or commas. Set to R 0 for now.`);
      }
    }

    // Collect photo URLs from primary column + numbered columns
    const rawImage = get("imageUrl")?.trim() || null;
    let candidateUrls = parseMultiPhotoField(rawImage);
    for (const idx of numberedPhotoColIndices) {
      const url = cells[idx]?.trim();
      if (url && url.length > 4 && !candidateUrls.includes(url)) {
        candidateUrls.push(url);
      }
    }
    candidateUrls = [...new Set(candidateUrls)];

    // Validate each candidate and collect specific photo warnings
    const imageUrls: string[] = [];
    const photoValidationWarnings: string[] = [];
    for (const url of candidateUrls) {
      const issue = photoUrlIssue(url);
      if (issue) {
        photoValidationWarnings.push(`Photo URL rejected — ${issue}`);
      } else {
        imageUrls.push(url);
      }
    }
    if (photoValidationWarnings.length > 0 && imageUrls.length === 0) {
      dataWarnings.push(
        `All ${photoValidationWarnings.length} photo URL(s) are invalid. Add real image links in Inventory. Reason: ${photoValidationWarnings[0]}`,
      );
    } else if (photoValidationWarnings.length > 0) {
      dataWarnings.push(
        `${photoValidationWarnings.length} photo URL(s) rejected (${photoValidationWarnings[0]}). ${imageUrls.length} photo(s) kept.`,
      );
    }

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

    // Populate vehicles.vin when a VIN column (or VIN-as-ref) is present and valid.
    // Soft: invalid VIN still imports; warn so the dealer can fix in Inventory.
    let vin: string | null = null;
    const rawVin = get("vin")?.trim() || null;
    const vinCandidate = rawVin || (externalRef && externalRef.length >= 11 ? externalRef : null);
    if (vinCandidate) {
      const vinResult = validateVin(vinCandidate);
      if (vinResult.ok && vinResult.normalized) {
        vin = vinResult.normalized;
      } else if (rawVin || (externalRef && /^[A-HJ-NPR-Z0-9\s-]{15,20}$/i.test(externalRef))) {
        dataWarnings.push(
          !vinResult.ok
            ? `VIN "${vinCandidate.slice(0, 24)}" is invalid — ${vinResult.reason} Fix in Inventory.`
            : `VIN could not be normalised. Fix in Inventory.`,
        );
      }
    }

    // Parse status — normalise DMS values to our enum
    const VALID_STATUSES = ["available", "sold", "pending", "reserved"];
    const rawStatus = get("status")?.trim().toLowerCase() || null;
    let status: string | null = null;
    if (rawStatus) {
      if (VALID_STATUSES.includes(rawStatus)) {
        status = rawStatus;
      } else if (/^(yes|y|true|1|sold out)$/i.test(rawStatus)) {
        status = "sold";
      } else if (/^(no|n|false|0|in stock|available|active)$/i.test(rawStatus)) {
        status = "available";
      } else if (/^(pend|hold|deposit)/i.test(rawStatus)) {
        status = "pending";
      } else if (/^(res|reserved)/i.test(rawStatus)) {
        status = "reserved";
      }
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
      vin,
      status,
      photoScore: photoCheck.score,
      photoWarnings: [...photoCheck.warnings, ...photoValidationWarnings],
      dataWarnings,
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
    warningRows: validRows.filter((r) => r.dataWarnings.length > 0 || r.photoWarnings.length > 0).length,
    photoSummary: {
      avgScore,
      rowsWithoutPhotos: validRows.filter((r) => r.imageUrls.length === 0).length,
      rowsBelowRecommended: validRows.filter((r) => r.imageUrls.length > 0 && r.imageUrls.length < 8).length,
    },
  };
}
