/**
 * Session Management Service
 * Handles user sessions, active sessions tracking, and device management
 */

import { getDb } from "../db";
import { userSessions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";

export interface SessionInfo {
  id: string;
  userId: number;
  token: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

/**
 * Create a new session
 */
export async function createSession(
  userId: number,
  userAgent: string,
  ipAddress: string
): Promise<SessionInfo> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const token = crypto.randomBytes(32).toString("hex");
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const deviceName = `${result.browser.name || "Unknown"} on ${result.os.name || "Unknown"}`;
  const deviceType = result.device.type || "desktop";
  const browser = `${result.browser.name} ${result.browser.version}`;

  await db.insert(userSessions).values({
    userId,
    token,
    deviceName,
    deviceType,
    browser,
    ipAddress,
    createdAt: now,
    lastActivityAt: now,
    expiresAt,
  });

  return {
    id: token,
    userId,
    token,
    deviceName,
    deviceType,
    browser,
    ipAddress,
    createdAt: now,
    lastActivityAt: now,
    expiresAt,
    isCurrent: true,
  };
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: number): Promise<SessionInfo[]> {
  const db = await getDb();
  if (!db) return [];

  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, 1)
      )
    )
    .orderBy(desc(userSessions.lastActivityAt));

  return sessions.map((s) => ({
    id: s.id?.toString() || "",
    userId: s.userId,
    token: s.token,
    deviceName: s.deviceName,
    deviceType: s.deviceType,
    browser: s.browser,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt,
    lastActivityAt: s.lastActivityAt,
    expiresAt: s.expiresAt,
    isCurrent: false,
  }));
}

/**
 * Update session last activity
 */
export async function updateSessionActivity(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(userSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(userSessions.token, token));
}

/**
 * Logout from a specific session
 */
export async function logoutSession(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(userSessions)
    .set({ isActive: 0 })
    .where(eq(userSessions.id, parseInt(sessionId)));
}

/**
 * Logout from all sessions except current
 */
export async function logoutOtherSessions(userId: number, currentToken: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(userSessions)
    .set({ isActive: 0 })
    .where(
      and(
        eq(userSessions.userId, userId),
        sql`token != ${currentToken}`
      )
    );
}

/**
 * Logout from all sessions
 */
export async function logoutAllSessions(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(userSessions)
    .set({ isActive: 0 })
    .where(eq(userSessions.userId, userId));
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  await db
    .update(userSessions)
    .set({ isActive: 0 })
    .where(sql`expiresAt < NOW()`);

  return 0;
}

/**
 * Get session by token
 */
export async function getSessionByToken(token: string): Promise<SessionInfo | null> {
  const db = await getDb();
  if (!db) return null;

  const session = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.token, token),
        eq(userSessions.isActive, 1)
      )
    )
    .limit(1);

  if (!session || session.length === 0) {
    return null;
  }

  const s = session[0];
  return {
    id: s.id?.toString() || "",
    userId: s.userId,
    token: s.token,
    deviceName: s.deviceName || "",
    deviceType: s.deviceType || "",
    browser: s.browser || "",
    ipAddress: s.ipAddress || "",
    createdAt: s.createdAt,
    lastActivityAt: s.lastActivityAt,
    expiresAt: s.expiresAt,
    isCurrent: true,
  };
}

// Import sql for raw queries
import { sql } from "drizzle-orm";
