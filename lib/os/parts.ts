import { newId, readJsonFile, writeJsonFile } from "@/lib/conversion/store";

export type Part = {
  id: string;
  sku: string;
  name: string;
  fits: string[];
  price: number;
  qty: number;
  dealershipId: string;
};

export type PartsEnquiry = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  message: string;
  partId?: string;
  status: "quoted" | "held" | "collected" | "lost";
  nalaReply: string;
  createdAt: string;
  holdUntil?: string;
};

type PartsState = { parts: Part[]; enquiries: PartsEnquiry[] };

const FILE = "parts.json";

const DEFAULT: PartsState = {
  parts: [
    {
      id: "part_filter_polo",
      sku: "OA-OF-POLO",
      name: "Oil filter (Polo / i20 compatible)",
      fits: ["Volkswagen Polo", "Hyundai i20"],
      price: 189,
      qty: 24,
      dealershipId: "demo-yard",
    },
    {
      id: "part_pad_hilux",
      sku: "BR-PAD-HILUX",
      name: "Front brake pads — Hilux GD-6",
      fits: ["Toyota Hilux"],
      price: 1450,
      qty: 8,
      dealershipId: "demo-yard",
    },
    {
      id: "part_battery_60",
      sku: "BAT-60AH",
      name: "60Ah maintenance-free battery",
      fits: ["Volkswagen Polo", "Hyundai i20", "Toyota Hilux"],
      price: 1899,
      qty: 5,
      dealershipId: "demo-yard",
    },
    {
      id: "part_wiper_set",
      sku: "WIP-SET-UNI",
      name: "Wiper blade set (universal 55/45cm)",
      fits: ["Most hatchbacks"],
      price: 320,
      qty: 15,
      dealershipId: "demo-yard",
    },
  ],
  enquiries: [],
};

function load(): PartsState {
  return readJsonFile(FILE, DEFAULT);
}

function save(state: PartsState) {
  writeJsonFile(FILE, state);
}

export function listParts(dealershipId = "demo-yard"): Part[] {
  return load().parts.filter((p) => p.dealershipId === dealershipId && p.qty > 0);
}

export function findPart(message: string): Part | undefined {
  const lower = message.toLowerCase();
  const parts = listParts();
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
  return parts.find((p) =>
    p.fits.some((f) => lower.includes(f.split(" ")[0]!.toLowerCase())),
  );
}

export function quotePart(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
}): { enquiry: PartsEnquiry; part?: Part } {
  const part = findPart(input.message);
  const name = input.buyerName.split(" ")[0] || "there";
  let nalaReply: string;

  if (part && part.qty > 0) {
    nalaReply = `Hi ${name} — I'm Nala on parts. We have ${part.name} (SKU ${part.sku}) at R${part.price.toLocaleString("en-ZA")} — ${part.qty} in stock. Fits: ${part.fits.join(", ")}. Want me to hold one for collection today, or book fitment with service?`;
  } else {
    const sample = listParts()
      .slice(0, 3)
      .map((p) => `• ${p.name} — R${p.price}`)
      .join("\n");
    nalaReply = `Hi ${name} — I'm Nala on parts. I couldn't match that exactly. Live counter stock:\n${sample}\n\nTell me the car + part and I'll quote from stock.`;
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
  if (!enquiry.partId) return { error: "No part matched to hold." };
  const part = state.parts.find((p) => p.id === enquiry.partId);
  if (!part || part.qty < 1) return { error: "Part out of stock." };

  part.qty -= 1;
  enquiry.status = "held";
  enquiry.holdUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  enquiry.nalaReply = `${enquiry.nalaReply}\n\nHeld until ${new Date(enquiry.holdUntil).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })} — bring ID to the parts counter.`;
  save(state);
  return enquiry;
}

export function listPartsEnquiries(): PartsEnquiry[] {
  return load().enquiries;
}
