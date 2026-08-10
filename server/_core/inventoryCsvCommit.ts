/**
 * Shared CSV inventory commit — used by manual import and live stock sync.
 * Match by externalRef (stock/VIN); sold units stay sold unless CSV says sold/reserved.
 *
 * Fast path (skipPhotoMirror): bulk-insert vehicles + gallery photos so a
 * 1000-car demo CSV finishes in one request instead of thousands of round-trips.
 */

import type { InsertVehicle } from "../../drizzle/schema";
import { vehicles } from "../../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import {
  addVehiclePhotosBulk,
  createVehicle,
  createVehiclesBulk,
  deleteVehiclePhotosForVehicle,
  findVehicleIdsByExternalRefs,
  getDb,
  listVehiclesWithExternalRef,
  logAgentActivity,
  updateVehicle,
} from "../db";
import { parseInventoryCsv, type ParsedVehicleRow } from "./csvInventory";
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

function galleryRows(vehicleId: number, urls: string[]) {
  const ts = Date.now();
  return urls.filter(Boolean).map((url, pi) => ({
    vehicleId,
    url,
    storageKey: `import/${vehicleId}/${pi}-${ts}`,
    position: pi,
    caption: null as null,
  }));
}

function rowToInsert(
  row: ParsedVehicleRow,
  opts: { ownerUserId: number | null; dealershipId: number; syncedAt: Date },
  primary: string | null,
): InsertVehicle {
  return {
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
    lastSyncedAt: opts.syncedAt,
    ...(row.status
      ? { status: row.status as "available" | "sold" | "reserved" }
      : {}),
  };
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

  // -------- Fast path: keep external URLs, bulk insert --------
  if (opts.skipPhotoMirror) {
    const toCreate: ParsedVehicleRow[] = [];

    for (const row of preview.validRows) {
      const refKey = row.externalRef?.trim().toLowerCase() || "";
      if (refKey) seenRefs.add(refKey);

      if (refKey && existingByRef.has(refKey)) {
        const existing = existingByRef.get(refKey)!;
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
        if (csvPrimary && csvPrimary !== (existing.primaryPhotoUrl || existing.imageUrl)) {
          const urls = row.imageUrls.length > 0 ? row.imageUrls : [csvPrimary];
          patch.imageUrl = urls[0];
          patch.primaryPhotoUrl = urls[0];
          await deleteVehiclePhotosForVehicle(existing.id);
          await addVehiclePhotosBulk(galleryRows(existing.id, urls));
        }
        const changedKeys = Object.keys(patch).filter((k) => k !== "lastSyncedAt");
        await updateVehicle(existing.id, patch as never);
        if (changedKeys.length > 0) updated++;
        else unchanged++;
        if (row.dataWarnings.length > 0 || row.photoWarnings.length > 0) {
          importedWithWarnings++;
        }
        continue;
      }

      toCreate.push(row);
    }

    // Bulk create in waves, then attach galleries in one INSERT wave.
    const WAVE = 150;
    for (let i = 0; i < toCreate.length; i += WAVE) {
      const wave = toCreate.slice(i, i + WAVE);
      const inserts: InsertVehicle[] = [];
      const waveRefs: string[] = [];
      const waveUrlSets: string[][] = [];

      for (const row of wave) {
        const urls =
          row.imageUrls.length > 0
            ? row.imageUrls
            : row.imageUrl
              ? [row.imageUrl]
              : [];
        photosLinked += urls.length;
        const primary = urls[0] ?? row.imageUrl ?? null;
        const ref = row.externalRef?.trim() || "";
        if (!ref) {
          // No stock ref — fall back to single insert (rare).
          try {
            const result = await createVehicle(
              rowToInsert(row, opts, primary),
            );
            const vehicleId = (result as { insertId?: number })?.insertId;
            if (vehicleId && urls.length) {
              await addVehiclePhotosBulk(galleryRows(vehicleId, urls));
            }
            created++;
          } catch (err) {
            failedRows.push({
              title: row.title,
              reason: err instanceof Error ? err.message : String(err),
            });
          }
          continue;
        }
        inserts.push(rowToInsert(row, opts, primary));
        waveRefs.push(ref);
        waveUrlSets.push(urls);
      }

      if (inserts.length === 0) continue;

      try {
        await createVehiclesBulk(inserts);
        const idMap = await findVehicleIdsByExternalRefs(opts.dealershipId, waveRefs);
        const photoPayload: Array<{
          vehicleId: number;
          url: string;
          storageKey: string;
          position: number;
          caption: null;
        }> = [];
        for (let j = 0; j < waveRefs.length; j++) {
          const id = idMap.get(waveRefs[j].toLowerCase());
          if (!id) {
            failedRows.push({
              title: inserts[j]?.title ?? waveRefs[j],
              reason: "Created but could not resolve id for photo attach",
            });
            continue;
          }
          created++;
          photoPayload.push(...galleryRows(id, waveUrlSets[j]));
          existingByRef.set(waveRefs[j].toLowerCase(), {
            id,
            externalRef: waveRefs[j],
            status: "available",
            price: inserts[j]?.price ?? null,
            km: inserts[j]?.km ?? null,
            imageUrl: (inserts[j]?.imageUrl as string) ?? null,
            primaryPhotoUrl: (inserts[j]?.primaryPhotoUrl as string) ?? null,
          });
        }
        if (photoPayload.length > 0) {
          await addVehiclePhotosBulk(photoPayload);
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        for (const row of wave) {
          if (row.externalRef?.trim()) {
            failedRows.push({ title: row.title, reason });
          }
        }
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
      summary: `Imported ${created} new vehicle${created === 1 ? "" : "s"} via CSV fast-path (${updated} updated, ${unchanged} unchanged, ${markedSold} marked sold).`,
      payload: {
        created,
        updated,
        unchanged,
        markedSold,
        failed: failedRows.length,
        dealershipId: opts.dealershipId,
        fastPath: true,
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

  // -------- Slow path: mirror photos (per-row) --------
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
        if (changedKeys.length > 0) updated++;
        else unchanged++;
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
      const result = await createVehicle(rowToInsert(row, opts, primary));
      const vehicleId = (result as { insertId?: number })?.insertId;
      if (vehicleId && resolved.length > 0) {
        await addVehiclePhotosBulk(galleryRows(vehicleId, resolved));
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
    summary: `Imported ${created} new vehicle${created === 1 ? "" : "s"} via CSV (${updated} updated, ${unchanged} unchanged, ${markedSold} marked sold).`,
    payload: {
      created,
      updated,
      unchanged,
      markedSold,
      failed: failedRows.length,
      dealershipId: opts.dealershipId,
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
