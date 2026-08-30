import { and, desc, eq, sql } from "drizzle-orm";
import { mapCsvRows, normalizeFitment, parseFlexibleNumber } from "@shared/smartCsv";
import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";
import {
  getDealershipSettings,
  updateDealershipSettings,
} from "@nalaOs/dealership/settings";
import { getDb } from "../../../db";
import {
  dealershipParts,
  dealershipPartsEnquiries,
  type DealershipPart,
  type DealershipPartEnquiry,
} from "../../../../drizzle/schema";
import { attachPartToJob, getServiceJob } from "@nalaOs/os/service";

/**
 * Dealer parts catalog row — their numbers, their prices.
 * GrayArx does NOT invent OEM pricing; we quote what they import/sync.
 */
export type Part = {
  id: string;
  /** Dealer / internal SKU (what their counter uses) */
  sku: string;
  /** OEM / manufacturer part number if they have it */
  oemNumber?: string;
  name: string;
  /** Human fitment labels e.g. "Toyota Hilux" */
  fits: string[];
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  /** What the dealer paid (optional) */
  costPrice?: number;
  /** What the buyer is quoted — REQUIRED for public quotes */
  retailPrice: number;
  qty: number;
  supplier?: string;
  dealershipId: string;
  updatedAt: string;
  source: "seed" | "csv_import" | "manual" | "dms_feed";
};

export type PartsEnquiry = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  message: string;
  partId?: string;
  serviceJobId?: string;
  status: "quoted" | "held" | "collected" | "lost" | "module_off";
  nalaReply: string;
  createdAt: string;
  holdUntil?: string;
  dealershipId: string;
};

export type PartsSlip = {
  yardName: string;
  client: string;
  vehicle: string;
  sku: string;
  name: string;
  qty: number;
  retail: number;
  jobRef?: string;
  createdAt: string;
};

export type RankedPart = { part: Part; score: number };

export type PartImportRow = {
  sku: string;
  oemNumber?: string;
  name: string;
  fits?: string;
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  costPrice?: number;
  retailPrice?: number;
  qty?: number;
  supplier?: string;
};

type PartsState = { parts: Part[]; enquiries: PartsEnquiry[] };

const FILE = "parts.json";

export const PARTS_CSV_HEADERS =
  "sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier";

const PARTS_CSV_FIELDS: Record<string, readonly string[]> = {
  sku: ["sku", "skus", "stock", "stock code", "stockcode", "part no", "part number", "partnumber", "part #", "item", "item code", "itemcode", "code"],
  oemNumber: ["oemnumber", "oem number", "oem no", "oem", "oem part", "manufacturer part", "mfr", "mpn", "genuine no"],
  name: ["name", "description", "part name", "partname", "item name", "title", "product", "product name"],
  fits: ["fits", "fitment", "vehicles", "applications", "suitable for", "application", "compat"],
  make: ["make", "manufacturer", "brand", "marque"],
  model: ["model", "series", "range"],
  yearFrom: ["yearfrom", "year from", "from year", "start year", "yr from", "year start"],
  yearTo: ["yearto", "year to", "end year", "yr to", "year end"],
  costPrice: ["costprice", "cost price", "cost", "wholesale", "dealer cost", "buy price", "nett"],
  retailPrice: ["retailprice", "retail price", "retail", "price", "sell", "selling price", "rrp", "list price"],
  qty: ["qty", "quantity", "stock qty", "on hand", "onhand", "units", "count", "available"],
  supplier: ["supplier", "vendor", "source", "distributor", "wholesaler"],
};

const PARTS_CSV_DEFAULT_ORDER = PARTS_CSV_HEADERS.split(",");

export const PARTS_CSV_TEMPLATE = `# GrayArx parts template
# Re-import any time — rows match on SKU for this dealership. fits is pipe-separated.
# Pricing: retailPrice as-is, OR costPrice × (1 + your markup %). Rows with neither are skipped.
${PARTS_CSV_HEADERS}
OA-OF-POLO,03C115561H,Oil filter,Volkswagen Polo|Hyundai i20,Volkswagen,Polo,2018,2024,95,189,24,Local OEM
BR-PAD-HILUX,04465-0K290,Front brake pads — Hilux GD-6,Toyota Hilux,Toyota,Hilux,2016,2024,780,1450,8,
`;

