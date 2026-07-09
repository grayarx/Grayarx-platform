import { eq, desc, sql, gte, lte, and, count, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser,
  users,
  leads,
  bookings,
  vehicles,
  vehiclePhotos,
  conversations,
  prospects,
  agentActivity,
  invoices,
  payments,
  vatReconciliation,
  dealerships,
  onboardingSubmissions,
  upgradeRoadmap,
  fallbackMessages,
  preApprovals,
  testDriveBookings,
  type TestDriveBooking,
  approvalQueue,
  kagisoProposedPatches,
  tradeInQuotes,
  tradeInInvites,
  marketGuideLive,
  marketGuideRefreshMeta,
  type KagisoProposedPatch,
  type InsertKagisoProposedPatch,
  popiaConsentSignatures,
  whatsappConversations,
  whatsappMessages,
  whatsappQueue,
  whatsappWebhooks,
  type WhatsappConversation,
  type InsertWhatsappConversation,
  type WhatsappMessage,
  type InsertWhatsappMessage,
  type WhatsappQueueItem,
  type InsertWhatsappQueueItem,
  type WhatsappWebhook,
  type InsertWhatsappWebhook,
  InsertLead,
  InsertBooking,
  InsertVehicle,
  InsertConversation,
  InsertProspect,
  InsertAgentActivity,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const pool = mysql.createPool({
        host: url.hostname,
        port: Number(url.port) || 4000,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 10,
      });
      _db = drizzle(pool) as unknown as ReturnType<typeof drizzle>;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

// === Leads ===
export async function createLead(data: InsertLead): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data);
  // @ts-expect-error Drizzle MySQL returns insertId on result[0]
  return Number(result?.[0]?.insertId ?? result?.insertId ?? 0);
}

export async function listLeads(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
}

export async function updateLeadStatus(
  id: number,
  status: "new" | "contacted" | "qualified" | "converted" | "lost",
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

// === Bookings ===
export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(bookings).values(data);
}

export async function listBookings(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(limit);
}

export async function updateBookingStatus(
  id: number,
  status: "pending" | "confirmed" | "completed" | "cancelled",
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
}

// === Vehicles ===
export async function createVehicle(data: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(vehicles).values(data);
  return result;
}

export async function listVehicles(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt)).limit(limit);
}

export async function getVehicle(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateVehicle(id: number, data: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Drop the photo metadata rows too — the underlying S3 objects become
  // unreferenced and effectively gone (storage layer doesn't expose deletes).
  await db.delete(vehiclePhotos).where(eq(vehiclePhotos.vehicleId, id));
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

// === Vehicle photos ===
export async function listVehiclePhotos(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(vehiclePhotos)
    .where(eq(vehiclePhotos.vehicleId, vehicleId))
    .orderBy(vehiclePhotos.position, vehiclePhotos.id);
}

export async function addVehiclePhoto(input: {
  vehicleId: number;
  url: string;
  storageKey: string;
  position?: number;
  caption?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(vehiclePhotos).values({
    vehicleId: input.vehicleId,
    url: input.url,
    storageKey: input.storageKey,
    position: input.position ?? 0,
    caption: input.caption ?? null,
  });
  return { id: res?.insertId ?? 0 };
}

export async function deleteVehiclePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehiclePhotos).where(eq(vehiclePhotos.id, id));
}

export async function setVehiclePrimaryPhoto(vehicleId: number, photoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(vehicles)
    .set({ primaryPhotoUrl: photoUrl })
    .where(eq(vehicles.id, vehicleId));
}

// === Conversations ===
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(conversations).values(data);
}

// === Prospects ===
export async function createProspect(data: InsertProspect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(prospects).values(data);
}

export async function createProspects(data: InsertProspect[]) {
  if (data.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(prospects).values(data);
}

export async function listProspects(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prospects).orderBy(desc(prospects.score), desc(prospects.createdAt)).limit(limit);
}

export async function updateProspectStatus(
  id: number,
  status: "new" | "scouted" | "queued_for_call" | "called" | "contacted" | "converted" | "rejected",
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(prospects).set({ status }).where(eq(prospects.id, id));
}

export async function deleteProspect(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(prospects).where(eq(prospects.id, id));
}

// === Aggregates / KPIs ===
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalLeads: 0,
      newLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      totalVehicles: 0,
      availableVehicles: 0,
      reservedVehicles: 0,
      soldVehicles: 0,
      leadsLast7Days: 0,
      bookingsLast7Days: 0,
      totalProspects: 0,
      queuedProspects: 0,
    };
  }

  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totals] = await db
    .select({
      totalLeads: sql<number>`COUNT(*)`,
      newLeads: sql<number>`SUM(CASE WHEN ${leads.status} = 'new' THEN 1 ELSE 0 END)`,
      qualifiedLeads: sql<number>`SUM(CASE WHEN ${leads.status} = 'qualified' THEN 1 ELSE 0 END)`,
      convertedLeads: sql<number>`SUM(CASE WHEN ${leads.status} = 'converted' THEN 1 ELSE 0 END)`,
    })
    .from(leads);

  const [bookingTotals] = await db
    .select({
      totalBookings: sql<number>`COUNT(*)`,
      pendingBookings: sql<number>`SUM(CASE WHEN ${bookings.status} = 'pending' THEN 1 ELSE 0 END)`,
      confirmedBookings: sql<number>`SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END)`,
    })
    .from(bookings);

  const [vehicleTotals] = await db
    .select({
      totalVehicles: sql<number>`COUNT(*)`,
      availableVehicles: sql<number>`SUM(CASE WHEN ${vehicles.status} = 'available' THEN 1 ELSE 0 END)`,
      reservedVehicles: sql<number>`SUM(CASE WHEN ${vehicles.status} = 'reserved' THEN 1 ELSE 0 END)`,
      soldVehicles: sql<number>`SUM(CASE WHEN ${vehicles.status} = 'sold' THEN 1 ELSE 0 END)`,
    })
    .from(vehicles);

  const [prospectTotals] = await db
    .select({
      totalProspects: sql<number>`COUNT(*)`,
      queuedProspects: sql<number>`SUM(CASE WHEN ${prospects.status} = 'queued_for_call' THEN 1 ELSE 0 END)`,
    })
    .from(prospects);

  const [last7] = await db
    .select({ leadsLast7Days: sql<number>`COUNT(*)` })
    .from(leads)
    .where(gte(leads.createdAt, since7));

  const [bookings7] = await db
    .select({ bookingsLast7Days: sql<number>`COUNT(*)` })
    .from(bookings)
    .where(gte(bookings.createdAt, since7));

  return {
    totalLeads: Number(totals?.totalLeads ?? 0),
    newLeads: Number(totals?.newLeads ?? 0),
    qualifiedLeads: Number(totals?.qualifiedLeads ?? 0),
    convertedLeads: Number(totals?.convertedLeads ?? 0),
    totalBookings: Number(bookingTotals?.totalBookings ?? 0),
    pendingBookings: Number(bookingTotals?.pendingBookings ?? 0),
    confirmedBookings: Number(bookingTotals?.confirmedBookings ?? 0),
    totalVehicles: Number(vehicleTotals?.totalVehicles ?? 0),
    availableVehicles: Number(vehicleTotals?.availableVehicles ?? 0),
    reservedVehicles: Number(vehicleTotals?.reservedVehicles ?? 0),
    soldVehicles: Number(vehicleTotals?.soldVehicles ?? 0),
    leadsLast7Days: Number(last7?.leadsLast7Days ?? 0),
    bookingsLast7Days: Number(bookings7?.bookingsLast7Days ?? 0),
    totalProspects: Number(prospectTotals?.totalProspects ?? 0),
    queuedProspects: Number(prospectTotals?.queuedProspects ?? 0),
  };
}

