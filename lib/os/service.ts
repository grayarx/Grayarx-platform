import { newId, readJsonFile, writeJsonFile } from "@/lib/conversion/store";

export type ServiceType =
  | "minor_service"
  | "major_service"
  | "brakes"
  | "diagnostics"
  | "other";

export type ServiceBooking = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  vehicleDesc: string;
  serviceType: ServiceType;
  scheduledAt: string;
  status: "booked" | "in_progress" | "done" | "cancelled";
  nalaReply: string;
  createdAt: string;
  notes?: string;
};

type ServiceState = { bookings: ServiceBooking[] };

const FILE = "service.json";

function load(): ServiceState {
  return readJsonFile(FILE, { bookings: [] });
}

function save(state: ServiceState) {
  writeJsonFile(FILE, state);
}

function detectServiceType(message: string): ServiceType {
  const lower = message.toLowerCase();
  if (/\bbrake/.test(lower)) return "brakes";
  if (/\b(major|60.?000|90.?000)\b/.test(lower)) return "major_service";
  if (/\b(diag|check engine|warning light)\b/.test(lower)) return "diagnostics";
  if (/\b(service|oil|minor|15.?000|30.?000)\b/.test(lower)) return "minor_service";
  return "other";
}

function label(type: ServiceType): string {
  switch (type) {
    case "minor_service":
      return "minor service";
    case "major_service":
      return "major service";
    case "brakes":
      return "brake inspection / job";
    case "diagnostics":
      return "diagnostics";
    default:
      return "workshop appointment";
  }
}

function defaultSlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + (d.getDay() === 5 ? 3 : d.getDay() === 6 ? 2 : 1));
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function bookService(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
  vehicleDesc?: string;
  scheduledAt?: string;
}): ServiceBooking {
  const serviceType = detectServiceType(input.message);
  const scheduledAt = input.scheduledAt ?? defaultSlot();
  const name = input.buyerName.split(" ")[0] || "there";
  const vehicleDesc =
    input.vehicleDesc ??
    (input.message.match(/\b(polo|hilux|i20|corolla|ranger|golf)\b/i)?.[0] ??
      "your vehicle");

  const nalaReply = `Hi ${name} — I'm Nala on service. I've booked a ${label(serviceType)} for your ${vehicleDesc} on ${new Date(scheduledAt).toLocaleString("en-ZA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. Drop keys at reception; we'll WhatsApp status updates. Need a different slot?`;

  const booking: ServiceBooking = {
    id: newId("svc"),
    buyerName: input.buyerName.trim(),
    buyerPhone: input.buyerPhone.trim(),
    vehicleDesc,
    serviceType,
    scheduledAt,
    status: "booked",
    nalaReply,
    createdAt: new Date().toISOString(),
    notes: input.message.trim(),
  };

  const state = load();
  state.bookings.unshift(booking);
  save(state);
  return booking;
}

export function listServiceBookings(): ServiceBooking[] {
  return load().bookings;
}
