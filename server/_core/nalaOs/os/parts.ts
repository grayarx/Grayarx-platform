import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";
import {
  getDealershipSettings,
  updateDealershipSettings,
} from "@nalaOs/dealership/settings";

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
  status: "quoted" | "held" | "collected" | "lost" | "module_off";
  nalaReply: string;
  createdAt: string;
  holdUntil?: string;
  dealershipId: string;
};

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
  ],
  enquiries: [],
};

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

export function listParts(dealershipId = "demo-yard"): Part[] {
  return load().parts.filter(
    (p) => p.dealershipId === dealershipId && p.qty > 0,
  );
}

export function listAllParts(dealershipId = "demo-yard"): Part[] {
  return load().parts.filter((p) => p.dealershipId === dealershipId);
}

function retailOf(p: Part): number {
  return p.retailPrice;
}

export function findPart(
  message: string,
  dealershipId = "demo-yard",
): Part | undefined {
  const lower = message.toLowerCase();
  const parts = listParts(dealershipId);

  // Exact SKU / OEM in message
  const skuHit = parts.find(
    (p) =>
      lower.includes(p.sku.toLowerCase()) ||
      (p.oemNumber && lower.includes(p.oemNumber.toLowerCase())),
  );
  if (skuHit) return skuHit;

  if (/\b(brake|pads?)\b/.test(lower)) {
    return parts.find((p) => /brake/i.test(p.name));
  }
  if (/\b(oil filter|filter)\b/.test(lower)) {
    return parts.find((p) => /oil filter/i.test(p.name));
  }
  if (/\bbatter(y|ies)\b/.test(lower)) {
    return parts.find((p) => /battery/i.test(p.name));
  }
  if (/\bwiper\b/.test(lower)) {
    return parts.find((p) => /wiper/i.test(p.name));
  }

  // Fitment: message mentions make/model that part fits
  return parts.find((p) => {
    if (p.make && lower.includes(p.make.toLowerCase())) return true;
    if (p.model && lower.includes(p.model.toLowerCase())) return true;
    return p.fits.some((f) =>
      f
        .toLowerCase()
        .split(/\s+/)
        .some((token) => token.length > 2 && lower.includes(token)),
    );
  });
}

/**
 * Import dealer catalog. Pricing rules:
 * - If retailPrice provided → use it (dealer's sell price)
 * - Else if costPrice + markup settings → retail = cost * (1 + markup%)
 * - Else skip row (we never invent prices)
 */
export function importPartsCatalog(input: {
  dealershipId?: string;
  rows: PartImportRow[];
  source?: Part["source"];
}): {
  imported: number;
  updated: number;
  skipped: Array<{ sku: string; reason: string }>;
  parts: Part[];
} {
  const dealershipId = input.dealershipId ?? "demo-yard";
  const settings = getDealershipSettings(dealershipId);
  const state = load();
  let imported = 0;
  let updated = 0;
  const skipped: Array<{ sku: string; reason: string }> = [];
  const now = new Date().toISOString();

  for (const row of input.rows) {
    const sku = row.sku?.trim();
    if (!sku || !row.name?.trim()) {
      skipped.push({ sku: sku || "(blank)", reason: "Missing sku or name" });
      continue;
    }

    let retail = row.retailPrice;
    if (retail == null && row.costPrice != null) {
      retail = Math.round(
        row.costPrice * (1 + settings.parts.defaultMarkupPercent / 100),
      );
    }
    if (retail == null || retail <= 0) {
      skipped.push({
        sku,
        reason: "No retailPrice and no costPrice to markup — dealer must supply pricing",
      });
      continue;
    }

    const fits =
      row.fits
        ?.split("|")
        .map((s) => s.trim())
        .filter(Boolean) ??
      (row.make && row.model ? [`${row.make} ${row.model}`] : []);

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
      existing.retailPrice = retail;
      existing.qty = row.qty ?? existing.qty;
      existing.supplier = row.supplier ?? existing.supplier;
      existing.updatedAt = now;
      existing.source = input.source ?? "csv_import";
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
        retailPrice: retail,
        qty: row.qty ?? 0,
        supplier: row.supplier,
        dealershipId,
        updatedAt: now,
        source: input.source ?? "csv_import",
      });
      imported += 1;
    }
  }

  save(state);
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
    parts: listAllParts(dealershipId),
  };
}

/** Parse simple CSV: sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier */
export function parsePartsCsv(csv: string): PartImportRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const num = (name: string) => {
      const i = idx(name);
      if (i < 0 || !cols[i]) return undefined;
      const n = Number(cols[i]);
      return Number.isFinite(n) ? n : undefined;
    };
    const str = (name: string) => {
      const i = idx(name);
      return i >= 0 ? cols[i] || undefined : undefined;
    };
    return {
      sku: str("sku") || "",
      oemNumber: str("oemnumber") || str("oem"),
      name: str("name") || "",
      fits: str("fits"),
      make: str("make"),
      model: str("model"),
      yearFrom: num("yearfrom"),
      yearTo: num("yearto"),
      costPrice: num("costprice") ?? num("cost"),
      retailPrice: num("retailprice") ?? num("price") ?? num("retail"),
      qty: num("qty") ?? num("quantity"),
      supplier: str("supplier"),
    };
  });
}

export function quotePart(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
  dealershipId?: string;
}): { enquiry: PartsEnquiry; part?: Part } {
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
    const state = load();
    state.enquiries.unshift(enquiry);
    save(state);
    return { enquiry };
  }

  const part = findPart(input.message, dealershipId);
  let nalaReply: string;

  if (part && part.qty > 0) {
    const priceBit = settings.parts.showPriceToBuyer
      ? ` at R${retailOf(part).toLocaleString("en-ZA")}`
      : "";
    const oemBit = part.oemNumber ? ` (OEM ${part.oemNumber})` : "";
    nalaReply = `Hi ${name} — I'm Nala on parts. We have ${part.name}${oemBit}, dealer SKU ${part.sku}${priceBit} — ${part.qty} in stock. Fits: ${part.fits.join(", ") || "see counter"}. Want me to hold one for collection today, or book fitment with service?`;
  } else if (part && part.qty <= 0 && settings.parts.allowBackorderMessage) {
    nalaReply = `Hi ${name} — I'm Nala on parts. ${part.name} (SKU ${part.sku}) is temporarily out of stock. I can order it in or book a service slot once it arrives — which do you prefer?`;
  } else {
    const sample = listParts(dealershipId)
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

  const state = load();
  state.enquiries.unshift(enquiry);
  save(state);
  return { enquiry, part };
}

export function holdPart(enquiryId: string): PartsEnquiry | { error: string } {
  const state = load();
  const enquiry = state.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { error: "Enquiry not found." };
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

export function listPartsEnquiries(dealershipId?: string): PartsEnquiry[] {
  const all = load().enquiries;
  return dealershipId
    ? all.filter((e) => e.dealershipId === dealershipId)
    : all;
}