export async function getRecentActivity(limit = 8) {
  const db = await getDb();
  if (!db) return [];

  const recentLeads = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  const recentBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(limit);
  const recentProspects = await db.select().from(prospects).orderBy(desc(prospects.createdAt)).limit(limit);

  type Activity = {
    type: "lead" | "booking" | "prospect";
    id: number;
    title: string;
    subtitle: string;
    createdAt: Date;
  };

  const merged: Activity[] = [
    ...recentLeads.map((l) => ({
      type: "lead" as const,
      id: l.id,
      title: `New lead — ${l.dealershipName}`,
      subtitle: `${l.contactName} · ${l.email}`,
      createdAt: l.createdAt,
    })),
    ...recentBookings.map((b) => ({
      type: "booking" as const,
      id: b.id,
      title: `Demo booked — ${b.dealershipName}`,
      subtitle: `${b.contactName} · ${b.preferredDate} ${b.preferredTime}`,
      createdAt: b.createdAt,
    })),
    ...recentProspects.map((p) => ({
      type: "prospect" as const,
      id: p.id,
      title: `Prospect scouted — ${p.dealershipName}`,
      subtitle: `${p.city ?? p.region ?? "South Africa"} · score ${p.score}`,
      createdAt: p.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);

  return merged;
}

export async function getLeadsTrend(days = 14) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // TiDB / strict MySQL with only_full_group_by is fussy about matching the
  // exact AST node between SELECT and GROUP BY. Drizzle's `select({...}, sql)`
  // helper sometimes emits two slightly different fragments. Issue the raw
  // query verbatim so the parser sees identical text on both sides.
  try {
    const result: any = await db.execute(
      sql`SELECT DATE(\`createdAt\`) AS \`day\`, COUNT(*) AS \`count\`
          FROM \`leads\`
          WHERE \`createdAt\` >= ${since}
          GROUP BY DATE(\`createdAt\`)
          ORDER BY DATE(\`createdAt\`)`,
    );
    // mysql2/drizzle returns [rows, fields] for raw execute; normalise.
    const rows: Array<{ day: unknown; count: unknown }> = Array.isArray(result)
      ? Array.isArray(result[0])
        ? (result[0] as Array<{ day: unknown; count: unknown }>)
        : (result as Array<{ day: unknown; count: unknown }>)
      : [];
    return rows.map((r) => ({
      day:
        r.day instanceof Date
          ? r.day.toISOString().slice(0, 10)
          : String(r.day),
      count: Number(r.count),
    }));
  } catch (err) {
    console.error("[getLeadsTrend] query failed, returning empty trend", err);
    return [];
  }
}

// === Prospect lookups ===
export async function getProspect(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  return result[0];
}

// === Call attempts ===
import { callAttempts, InsertCallAttempt } from "../drizzle/schema";

export async function createCallAttempt(data: InsertCallAttempt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(callAttempts).values(data);
  return result;
}

export async function updateCallAttempt(id: number, data: Partial<InsertCallAttempt>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(callAttempts).set(data).where(eq(callAttempts.id, id));
}

export async function listCallAttempts(prospectId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (prospectId !== undefined) {
    return db
      .select()
      .from(callAttempts)
      .where(eq(callAttempts.prospectId, prospectId))
      .orderBy(desc(callAttempts.createdAt))
      .limit(limit);
  }
  return db.select().from(callAttempts).orderBy(desc(callAttempts.createdAt)).limit(limit);
}

// === Prospects scheduler helpers ===
export async function getProspectsSchedule() {
  // Returns the single-row schedule config (using sourceNotes / a settings table not yet present).
  // For now, we treat the most-recent prospect's region as "last scouted region" — simple rotation.
  const db = await getDb();
  if (!db) return undefined;
  const recent = await db.select().from(prospects).orderBy(desc(prospects.createdAt)).limit(1);
  return { lastRegion: recent[0]?.region ?? null };
}


// === Agent activity helpers ===

export type AgentId = "email" | "calling" | "booking" | "prospector" | "improvement" | "whatsapp" | "accountant" | "fallback" | "preapproval" | "tradein";

/**
 * Append a row to the shared agent activity log.
 * All four agents (email, calling, booking, prospector) write to this single feed
 * so they can read each other's work.
 */
export async function logAgentActivity(input: {
  agentId: AgentId;
  action: string;
  subjectType?: string | null;
  subjectId?: number | null;
  summary: string;
  payload?: unknown;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const row: InsertAgentActivity = {
    agentId: input.agentId,
    action: input.action,
    subjectType: input.subjectType ?? null,
    subjectId: input.subjectId ?? null,
    summary: input.summary,
    payload: input.payload ? JSON.stringify(input.payload) : null,
  };
  try {
    await db.insert(agentActivity).values(row);
  } catch (err) {
    console.warn("[agent_activity] failed to log:", err);
  }
}

/**
 * Read the unified agent activity feed (newest first).
 * Optionally filter by agent.
 */
export async function listAgentActivity(opts?: {
  agentId?: AgentId;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts?.limit ?? 100;
  const q = opts?.agentId
    ? db.select().from(agentActivity).where(eq(agentActivity.agentId, opts.agentId))
    : db.select().from(agentActivity);
  const rows = await q.orderBy(desc(agentActivity.createdAt)).limit(limit);
  return rows;
}

/**
 * Per-agent stats: total actions and last action timestamp.
 */
export async function getAgentStats() {
  const db = await getDb();
  if (!db) {
    return {
      email: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      calling: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      booking: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      prospector: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      improvement: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      whatsapp: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      accountant: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      fallback: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      preapproval: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
      tradein: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    };
  }
  const rows = await db
    .select({
      agentId: agentActivity.agentId,
      count: sql<number>`count(*)`.as("count"),
      lastAt: sql<Date | null>`max(${agentActivity.createdAt})`.as("lastAt"),
    })
    .from(agentActivity)
    .groupBy(agentActivity.agentId);

  const result = {
    email: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    calling: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    booking: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    prospector: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    improvement: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    whatsapp: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    accountant: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    fallback: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    preapproval: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
    tradein: { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null },
  };
  for (const row of rows) {
    const key = row.agentId as AgentId;
    if (key in result) {
      result[key].actionCount = Number(row.count) || 0;
      result[key].lastActionAt = row.lastAt;
    }
  }

  // Fetch the latest action summary for each agent.
  const latest = await db
    .select()
    .from(agentActivity)
    .orderBy(desc(agentActivity.createdAt))
    .limit(50);
  for (const a of latest) {
    const key = a.agentId as AgentId;
    if (result[key] && !result[key].lastAction) {
      result[key].lastAction = a.summary;
    }
  }
  return result;
}


// ---------------------------------------------------------------------------
// Dealerships admin + Dealer Network helpers
// ---------------------------------------------------------------------------

/** Owner-only: list every dealer signed up to the platform with quick stats. */
export async function listDealerships() {
  const db = await getDb();
  if (!db) return [] as Array<{
    id: number;
    name: string | null;
    email: string | null;
    role: "admin" | "user";
    createdAt: Date;
    lastSignedIn: Date;
    vehicleCount: number;
    leadCount: number;
  }>;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // We don't currently link vehicles/leads to a specific dealer's user_id
  // (single-tenant for v1). Surface platform-wide counts as a quick signal.
  const [vehiclesCount, leadsCount] = await Promise.all([
    db.select({ c: count() }).from(vehicles),
    db.select({ c: count() }).from(leads),
  ]);

  return rows.map((r) => ({
    ...r,
    vehicleCount: Number(vehiclesCount[0]?.c ?? 0),
    leadCount: Number(leadsCount[0]?.c ?? 0),
  }));
}

/** Public-ish: vehicle photos only, for peer Dealer Network gallery. */
export async function listDealerNetworkPhotos(limit = 60) {
  const db = await getDb();
  if (!db) return [] as Array<{ id: number; imageUrl: string; createdAt: Date }>;
  const rows = await db
    .select({
      id: vehicles.id,
      imageUrl: vehicles.imageUrl,
      createdAt: vehicles.createdAt,
    })
    .from(vehicles)
    .orderBy(desc(vehicles.createdAt))
    .limit(limit);
  return rows.filter((r) => !!r.imageUrl) as Array<{ id: number; imageUrl: string; createdAt: Date }>;
}

// ---------------------------------------------------------------------------
// Improvement actions (Kagiso) + WhatsApp drafts (Nala)
// ---------------------------------------------------------------------------

import {
  improvementActions,
  whatsappDrafts,
  type InsertImprovementAction,
  type ImprovementAction,
  type InsertWhatsappDraft,
  type WhatsappDraft,
} from "../drizzle/schema";

export async function createImprovementAction(
  data: InsertImprovementAction,
): Promise<ImprovementAction | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(improvementActions).values(data);
  const [row] = await db
    .select()
    .from(improvementActions)
    .orderBy(desc(improvementActions.id))
    .limit(1);
  return row;
}

export async function listImprovementActions(opts?: {
  status?: "open" | "pending_approval" | "applied" | "dismissed";
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [] as ImprovementAction[];
  const limit = opts?.limit ?? 100;
  const q = opts?.status
    ? db
        .select()
        .from(improvementActions)
        .where(eq(improvementActions.status, opts.status))
    : db.select().from(improvementActions);
  return q.orderBy(desc(improvementActions.createdAt)).limit(limit);
}

export async function getImprovementAction(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db
    .select()
    .from(improvementActions)
    .where(eq(improvementActions.id, id))
    .limit(1);
  return row;
}

export async function updateImprovementActionStatus(
  id: number,
  status: "open" | "pending_approval" | "applied" | "dismissed",
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(improvementActions)
    .set({
      status,
      appliedAt: status === "applied" ? new Date() : null,
    })
    .where(eq(improvementActions.id, id));
}

export async function createWhatsappDraft(
  data: InsertWhatsappDraft,
): Promise<WhatsappDraft | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(whatsappDrafts).values(data);
  const [row] = await db
    .select()
    .from(whatsappDrafts)
    .orderBy(desc(whatsappDrafts.id))
    .limit(1);
  return row;
}

export async function listWhatsappDrafts(opts?: { limit?: number }) {
  const db = await getDb();
  if (!db) return [] as WhatsappDraft[];
  return db
    .select()
    .from(whatsappDrafts)
    .orderBy(desc(whatsappDrafts.createdAt))
    .limit(opts?.limit ?? 100);
}

export async function updateWhatsappDraftStatus(
  id: number,
  status: "draft" | "approved" | "sent" | "dismissed",
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(whatsappDrafts)
    .set({ status })
    .where(eq(whatsappDrafts.id, id));
}

/** Find a vehicle by its CSV-imported externalRef (stock/VIN/registration). Used to dedupe imports. */
export async function findVehicleByExternalRef(ref: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.externalRef, ref))
    .limit(1);
  return row;
}

/** Count vehicles with suspiciously low prices (e.g. R1 from bad CSV import). */
export async function countSuspiciousPriceVehicles(maxPrice = 1) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ c: count() })
    .from(vehicles)
    .where(lte(vehicles.price, String(maxPrice)));
  return Number(row?.c ?? 0);
}

