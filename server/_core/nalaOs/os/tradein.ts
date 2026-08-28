import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";

export type TradeIn = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  make: string;
  model: string;
  year?: number;
  mileage?: number;
  condition: "excellent" | "good" | "fair" | "rough";
  notes: string;
  status: "intake" | "with_appraiser" | "valued" | "closed";
  nalaReply: string;
  createdAt: string;
  estimatedBandZar?: { low: number; high: number };
  /** Buyer WhatsApp photo attachments (data URLs or https URLs) */
  photos: Array<{ id: string; label: string; url: string; uploadedAt: string }>;
};

type TradeInState = { intakes: TradeIn[] };

const FILE = "tradeins.json";

function load(): TradeInState {
  return readJsonFile(FILE, { intakes: [] });
}

function save(state: TradeInState) {
  writeJsonFile(FILE, state);
}

function parseVehicle(message: string): {
  make: string;
  model: string;
  year?: number;
  mileage?: number;
} {
  const year = message.match(/\b(20\d{2})\b/)?.[1];
  const mileage = message.match(/\b(\d{1,3}[\s,]?\d{3})\s*km\b/i)?.[1];
  const lower = message.toLowerCase();

  let make = "Unknown";
  let model = "vehicle";
  if (/\bpolo\b/.test(lower)) {
    make = "Volkswagen";
    model = "Polo";
  } else if (/\bhilux\b/.test(lower)) {
    make = "Toyota";
    model = "Hilux";
  } else if (/\bi20\b/.test(lower)) {
    make = "Hyundai";
    model = "i20";
  } else if (/\bcorolla\b/.test(lower)) {
    make = "Toyota";
    model = "Corolla";
  } else if (/\bgolf\b/.test(lower)) {
    make = "Volkswagen";
    model = "Golf";
  }

  return {
    make,
    model,
    year: year ? Number(year) : undefined,
    mileage: mileage
      ? Number(mileage.replace(/[\s,]/g, ""))
      : undefined,
  };
}

function conditionFrom(message: string): TradeIn["condition"] {
  const lower = message.toLowerCase();
  if (/\b(excellent|mint|showroom)\b/.test(lower)) return "excellent";
  if (/\b(rough|damaged|accident|high km)\b/.test(lower)) return "rough";
  if (/\bfair\b/.test(lower)) return "fair";
  return "good";
}

function estimateBand(input: {
  year?: number;
  mileage?: number;
  condition: TradeIn["condition"];
}): { low: number; high: number } {
  const age = input.year ? Math.max(0, new Date().getFullYear() - input.year) : 6;
  let mid = Math.max(45000, 280000 - age * 22000);
  if (input.mileage && input.mileage > 120000) mid *= 0.85;
  if (input.condition === "excellent") mid *= 1.08;
  if (input.condition === "fair") mid *= 0.9;
  if (input.condition === "rough") mid *= 0.75;
  return {
    low: Math.round(mid * 0.9 / 1000) * 1000,
    high: Math.round(mid * 1.1 / 1000) * 1000,
  };
}

export function captureTradeIn(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
}): TradeIn {
  const parsed = parseVehicle(input.message);
  const condition = conditionFrom(input.message);
  const band = estimateBand({ ...parsed, condition });
  const name = input.buyerName.split(" ")[0] || "there";

  const nalaReply = `Hi ${name} — I'm Nala. Got your trade-in: ${parsed.year ?? ""} ${parsed.make} ${parsed.model}${parsed.mileage ? ` · ${parsed.mileage.toLocaleString("en-ZA")} km` : ""} (${condition}). Indicative band R${band.low.toLocaleString("en-ZA")}–R${band.high.toLocaleString("en-ZA")} pending appraisal photos. I've flagged our appraiser — WhatsApp 4 clear photos (front, rear, interior, odometer) and we'll confirm today.`;

  const intake: TradeIn = {
    id: newId("trd"),
    buyerName: input.buyerName.trim(),
    buyerPhone: input.buyerPhone.trim(),
    make: parsed.make,
    model: parsed.model,
    year: parsed.year,
    mileage: parsed.mileage,
    condition,
    notes: input.message.trim(),
    status: "with_appraiser",
    nalaReply,
    createdAt: new Date().toISOString(),
    estimatedBandZar: band,
    photos: [],
  };

  const state = load();
  state.intakes.unshift(intake);
  save(state);
  return intake;
}

export function attachTradeInPhoto(input: {
  tradeInId: string;
  label: string;
  /** data:image/...;base64,... or https URL */
  url: string;
}): TradeIn | { error: string } {
  const state = load();
  const intake = state.intakes.find((t) => t.id === input.tradeInId);
  if (!intake) return { error: "Trade-in not found." };
  if (!intake.photos) intake.photos = [];
  intake.photos.push({
    id: newId("ph"),
    label: input.label.trim() || "photo",
    url: input.url.trim(),
    uploadedAt: new Date().toISOString(),
  });
  if (intake.photos.length >= 4) {
    intake.status = "with_appraiser";
    intake.nalaReply = `${intake.nalaReply}\n\nGot ${intake.photos.length} photos — appraiser has everything to confirm the band today.`;
  }
  save(state);
  return intake;
}

export function listTradeIns(): TradeIn[] {
  return load().intakes.map((t) => ({
    ...t,
    photos: t.photos ?? [],
  }));
}