const DEFAULT: PartsState = {
  parts: [
    {
      id: "part_filter_polo",
      sku: "OA-OF-POLO",
      oemNumber: "03C115561H",
      name: "Oil filter (Polo / i20 compatible)",
      fits: ["Volkswagen Polo", "Hyundai i20"],
      make: "Volkswagen",
      model: "Polo",
      yearFrom: 2018,
      yearTo: 2024,
      costPrice: 95,
      retailPrice: 189,
      qty: 24,
      supplier: "Local OEM distributor",
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
      source: "seed",
    },
    {
      id: "part_pad_hilux",
      sku: "BR-PAD-HILUX",
      oemNumber: "04465-0K290",
      name: "Front brake pads — Hilux GD-6",
      fits: ["Toyota Hilux"],
      make: "Toyota",
      model: "Hilux",
      yearFrom: 2016,
      yearTo: 2024,
      costPrice: 780,
      retailPrice: 1450,
      qty: 8,
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
      source: "seed",
    },
    {
      id: "part_battery_60",
      sku: "BAT-60AH",
      name: "60Ah maintenance-free battery",
      fits: ["Volkswagen Polo", "Hyundai i20", "Toyota Hilux"],
      costPrice: 1100,
      retailPrice: 1899,
      qty: 5,
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
      source: "seed",
    },
    {
      id: "part_wiper_set",
      sku: "WIP-SET-UNI",
      name: "Wiper blade set (universal 55/45cm)",
      fits: ["Most hatchbacks"],
      costPrice: 140,
      retailPrice: 320,
      qty: 15,
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
      source: "seed",
    },
    {
      id: "part_rad_hilux",
      sku: "CL-RAD-HILUX",
      oemNumber: "16400-0K190",
      name: "Radiator — Hilux GD-6",
      fits: ["Toyota Hilux"],
      make: "Toyota",
      model: "Hilux",
      yearFrom: 2016,
      yearTo: 2024,
      costPrice: 1890,
      retailPrice: 3149,
      qty: 3,
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
      source: "seed",
    },
  ],
  enquiries: [],
};

/** Vitest + OS smoke stay on the JSON/memory seed. Production uses MySQL. */
function useDurableDb(): boolean {
  if (process.env.VITEST) return false;
  if (process.env.NALA_OS_SMOKE === "1") return false;
  return Boolean(process.env.DATABASE_URL);
}

function load(): PartsState {
  const state = readJsonFile(FILE, DEFAULT);
  // Migrate old `price` field if present
  for (const p of state.parts as Array<Part & { price?: number }>) {
    if (p.retailPrice == null && typeof p.price === "number") {
      p.retailPrice = p.price;
    }
    if (!p.updatedAt) p.updatedAt = new Date().toISOString();
    if (!p.source) p.source = "seed";
  }
  return state;
}

function save(state: PartsState) {
  writeJsonFile(FILE, state);
}

function asIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function numOrUndef(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseFits(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function rowToPart(row: DealershipPart): Part {
  return {
    id: row.id,
    sku: row.sku,
    oemNumber: row.oemNumber ?? undefined,
    name: row.name,
    fits: parseFits(row.fits),
    make: row.make ?? undefined,
    model: row.model ?? undefined,
    yearFrom: row.yearFrom ?? undefined,
    yearTo: row.yearTo ?? undefined,
    costPrice: numOrUndef(row.costPrice),
    retailPrice: Number(row.retailPrice),
    qty: row.qty,
    supplier: row.supplier ?? undefined,
    dealershipId: row.dealershipId,
    updatedAt: asIso(row.updatedAt),
    source: (row.source as Part["source"]) || "csv_import",
  };
}

function rowToEnquiry(row: DealershipPartEnquiry): PartsEnquiry {
  return {
    id: row.id,
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    message: row.message,
    partId: row.partId ?? undefined,
    status: row.status as PartsEnquiry["status"],
    nalaReply: row.nalaReply,
    createdAt: asIso(row.createdAt),
    holdUntil: row.holdUntil ? asIso(row.holdUntil) : undefined,
    dealershipId: row.dealershipId,
  };
}

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Parts catalog database is unavailable. Stock is not written to disk — try again shortly.",
    );
  }
  return db;
}