export async function findVehicleByMakeModelYear(
  make: string,
  model: string,
  year: number,
) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.make, make),
        eq(vehicles.model, model),
        eq(vehicles.year, year),
      ),
    )
    .limit(1);
  return row;
}

export async function findVehicleByTitle(title: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.title, title.trim()))
    .limit(1);
  return row;
}

// ---------------------------------------------------------------------------
// Kagiso settings \u2014 persisted toggles that auto-applied improvement actions
// flip. Stored as JSON in a single-row table so we don't have to migrate
// every time Kagiso learns a new lever.
// ---------------------------------------------------------------------------

import { kagisoSettings, type KagisoSettings } from "../drizzle/schema";

const DEFAULT_KAGISO_SETTINGS = {
  emailFirstTouchSlaSeconds: 60,
  emailAutoMarkContacted: false,
  callingWindowStart: "08:00",
  callingWindowEnd: "17:00",
  prospectorEnabled: true,
  prospectorCron: "0 0 3 * * *",
  languageHomepagePromo: false,
} as const;

export type KagisoSettingsShape = typeof DEFAULT_KAGISO_SETTINGS;

export async function getKagisoSettings(): Promise<KagisoSettingsShape> {
  const db = await getDb();
  if (!db) return { ...DEFAULT_KAGISO_SETTINGS };
  const [row] = await db.select().from(kagisoSettings).limit(1);
  if (!row) return { ...DEFAULT_KAGISO_SETTINGS };
  try {
    const parsed = JSON.parse(row.settingsJson) as Partial<KagisoSettingsShape>;
    return { ...DEFAULT_KAGISO_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_KAGISO_SETTINGS };
  }
}

export async function patchKagisoSettings(
  patch: Partial<KagisoSettingsShape>,
): Promise<KagisoSettingsShape> {
  const db = await getDb();
  if (!db) return { ...DEFAULT_KAGISO_SETTINGS, ...patch };
  const current = await getKagisoSettings();
  const next = { ...current, ...patch };
  const [existing] = await db.select().from(kagisoSettings).limit(1);
  const json = JSON.stringify(next);
  if (existing) {
    await db
      .update(kagisoSettings)
      .set({ settingsJson: json })
      .where(eq(kagisoSettings.id, existing.id));
  } else {
    await db.insert(kagisoSettings).values({ settingsJson: json });
  }
  return next;
}


// ---- Thandi — Accountant Agent ----

export async function createInvoice(data: {
  dealershipId: number;
  leadId: number;
  invoiceNumber: string;
  dueDate: Date;
  vehicleId: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  pdfUrl?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const result = await db.insert(invoices).values({
    dealershipId: data.dealershipId,
    leadId: data.leadId,
    invoiceNumber: data.invoiceNumber,
    dueDate: data.dueDate,
    vehicleId: data.vehicleId,
    subtotal: data.subtotal.toString() as any,
    vatAmount: data.vatAmount.toString() as any,
    totalAmount: data.totalAmount.toString() as any,
    pdfUrl: data.pdfUrl,
    status: "draft",
  });

  return (result as any).insertId || 0;
}

export async function listInvoices(
  dealershipId: number,
  status?: string,
  limit = 50,
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const whereClause = status
    ? and(eq(invoices.dealershipId, dealershipId), eq(invoices.status, status as any))
    : eq(invoices.dealershipId, dealershipId);

  return db.select().from(invoices).where(whereClause).limit(limit).orderBy(desc(invoices.createdAt));
}

export async function getInvoice(invoiceId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const [row] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  return row || null;
}

export async function updateInvoiceStatus(invoiceId: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(invoices).set({ status: status as any }).where(eq(invoices.id, invoiceId));
}

export async function createPayment(data: {
  invoiceId: number;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const result = await db.insert(payments).values({
    invoiceId: data.invoiceId,
    amount: data.amount.toString() as any,
    paymentDate: data.paymentDate,
    paymentMethod: data.paymentMethod as any,
    reference: data.reference,
  });

  return (result as any).insertId || 0;
}

export async function listPayments(invoiceId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
}

export async function createVatReconciliation(data: {
  dealershipId: number;
  periodStart: Date;
  periodEnd: Date;
  totalInvoices: number;
  totalVatCollected: number;
  vatDueDate: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const flagged = data.totalVatCollected > 50000 ? 1 : 0;

  const result = await db.insert(vatReconciliation).values({
    dealershipId: data.dealershipId,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    totalInvoices: data.totalInvoices,
    totalVatCollected: data.totalVatCollected.toString() as any,
    vatDueDate: data.vatDueDate,
    flagged,
    status: "pending",
  });

  return (result as any).insertId || 0;
}

export async function getVatReconciliation(
  dealershipId: number,
  periodStart: Date,
  periodEnd: Date,
): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const [row] = await db
    .select()
    .from(vatReconciliation)
    .where(
      and(
        eq(vatReconciliation.dealershipId, dealershipId),
        gte(vatReconciliation.periodStart, periodStart),
        lte(vatReconciliation.periodEnd, periodEnd),
      ),
    );

  return row || null;
}


// ---------- Founder restructure: DB helpers ----------

// Onboarding submissions
export async function createOnboardingSubmission(input: {
  dealershipName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  region?: string | null;
  monthlyVolume?: number | null;
  languages?: string[] | null;
  vehicleTypes?: string[] | null;
  csvUrl?: string | null;
  notes?: string | null;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result: any = await db.insert(onboardingSubmissions).values({
    dealershipName: input.dealershipName,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    ownerPhone: input.ownerPhone,
    region: input.region ?? null,
    monthlyVolume: input.monthlyVolume ?? null,
    languages: input.languages ?? null,
    vehicleTypes: input.vehicleTypes ?? null,
    csvUrl: input.csvUrl ?? null,
    notes: input.notes ?? null,
    status: "new",
  });
  return { id: result[0]?.insertId ?? 0 };
}

export async function listOnboardingSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingSubmissions).orderBy(desc(onboardingSubmissions.createdAt));
}

export async function updateOnboardingStatus(
  id: number,
  status: "new" | "reviewing" | "approved" | "rejected" | "provisioned",
  reviewerId?: number,
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(onboardingSubmissions)
    .set({ status, reviewedBy: reviewerId ?? null, reviewedAt: new Date() })
    .where(eq(onboardingSubmissions.id, id));
}

// Approval queue
export async function createApproval(input: {
  dealershipId: number;
  agentId: string;
  actionType:
    | "send_email"
    | "send_whatsapp"
    | "make_call"
    | "send_invoice"
    | "send_reminder"
    | "create_booking"
    | "update_lead"
    | "high_value_invoice"
    | "other";
  riskLevel?: "low" | "medium" | "high";
  summary: string;
  payloadJson?: any;
  subjectType?: string;
  subjectId?: number;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result: any = await db.insert(approvalQueue).values({
    dealershipId: input.dealershipId,
    agentId: input.agentId,
    actionType: input.actionType,
    riskLevel: input.riskLevel ?? "medium",
    summary: input.summary,
    payloadJson: input.payloadJson ?? null,
    subjectType: input.subjectType ?? null,
    subjectId: input.subjectId ?? null,
    status: "pending",
  });
  return { id: result[0]?.insertId ?? 0 };
}

export async function listPendingApprovals() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(approvalQueue)
    .where(eq(approvalQueue.status, "pending"))
    .orderBy(desc(approvalQueue.createdAt));
}

export async function decideApproval(
  id: number,
  decision: "approved" | "rejected",
  reviewerId?: number,
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(approvalQueue)
    .set({ status: decision, decidedAt: new Date(), decidedBy: reviewerId ?? null })
    .where(eq(approvalQueue.id, id));
}

// Fallback messages — note: schema has no "status", we treat resolvedAt IS NULL as awaiting callback
export async function createFallbackMessage(input: {
  referenceNumber: string;
  dealershipId: number;
  leadId?: number | null;
  customerName?: string | null;
  customerContact?: string | null;
  channel: "email" | "whatsapp" | "call" | "web_chat";
  inboundMessage?: string | null;
  outboundReply: string;
  language?: string;
}): Promise<{ id: number; reference: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result: any = await db.insert(fallbackMessages).values({
    referenceNumber: input.referenceNumber,
    dealershipId: input.dealershipId,
    leadId: input.leadId ?? null,
    customerName: input.customerName ?? null,
    customerContact: input.customerContact ?? null,
    channel: input.channel,
    inboundMessage: input.inboundMessage ?? null,
    outboundReply: input.outboundReply,
    language: input.language ?? "en",
  });
  return { id: result[0]?.insertId ?? 0, reference: input.referenceNumber };
}

export async function listFallbackMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fallbackMessages).orderBy(desc(fallbackMessages.createdAt));
}

