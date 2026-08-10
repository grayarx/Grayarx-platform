/**
 * Shared CSV inventory commit — used by manual import and live stock sync.
 * Match by externalRef (stock/VIN); sold units stay sold unless CSV says sold/reserved.
 *
 * Performance notes (1000-car demos):
 * - Prefetch existing stock refs once (no per-row SELECT)
 * - Bulk-insert gallery photos (one INSERT per vehicle / chunk)
 */

import {
  addVehiclePhotosBulk,
  createVehicle,
  deleteVehiclePhotosForVehicle,
  getDb,
  listVehiclesWithExternalRef,
  logAgentActivity,
  updateVehicle,
} from "../db";
import { vehicles } from "../../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { parseInventoryCsv } from "./csvInventory";
import { shouldApplyCsvStatus } from "./csvStatusGuard";
import { resolveImportPhotoUrls } from "./photoDownloader";

export type InventoryCommitResult = {
  created: number;
  updated: number;
  unchanged: number;
  markedSold: number;
  importedWithWarnings: number;
  skipped: Array<{ index: number; reason: string }>;
  duplicatesInCsv: string[];
  failedRows: Array<{ title: string; reason: string }>;
  /** Alias for updated — older clients */
  repaired: number;
  photosMirrored?: number;
  photosLinked?: number;
  photoMirrorSkippedReason?: string | null;
};

type ExistingVehicle = {
  id: number;
  externalRef: string | null;
  status: string | null;
  price: string | number | null;
  km: number | null;
  imageUrl: string | null;
  primaryPhotoUrl: string | null;
};

async function loadExistingByRef(
  dealershipId: number,
): Promise<Map<string, ExistingVehicle>> {
  const db = await getDb();
  const map = new Map<string, ExistingVehicle>();
  if (!db) return map;
  const rows = await db
    .select({
      id: vehicles.id,
      externalRef: vehicles.externalRef,
      status: vehicles.status,
      price: vehicles.price,
      km: vehicles.km,
      imageUrl: vehicles.imageUrl,
      primaryPhotoUrl: vehicles.primaryPhotoUrl,
    })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.dealershipId, dealershipId),
        sql`${vehicles.externalRef} IS NOT NULL`,
        sql`TRIM(${vehicles.externalRef}) <> ''`,
      ),
    );
  for (const row of rows) {
    const ref = (row.externalRef ?? "").trim().toLowerCase();
    if (ref) map.set(ref, row);
  }
  return map;
}

function galleryRows(
  vehicleId: number,
  urls: string[],
): Array<{
  vehicleId: number;
  url: string;
  storageKey: string;
  position: number;
  caption: null;
}> {
  const ts = Date.now();
  return urls
    .filter(Boolean)
    .map((url, pi) => ({
      vehicleId,
      url,
      storageKey: `import/${vehicleId}/${pi}-${ts}`,
      position: pi,
      caption: null,
    }));
}