export function lastImportAtFromParts(parts: Part[]): string | null {
  if (parts.length === 0) return null;
  return parts.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), parts[0]!.updatedAt);
}

export async function listParts(dealershipId = "demo-yard"): Promise<Part[]> {
  return (await listAllParts(dealershipId)).filter((p) => p.qty > 0);
}

export async function listAllParts(dealershipId = "demo-yard"): Promise<Part[]> {
  if (!useDurableDb()) {
    return load().parts.filter((p) => p.dealershipId === dealershipId);
  }
  const db = await requireDb();
  const rows = await db
    .select()
    .from(dealershipParts)
    .where(eq(dealershipParts.dealershipId, dealershipId))
    .orderBy(dealershipParts.name);
  return rows.map(rowToPart);
}

function retailOf(p: Part): number {
  return p.retailPrice;
}

const FIND_STOP = new Set([
  "for",
  "the",
  "a",
  "an",
  "my",
  "and",
  "or",
  "of",
  "on",
  "to",
  "in",
  "with",
  "please",
  "need",
  "want",
  "quote",
  "part",
  "parts",
  "price",
  "have",
  "you",
  "got",
  "do",
]);

function tokenizePartQuery(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !FIND_STOP.has(t));
}

export function scorePartAgainstQuery(part: Part, message: string): number {
  const lower = message.toLowerCase();
  if (part.sku && lower.includes(part.sku.toLowerCase())) return 1000;
  if (part.oemNumber && lower.includes(part.oemNumber.toLowerCase())) return 1000;

  const tokens = tokenizePartQuery(message);
  if (tokens.length === 0) return 0;

  const name = part.name.toLowerCase();
  const make = (part.make || "").toLowerCase();
  const model = (part.model || "").toLowerCase();
  const fits = (part.fits || []).join(" ").toLowerCase();
  const fitHay = `${make} ${model} ${fits}`;

  let score = 0;
  let nameHits = 0;
  let fitHits = 0;
  for (const t of tokens) {
    if (name.includes(t)) {
      score += 12;
      nameHits += 1;
    }
    if (make === t || model === t || (t.length > 2 && fitHay.includes(t))) {
      score += 4;
      fitHits += 1;
    }
  }
  if (nameHits && fitHits) score += 10;
  return score;
}