export async function resolveFallbackMessage(id: number, reviewerId?: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(fallbackMessages)
    .set({ resolvedAt: new Date(), resolvedBy: reviewerId ?? null })
    .where(eq(fallbackMessages.id, id));
}

// === Pre-approval (Naledi) helpers ===

export async function insertPreApproval(input: {
  dealershipId: number;
  vehicleId?: number | null;
  referenceNumber: string;
  fullName: string;
  idNumberMasked?: string | null;
  email: string;
  phone: string;
  employmentStatus?:
    | "permanent"
    | "contract"
    | "self_employed"
    | "pensioner"
    | "unemployed"
    | null;
  employer?: string | null;
  monthsEmployed?: number | null;
  grossMonthlyIncome?: number | null;
  netMonthlyIncome?: number | null;
  totalMonthlyExpenses?: number | null;
  existingDebtMonthly?: number | null;
  vehiclePrice?: number | null;
  desiredDeposit?: number | null;
  desiredTermMonths?: number | null;
  hasTradeIn?: boolean;
  tradeInDescription?: string | null;
  notes?: string | null;
  agentReply: string;
  language?: string;
}): Promise<{ id: number; reference: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const decimal = (n: number | null | undefined) =>
    n == null ? null : String(n);
  const result: any = await db.insert(preApprovals).values({
    dealershipId: input.dealershipId,
    vehicleId: input.vehicleId ?? null,
    referenceNumber: input.referenceNumber,
    fullName: input.fullName,
    idNumberMasked: input.idNumberMasked ?? null,
    email: input.email,
    phone: input.phone,
    employmentStatus: input.employmentStatus ?? null,
    employer: input.employer ?? null,
    monthsEmployed: input.monthsEmployed ?? null,
    grossMonthlyIncome: decimal(input.grossMonthlyIncome) as any,
    netMonthlyIncome: decimal(input.netMonthlyIncome) as any,
    totalMonthlyExpenses: decimal(input.totalMonthlyExpenses) as any,
    existingDebtMonthly: decimal(input.existingDebtMonthly) as any,
    vehiclePrice: decimal(input.vehiclePrice) as any,
    desiredDeposit: decimal(input.desiredDeposit) as any,
    desiredTermMonths: input.desiredTermMonths ?? null,
    hasTradeIn: input.hasTradeIn ? 1 : 0,
    tradeInDescription: input.tradeInDescription ?? null,
    notes: input.notes ?? null,
    agentReply: input.agentReply,
    language: input.language ?? "en",
  });
  return { id: result[0]?.insertId ?? 0, reference: input.referenceNumber };
}

export async function listPreApprovals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(preApprovals).orderBy(desc(preApprovals.createdAt));
}

export async function getPreApproval(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(preApprovals).where(eq(preApprovals.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function decidePreApproval(input: {
  id: number;
  decision: "approved" | "declined" | "more_info";
  note?: string | null;
  reviewerId?: number | null;
}) {
  const db = await getDb();
  if (!db) return;
  const newStatus =
    input.decision === "approved"
      ? "approved"
      : input.decision === "declined"
        ? "declined"
        : "more_info_needed";
  await db
    .update(preApprovals)
    .set({
      humanDecision: input.decision,
      humanNote: input.note ?? null,
      decidedBy: input.reviewerId ?? null,
      decidedAt: new Date(),
      status: newStatus as any,
    })
    .where(eq(preApprovals.id, input.id));
}

// Upgrade roadmap
export async function createRoadmapItem(input: {
  title: string;
  description: string;
  category:
    | "new_agent"
    | "agent_improvement"
    | "integration"
    | "ui_ux"
    | "performance"
    | "security"
    | "compliance"
    | "billing"
    | "other";
  priority?: "critical" | "high" | "medium" | "low";
  creditCostEstimate: number;
  roiEstimateZar?: number | null;
  evidenceJson?: any;
  source?: string;
  dealershipScope?: string;
  hash?: string;
  // v23+ Kagiso methodical audit fields
  auditSection?: string;
  severity?: "info" | "low" | "medium" | "high" | "critical";
  agentAutonomous?: boolean;
  humanRequired?: boolean;
  rationale?: string;
  llmTokensEstimate?: number;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result: any = await db.insert(upgradeRoadmap).values({
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority ?? "medium",
    creditCostEstimate: input.creditCostEstimate,
    roiEstimateZar: input.roiEstimateZar ?? null,
    evidenceJson: input.evidenceJson ?? null,
    source: input.source ?? "kagiso_audit",
    dealershipScope: input.dealershipScope ?? "platform",
    hash: input.hash ?? null,
    status: "pending",
    auditSection: input.auditSection ?? null,
    severity: input.severity ?? "medium",
    agentAutonomous: input.agentAutonomous ? 1 : 0,
    humanRequired: input.humanRequired ? 1 : 0,
    rationale: input.rationale ?? null,
    llmTokensEstimate: input.llmTokensEstimate ?? null,
  });
  return { id: result[0]?.insertId ?? 0 };
}

/**
 * Cheap dedupe: skip insert if an open finding with this hash already exists.
 */
export async function findRoadmapByHash(hash: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(upgradeRoadmap)
    .where(eq(upgradeRoadmap.hash, hash))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Tiny snapshot the Kagiso full audit reads to score findings. Counting only;
 * never returns PII. Safe for both founder and admin roles.
 */
export async function getKagisoSnapshot() {
  const db = await getDb();
  if (!db) {
    return {
      dealerships: 0,
      vehicles: 0,
      vehiclesWithoutPhoto: 0,
      vehiclesWithoutVin: 0,
      leads: 0,
      leadsLast30d: 0,
      preApprovals: 0,
      preApprovalsPending: 0,
      fallbackUnresolved: 0,
      brandKitIncomplete: 0,
    };
  }
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const allDealerships = await db.select().from(dealerships);
  const allVehicles = await db.select().from(vehicles);
  const allLeads = await db.select().from(leads);
  const recentLeads = allLeads.filter(
    (l) => l.createdAt && new Date(l.createdAt as any).getTime() >= since30.getTime(),
  );
  const allPreApprovals = await db.select().from(preApprovals);
  const allFallback = await db.select().from(fallbackMessages);

  const brandKitIncomplete = allDealerships.filter((d) => {
    return (
      !d.brandLogoUrl ||
      !d.brandAccentColor ||
      !d.brandSignature ||
      d.brandSignature.length < 20
    );
  }).length;

  return {
    dealerships: allDealerships.length,
    vehicles: allVehicles.length,
    vehiclesWithoutPhoto: allVehicles.filter((v) => !v.primaryPhotoUrl).length,
    vehiclesWithoutVin: allVehicles.filter((v) => !v.vin).length,
    leads: allLeads.length,
    leadsLast30d: recentLeads.length,
    preApprovals: allPreApprovals.length,
    preApprovalsPending: allPreApprovals.filter(
      (p) => p.status === "submitted" || p.status === "in_review" || p.status === "more_info_needed",
    ).length,
    fallbackUnresolved: allFallback.filter((f) => !f.resolvedAt).length,
    brandKitIncomplete,
  };
}

export type KagisoSnapshot = Awaited<ReturnType<typeof getKagisoSnapshot>>;

export async function listRoadmap() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upgradeRoadmap).orderBy(desc(upgradeRoadmap.createdAt));
}

export async function decideRoadmapItem(
  id: number,
  decision: "approved_for_build" | "dismissed" | "in_progress" | "completed",
) {
  const db = await getDb();
  if (!db) return;
  await db.update(upgradeRoadmap).set({ status: decision }).where(eq(upgradeRoadmap.id, id));
}

// Dealerships (admin-side)
export async function listAllDealerships() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(dealerships).orderBy(desc(dealerships.createdAt));
  // Per-dealership counts deferred until leads/vehicles get a dealershipId column
  return rows.map((d) => ({ ...d, leadsCount: 0, vehiclesCount: 0 }));
}

export async function createDealership(input: {
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  region?: string | null;
  monthlyVolume?: number | null;
  languages?: string[] | null;
  vehicleTypes?: string[] | null;
  plan?: "starter" | "professional" | "enterprise";
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result: any = await db.insert(dealerships).values({
    name: input.name,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    region: input.region ?? null,
    monthlyVolume: input.monthlyVolume ?? null,
    languages: input.languages ?? null,
    vehicleTypes: input.vehicleTypes ?? null,
    plan: input.plan ?? "starter",
    status: "onboarding",
  });
  return { id: result[0]?.insertId ?? 0 };
}

export async function getDealershipById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(dealerships).where(eq(dealerships.id, id));
  return row ?? null;
}

/**
 * Look up a dealership by its public shortcode (used by webhook URLs and
 * contact forms so external systems can reach the Fallback agent without
 * authenticating). Returns null if no dealership matches.
 */
export async function getDealershipByShortcode(shortcode: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.publicShortcode, shortcode));
  return row ?? null;
}

/** Set or replace a dealership's public shortcode. */
export async function setDealershipShortcode(id: number, shortcode: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(dealerships)
    .set({ publicShortcode: shortcode })
    .where(eq(dealerships.id, id));
}

