import { and, desc, eq } from "drizzle-orm";
import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";
import { getDb } from "../../../db";
import {
  dealershipJobParts,
  dealershipServiceJobs,
  type DealershipJobPart,
  type DealershipServiceJob,
} from "../../../../drizzle/schema";

export type ServiceType =
  | "minor_service"
  | "major_service"
  | "brakes"
  | "diagnostics"
  | "other";

export type ServiceJobStatus = "booked" | "in_progress" | "done" | "cancelled";
export type ServiceJobSource = "nala" | "counter";

export type ServiceBooking = {
  id: string;
  dealershipId: string;
  buyerName: string;
  buyerPhone: string;
  vehicleDesc: string;
  serviceType: ServiceType;
  scheduledAt: string;
  status: ServiceJobStatus;
  source: ServiceJobSource;
  nalaReply: string;
  createdAt: string;
  notes?: string;
};

export type JobPartLink = {
  id: string;
  dealershipId: string;
  serviceJobId: string;
  enquiryId?: string;
  partId: string;
  sku: string;
  name: string;
  qty: number;
  retailPrice: number;
  createdAt: string;
};

type ServiceState = { bookings: ServiceBooking[]; jobParts: JobPartLink[] };

const FILE = "service.json";

const DEFAULT: ServiceState = { bookings: [], jobParts: [] };

/** Vitest + OS smoke stay on JSON. Production uses MySQL. */
function useDurableDb(): boolean {
  if (process.env.VITEST) return false;
  if (process.env.NALA_OS_SMOKE === "1") return false;
  return Boolean(process.env.DATABASE_URL);
}

function load(): ServiceState {
  const raw = readJsonFile(FILE, DEFAULT) as Partial<ServiceState> & {
    bookings?: Array<ServiceBooking & { dealershipId?: string; source?: ServiceJobSource }>;
  };
  const bookings = (raw.bookings ?? []).map((b) => ({
    ...b,
    dealershipId: b.dealershipId || "demo-yard",
    source: b.source || "nala",
  }));
  return { bookings, jobParts: raw.jobParts ?? [] };
}

function save(state: ServiceState) {
  writeJsonFile(FILE, state);
}

function asIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Workshop diary database is unavailable. Jobs are not written to disk — try again shortly.",
    );
  }
  return db;
}

function rowToBooking(row: DealershipServiceJob): ServiceBooking {
  return {
    id: row.id,
    dealershipId: row.dealershipId,
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    vehicleDesc: row.vehicleDesc,
    serviceType: row.serviceType as ServiceType,
    scheduledAt: asIso(row.scheduledAt),
    status: row.status as ServiceJobStatus,
    source: (row.source as ServiceJobSource) || "nala",
    nalaReply: row.nalaReply,
    createdAt: asIso(row.createdAt),
    notes: row.notes ?? undefined,
  };
}

function rowToJobPart(row: DealershipJobPart): JobPartLink {
  return {
    id: row.id,
    dealershipId: row.dealershipId,
    serviceJobId: row.serviceJobId,
    enquiryId: row.enquiryId ?? undefined,
    partId: row.partId,
    sku: row.sku,
    name: row.name,
    qty: row.qty,
    retailPrice: Number(row.retailPrice),
    createdAt: asIso(row.createdAt),
  };
}

export function detectServiceType(message: string): ServiceType {
  const lower = message.toLowerCase();
  if (/\bbrake/.test(lower)) return "brakes";
  if (/\b(major|60.?000|90.?000)\b/.test(lower)) return "major_service";
  if (/\b(diag|check engine|warning light)\b/.test(lower)) return "diagnostics";
  if (/\b(service|oil|minor|15.?000|30.?000)\b/.test(lower)) return "minor_service";
  return "other";
}