export async function rankParts(
  message: string,
  dealershipId = "demo-yard",
): Promise<RankedPart[]> {
  const parts = await listParts(dealershipId);
  return parts
    .map((part) => ({ part, score: scorePartAgainstQuery(part, message) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.part.name.localeCompare(b.part.name));
}

export async function findPart(
  message: string,
  dealershipId = "demo-yard",
): Promise<Part | undefined> {
  const ranked = await rankParts(message, dealershipId);
  return ranked[0]?.part;
}

function resolveRetail(
  row: PartImportRow,
  markupPercent: number,
): { retail: number } | { skip: string } {
  let retail = row.retailPrice;
  if (retail == null && row.costPrice != null) {
    retail = Math.round(row.costPrice * (1 + markupPercent / 100));
  }
  if (retail == null || retail <= 0) {
    return {
      skip: "No retailPrice and no costPrice to markup — dealer must supply pricing",
    };
  }
  return { retail };
}

function fitsFromRow(row: PartImportRow): string[] {
  return (
    row.fits
      ?.split("|")
      .map((s) => s.trim())
      .filter(Boolean) ??
    (row.make && row.model ? [`${row.make} ${row.model}`] : [])
  );
}

/**
 * Import dealer catalog. Pricing rules:
 * - If retailPrice provided → use it (dealer's sell price)
 * - Else if costPrice + markup settings → retail = cost * (1 + markup%)
 * - Else skip row (we never invent prices)
 */
export async function importPartsCatalog(input: {
  dealershipId?: string;
  rows: PartImportRow[];
  source?: Part["source"];
}): Promise<{
  imported: number;
  updated: number;
  skipped: Array<{ sku: string; reason: string }>;
  parts: Part[];
}> {
  const dealershipId = input.dealershipId ?? "demo-yard";
  const settings = getDealershipSettings(dealershipId);
  const markup = settings.parts.defaultMarkupPercent;
  const source = input.source ?? "csv_import";
  const now = new Date().toISOString();
  let imported = 0;
  let updated = 0;
  const skipped: Array<{ sku: string; reason: string }> = [];

  if (useDurableDb()) {
    const db = await requireDb();
    for (const row of input.rows) {
      const sku = row.sku?.trim();
      if (!sku || !row.name?.trim()) {
        skipped.push({ sku: sku || "(blank)", reason: "Missing sku or name" });
        continue;
      }
      const priced = resolveRetail(row, markup);
      if ("skip" in priced) {
        skipped.push({ sku, reason: priced.skip });
        continue;
      }
      const fits = fitsFromRow(row);
      const existing = await db
        .select()
        .from(dealershipParts)
        .where(
          and(
            eq(dealershipParts.dealershipId, dealershipId),
            eq(dealershipParts.sku, sku),
          ),
        )
        .limit(1);
      const prev = existing[0];
      if (prev) {
        await db
          .update(dealershipParts)
          .set({
            oemNumber: row.oemNumber ?? prev.oemNumber,
            name: row.name.trim(),
            fits: fits.length ? fits : parseFits(prev.fits),
            make: row.make ?? prev.make,
            model: row.model ?? prev.model,
            yearFrom: row.yearFrom ?? prev.yearFrom,
            yearTo: row.yearTo ?? prev.yearTo,
            costPrice:
              row.costPrice != null ? String(row.costPrice) : prev.costPrice,
            retailPrice: String(priced.retail),
            qty: row.qty ?? prev.qty,
            supplier: row.supplier ?? prev.supplier,
            source,
            updatedAt: new Date(now),
          })
          .where(eq(dealershipParts.id, prev.id));
        updated += 1;
      } else {
        await db.insert(dealershipParts).values({
          id: newId("part"),
          sku,
          oemNumber: row.oemNumber,
          name: row.name.trim(),
          fits,
          make: row.make,
          model: row.model,
          yearFrom: row.yearFrom,
          yearTo: row.yearTo,
          costPrice: row.costPrice != null ? String(row.costPrice) : null,
          retailPrice: String(priced.retail),
          qty: row.qty ?? 0,
          supplier: row.supplier,
          dealershipId,
          source,
          updatedAt: new Date(now),
        });
        imported += 1;
      }
    }
  } else {
    const state = load();
    for (const row of input.rows) {
      const sku = row.sku?.trim();
      if (!sku || !row.name?.trim()) {
        skipped.push({ sku: sku || "(blank)", reason: "Missing sku or name" });
        continue;
      }
      const priced = resolveRetail(row, markup);
      if ("skip" in priced) {
        skipped.push({ sku, reason: priced.skip });
        continue;
      }
      const fits = fitsFromRow(row);
      const existing = state.parts.find(
        (p) => p.dealershipId === dealershipId && p.sku === sku,
      );
      if (existing) {
        existing.oemNumber = row.oemNumber ?? existing.oemNumber;
        existing.name = row.name.trim();
        existing.fits = fits.length ? fits : existing.fits;
        existing.make = row.make ?? existing.make;
        existing.model = row.model ?? existing.model;
        existing.yearFrom = row.yearFrom ?? existing.yearFrom;
        existing.yearTo = row.yearTo ?? existing.yearTo;
        existing.costPrice = row.costPrice ?? existing.costPrice;
        existing.retailPrice = priced.retail;
        existing.qty = row.qty ?? existing.qty;
        existing.supplier = row.supplier ?? existing.supplier;
        existing.updatedAt = now;
        existing.source = source;
        updated += 1;
      } else {
        state.parts.push({
          id: newId("part"),
          sku,
          oemNumber: row.oemNumber,
          name: row.name.trim(),
          fits,
          make: row.make,
          model: row.model,
          yearFrom: row.yearFrom,
          yearTo: row.yearTo,
          costPrice: row.costPrice,
          retailPrice: priced.retail,
          qty: row.qty ?? 0,
          supplier: row.supplier,
          dealershipId,
          updatedAt: now,
          source,
        });
        imported += 1;
      }
    }
    save(state);
  }

  updateDealershipSettings(dealershipId, {
    parts: {
      lastImportAt: now,
      lastImportCount: imported + updated,
      pricingSource: input.source === "dms_feed" ? "dms_feed" : "csv_import",
    },
  });

  return {
    imported,
    updated,
    skipped,
    parts: await listAllParts(dealershipId),
  };
}

/** Parse dealer parts CSV — quoted commas, ; or tab, decimal commas, misspelt headers. */
export function parsePartsCsv(csv: string): PartImportRow[] {
  return mapCsvRows(csv, PARTS_CSV_FIELDS, { defaultOrder: PARTS_CSV_DEFAULT_ORDER }).map((row) => ({
    sku: row.sku || "",
    oemNumber: row.oemNumber || undefined,
    name: row.name || "",
    fits: normalizeFitment(row.fits),
    make: row.make || undefined,
    model: row.model || undefined,
    yearFrom: parseFlexibleNumber(row.yearFrom),
    yearTo: parseFlexibleNumber(row.yearTo),
    costPrice: parseFlexibleNumber(row.costPrice),
    retailPrice: parseFlexibleNumber(row.retailPrice),
    qty: parseFlexibleNumber(row.qty),
    supplier: row.supplier || undefined,
  }));
}

async function persistEnquiry(enquiry: PartsEnquiry): Promise<void> {
  if (!useDurableDb()) {
    const state = load();
    state.enquiries.unshift(enquiry);
    save(state);
    return;
  }
  const db = await requireDb();
  await db.insert(dealershipPartsEnquiries).values({
    id: enquiry.id,
    dealershipId: enquiry.dealershipId,
    buyerName: enquiry.buyerName,
    buyerPhone: enquiry.buyerPhone,
    message: enquiry.message,
    partId: enquiry.partId ?? null,
    status: enquiry.status,
    nalaReply: enquiry.nalaReply,
    holdUntil: enquiry.holdUntil ? new Date(enquiry.holdUntil) : null,
    createdAt: new Date(enquiry.createdAt),
  });
}

export async function quotePart(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
  dealershipId?: string;
}): Promise<{ enquiry: PartsEnquiry; part?: Part }> {
  const dealershipId = input.dealershipId ?? "demo-yard";
  const settings = getDealershipSettings(dealershipId);
  const name = input.buyerName.split(" ")[0] || "there";

  if (!settings.modules.parts || !settings.parts.enabled) {
    const enquiry: PartsEnquiry = {
      id: newId("penq"),
      buyerName: input.buyerName.trim(),
      buyerPhone: input.buyerPhone.trim(),
      message: input.message.trim(),
      status: "module_off",
      nalaReply: `Hi ${name} — I'm Nala. This yard uses GrayArx for vehicle sales${settings.modules.service ? " and service bookings" : ""}, but they don't run a parts counter on WhatsApp. I can help you with a car, a viewing, or a workshop booking — what do you need?`,
      createdAt: new Date().toISOString(),
      dealershipId,
    };
    await persistEnquiry(enquiry);
    return { enquiry };
  }

  const ranked = await rankParts(input.message, dealershipId);
  const top = ranked[0];
  const close =
    top &&
    ranked
      .filter((r) => r.score >= top.score * 0.7 && r.score >= 12)
      .slice(0, 3);
  const ambiguous = Boolean(close && close.length > 1 && top.score < 1000);
  const part = ambiguous ? undefined : top?.part;
  let nalaReply: string;

  if (ambiguous && close) {
    const lines = close
      .map(
        (r) =>
          `• ${r.part.name} — R${retailOf(r.part).toLocaleString("en-ZA")} (${r.part.sku}${r.part.qty > 0 ? `, ${r.part.qty} in stock` : ", backorder"})`,
      )
      .join("\n");
    nalaReply = `Hi ${name} — I'm Nala on parts. A few matches on this yard:\n${lines}\n\nReply with the SKU or a bit more (make/model + part) and I'll quote the right one.`;
  } else if (part && part.qty > 0) {
    const priceBit = settings.parts.showPriceToBuyer
      ? ` at R${retailOf(part).toLocaleString("en-ZA")}`
      : "";
    const oemBit = part.oemNumber ? ` (OEM ${part.oemNumber})` : "";
    nalaReply = `Hi ${name} — I'm Nala on parts. We have ${part.name}${oemBit}, dealer SKU ${part.sku}${priceBit} — ${part.qty} in stock. Fits: ${part.fits.join(", ") || "see counter"}. Want me to hold one for collection today, or book fitment with service?`;
  } else if (part && part.qty <= 0 && settings.parts.allowBackorderMessage) {
    nalaReply = `Hi ${name} — I'm Nala on parts. ${part.name} (SKU ${part.sku}) is temporarily out of stock. I can order it in or book a service slot once it arrives — which do you prefer?`;
  } else {
    const sample = (await listParts(dealershipId))
      .slice(0, 3)
      .map(
        (p) =>
          `• ${p.name} — R${retailOf(p).toLocaleString("en-ZA")} (${p.sku})`,
      )
      .join("\n");
    nalaReply = sample
      ? `Hi ${name} — I'm Nala on parts. I couldn't match that exactly to our catalog. Live counter stock:\n${sample}\n\nSend the car (make/model/year) + part name or OEM number and I'll quote your yard's price.`
      : `Hi ${name} — I'm Nala on parts. Our catalog for this yard is empty right now — the dealer still needs to import their SKUs and retail prices. I can take your request and the parts desk will follow up.`;
  }

  const enquiry: PartsEnquiry = {
    id: newId("penq"),
    buyerName: input.buyerName.trim(),
    buyerPhone: input.buyerPhone.trim(),
    message: input.message.trim(),
    partId: part?.id,
    status: "quoted",
    nalaReply,
    createdAt: new Date().toISOString(),
    dealershipId,
  };

  await persistEnquiry(enquiry);
  return { enquiry, part };
}

export async function holdPart(
  enquiryId: string,
  dealershipId?: string,
): Promise<PartsEnquiry | { error: string }> {
  if (useDurableDb()) {
    const db = await requireDb();
    const enqRows = await db
      .select()
      .from(dealershipPartsEnquiries)
      .where(eq(dealershipPartsEnquiries.id, enquiryId))
      .limit(1);
    const enquiryRow = enqRows[0];
    if (!enquiryRow) return { error: "Enquiry not found." };
    if (dealershipId && enquiryRow.dealershipId !== dealershipId) {
      return { error: "That hold belongs to another dealership." };
    }
    const enquiry = rowToEnquiry(enquiryRow);
    if (enquiry.status === "module_off") {
      return { error: "Parts module is off for this dealership." };
    }
    if (!enquiry.partId) return { error: "No part matched to hold." };
    const partRows = await db
      .select()
      .from(dealershipParts)
      .where(eq(dealershipParts.id, enquiry.partId))
      .limit(1);
    const partRow = partRows[0];
    if (!partRow || partRow.qty < 1) return { error: "Part out of stock." };

    await db
      .update(dealershipParts)
      .set({
        qty: sql`${dealershipParts.qty} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(dealershipParts.id, partRow.id), sql`${dealershipParts.qty} >= 1`),
      );

    const holdUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const nalaReply = `${enquiry.nalaReply}\n\nHeld until ${new Date(holdUntil).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })} — bring ID to the parts counter. SKU ${partRow.sku}.`;
    await db
      .update(dealershipPartsEnquiries)
      .set({
        status: "held",
        holdUntil: new Date(holdUntil),
        nalaReply,
      })
      .where(eq(dealershipPartsEnquiries.id, enquiry.id));
    return {
      ...enquiry,
      status: "held",
      holdUntil,
      nalaReply,
    };
  }

  const state = load();
  const enquiry = state.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { error: "Enquiry not found." };
  if (dealershipId && enquiry.dealershipId !== dealershipId) {
    return { error: "That hold belongs to another dealership." };
  }
  if (enquiry.status === "module_off") {
    return { error: "Parts module is off for this dealership." };
  }
  if (!enquiry.partId) return { error: "No part matched to hold." };
  const part = state.parts.find((p) => p.id === enquiry.partId);
  if (!part || part.qty < 1) return { error: "Part out of stock." };

  part.qty -= 1;
  part.updatedAt = new Date().toISOString();
  enquiry.status = "held";
  enquiry.holdUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  enquiry.nalaReply = `${enquiry.nalaReply}\n\nHeld until ${new Date(enquiry.holdUntil).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })} — bring ID to the parts counter. SKU ${part.sku}.`;
  save(state);
  return enquiry;
}

/**
 * Counter book-out: workshop called the client, they approved the part.
 * Decrements qty by `units` on THIS dealership only.
 */
export async function bookOutPart(input: {
  dealershipId: string;
  sku?: string;
  partId?: string;
  units?: number;
  customerName?: string;
  customerPhone?: string;
  vehicleDesc?: string;
  notes?: string;
  serviceJobId?: string;
  yardName?: string;
}): Promise<
  { part: Part; enquiry: PartsEnquiry; slip: PartsSlip } | { error: string }
> {
  const dealershipId = input.dealershipId?.trim();
  if (!dealershipId) return { error: "Dealership is required." };
  const units = Math.floor(Number(input.units ?? 1));
  if (!Number.isFinite(units) || units < 1) {
    return { error: "Book out at least 1 unit." };
  }
  const sku = input.sku?.trim();
  const partId = input.partId?.trim();
  if (!sku && !partId) return { error: "Search and pick a SKU to book out." };

  const vehicle = input.vehicleDesc?.trim();
  const customer = input.customerName?.trim() || "Workshop client";
  const note = input.notes?.trim();
  const serviceJobId = input.serviceJobId?.trim() || undefined;
  if (serviceJobId) {
    const job = await getServiceJob(serviceJobId, dealershipId);
    if (!job) {
      return { error: "That workshop job is not on this dealership." };
    }
  }

  const buildSlip = (part: Part, enquiry: PartsEnquiry): PartsSlip => ({
    yardName: input.yardName?.trim() || dealershipId,
    client: customer,
    vehicle: vehicle || "—",
    sku: part.sku,
    name: part.name,
    qty: units,
    retail: retailOf(part),
    jobRef: serviceJobId,
    createdAt: enquiry.createdAt,
  });

  if (useDurableDb()) {
    const db = await requireDb();
    const found = await db
      .select()
      .from(dealershipParts)
      .where(
        and(
          eq(dealershipParts.dealershipId, dealershipId),
          partId
            ? eq(dealershipParts.id, partId)
            : eq(dealershipParts.sku, sku!),
        ),
      )
      .limit(1);
    const row = found[0];
    if (!row) return { error: "That part is not on this dealership's catalog." };
    if (row.qty < units) {
      return { error: `Only ${row.qty} in stock — cannot book out ${units}.` };
    }

    await db
      .update(dealershipParts)
      .set({
        qty: sql`${dealershipParts.qty} - ${units}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dealershipParts.id, row.id),
          eq(dealershipParts.dealershipId, dealershipId),
          sql`${dealershipParts.qty} >= ${units}`,
        ),
      );

    const refreshed = await db
      .select()
      .from(dealershipParts)
      .where(eq(dealershipParts.id, row.id))
      .limit(1);
    const part = rowToPart(refreshed[0] ?? { ...row, qty: row.qty - units });
    const enquiry: PartsEnquiry = {
      id: newId("penq"),
      buyerName: customer,
      buyerPhone: input.customerPhone?.trim() || "counter",
      message: [
        `Manual book-out ${units}× ${row.name} (${row.sku})`,
        vehicle ? `Vehicle: ${vehicle}` : "",
        serviceJobId ? `Job: ${serviceJobId}` : "",
        note ? `Note: ${note}` : "Client approved at the counter.",
      ]
        .filter(Boolean)
        .join(" — "),
      partId: part.id,
      serviceJobId,
      status: "collected",
      nalaReply: `Booked out ${units}× ${part.name} (SKU ${part.sku}) at R${retailOf(part).toLocaleString("en-ZA")} each. ${part.qty} left on this yard.`,
      createdAt: new Date().toISOString(),
      dealershipId,
    };
    await persistEnquiry(enquiry);
    if (serviceJobId) {
      const linked = await attachPartToJob({
        dealershipId,
        serviceJobId,
        enquiryId: enquiry.id,
        partId: part.id,
        sku: part.sku,
        name: part.name,
        qty: units,
        retailPrice: retailOf(part),
      });
      if ("error" in linked) return linked;
    }
    return { part, enquiry, slip: buildSlip(part, enquiry) };
  }

  const state = load();
  const part = state.parts.find(
    (p) =>
      p.dealershipId === dealershipId &&
      (partId ? p.id === partId : p.sku === sku),
  );
  if (!part) return { error: "That part is not on this dealership's catalog." };
  if (part.qty < units) {
    return { error: `Only ${part.qty} in stock — cannot book out ${units}.` };
  }
  part.qty -= units;
  part.updatedAt = new Date().toISOString();
  const enquiry: PartsEnquiry = {
    id: newId("penq"),
    buyerName: customer,
    buyerPhone: input.customerPhone?.trim() || "counter",
    message: [
      `Manual book-out ${units}× ${part.name} (${part.sku})`,
      vehicle ? `Vehicle: ${vehicle}` : "",
      serviceJobId ? `Job: ${serviceJobId}` : "",
      note ? `Note: ${note}` : "Client approved at the counter.",
    ]
      .filter(Boolean)
      .join(" — "),
    partId: part.id,
    serviceJobId,
    status: "collected",
    nalaReply: `Booked out ${units}× ${part.name} (SKU ${part.sku}) at R${retailOf(part).toLocaleString("en-ZA")} each. ${part.qty} left on this yard.`,
    createdAt: new Date().toISOString(),
    dealershipId,
  };
  state.enquiries.unshift(enquiry);
  save(state);
  if (serviceJobId) {
    const linked = await attachPartToJob({
      dealershipId,
      serviceJobId,
      enquiryId: enquiry.id,
      partId: part.id,
      sku: part.sku,
      name: part.name,
      qty: units,
      retailPrice: retailOf(part),
    });
    if ("error" in linked) return linked;
  }
  return { part, enquiry, slip: buildSlip(part, enquiry) };
}

export async function listPartsEnquiries(
  dealershipId?: string,
): Promise<PartsEnquiry[]> {
  if (!useDurableDb()) {
    const all = load().enquiries;
    return dealershipId
      ? all.filter((e) => e.dealershipId === dealershipId)
      : all;
  }
  const db = await requireDb();
  const rows = dealershipId
    ? await db
        .select()
        .from(dealershipPartsEnquiries)
        .where(eq(dealershipPartsEnquiries.dealershipId, dealershipId))
        .orderBy(desc(dealershipPartsEnquiries.createdAt))
        .limit(100)
    : await db
        .select()
        .from(dealershipPartsEnquiries)
        .orderBy(desc(dealershipPartsEnquiries.createdAt))
        .limit(100);
  return rows.map(rowToEnquiry);
}
