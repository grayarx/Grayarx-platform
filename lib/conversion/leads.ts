import { newId, readJsonFile, writeJsonFile } from "@/lib/conversion/store";
import {
  findVehicle,
  formatVehicleLine,
  listAvailable,
  type Vehicle,
} from "@/lib/conversion/stock";

export type LeadSource =
  | "autotrader"
  | "cars_co_za"
  | "website"
  | "whatsapp"
  | "missed_call"
  | "manual";

export type LeadStatus =
  | "new"
  | "answered"
  | "viewing_booked"
  | "handed_off"
  | "closed"
  | "lost";

export type Lead = {
  id: string;
  dealershipId: string;
  source: LeadSource;
  buyerName: string;
  buyerPhone: string;
  message: string;
  vehicleId?: string;
  status: LeadStatus;
  createdAt: string;
  answeredAt?: string;
  bookedAt?: string;
  nalaReply?: string;
  viewingAt?: string;
  recoveredAfterHours: boolean;
};

export type Booking = {
  id: string;
  leadId: string;
  vehicleId: string;
  buyerName: string;
  buyerPhone: string;
  viewingAt: string;
  createdAt: string;
  status: "confirmed" | "cancelled" | "completed";
};

type LeadState = { leads: Lead[]; bookings: Booking[] };

const FILE = "leads.json";

function load(): LeadState {
  return readJsonFile(FILE, { leads: [], bookings: [] });
}

function save(state: LeadState) {
  writeJsonFile(FILE, state);
}

function isAfterHours(date = new Date()): boolean {
  const day = date.getDay(); // 0 Sun
  const hour = date.getHours();
  if (day === 0 || day === 6) return true;
  return hour < 8 || hour >= 17;
}

function extractVehicleHints(message: string): {
  make?: string;
  model?: string;
  stockNumber?: string;
} {
  const stockMatch = message.match(/\b(GA-\d{3,})\b/i);
  const lower = message.toLowerCase();

  if (/\bpolo\b/i.test(lower)) {
    return { stockNumber: stockMatch?.[1], make: "Volkswagen", model: "Polo" };
  }
  if (/\bhilux\b/i.test(lower)) {
    return { stockNumber: stockMatch?.[1], make: "Toyota", model: "Hilux" };
  }
  if (/\bi20\b/i.test(lower)) {
    return { stockNumber: stockMatch?.[1], make: "Hyundai", model: "i20" };
  }

  const makes = [
    "volkswagen",
    "vw",
    "toyota",
    "hyundai",
    "ford",
    "bmw",
    "mercedes",
    "audi",
    "nissan",
    "kia",
  ];
  const make = makes.find((m) => lower.includes(m));
  return {
    stockNumber: stockMatch?.[1],
    make:
      make === "vw"
        ? "Volkswagen"
        : make
          ? make[0]!.toUpperCase() + make.slice(1)
          : undefined,
  };
}

export function buildNalaReply(input: {
  buyerName: string;
  message: string;
  source: LeadSource;
  vehicle?: Vehicle;
}): string {
  const name = input.buyerName.split(" ")[0] || "there";
  const vehicle = input.vehicle;

  if (input.source === "missed_call") {
    if (vehicle) {
      return `Hi ${name} — sorry we missed your call. I'm Nala from the yard. Saw you may be interested in our ${formatVehicleLine(vehicle)}. Want me to book a 15-minute viewing for you — today or tomorrow?`;
    }
    return `Hi ${name} — sorry we missed your call. I'm Nala from the yard. I can pull our available stock and book a viewing. Which make or budget should I start with?`;
  }

  if (vehicle) {
    return `Hi ${name} — thanks for your enquiry${input.source === "autotrader" ? " via AutoTrader" : input.source === "cars_co_za" ? " via Cars.co.za" : ""}. I'm Nala. That ${formatVehicleLine(vehicle)} is still available. I can hold a viewing slot for you — would later today or tomorrow morning work?`;
  }

  const available = listAvailable().slice(0, 3);
  const lines = available.map((v) => `• ${formatVehicleLine(v)}`).join("\n");
  return `Hi ${name} — thanks for getting in touch. I'm Nala. I couldn't match one exact car from your message, but here's what's live right now:\n${lines}\n\nWhich one should I book a viewing for?`;
}

export function ingestLead(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
  source: LeadSource;
  dealershipId?: string;
  vehicleId?: string;
  createdAt?: string;
}): {
  lead: Lead;
  vehicle?: Vehicle;
  nalaReply: string;
} {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const hints = extractVehicleHints(input.message);
  const vehicle =
    (input.vehicleId
      ? findVehicle({ id: input.vehicleId })
      : findVehicle(hints)) ?? undefined;

  const nalaReply = buildNalaReply({
    buyerName: input.buyerName,
    message: input.message,
    source: input.source,
    vehicle,
  });

  const lead: Lead = {
    id: newId("lead"),
    dealershipId: input.dealershipId ?? "demo-yard",
    source: input.source,
    buyerName: input.buyerName.trim(),
    buyerPhone: input.buyerPhone.trim(),
    message: input.message.trim(),
    vehicleId: vehicle?.id,
    status: "answered",
    createdAt,
    answeredAt: createdAt,
    nalaReply,
    recoveredAfterHours: isAfterHours(new Date(createdAt)),
  };

  const state = load();
  state.leads.unshift(lead);
  save(state);

  return { lead, vehicle, nalaReply };
}

export function bookViewing(input: {
  leadId: string;
  viewingAt: string;
}): { lead: Lead; booking: Booking } | { error: string } {
  const state = load();
  const lead = state.leads.find((l) => l.id === input.leadId);
  if (!lead) return { error: "Lead not found." };
  if (!lead.vehicleId) {
    return {
      error: "No vehicle matched yet — ask the buyer which car, then book.",
    };
  }

  const viewingAt = new Date(input.viewingAt);
  if (Number.isNaN(viewingAt.getTime())) {
    return { error: "Invalid viewing time." };
  }

  const booking: Booking = {
    id: newId("book"),
    leadId: lead.id,
    vehicleId: lead.vehicleId,
    buyerName: lead.buyerName,
    buyerPhone: lead.buyerPhone,
    viewingAt: viewingAt.toISOString(),
    createdAt: new Date().toISOString(),
    status: "confirmed",
  };

  lead.status = "viewing_booked";
  lead.bookedAt = booking.createdAt;
  lead.viewingAt = booking.viewingAt;
  state.bookings.unshift(booking);
  save(state);

  return { lead, booking };
}

export function listLeads(): Lead[] {
  return load().leads;
}

export function listBookings(): Booking[] {
  return load().bookings;
}

export function getLead(id: string): Lead | undefined {
  return load().leads.find((l) => l.id === id);
}
