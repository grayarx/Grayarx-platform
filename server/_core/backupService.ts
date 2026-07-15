/**
 * Database Backup Service — REAL implementation.
 *
 * Exports a snapshot of core business tables to JSON, gzips it, and uploads
 * it to S3/R2 (reusing `server/storage.ts`) when durable storage is
 * configured. If no S3/R2 env vars are set, the backup is written to the
 * ephemeral local temp directory instead and the founder is alerted, because
 * Railway's filesystem does NOT survive redeploys/restarts — a local-only
 * backup is better than nothing but is not durable.
 *
 * Scheduling: call `runDatabaseBackup()` from `/api/scheduled/db-backup`
 * (see `server/_core/scheduled.ts`), which is gated by
 * `server/_core/scheduledAuth.ts` (shared-secret header, since Manus'
 * `isCron` no longer applies on Railway). See docs/SCHEDULED_TASKS.md for
 * external cron setup and docs/BACKUP_RESTORE.md for exactly what's backed
 * up and how to restore.
 *
 * RESTORE IS MANUAL. This service does NOT write data back into the
 * database. Automated restore into a live TiDB database is high-risk
 * (foreign-key ordering, partial-write corruption, no transactional
 * rollback across 25+ tables) and is intentionally NOT implemented here.
 * `restoreBackup()` below fetches/validates a backup and returns manual,
 * TiDB-console-driven restore instructions — it is honest about not having
 * performed a restore.
 */

import * as zlib from "zlib";
import * as crypto from "crypto";
import { getDb } from "../db";
import { storagePutRaw } from "../storage";
import { alertFounder } from "./founderAlert";
import {
  users,
  dealerships,
  dealerGroups,
  dealershipUsers,
  vehicles,
  vehiclePhotos,
  leads,
  bookings,
  testDriveBookings,
  conversations,
  chatbotConversations,
  whatsappConversations,
  whatsappMessages,
  whatsappQueue,
  invoices,
  payments,
  subscriptions,
  tradeInQuotes,
  tradeInInvites,
  prospects,
  onboardingSubmissions,
  popiaConsentSignatures,
  apiKeys,
  webhooks,
  documents,
  documentSignatures,
} from "../../drizzle/schema";

/** Tables included in the lightweight backup. Order doesn't matter for export. */
const BACKUP_TABLES: Array<{ name: string; table: any }> = [
  { name: "users", table: users },
  { name: "dealerships", table: dealerships },
  { name: "dealerGroups", table: dealerGroups },
  { name: "dealershipUsers", table: dealershipUsers },
  { name: "vehicles", table: vehicles },
  { name: "vehiclePhotos", table: vehiclePhotos },
  { name: "leads", table: leads },
  { name: "bookings", table: bookings },
  { name: "testDriveBookings", table: testDriveBookings },
  { name: "conversations", table: conversations },
  { name: "chatbotConversations", table: chatbotConversations },
  { name: "whatsappConversations", table: whatsappConversations },
  { name: "whatsappMessages", table: whatsappMessages },
  { name: "whatsappQueue", table: whatsappQueue },
  { name: "invoices", table: invoices },
  { name: "payments", table: payments },
  { name: "subscriptions", table: subscriptions },
  { name: "tradeInQuotes", table: tradeInQuotes },
  { name: "tradeInInvites", table: tradeInInvites },
  { name: "prospects", table: prospects },
  { name: "onboardingSubmissions", table: onboardingSubmissions },
  { name: "popiaConsentSignatures", table: popiaConsentSignatures },
  { name: "apiKeys", table: apiKeys },
  { name: "webhooks", table: webhooks },
  { name: "documents", table: documents },
  { name: "documentSignatures", table: documentSignatures },
];

export interface BackupMetadata {
  id: string;
  type: "full" | "incremental";
  status: "completed" | "failed";
  createdAt: string;
  timestamp: number;
  sizeBytes: number;
  rawSizeBytes: number;
  tableCount: number;
  totalRows: number;
  tableErrors: string[];
  checksum: string;
  durable: boolean;
  location: string;
  error?: string;
}