export async function updateDealershipBrand(
  id: number,
  patch: {
    brandLogoUrl?: string | null;
    brandAccentColor?: string | null;
    brandSignature?: string | null;
    vatNumber?: string | null;
    bankDetails?: string | null;
    businessHoursJson?: unknown | null;
  },
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const set: Record<string, unknown> = {
    brandLogoUrl: patch.brandLogoUrl ?? null,
    brandAccentColor: patch.brandAccentColor ?? null,
    brandSignature: patch.brandSignature ?? null,
    vatNumber: patch.vatNumber ?? null,
    bankDetails: patch.bankDetails ?? null,
  };
  // Only touch businessHoursJson when explicitly supplied so callers that
  // don't know about hours don't accidentally null out an override.
  if (Object.prototype.hasOwnProperty.call(patch, "businessHoursJson")) {
    set.businessHoursJson = patch.businessHoursJson ?? null;
  }
  await db.update(dealerships).set(set).where(eq(dealerships.id, id));
}

// Admin KPIs
export async function getAdminOverview() {
  const db = await getDb();
  if (!db)
    return {
      dealershipsCount: 0,
      pendingOnboarding: 0,
      pendingApprovals: 0,
      pendingFallback: 0,
      pendingRoadmap: 0,
    };
  const [dealershipsCountRow] = await db.select({ c: sql<number>`count(*)` }).from(dealerships);
  const [pendingOnboardingRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(onboardingSubmissions)
    .where(eq(onboardingSubmissions.status, "new"));
  const [pendingApprovalsRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(approvalQueue)
    .where(eq(approvalQueue.status, "pending"));
  const [pendingFallbackRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(fallbackMessages)
    .where(sql`${fallbackMessages.resolvedAt} IS NULL`);
  const [pendingRoadmapRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(upgradeRoadmap)
    .where(eq(upgradeRoadmap.status, "pending"));
  return {
    dealershipsCount: Number(dealershipsCountRow?.c ?? 0),
    pendingOnboarding: Number(pendingOnboardingRow?.c ?? 0),
    pendingApprovals: Number(pendingApprovalsRow?.c ?? 0),
    pendingFallback: Number(pendingFallbackRow?.c ?? 0),
    pendingRoadmap: Number(pendingRoadmapRow?.c ?? 0),
  };
}


// ---------------------------------------------------------------------------
// Test drive bookings — Lerato (Booking Agent)
//
// Lerato never confirms slots autonomously. createTestDriveBooking persists a
// `requested` row + her suggested next-in-hours slot; humans (or the dealer
// admin page) confirm/reschedule/cancel via updateTestDriveBookingStatus.
// ---------------------------------------------------------------------------
export async function createTestDriveBooking(input: {
  dealershipId: number;
  vehicleId?: number | null;
  referenceNumber: string;
  customerName: string;
  customerContact: string;
  inboundMessage?: string | null;
  outboundReply: string;
  requestedSlotStart?: Date | null;
  requestedSlotEnd?: Date | null;
  suggestedSlotStart?: Date | null;
  suggestedSlotEnd?: Date | null;
  channel: "website" | "whatsapp" | "call" | "web_chat";
  language?: string | null;
  notes?: string | null;
}): Promise<TestDriveBooking> {
  const db = await getDb();
  if (!db) {
    // Tests / no-DB sandboxes: return a synthetic row that mirrors the insert.
    return {
      id: 0,
      dealershipId: input.dealershipId,
      vehicleId: input.vehicleId ?? null,
      referenceNumber: input.referenceNumber,
      customerName: input.customerName,
      customerContact: input.customerContact,
      inboundMessage: input.inboundMessage ?? null,
      outboundReply: input.outboundReply,
      requestedSlotStart: input.requestedSlotStart ?? null,
      requestedSlotEnd: input.requestedSlotEnd ?? null,
      suggestedSlotStart: input.suggestedSlotStart ?? null,
      suggestedSlotEnd: input.suggestedSlotEnd ?? null,
      confirmedSlotStart: null,
      confirmedSlotEnd: null,
      channel: input.channel,
      language: input.language ?? "en",
      status: "requested",
      notes: input.notes ?? null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TestDriveBooking;
  }
  await db.insert(testDriveBookings).values({
    dealershipId: input.dealershipId,
    vehicleId: input.vehicleId ?? null,
    referenceNumber: input.referenceNumber,
    customerName: input.customerName,
    customerContact: input.customerContact,
    inboundMessage: input.inboundMessage ?? null,
    outboundReply: input.outboundReply,
    requestedSlotStart: input.requestedSlotStart ?? null,
    requestedSlotEnd: input.requestedSlotEnd ?? null,
    suggestedSlotStart: input.suggestedSlotStart ?? null,
    suggestedSlotEnd: input.suggestedSlotEnd ?? null,
    channel: input.channel,
    language: input.language ?? "en",
    notes: input.notes ?? null,
  });
  const [row] = await db
    .select()
    .from(testDriveBookings)
    .where(eq(testDriveBookings.referenceNumber, input.referenceNumber))
    .limit(1);
  return row as TestDriveBooking;
}

export async function listTestDriveBookings(
  dealershipId?: number,
  status?: TestDriveBooking["status"],
  limit = 200,
): Promise<TestDriveBooking[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [] as ReturnType<typeof eq>[];
  if (dealershipId != null) conds.push(eq(testDriveBookings.dealershipId, dealershipId));
  if (status) conds.push(eq(testDriveBookings.status, status));
  let q = db.select().from(testDriveBookings).$dynamic();
  if (conds.length === 1) q = q.where(conds[0]);
  else if (conds.length > 1) q = q.where(and(...conds));
  return (await q.orderBy(desc(testDriveBookings.createdAt)).limit(limit)) as TestDriveBooking[];
}

export async function getTestDriveBooking(id: number): Promise<TestDriveBooking | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(testDriveBookings)
    .where(eq(testDriveBookings.id, id))
    .limit(1);
  return (row as TestDriveBooking) ?? null;
}

export async function updateTestDriveBookingStatus(
  id: number,
  patch: {
    status?: TestDriveBooking["status"];
    confirmedSlotStart?: Date | null;
    confirmedSlotEnd?: Date | null;
    notes?: string | null;
    resolvedBy?: number | null;
    resolvedAt?: Date | null;
  },
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const set: Record<string, unknown> = {};
  if (patch.status) set.status = patch.status;
  if (Object.prototype.hasOwnProperty.call(patch, "confirmedSlotStart"))
    set.confirmedSlotStart = patch.confirmedSlotStart ?? null;
  if (Object.prototype.hasOwnProperty.call(patch, "confirmedSlotEnd"))
    set.confirmedSlotEnd = patch.confirmedSlotEnd ?? null;
  if (Object.prototype.hasOwnProperty.call(patch, "notes")) set.notes = patch.notes ?? null;
  if (Object.prototype.hasOwnProperty.call(patch, "resolvedBy"))
    set.resolvedBy = patch.resolvedBy ?? null;
  if (Object.prototype.hasOwnProperty.call(patch, "resolvedAt"))
    set.resolvedAt = patch.resolvedAt ?? null;
  if (Object.keys(set).length === 0) return;
  await db.update(testDriveBookings).set(set).where(eq(testDriveBookings.id, id));
}


/**
 * Returns the timestamp of the most-recent finding written by the Kagiso
 * autonomous full audit. Used by the in-app autonomous trigger
 * (`server/_core/autonomousAudit.ts`) to decide whether the next audit window
 * has elapsed without depending on the external Heartbeat scheduler.
 *
 * Returns `null` if no audit has ever run.
 */
export async function getLastKagisoAuditRunAt(): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ createdAt: upgradeRoadmap.createdAt })
    .from(upgradeRoadmap)
    .where(eq(upgradeRoadmap.source, "kagiso_full_audit"))
    .orderBy(desc(upgradeRoadmap.createdAt))
    .limit(1);
  return rows[0]?.createdAt ?? null;
}



/**
 * List the id+hash of every roadmap item that came from a kagiso_full_audit
 * run AND is still in an actionable status (pending or approved_for_build).
 * Used by the autonomous audit to decide which prior findings are now stale.
 */
export async function listOpenAuditFindings(): Promise<
  { id: number; hash: string | null }[]
> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ id: upgradeRoadmap.id, hash: upgradeRoadmap.hash })
    .from(upgradeRoadmap)
    .where(
      and(
        eq(upgradeRoadmap.source, "kagiso_full_audit"),
        inArray(upgradeRoadmap.status, ["pending", "approved_for_build"]),
      ),
    );
  return rows;
}

/**
 * Mark the given roadmap rows as `auto_resolved` because Kagiso no longer
 * detects the underlying condition. Returns the number of rows updated.
 */
export async function autoResolveStaleAuditFindings(
  ids: number[],
): Promise<number> {
  if (!ids.length) return 0;
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .update(upgradeRoadmap)
    .set({ status: "auto_resolved" as const })
    .where(inArray(upgradeRoadmap.id, ids));
  // mysql2 driver returns affectedRows under [0].affectedRows; fall back to ids.length.
  // drizzle's mysql update returns { affectedRows } via metadata in some setups.
  // We trust the count we passed in since we built the id list from the same DB.
  return Array.isArray(result) ? ids.length : (result as any)?.affectedRows ?? ids.length;
}