export function labelServiceType(type: ServiceType): string {
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

function buildNalaReply(input: {
  buyerName: string;
  vehicleDesc: string;
  serviceType: ServiceType;
  scheduledAt: string;
}): string {
  const name = input.buyerName.split(" ")[0] || "there";
  return `Hi ${name} — I'm Nala on service. I've booked a ${labelServiceType(input.serviceType)} for your ${input.vehicleDesc} on ${new Date(input.scheduledAt).toLocaleString("en-ZA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. Drop keys at reception; we'll WhatsApp status updates. Need a different slot?`;
}

async function persistJob(booking: ServiceBooking): Promise<void> {
  if (!useDurableDb()) {
    const state = load();
    const idx = state.bookings.findIndex((b) => b.id === booking.id);
    if (idx >= 0) state.bookings[idx] = booking;
    else state.bookings.unshift(booking);
    save(state);
    return;
  }
  const db = await requireDb();
  const existing = await db
    .select({ id: dealershipServiceJobs.id })
    .from(dealershipServiceJobs)
    .where(eq(dealershipServiceJobs.id, booking.id))
    .limit(1);
  const values = {
    dealershipId: booking.dealershipId,
    buyerName: booking.buyerName,
    buyerPhone: booking.buyerPhone,
    vehicleDesc: booking.vehicleDesc,
    serviceType: booking.serviceType,
    scheduledAt: new Date(booking.scheduledAt),
    status: booking.status,
    source: booking.source,
    nalaReply: booking.nalaReply,
    notes: booking.notes ?? null,
    updatedAt: new Date(),
  };
  if (existing[0]) {
    await db
      .update(dealershipServiceJobs)
      .set(values)
      .where(eq(dealershipServiceJobs.id, booking.id));
    return;
  }
  await db.insert(dealershipServiceJobs).values({
    id: booking.id,
    ...values,
    createdAt: new Date(booking.createdAt),
  });
}

export async function bookService(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
  vehicleDesc?: string;
  scheduledAt?: string;
  dealershipId?: string;
  source?: ServiceJobSource;
  serviceType?: ServiceType;
}): Promise<ServiceBooking> {
  const dealershipId = input.dealershipId?.trim() || "demo-yard";
  const serviceType = input.serviceType ?? detectServiceType(input.message);
  const scheduledAt = input.scheduledAt ?? defaultSlot();
  const vehicleDesc =
    input.vehicleDesc?.trim() ||
    (input.message.match(/\b(polo|hilux|i20|corolla|ranger|golf)\b/i)?.[0] ??
      "your vehicle");

  const booking: ServiceBooking = {
    id: newId("svc"),
    dealershipId,
    buyerName: input.buyerName.trim(),
    buyerPhone: input.buyerPhone.trim() || "counter",
    vehicleDesc,
    serviceType,
    scheduledAt,
    status: "booked",
    source: input.source ?? "nala",
    nalaReply: buildNalaReply({
      buyerName: input.buyerName,
      vehicleDesc,
      serviceType,
      scheduledAt,
    }),
    createdAt: new Date().toISOString(),
    notes: input.message.trim() || undefined,
  };

  await persistJob(booking);
  return booking;
}

/** Counter creates a job: “Hilux in for cooling — waiting on client.” */
export async function createServiceJob(input: {
  dealershipId: string;
  buyerName: string;
  buyerPhone?: string;
  vehicleDesc: string;
  serviceType?: ServiceType;
  scheduledAt?: string;
  notes?: string;
}): Promise<ServiceBooking | { error: string }> {
  const dealershipId = input.dealershipId?.trim();
  if (!dealershipId) return { error: "Dealership is required." };
  const buyerName = input.buyerName.trim();
  const vehicleDesc = input.vehicleDesc.trim();
  if (!buyerName) return { error: "Client name is required." };
  if (!vehicleDesc) return { error: "Vehicle is required." };
  return bookService({
    dealershipId,
    buyerName,
    buyerPhone: input.buyerPhone?.trim() || "counter",
    message: input.notes?.trim() || `${vehicleDesc} — workshop job`,
    vehicleDesc,
    scheduledAt: input.scheduledAt,
    serviceType: input.serviceType,
    source: "counter",
  });
}

export async function listServiceBookings(
  dealershipId?: string,
): Promise<ServiceBooking[]> {
  if (!useDurableDb()) {
    const all = load().bookings;
    return dealershipId
      ? all.filter((b) => b.dealershipId === dealershipId)
      : all;
  }
  const db = await requireDb();
  const rows = dealershipId
    ? await db
        .select()
        .from(dealershipServiceJobs)
        .where(eq(dealershipServiceJobs.dealershipId, dealershipId))
        .orderBy(desc(dealershipServiceJobs.scheduledAt))
        .limit(200)
    : await db
        .select()
        .from(dealershipServiceJobs)
        .orderBy(desc(dealershipServiceJobs.scheduledAt))
        .limit(200);
  return rows.map(rowToBooking);
}

export async function listOpenServiceJobs(
  dealershipId: string,
): Promise<ServiceBooking[]> {
  const all = await listServiceBookings(dealershipId);
  return all.filter((b) => b.status === "booked" || b.status === "in_progress");
}

export async function getServiceJob(
  jobId: string,
  dealershipId: string,
): Promise<ServiceBooking | null> {
  if (!jobId || !dealershipId) return null;
  if (!useDurableDb()) {
    return (
      load().bookings.find(
        (b) => b.id === jobId && b.dealershipId === dealershipId,
      ) ?? null
    );
  }
  const db = await requireDb();
  const rows = await db
    .select()
    .from(dealershipServiceJobs)
    .where(
      and(
        eq(dealershipServiceJobs.id, jobId),
        eq(dealershipServiceJobs.dealershipId, dealershipId),
      ),
    )
    .limit(1);
  return rows[0] ? rowToBooking(rows[0]) : null;
}

