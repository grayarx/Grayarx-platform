import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));
vi.mock("../storage", () => ({
  storagePutRaw: vi.fn(),
}));
vi.mock("./founderAlert", () => ({
  alertFounder: vi.fn().mockResolvedValue({ emailSent: true, pushSent: false }),
}));

import { getDb } from "../db";
import { storagePutRaw } from "../storage";
import { alertFounder } from "./founderAlert";
import {
  runDatabaseBackup,
  restoreBackup,
  createBackup,
  getBackupStatus,
  listBackups,
  getBackupStats,
} from "./backupService";

function mockDbWithRows(rowsPerTable: unknown[] = []) {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockResolvedValue(rowsPerTable),
  };
}

describe("backupService (real implementation)", () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset();
    vi.mocked(storagePutRaw).mockReset();
    vi.mocked(alertFounder).mockClear();
  });

  it("fails honestly (no fake success) when there is no DB connection", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    const result = await runDatabaseBackup("full");

    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/DATABASE_URL/);
    expect(storagePutRaw).not.toHaveBeenCalled();
    expect(alertFounder).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("no database connection") }),
    );
  });

  it("exports real rows from the DB, gzips them, and uploads via storagePutRaw when durable storage is configured", async () => {
    vi.mocked(getDb).mockResolvedValue(mockDbWithRows([{ id: 1 }]) as any);
    vi.mocked(storagePutRaw).mockResolvedValue({
      key: "backups/db-backup-test.json.gz",
      url: "https://cdn.example.com/backups/db-backup-test.json.gz",
      durable: true,
    });

    const result = await runDatabaseBackup("full");

    expect(result.status).toBe("completed");
    expect(result.durable).toBe(true);
    expect(result.location).toBe("https://cdn.example.com/backups/db-backup-test.json.gz");
    expect(result.totalRows).toBeGreaterThan(0);
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/); // real sha256, not a mock string
    expect(storagePutRaw).toHaveBeenCalledWith(
      expect.stringContaining("backups/"),
      expect.any(Buffer),
      "application/gzip",
    );
    // Success + durable + no table errors → no founder alert needed.
    expect(alertFounder).not.toHaveBeenCalled();
  });

  it("alerts the founder when the backup lands on non-durable local disk", async () => {
    vi.mocked(getDb).mockResolvedValue(mockDbWithRows([]) as any);
    vi.mocked(storagePutRaw).mockResolvedValue({
      key: "backups/db-backup-test.json.gz",
      url: "file:///tmp/grayarx-backups/db-backup-test.json.gz",
      durable: false,
      localPath: "/tmp/grayarx-backups/db-backup-test.json.gz",
    });

    const result = await runDatabaseBackup("full");

    expect(result.status).toBe("completed");
    expect(result.durable).toBe(false);
    expect(alertFounder).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("NOT durable") }),
    );
  });

  it("continues past a single failing table and records the error instead of aborting the whole backup", async () => {
    const db = {
      select: vi.fn().mockReturnThis(),
      from: vi
        .fn()
        .mockRejectedValueOnce(new Error("table doesn't exist"))
        .mockResolvedValue([{ id: 1 }]),
    };
    vi.mocked(getDb).mockResolvedValue(db as any);
    vi.mocked(storagePutRaw).mockResolvedValue({
      key: "backups/db-backup-test.json.gz",
      url: "https://cdn.example.com/backups/db-backup-test.json.gz",
      durable: true,
    });

    const result = await runDatabaseBackup("full");

    expect(result.status).toBe("completed");
    expect(result.tableErrors.length).toBe(1);
    expect(result.tableErrors[0]).toMatch(/table doesn't exist/);
  });

  it("createBackup/getBackupStatus/listBackups round-trip through the real metadata store", async () => {
    vi.mocked(getDb).mockResolvedValue(mockDbWithRows([]) as any);
    vi.mocked(storagePutRaw).mockResolvedValue({
      key: "backups/db-backup-a.json.gz",
      url: "https://cdn.example.com/backups/db-backup-a.json.gz",
      durable: true,
    });

    const id = await createBackup("full");
    expect(typeof id).toBe("string");

    const status = getBackupStatus(id);
    expect(status).toHaveProperty("id", id);
    expect(status).toHaveProperty("status", "completed");
    expect(status).toHaveProperty("createdAt");

    const backups = listBackups();
    expect(Array.isArray(backups)).toBe(true);
    expect(backups.some((b) => b.id === id)).toBe(true);

    const stats = getBackupStats();
    expect(stats.totalBackups).toBeGreaterThan(0);
  });

  it("restoreBackup never writes to the database — it only validates and returns manual instructions", async () => {
    vi.mocked(getDb).mockResolvedValue(mockDbWithRows([]) as any);
    vi.mocked(storagePutRaw).mockResolvedValue({
      key: "backups/db-backup-b.json.gz",
      url: "https://cdn.example.com/backups/db-backup-b.json.gz",
      durable: true,
    });

    const id = await createBackup("full");
    const result = await restoreBackup(id);

    expect(result.success).toBe(true);
    expect(result.automated).toBe(false);
    expect(result.manualRestoreRequired).toBe(true);
    expect(result.instructions).toMatch(/MANUAL/);
    // The mocked db object should never receive an insert/update call from restore.
    expect(getDb).toHaveBeenCalledTimes(1); // only from createBackup's runDatabaseBackup call
  });

  it("restoreBackup reports failure honestly for an unknown backup id", async () => {
    const result = await restoreBackup("does-not-exist");
    expect(result.success).toBe(false);
    expect(result.automated).toBe(false);
    expect(result.error).toMatch(/No backup with id/);
  });
});