/**
 * Return the start/end (utc-ms) windows of every still-active booking for the
 * given dealership (and optional vehicle) that ends in the future. Used by
 * Lerato's slot suggester to avoid double-booking the same car.
 *
 * "Still active" = status in (`requested`,`confirmed`,`rescheduled`).
 */
export async function listFutureBookingWindows(
  dealershipId: number,
  vehicleId?: number | null,
): Promise<{ startMs: number; endMs: number }[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [
    eq(testDriveBookings.dealershipId, dealershipId),
    inArray(testDriveBookings.status, ["requested", "confirmed", "rescheduled"]),
  ];
  if (vehicleId != null) {
    conds.push(eq(testDriveBookings.vehicleId, vehicleId));
  }
  const rows = await db
    .select({
      requestedStart: testDriveBookings.requestedSlotStart,
      requestedEnd: testDriveBookings.requestedSlotEnd,
      suggestedStart: testDriveBookings.suggestedSlotStart,
      suggestedEnd: testDriveBookings.suggestedSlotEnd,
    })
    .from(testDriveBookings)
    .where(and(...conds))
    .limit(500);
  const now = Date.now();
  const out: { startMs: number; endMs: number }[] = [];
  for (const r of rows) {
    // Prefer suggested (= what Lerato actually pencilled-in). Fall back to
    // requested when suggested is missing.
    const start =
      (r.suggestedStart instanceof Date ? r.suggestedStart : r.requestedStart) ??
      null;
    const end =
      (r.suggestedEnd instanceof Date ? r.suggestedEnd : r.requestedEnd) ??
      null;
    if (!start || !end) continue;
    const s = start instanceof Date ? start.getTime() : new Date(start).getTime();
    const e = end instanceof Date ? end.getTime() : new Date(end).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue;
    if (e <= now) continue; // past, can't conflict
    out.push({ startMs: s, endMs: e });
  }
  return out;
}


/**
 * Platform-wide operational snapshot for the founder ops dashboard.
 *
 * Returns small integer counts and the most recent timestamps across the
 * platform. Designed to be cheap (a handful of `count(*)` queries) so it
 * can be polled from /admin/ops every few seconds without straining the
 * database.
 */