export async function commitInventoryCsv(opts: {
  csv: string;
  dealershipId: number;
  ownerUserId: number | null;
  skipPhotoMirror?: boolean;
  markMissingAsSold?: boolean;
}): Promise<InventoryCommitResult> {
  const preview = parseInventoryCsv(opts.csv);
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let importedWithWarnings = 0;
  let photosMirrored = 0;
  let photosLinked = 0;
  let photoMirrorSkippedReason: string | null = null;
  const failedRows: Array<{ title: string; reason: string }> = [];
  const seenRefs = new Set<string>();
  const syncedAt = new Date();
  const startedAt = Date.now();
  const MIRROR_DEADLINE_MS = 55_000;

  const existingByRef = await loadExistingByRef(opts.dealershipId);

  const resolvePhotos = async (
    urls: string[],
    title: string,
    externalRef: string | null,
  ) => {
    const res = await resolveImportPhotoUrls(
      urls,
      { title, externalRef },
      {
        skipMirror: opts.skipPhotoMirror,
        concurrency: 4,
        perPhotoMs: 8_000,
        deadlineMs: MIRROR_DEADLINE_MS,
        startedAt,
      },
    );
    photosMirrored += res.mirrored;
    photosLinked += res.linked;
    if (res.skippedMirror && !opts.skipPhotoMirror) {
      photoMirrorSkippedReason =
        "Photo save needs S3/R2 storage on the server — cars imported with original image links instead.";
    }
    return res.urls;
  };

  for (const row of preview.validRows) {
    const refKey = row.externalRef?.trim().toLowerCase() || "";
    if (refKey) {
      seenRefs.add(refKey);
      const existing = existingByRef.get(refKey);
      if (existing) {
        const patch: Record<string, unknown> = { lastSyncedAt: syncedAt };
        if (
          row.price != null &&
          row.price > 1 &&
          String(row.price) !== String(existing.price)
        ) {
          patch.price = String(row.price);
        }
        if (shouldApplyCsvStatus(existing.status, row.status)) {
          patch.status = row.status;
        }
        if (row.km != null && row.km !== existing.km) {
          patch.km = row.km;
        }

        const csvPrimary = row.imageUrls[0] ?? row.imageUrl;
        if (csvPrimary) {
          const prevPrimary = existing.primaryPhotoUrl || existing.imageUrl || null;
          if (csvPrimary !== prevPrimary) {
            const sourceUrls =
              row.imageUrls.length > 0
                ? row.imageUrls
                : csvPrimary
                  ? [csvPrimary]
                  : [];
            const resolved = await resolvePhotos(
              sourceUrls,
              row.title,
              row.externalRef,
            );
            const primary = resolved[0] || csvPrimary;
            patch.imageUrl = primary;
            patch.primaryPhotoUrl = primary;
            if (resolved.length > 0) {
              await deleteVehiclePhotosForVehicle(existing.id);
              await addVehiclePhotosBulk(galleryRows(existing.id, resolved));
            }
          }
        }

        const changedKeys = Object.keys(patch).filter((k) => k !== "lastSyncedAt");
        await updateVehicle(existing.id, patch as never);
        if (changedKeys.length > 0) {
          updated++;
          existingByRef.set(refKey, {
            ...existing,
            price: (patch.price as string) ?? existing.price,
            km: (patch.km as number) ?? existing.km,
            status: (patch.status as string) ?? existing.status,
            imageUrl: (patch.imageUrl as string) ?? existing.imageUrl,
            primaryPhotoUrl:
              (patch.primaryPhotoUrl as string) ?? existing.primaryPhotoUrl,
          });
        } else unchanged++;
        continue;
      }
    }

    try {
      const sourceUrls =
        row.imageUrls.length > 0
          ? row.imageUrls
          : row.imageUrl
            ? [row.imageUrl]
            : [];
      const resolved = await resolvePhotos(sourceUrls, row.title, row.externalRef);
      const primary = resolved[0] ?? row.imageUrl ?? null;
      const result = await createVehicle({
        ownerUserId: opts.ownerUserId,
        dealershipId: opts.dealershipId,
        title: row.title,
        make: row.make,
        model: row.model,
        year: row.year,
        price: row.price != null ? String(row.price) : "1",
        km: row.km,
        fuel: row.fuel,
        transmission: row.transmission,
        location: row.location,
        imageUrl: primary,
        primaryPhotoUrl: primary,
        description: row.description,
        externalRef: row.externalRef,
        vin: row.vin,
        lastSyncedAt: syncedAt,
        ...(row.status
          ? {
              status: row.status as "available" | "sold" | "reserved",
            }
          : {}),
      });
      const vehicleId = (result as { insertId?: number })?.insertId;
      if (vehicleId && resolved.length > 0) {
        await addVehiclePhotosBulk(galleryRows(vehicleId, resolved));
      }
      if (vehicleId && refKey) {
        existingByRef.set(refKey, {
          id: vehicleId,
          externalRef: row.externalRef,
          status: row.status ?? "available",
          price: row.price != null ? String(row.price) : "1",
          km: row.km,
          imageUrl: primary,
          primaryPhotoUrl: primary,
        });
      }
      created++;
      if (row.dataWarnings.length > 0 || row.photoWarnings.length > 0) {
        importedWithWarnings++;
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failedRows.push({ title: row.title, reason });
    }
  }

  let markedSold = 0;
  if (opts.markMissingAsSold && seenRefs.size > 0) {
    const existing = await listVehiclesWithExternalRef(opts.dealershipId);
    for (const v of existing) {
      const ref = (v.externalRef ?? "").trim().toLowerCase();
      if (!ref || seenRefs.has(ref)) continue;
      if (v.status === "sold") continue;
      await updateVehicle(v.id, {
        status: "sold",
        lastSyncedAt: syncedAt,
      } as never);
      markedSold++;
    }
  }

  await logAgentActivity({
    agentId: "improvement",
    action: "inventory_imported",
    subjectType: null,
    summary: `Imported ${created} new vehicle${created === 1 ? "" : "s"} via CSV (${updated} updated, ${unchanged} unchanged, ${markedSold} marked sold, ${preview.skippedRows.length} skipped, ${failedRows.length} failed).`,
    payload: {
      created,
      updated,
      unchanged,
      markedSold,
      skipped: preview.skippedRows.length,
      duplicatesInCsv: preview.duplicateRefs.length,
      failed: failedRows.length,
      dealershipId: opts.dealershipId,
      photosMirrored,
      photosLinked,
      photoMirrorSkippedReason,
    },
  });

  return {
    created,
    updated,
    unchanged,
    markedSold,
    importedWithWarnings,
    skipped: preview.skippedRows,
    duplicatesInCsv: preview.duplicateRefs,
    failedRows,
    repaired: updated,
    photosMirrored,
    photosLinked,
    photoMirrorSkippedReason,
  };
}
