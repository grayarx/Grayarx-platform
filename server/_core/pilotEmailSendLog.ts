/**
 * Persist pilot outreach sends so the campaigns UI can show "already emailed"
 * and avoid re-spamming the same verified address.
 *
 * Prefers MySQL (`pilot_email_sends`); falls back to data/pilot-email-sends.json
 * when the DB is unavailable (local/dev).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";

export type PilotEmailSendRecord = {
  email: string;
  prospectId: string;
  dealershipName: string;
  segment: string;
  sentAt: string;
  resendId?: string;
};

const LOG_DIR = join(process.cwd(), "data");
const LOG_PATH = join(LOG_DIR, "pilot-email-sends.json");

function readFileLog(): PilotEmailSendRecord[] {
  try {
    if (!existsSync(LOG_PATH)) return [];
    const raw = readFileSync(LOG_PATH, "utf8");
    const parsed = JSON.parse(raw) as PilotEmailSendRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFileLog(rows: PilotEmailSendRecord[]) {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  writeFileSync(LOG_PATH, JSON.stringify(rows, null, 2), "utf8");
}

async function withDb<T>(fn: (conn: mysql.Connection) => Promise<T>): Promise<T | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    const conn = await mysql.createConnection({
      host: url.hostname,
      port: Number(url.port) || 4000,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: true },
    });
    try {
      return await fn(conn);
    } finally {
      await conn.end();
    }
  } catch {
    return null;
  }
}

async function readDbLog(): Promise<PilotEmailSendRecord[] | null> {
  return withDb(async (conn) => {
    const [rows] = await conn.query(
      `SELECT email, prospectId, dealershipName, segment, resendId, sentAt
       FROM pilot_email_sends
       ORDER BY sentAt ASC`,
    );
    const list = rows as Array<{
      email: string;
      prospectId: string;
      dealershipName: string;
      segment: string;
      resendId: string | null;
      sentAt: Date | string;
    }>;
    return list.map((r) => ({
      email: String(r.email),
      prospectId: String(r.prospectId),
      dealershipName: String(r.dealershipName),
      segment: String(r.segment),
      resendId: r.resendId ?? undefined,
      sentAt: r.sentAt instanceof Date ? r.sentAt.toISOString() : String(r.sentAt),
    }));
  });
}

async function writeDbRecord(record: PilotEmailSendRecord): Promise<boolean> {
  const ok = await withDb(async (conn) => {
    await conn.query(
      `INSERT INTO pilot_email_sends
        (email, prospectId, dealershipName, segment, resendId, sentAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.email,
        record.prospectId,
        record.dealershipName,
        record.segment,
        record.resendId ?? null,
        new Date(record.sentAt),
      ],
    );
    return true;
  });
  return ok === true;
}

function rowsToMap(rows: PilotEmailSendRecord[]): Map<string, PilotEmailSendRecord> {
  const map = new Map<string, PilotEmailSendRecord>();
  for (const row of rows) {
    const key = row.email.trim().toLowerCase();
    const prev = map.get(key);
    if (!prev || prev.sentAt < row.sentAt) map.set(key, row);
  }
  return map;
}

export async function refreshPilotEmailSendMap(): Promise<Map<string, PilotEmailSendRecord>> {
  const dbRows = await readDbLog();
  const fileRows = readFileLog();
  const map = rowsToMap([...(dbRows ?? []), ...fileRows]);
  return map;
}

export function recordPilotEmailSend(input: {
  email: string;
  prospectId: string;
  dealershipName: string;
  segment: string;
  resendId?: string;
}): PilotEmailSendRecord {
  const record: PilotEmailSendRecord = {
    email: input.email.trim().toLowerCase(),
    prospectId: input.prospectId,
    dealershipName: input.dealershipName,
    segment: input.segment,
    sentAt: new Date().toISOString(),
    resendId: input.resendId,
  };

  const rows = readFileLog();
  rows.push(record);
  writeFileLog(rows);
  void writeDbRecord(record);
  return record;
}

/** Newest-first send history for admin/prospector UI. */
export async function listPilotEmailSends(limit = 50): Promise<PilotEmailSendRecord[]> {
  const map = await refreshPilotEmailSendMap();
  return [...map.values()]
    .sort((a, b) => (a.sentAt < b.sentAt ? 1 : a.sentAt > b.sentAt ? -1 : 0))
    .slice(0, Math.max(1, Math.min(limit, 200)));
}
