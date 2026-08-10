/**
 * Shared CSV inventory commit — used by manual import and live stock sync.
 * Match by externalRef (stock/VIN); sold units stay sold unless CSV says sold/reserved.
 */

import {
  addVehiclePhoto,
  createVehicle,
  deleteVehiclePhoto,
  findVehicleByExternalRef,
  listVehiclePhotos,
  listVehiclesWithExternalRef,
  logAgentActivity,
  updateVehicle,
} from "../db";
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
  // Stay under typical Cloudflare/proxy ~100s limits for the whole request.
  const MIRROR_DEADLINE_MS = 55_000;

  const resolvePhotos = async (urls: string[], title: string, externalRef: string | null) => {
    const res = await resolveImportPhotoUrls(urls, { title, externalRef }, {
      skipMirror: opts.skipPhotoMirror,
      concurrency: 4,
      perPhotoMs: 8_000,
      deadlineMs: MIRROR_DEADLINE_MS,
      startedAt,
    });
    photosMirrored += res.mirrored;
    photosLinked += res.linked;
    if (res.skippedMirror && !opts.skipPhotoMirror) {
      photoMirrorSkippedReason =
        "Photo save needs S3/R2 storage on the server — cars imported with original image links instead.";
    }
    return res.urls;
  };

  for (const row of preview.validRows) {
    if (row.externalRef) {
      seenRefs.add(row.externalRef.trim().toLowerCase());
      const existing = await findVehicleByExternalRef(
        row.externalRef,
        opts.dealershipId,
      );
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

        // Re-import can refresh listing photos when the CSV primary URL changed
        // (e.g. fixing mismatched demo stock photos). Unchanged URLs leave the
        // gallery alone so nightly sync does not thrash photo rows.
        const csvPrimary = row.imageUrls[0] ?? row.imageUrl;
        if (csvPrimary) {
          const prevPrimary =
            (existing as { primaryPhotoUrl?: string | null }).primaryPhotoUrl ||
            (existing as { imageUrl?: string | null }).imageUrl ||
            null;
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
              const existingPhotos = await listVehiclePhotos(existing.id);
              for (const photo of existingPhotos) {
                await deleteVehiclePhoto(photo.id);
              }
              for (let pi = 0; pi < resolved.length; pi++) {
                const stored = resolved[pi];
                if (!stored) continue;
                await addVehiclePhoto({
                  vehicleId: existing.id,
                  url: stored,
                  storageKey: `import/${existing.id}/${pi}-${Date.now()}`,
                  position: pi,
                });
              }
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
        for (let pi = 0; pi < resolved.length; pi++) {
          const stored = resolved[pi];
          if (!stored) continue;
          await addVehiclePhoto({
            vehicleId,
            url: stored,
            storageKey: `import/${vehicleId}/${pi}-${Date.now()}`,
            position: pi,
            caption: null,
          });
        }
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