/** Calendar view: bookings grouped by local date YYYY-MM-DD */
export async function getServiceCalendar(
  daysAhead = 14,
  dealershipId?: string,
): Promise<Array<{ date: string; slots: ServiceBooking[] }>> {
  const bookings = (await listServiceBookings(dealershipId)).filter(
    (b) => b.status === "booked" || b.status === "in_progress",
  );
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days: Array<{ date: string; slots: ServiceBooking[] }> = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      slots: bookings.filter((b) => b.scheduledAt.slice(0, 10) === key),
    });
  }
  return days;
}

export async function rescheduleService(
  bookingId: string,
  scheduledAt: string,
  dealershipId?: string,
): Promise<ServiceBooking | { error: string }> {
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) return { error: "Invalid time." };

  if (!useDurableDb()) {
    const state = load();
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return { error: "Booking not found." };
    if (dealershipId && booking.dealershipId !== dealershipId) {
      return { error: "That job belongs to another dealership." };
    }
    booking.scheduledAt = when.toISOString();
    booking.nalaReply = `${booking.nalaReply}\n\nRescheduled to ${when.toLocaleString("en-ZA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.`;
    save(state);
    return booking;
  }

  const db = await requireDb();
  const rows = await db
    .select()
    .from(dealershipServiceJobs)
    .where(eq(dealershipServiceJobs.id, bookingId))
    .limit(1);
  const row = rows[0];
  if (!row) return { error: "Booking not found." };
  if (dealershipId && row.dealershipId !== dealershipId) {
    return { error: "That job belongs to another dealership." };
  }
  const booking = rowToBooking(row);
  booking.scheduledAt = when.toISOString();
  booking.nalaReply = `${booking.nalaReply}\n\nRescheduled to ${when.toLocaleString("en-ZA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.`;
  await persistJob(booking);
  return booking;
}

export async function listJobParts(
  serviceJobId: string,
  dealershipId: string,
): Promise<JobPartLink[]> {
  if (!useDurableDb()) {
    return load().jobParts.filter(
      (p) => p.serviceJobId === serviceJobId && p.dealershipId === dealershipId,
    );
  }
  const db = await requireDb();
  const rows = await db
    .select()
    .from(dealershipJobParts)
    .where(
      and(
        eq(dealershipJobParts.serviceJobId, serviceJobId),
        eq(dealershipJobParts.dealershipId, dealershipId),
      ),
    )
    .orderBy(desc(dealershipJobParts.createdAt));
  return rows.map(rowToJobPart);
}

export async function listJobPartsForYard(
  dealershipId: string,
): Promise<JobPartLink[]> {
  if (!useDurableDb()) {
    return load().jobParts.filter((p) => p.dealershipId === dealershipId);
  }
  const db = await requireDb();
  const rows = await db
    .select()
    .from(dealershipJobParts)
    .where(eq(dealershipJobParts.dealershipId, dealershipId))
    .orderBy(desc(dealershipJobParts.createdAt))
    .limit(200);
  return rows.map(rowToJobPart);
}

export async function attachPartToJob(input: {
  dealershipId: string;
  serviceJobId: string;
  enquiryId?: string;
  partId: string;
  sku: string;
  name: string;
  qty: number;
  retailPrice: number;
}): Promise<JobPartLink | { error: string }> {
  const job = await getServiceJob(input.serviceJobId, input.dealershipId);
  if (!job) {
    return { error: "That workshop job is not on this dealership." };
  }
  const link: JobPartLink = {
    id: newId("jpart"),
    dealershipId: input.dealershipId,
    serviceJobId: input.serviceJobId,
    enquiryId: input.enquiryId,
    partId: input.partId,
    sku: input.sku,
    name: input.name,
    qty: input.qty,
    retailPrice: input.retailPrice,
    createdAt: new Date().toISOString(),
  };
  if (!useDurableDb()) {
    const state = load();
    state.jobParts.unshift(link);
    save(state);
    return link;
  }
  const db = await requireDb();
  await db.insert(dealershipJobParts).values({
    id: link.id,
    dealershipId: link.dealershipId,
    serviceJobId: link.serviceJobId,
    enquiryId: link.enquiryId ?? null,
    partId: link.partId,
    sku: link.sku,
    name: link.name,
    qty: link.qty,
    retailPrice: String(link.retailPrice),
    createdAt: new Date(link.createdAt),
  });
  return link;
}