export type PlatformOpsSnapshot = {
  signupsToday: number;
  signupsLast7d: number;
  totalUsers: number;
  totalDealerships: number;
  activeDealerships: number;
  leadsToday: number;
  leadsLast7d: number;
  totalLeads: number;
  bookingsToday: number;
  totalBookings: number;
  testDrivesToday: number;
  testDrivesPending: number;
  testDrivesConfirmed: number;
  totalTestDrives: number;
  vehiclesAvailable: number;
  vehiclesTotal: number;
  prospectsTotal: number;
  prospectsLast7d: number;
  upgradeRoadmapOpen: number;
  upgradeRoadmapAutoResolved: number;
  lastAuditRunAt: number | null;
  lastTestDriveAt: number | null;
  lastLeadAt: number | null;
  generatedAt: number;
};

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function nDaysAgoMs(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

export async function getPlatformOpsSnapshot(): Promise<PlatformOpsSnapshot> {
  const db = await getDb();
  const empty: PlatformOpsSnapshot = {
    signupsToday: 0,
    signupsLast7d: 0,
    totalUsers: 0,
    totalDealerships: 0,
    activeDealerships: 0,
    leadsToday: 0,
    leadsLast7d: 0,
    totalLeads: 0,
    bookingsToday: 0,
    totalBookings: 0,
    testDrivesToday: 0,
    testDrivesPending: 0,
    testDrivesConfirmed: 0,
    totalTestDrives: 0,
    vehiclesAvailable: 0,
    vehiclesTotal: 0,
    prospectsTotal: 0,
    prospectsLast7d: 0,
    upgradeRoadmapOpen: 0,
    upgradeRoadmapAutoResolved: 0,
    lastAuditRunAt: null,
    lastTestDriveAt: null,
    lastLeadAt: null,
    generatedAt: Date.now(),
  };
  if (!db) return empty;
  const today = new Date(startOfTodayMs());
  const last7 = new Date(nDaysAgoMs(7));

  try {
    const [
      signupsTodayRow,
      signupsLast7dRow,
      totalUsersRow,
      totalDealershipsRow,
      activeDealershipsRow,
      leadsTodayRow,
      leadsLast7dRow,
      totalLeadsRow,
      bookingsTodayRow,
      totalBookingsRow,
      testDrivesTodayRow,
      testDrivesPendingRow,
      testDrivesConfirmedRow,
      totalTestDrivesRow,
      vehiclesAvailableRow,
      vehiclesTotalRow,
      prospectsTotalRow,
      prospectsLast7dRow,
      roadmapOpenRow,
      roadmapAutoResolvedRow,
      lastAuditRow,
      lastTestDriveRow,
      lastLeadRow,
    ] = await Promise.all([
      db.select({ c: count() }).from(users).where(gte(users.createdAt, today)),
      db.select({ c: count() }).from(users).where(gte(users.createdAt, last7)),
      db.select({ c: count() }).from(users),
      db.select({ c: count() }).from(dealerships),
      db
        .select({ c: count() })
        .from(dealerships)
        .where(eq(dealerships.status, "active")),
      db.select({ c: count() }).from(leads).where(gte(leads.createdAt, today)),
      db.select({ c: count() }).from(leads).where(gte(leads.createdAt, last7)),
      db.select({ c: count() }).from(leads),
      db
        .select({ c: count() })
        .from(bookings)
        .where(gte(bookings.createdAt, today)),
      db.select({ c: count() }).from(bookings),
      db
        .select({ c: count() })
        .from(testDriveBookings)
        .where(gte(testDriveBookings.createdAt, today)),
      db
        .select({ c: count() })
        .from(testDriveBookings)
        .where(eq(testDriveBookings.status, "requested")),
      db
        .select({ c: count() })
        .from(testDriveBookings)
        .where(eq(testDriveBookings.status, "confirmed")),
      db.select({ c: count() }).from(testDriveBookings),
      db
        .select({ c: count() })
        .from(vehicles)
        .where(eq(vehicles.status, "available")),
      db.select({ c: count() }).from(vehicles),
      db.select({ c: count() }).from(prospects),
      db
        .select({ c: count() })
        .from(prospects)
        .where(gte(prospects.createdAt, last7)),
      db
        .select({ c: count() })
        .from(upgradeRoadmap)
        .where(
          inArray(upgradeRoadmap.status, ["pending", "in_progress", "approved_for_build"]),
        ),
      db
        .select({ c: count() })
        .from(upgradeRoadmap)
        .where(eq(upgradeRoadmap.status, "auto_resolved")),
      db
        .select({ ts: upgradeRoadmap.createdAt })
        .from(upgradeRoadmap)
        .where(eq(upgradeRoadmap.source, "kagiso_full_audit"))
        .orderBy(desc(upgradeRoadmap.createdAt))
        .limit(1),
      db
        .select({ ts: testDriveBookings.createdAt })
        .from(testDriveBookings)
        .orderBy(desc(testDriveBookings.createdAt))
        .limit(1),
      db
        .select({ ts: leads.createdAt })
        .from(leads)
        .orderBy(desc(leads.createdAt))
        .limit(1),
    ]);

    const tsToMs = (v: unknown): number | null =>
      v instanceof Date ? v.getTime() : v ? new Date(v as string).getTime() : null;

    return {
      ...empty,
      signupsToday: Number(signupsTodayRow[0]?.c ?? 0),
      signupsLast7d: Number(signupsLast7dRow[0]?.c ?? 0),
      totalUsers: Number(totalUsersRow[0]?.c ?? 0),
      totalDealerships: Number(totalDealershipsRow[0]?.c ?? 0),
      activeDealerships: Number(activeDealershipsRow[0]?.c ?? 0),
      leadsToday: Number(leadsTodayRow[0]?.c ?? 0),
      leadsLast7d: Number(leadsLast7dRow[0]?.c ?? 0),
      totalLeads: Number(totalLeadsRow[0]?.c ?? 0),
      bookingsToday: Number(bookingsTodayRow[0]?.c ?? 0),
      totalBookings: Number(totalBookingsRow[0]?.c ?? 0),
      testDrivesToday: Number(testDrivesTodayRow[0]?.c ?? 0),
      testDrivesPending: Number(testDrivesPendingRow[0]?.c ?? 0),
      testDrivesConfirmed: Number(testDrivesConfirmedRow[0]?.c ?? 0),
      totalTestDrives: Number(totalTestDrivesRow[0]?.c ?? 0),
      vehiclesAvailable: Number(vehiclesAvailableRow[0]?.c ?? 0),
      vehiclesTotal: Number(vehiclesTotalRow[0]?.c ?? 0),
      prospectsTotal: Number(prospectsTotalRow[0]?.c ?? 0),
      prospectsLast7d: Number(prospectsLast7dRow[0]?.c ?? 0),
      upgradeRoadmapOpen: Number(roadmapOpenRow[0]?.c ?? 0),
      upgradeRoadmapAutoResolved: Number(roadmapAutoResolvedRow[0]?.c ?? 0),
      lastAuditRunAt: tsToMs(lastAuditRow[0]?.ts),
      lastTestDriveAt: tsToMs(lastTestDriveRow[0]?.ts),
      lastLeadAt: tsToMs(lastLeadRow[0]?.ts),
      generatedAt: Date.now(),
    };
  } catch (err) {
    console.warn("[Ops] getPlatformOpsSnapshot failed:", err);
    return empty;
  }
}



// ---------------------------------------------------------------------------
// Kagiso proposed patches — autonomous low-risk fix proposals (v29).
// ---------------------------------------------------------------------------

export type ProposedPatchCategory = "stale_copy" | "seo_meta" | "safe_constant";
export type ProposedPatchStatus =
  | "proposed"
  | "applied"
  | "rejected"
  | "failed"
  | "stale";

export async function createProposedPatch(input: {
  findingId: number;
  category: ProposedPatchCategory;
  title: string;
  rationale: string;
  filePath: string;
  findText: string;
  replaceText: string;
  diffPreview: string;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result: any = await db.insert(kagisoProposedPatches).values({
    findingId: input.findingId,
    category: input.category,
    patchType: "replace_text",
    title: input.title,
    rationale: input.rationale,
    filePath: input.filePath,
    findText: input.findText,
    replaceText: input.replaceText,
    diffPreview: input.diffPreview,
    status: "proposed",
  });
  return { id: result[0]?.insertId ?? 0 };
}

export async function listProposedPatches(opts?: {
  status?: ProposedPatchStatus;
  limit?: number;
}): Promise<KagisoProposedPatch[]> {
  const db = await getDb();
  if (!db) return [];
  const limit = opts?.limit ?? 200;
  if (opts?.status) {
    return db
      .select()
      .from(kagisoProposedPatches)
      .where(eq(kagisoProposedPatches.status, opts.status))
      .orderBy(desc(kagisoProposedPatches.createdAt))
      .limit(limit);
  }
  return db
    .select()
    .from(kagisoProposedPatches)
    .orderBy(desc(kagisoProposedPatches.createdAt))
    .limit(limit);
}

export async function getProposedPatch(id: number): Promise<KagisoProposedPatch | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(kagisoProposedPatches)
    .where(eq(kagisoProposedPatches.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findProposedPatchByFingerprint(
  findingId: number,
  filePath: string,
  findText: string,
): Promise<KagisoProposedPatch | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(kagisoProposedPatches)
    .where(
      and(
        eq(kagisoProposedPatches.findingId, findingId),
        eq(kagisoProposedPatches.filePath, filePath),
        eq(kagisoProposedPatches.findText, findText),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function markPatchApplied(id: number, appliedBy: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(kagisoProposedPatches)
    .set({
      status: "applied",
      appliedAt: new Date(),
      appliedBy,
      errorMessage: null,
    })
    .where(eq(kagisoProposedPatches.id, id));
}

export async function markPatchRejected(id: number, rejectedBy: number, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(kagisoProposedPatches)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
      rejectedBy,
      errorMessage: reason ?? null,
    })
    .where(eq(kagisoProposedPatches.id, id));
}

export async function markPatchFailed(id: number, error: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(kagisoProposedPatches)
    .set({ status: "failed", errorMessage: error })
    .where(eq(kagisoProposedPatches.id, id));
}

export type { KagisoProposedPatch, InsertKagisoProposedPatch };


/**
 * Cheap COUNT(*) for the admin sidebar badge — avoids hauling every patch
 * row into the client just to render a number.
 */
export async function countPendingProposedPatches(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: count() })
    .from(kagisoProposedPatches)
    .where(eq(kagisoProposedPatches.status, "proposed"));
  return Number(rows[0]?.n ?? 0);
}


// -----------------------------------------------------------------------------
// Tumi — Trade-In Quote helpers
// -----------------------------------------------------------------------------

export async function insertTradeInQuote(row: {
  dealershipId: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  make: string;
  model: string;
  year: number;
  mileageKm: number;
  transmission: "manual" | "automatic" | "cvt" | "dct";
  fuel: "petrol" | "diesel" | "hybrid" | "electric";
  bodyType: string;
  condition: "excellent" | "good" | "fair" | "poor";
  serviceHistory: "full_dealer" | "full_independent" | "partial" | "none";
  notes?: string | null;
  estimateLow: number;
  estimateMid: number;
  estimateHigh: number;
  confidence: "low" | "medium" | "high";
  factorBreakdown: string;
  memoMarkdown: string;
  language: string;
  province?: string | null;
  photoUrls?: string | null;
  networkListed?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(tradeInQuotes).values({
    ...row,
    networkListed: row.networkListed ?? 0,
  });
  // mysql2 returns insertId on result[0]
  // @ts-expect-error Drizzle MySQL returns insertId on result[0]
  const id = (result?.[0]?.insertId ?? result?.insertId ?? 0) as number;
  return Number(id);
}

export async function listTradeInQuotesForDealership(
  dealershipId: number | null,
  limit = 100,
) {
  const db = await getDb();
  if (!db) return [] as Array<typeof tradeInQuotes.$inferSelect>;
  const where =
    dealershipId === null
      ? undefined
      : eq(tradeInQuotes.dealershipId, dealershipId);
  const q = db.select().from(tradeInQuotes);
  const rows = await (where ? q.where(where) : q)
    .orderBy(desc(tradeInQuotes.createdAt))
    .limit(limit);
  return rows;
}

export async function getTradeInQuoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(tradeInQuotes)
    .where(eq(tradeInQuotes.id, id))
    .limit(1);
  return rows[0];
}

export async function listNetworkTradeInQuotes(limit = 100) {
  const db = await getDb();
  if (!db) return [] as Array<typeof tradeInQuotes.$inferSelect>;
  return db
    .select()
    .from(tradeInQuotes)
    .where(eq(tradeInQuotes.networkListed, 1))
    .orderBy(desc(tradeInQuotes.createdAt))
    .limit(limit);
}

export async function updateTradeInQuoteNetwork(
  id: number,
  patch: { networkListed?: number; status?: string },
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(tradeInQuotes).set(patch as any).where(eq(tradeInQuotes.id, id));
}

export async function insertTradeInInvite(row: {
  quoteId: number;
  dealershipId: number;
  dealershipName: string;
  inviteMessage: string;
  indicativeOfferZar?: number | null;
  leadId?: number | null;
  smsSent?: number;
  emailSent?: number;
  whatsappSent?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(tradeInInvites).values({
    quoteId: row.quoteId,
    dealershipId: row.dealershipId,
    dealershipName: row.dealershipName,
    inviteMessage: row.inviteMessage,
    indicativeOfferZar: row.indicativeOfferZar ?? null,
    leadId: row.leadId ?? null,
    smsSent: row.smsSent ?? 0,
    emailSent: row.emailSent ?? 0,
    whatsappSent: row.whatsappSent ?? 0,
  });
  // @ts-expect-error Drizzle MySQL returns insertId on result[0]
  return Number(result?.[0]?.insertId ?? result?.insertId ?? 0);
}

export async function listTradeInInvitesForQuote(quoteId: number) {
  const db = await getDb();
  if (!db) return [] as Array<typeof tradeInInvites.$inferSelect>;
  return db
    .select()
    .from(tradeInInvites)
    .where(eq(tradeInInvites.quoteId, quoteId))
    .orderBy(desc(tradeInInvites.createdAt));
}

export async function countTradeInInvitesForQuote(quoteId: number): Promise<number> {
  const rows = await listTradeInInvitesForQuote(quoteId);
  return rows.length;
}

export async function dealerInvitedQuote(
  quoteId: number,
  dealershipId: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(tradeInInvites)
    .where(
      and(eq(tradeInInvites.quoteId, quoteId), eq(tradeInInvites.dealershipId, dealershipId)),
    )
    .limit(1);
  return rows.length > 0;
}

export async function updateTradeInQuoteStatus(
  id: number,
  status: "estimated" | "principal_review" | "offer_sent" | "accepted" | "rejected" | "expired",
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(tradeInQuotes).set({ status }).where(eq(tradeInQuotes.id, id));
}


/**
 * Patch the `modulesEnabled` JSON on a dealership. Performs a *partial merge*:
 * existing keys not present in `patch` are preserved. To unset a module pass
 * `null` for the key.
 */
export async function updateDealershipModules(
  id: number,
  patch: Record<string, boolean | null>,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.select().from(dealerships).where(eq(dealerships.id, id));
  if (!row) throw new Error("Dealership not found");
  const current = (row.modulesEnabled as Record<string, boolean> | null) ?? {};
  const merged: Record<string, boolean> = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) {
      delete merged[k];
    } else {
      merged[k] = v;
    }
  }
  await db.update(dealerships).set({ modulesEnabled: merged }).where(eq(dealerships.id, id));
}


// POPIA Consent Signatures
export async function storePopiaConsent(data: {
  userId: number;
  dealershipId: number;
  signedName: string;
  ipAddress: string;
  userAgent: string;
  consentText: string;
  formVersion?: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Expires 1 year from now
    const result = await db.insert(popiaConsentSignatures).values({
      userId: data.userId,
      dealershipId: data.dealershipId,
      signedName: data.signedName,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      consentText: data.consentText,
      formVersion: data.formVersion || '1.0',
      signedAt: new Date(),
      expiresAt,
      status: 'active',
    });
    return result;
  } catch (error) {
    console.warn('[POPIA] Error storing consent:', error);
    return null;
  }
}

export async function getLatestPopiaConsent(userId: number, dealershipId: number) {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db
      .select()
      .from(popiaConsentSignatures)
      .where(
        and(
          eq(popiaConsentSignatures.userId, userId),
          eq(popiaConsentSignatures.dealershipId, dealershipId),
          eq(popiaConsentSignatures.status, 'active')
        )
      )
      .orderBy(desc(popiaConsentSignatures.signedAt))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.warn('[POPIA] Error fetching consent:', error);
    return null;
  }
}