const MAX_BACKUPS_IN_MEMORY = 30;
/** In-memory record of recent backups run by this process (for status/listing endpoints). Not durable across restarts by design — the durable record of a backup is the uploaded object itself. */
const recentBackups: BackupMetadata[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Export core business tables to a single gzip'd JSON snapshot and upload it
 * (S3/R2 if configured, else local ephemeral disk + founder alert).
 *
 * NOTE: `type` is currently metadata-only — there is no real incremental
 * (changed-rows-only) export implemented, so "incremental" still does a full
 * table export. Being honest about that here rather than faking a smaller
 * "incremental" payload like the old mock did.
 */
export async function runDatabaseBackup(
  type: "full" | "incremental" = "full",
): Promise<BackupMetadata> {
  const timestamp = Date.now();
  const id = `db-backup-${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}`;

  const db = await getDb();
  if (!db) {
    const failed: BackupMetadata = {
      id,
      type,
      status: "failed",
      createdAt: nowIso(),
      timestamp,
      sizeBytes: 0,
      rawSizeBytes: 0,
      tableCount: 0,
      totalRows: 0,
      tableErrors: [],
      checksum: "",
      durable: false,
      location: "",
      error: "DATABASE_URL not configured — cannot connect to database",
    };
    recentBackups.unshift(failed);
    console.error(`[Backup] ${id} failed: no database connection`);
    await alertFounder({
      title: "DB backup FAILED — no database connection",
      content: "runDatabaseBackup() could not obtain a DB connection (DATABASE_URL missing or unreachable). No backup was created.",
      category: "ops",
    }).catch(() => {});
    return failed;
  }

  const tables: Record<string, unknown[]> = {};
  const tableErrors: string[] = [];
  let totalRows = 0;

  for (const { name, table } of BACKUP_TABLES) {
    try {
      const rows = await db.select().from(table);
      tables[name] = rows;
      totalRows += rows.length;
    } catch (err) {
      const msg = `${name}: ${err instanceof Error ? err.message : String(err)}`;
      tableErrors.push(msg);
      console.warn(`[Backup] Skipped table "${name}" due to error:`, msg);
    }
  }

  const payload = {
    schemaVersion: 1,
    backupId: id,
    type,
    generatedAt: nowIso(),
    tableCount: Object.keys(tables).length,
    totalRows,
    tableErrors,
    tables,
  };

  const raw = JSON.stringify(payload);
  const gzipped = zlib.gzipSync(Buffer.from(raw, "utf8"));
  const checksum = crypto.createHash("sha256").update(gzipped).digest("hex");

  let upload: { key: string; url: string; durable: boolean; localPath?: string };
  try {
    upload = await storagePutRaw(`backups/${id}.json.gz`, gzipped, "application/gzip");
  } catch (err) {
    const failed: BackupMetadata = {
      id,
      type,
      status: "failed",
      createdAt: nowIso(),
      timestamp,
      sizeBytes: gzipped.length,
      rawSizeBytes: raw.length,
      tableCount: Object.keys(tables).length,
      totalRows,
      tableErrors,
      checksum,
      durable: false,
      location: "",
      error: `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    recentBackups.unshift(failed);
    console.error(`[Backup] ${id} upload failed:`, err);
    await alertFounder({
      title: "DB backup FAILED — upload error",
      content: `Backup was exported (${totalRows} rows, ${(gzipped.length / 1024).toFixed(1)} KB compressed) but the upload step failed: ${failed.error}`,
      category: "ops",
    }).catch(() => {});
    return failed;
  }

  const metadata: BackupMetadata = {
    id,
    type,
    status: "completed",
    createdAt: nowIso(),
    timestamp,
    sizeBytes: gzipped.length,
    rawSizeBytes: raw.length,
    tableCount: Object.keys(tables).length,
    totalRows,
    tableErrors,
    checksum,
    durable: upload.durable,
    location: upload.url,
  };

  recentBackups.unshift(metadata);
  if (recentBackups.length > MAX_BACKUPS_IN_MEMORY) recentBackups.length = MAX_BACKUPS_IN_MEMORY;

  console.log(
    `[Backup] ${id} completed: ${totalRows} rows across ${metadata.tableCount} tables, ` +
      `${(gzipped.length / 1024).toFixed(1)} KB compressed, durable=${upload.durable} -> ${upload.url}`,
  );

  if (!upload.durable) {
    await alertFounder({
      title: "DB backup stored locally — NOT durable",
      content:
        `Backup ${id} was written to ephemeral local disk (${upload.localPath}) because no S3/R2 storage ` +
        `is configured (S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT, S3_REGION). ` +
        `This file WILL BE LOST on the next Railway redeploy or restart.\n\n` +
        `Summary: ${totalRows} rows across ${metadata.tableCount} tables (${(gzipped.length / 1024).toFixed(1)} KB compressed).` +
        (tableErrors.length ? `\n\nTable errors (skipped): ${tableErrors.join("; ")}` : "") +
        `\n\nAction needed: configure S3/R2 env vars on Railway so backups persist off-server. See docs/BACKUP_RESTORE.md.`,
      category: "ops",
    }).catch(() => {});
  } else if (tableErrors.length > 0) {
    await alertFounder({
      title: "DB backup completed with table errors",
      content: `Backup ${id} uploaded to ${upload.url}, but ${tableErrors.length} table(s) were skipped: ${tableErrors.join("; ")}`,
      category: "ops",
    }).catch(() => {});
  }

  return metadata;
}

/** Human-readable, honest instructions for restoring a backup. Restore is manual by design — see file header. */
export function getRestoreInstructions(backup: BackupMetadata): string {
  return [
    `Restore for backup "${backup.id}" is MANUAL — this platform does not auto-restore into the live database.`,
    ``,
    `1. Download the backup:`,
    backup.durable
      ? `   - From S3/R2: ${backup.location}`
      : `   - WARNING: this backup was stored on local ephemeral disk (${backup.location}) and is very likely already gone after a redeploy/restart. If the server hasn't restarted since, fetch it from that path via Railway shell.`,
    `2. Decompress: gunzip the file to get the JSON snapshot (schemaVersion 1, { tables: { <tableName>: <rows[]> } }).`,
    `3. Inspect the JSON to decide which table(s)/row(s) actually need restoring — do NOT blindly overwrite live data.`,
    `4. Use the TiDB Cloud console (or a mysql client against DATABASE_URL) to manually INSERT/REPLACE the needed rows,`,
    `   respecting foreign-key order (dealerships/users before vehicles/leads/bookings, etc.).`,
    `5. Verify row counts and spot-check a few records before considering the restore complete.`,
    ``,
    `See docs/BACKUP_RESTORE.md for the full runbook.`,
  ].join("\n");
}

/**
 * "Restore" a backup — honestly, this validates the backup is findable and
 * returns manual restore instructions. It does NOT write anything to the
 * database. See file header for why automated restore is out of scope.
 */
export async function restoreBackup(backupId: string): Promise<{
  success: boolean;
  automated: false;
  manualRestoreRequired: true;
  backup?: BackupMetadata;
  instructions?: string;
  error?: string;
}> {
  const backup = recentBackups.find((b) => b.id === backupId);
  if (!backup) {
    return {
      success: false,
      automated: false,
      manualRestoreRequired: true,
      error: `No backup with id "${backupId}" found in this process's recent-backup history. Check docs/BACKUP_RESTORE.md and your S3/R2 bucket listing for older backups.`,
    };
  }
  if (backup.status !== "completed") {
    return {
      success: false,
      automated: false,
      manualRestoreRequired: true,
      backup,
      error: `Backup "${backupId}" did not complete successfully (status=${backup.status}); nothing to restore.`,
    };
  }
  return {
    success: true,
    automated: false,
    manualRestoreRequired: true,
    backup,
    instructions: getRestoreInstructions(backup),
  };
}

/** Trigger a backup and return its id. Convenience wrapper for callers/tests. */
export async function createBackup(type: "full" | "incremental" = "full"): Promise<string> {
  const metadata = await runDatabaseBackup(type);
  return metadata.id;
}

export function getBackupStatus(backupId: string): BackupMetadata | null {
  return recentBackups.find((b) => b.id === backupId) ?? null;
}

export function listBackups(limit: number = 50): BackupMetadata[] {
  return recentBackups.slice(0, limit);
}

export function getBackupStats() {
  const completed = recentBackups.filter((b) => b.status === "completed");
  return {
    totalBackups: recentBackups.length,
    completedBackups: completed.length,
    failedBackups: recentBackups.length - completed.length,
    totalSizeBytes: completed.reduce((sum, b) => sum + b.sizeBytes, 0),
    lastBackupAt: recentBackups[0]?.createdAt ?? null,
    lastBackupDurable: recentBackups[0]?.durable ?? null,
  };
}

/** Backward-compatible object surface (used by tests / older call sites). */
export const backupService = {
  createBackup,
  restoreBackup,
  getBackupStatus,
  listBackups,
  getBackupStats,
  runDatabaseBackup,
  getRestoreInstructions,
};

export default backupService;