export async function checkPopiaConsentExpired(userId: number, dealershipId: number) {
  const latest = await getLatestPopiaConsent(userId, dealershipId);
  if (!latest) return true; // No consent = expired

  const now = new Date();
  return latest.expiresAt < now;
}

export async function reconfirmPopiaConsent(consentId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await db
    .update(popiaConsentSignatures)
    .set({
      reconfirmedAt: new Date(),
      expiresAt,
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(popiaConsentSignatures.id, consentId));
}

export async function getPopiaConsentHistory(userId: number, dealershipId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(popiaConsentSignatures)
    .where(
      and(
        eq(popiaConsentSignatures.userId, userId),
        eq(popiaConsentSignatures.dealershipId, dealershipId)
      )
    )
    .orderBy(desc(popiaConsentSignatures.signedAt));
}


/**
 * Returns the autonomous audit status for the founder dashboard.
 * Includes: last audit run timestamp, whether autonomous mode is active,
 * and the count of pending findings waiting for approval.
 */
export async function getAutonomousAuditStatus(): Promise<{
  lastAuditRanAt: Date | null;
  isAutonomousActive: boolean;
  pendingFindingsCount: number;
  nextAuditDueAt: Date | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      lastAuditRanAt: null,
      isAutonomousActive: false,
      pendingFindingsCount: 0,
      nextAuditDueAt: null,
    };
  }

  const lastAuditRanAt = await getLastKagisoAuditRunAt();
  const pendingFindings = await db
    .select({ id: upgradeRoadmap.id })
    .from(upgradeRoadmap)
    .where(eq(upgradeRoadmap.status, "pending"))
    .limit(1);

  const isAutonomousActive = true; // Always true for now; can be toggled via settings later
  const nextAuditDueAt = lastAuditRanAt
    ? new Date(lastAuditRanAt.getTime() + 24 * 60 * 60 * 1000)
    : null;

  return {
    lastAuditRanAt,
    isAutonomousActive,
    pendingFindingsCount: pendingFindings.length,
    nextAuditDueAt,
  };
}


/**
 * WhatsApp Conversation Helpers
 */

export async function createWhatsappConversation(
  dealershipId: number,
  phoneNumber: string,
  leadId?: number,
  vehicleId?: number
): Promise<WhatsappConversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappConversations).values({
    dealershipId,
    phoneNumber,
    leadId,
    vehicleId,
    status: "open",
  });

  const conversationId = result[0].insertId;
  const conversations = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.id, Number(conversationId)))
    .limit(1);

  if (!conversations.length) throw new Error("Failed to create conversation");
  return conversations[0];
}

export async function getWhatsappConversation(
  conversationId: number
): Promise<WhatsappConversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.id, conversationId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateWhatsappConversation(
  dealershipId: number,
  phoneNumber: string,
  leadId?: number,
  vehicleId?: number
): Promise<WhatsappConversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.dealershipId, dealershipId),
        eq(whatsappConversations.phoneNumber, phoneNumber),
        eq(whatsappConversations.status, "open")
      )
    )
    .limit(1);

  if (existing.length > 0) return existing[0];
  return createWhatsappConversation(dealershipId, phoneNumber, leadId, vehicleId);
}

export async function closeWhatsappConversation(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(whatsappConversations)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(whatsappConversations.id, conversationId));
}

/**
 * WhatsApp Message Helpers
 */

export async function createWhatsappMessage(
  data: InsertWhatsappMessage
): Promise<WhatsappMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappMessages).values(data);
  const messageId = result[0].insertId;

  const messages = await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.id, Number(messageId)))
    .limit(1);

  if (!messages.length) throw new Error("Failed to create message");

  // Update conversation's lastMessageAt
  const message = messages[0];
  await db
    .update(whatsappConversations)
    .set({ lastMessageAt: message.createdAt, updatedAt: new Date() })
    .where(eq(whatsappConversations.id, message.conversationId));

  return message;
}

export async function getWhatsappMessages(
  conversationId: number,
  limit: number = 50
): Promise<WhatsappMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(limit);
}

export async function updateWhatsappMessageStatus(
  messageId: number,
  status: "sent" | "delivered" | "read" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(whatsappMessages)
    .set({ status, errorMessage })
    .where(eq(whatsappMessages.id, messageId));
}

/**
 * WhatsApp Queue Helpers
 */

export async function enqueueWhatsappMessage(
  data: InsertWhatsappQueueItem
): Promise<WhatsappQueueItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappQueue).values(data);
  const queueId = result[0].insertId;

  const items = await db
    .select()
    .from(whatsappQueue)
    .where(eq(whatsappQueue.id, Number(queueId)))
    .limit(1);

  if (!items.length) throw new Error("Failed to enqueue message");
  return items[0];
}

export async function getPendingWhatsappMessages(
  limit: number = 100
): Promise<WhatsappQueueItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(whatsappQueue)
    .where(
      and(
        eq(whatsappQueue.status, "pending"),
        sql`${whatsappQueue.nextRetryAt} IS NULL OR ${whatsappQueue.nextRetryAt} <= NOW()`
      )
    )
    .orderBy(whatsappQueue.createdAt)
    .limit(limit);
}

export async function updateWhatsappQueueStatus(
  queueId: number,
  status: "pending" | "processing" | "sent" | "failed" | "dead_letter",
  error?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updates: any = { status, updatedAt: new Date() };
  if (error) updates.lastError = error;

  await db.update(whatsappQueue).set(updates).where(eq(whatsappQueue.id, queueId));
}

export async function incrementWhatsappQueueRetry(
  queueId: number,
  nextRetryAt: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(whatsappQueue)
    .set({
      retryCount: sql`${whatsappQueue.retryCount} + 1`,
      nextRetryAt,
      updatedAt: new Date(),
    })
    .where(eq(whatsappQueue.id, queueId));
}

/**
 * WhatsApp Webhook Helpers
 */

export async function logWhatsappWebhook(
  data: InsertWhatsappWebhook
): Promise<WhatsappWebhook> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappWebhooks).values(data);
  const webhookId = result[0].insertId;

  const webhooks = await db
    .select()
    .from(whatsappWebhooks)
    .where(eq(whatsappWebhooks.id, Number(webhookId)))
    .limit(1);

  if (!webhooks.length) throw new Error("Failed to log webhook");
  return webhooks[0];
}

export async function markWhatsappWebhookProcessed(
  webhookId: number,
  error?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(whatsappWebhooks)
    .set({
      processed: 1,
      processedAt: new Date(),
      error,
    })
    .where(eq(whatsappWebhooks.id, webhookId));
}

export async function getUnprocessedWhatsappWebhooks(
  limit: number = 100
): Promise<WhatsappWebhook[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(whatsappWebhooks)
    .where(eq(whatsappWebhooks.processed, 0))
    .orderBy(whatsappWebhooks.createdAt)
    .limit(limit);
}

// ─── Live market guide overrides ───────────────────────────────────────────

export async function listMarketGuideLive(): Promise<Array<typeof marketGuideLive.$inferSelect>> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketGuideLive);
}

export async function upsertMarketGuideLive(input: {
  guideKey: string;
  year: number;
  tradeInValueZar: number;
  confidence: string;
  source: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(marketGuideLive)
    .where(and(eq(marketGuideLive.guideKey, input.guideKey), eq(marketGuideLive.year, input.year)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(marketGuideLive)
      .set({
        tradeInValueZar: input.tradeInValueZar,
        confidence: input.confidence,
        source: input.source,
        updatedAt: new Date(),
      })
      .where(eq(marketGuideLive.id, existing[0].id));
  } else {
    await db.insert(marketGuideLive).values(input);
  }
}

export async function getMarketGuideRefreshMeta(): Promise<typeof marketGuideRefreshMeta.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(marketGuideRefreshMeta).where(eq(marketGuideRefreshMeta.id, 1)).limit(1);
  return rows[0] ?? null;
}

export async function updateMarketGuideRefreshMeta(input: {
  lastRunAt: Date;
  lastGuideKey: string | null;
  modelsRefreshed: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getMarketGuideRefreshMeta();
  if (existing) {
    await db
      .update(marketGuideRefreshMeta)
      .set(input)
      .where(eq(marketGuideRefreshMeta.id, 1));
  } else {
    await db.insert(marketGuideRefreshMeta).values({ id: 1, ...input });
  }
}
