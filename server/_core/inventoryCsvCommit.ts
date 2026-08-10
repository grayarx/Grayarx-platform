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
import { downloadAndStorePhoto } from "./photoDownloader";

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
  const failedRows: Array<{ title: string; reason: string }> = [];
  const seenRefs = new Set<string>();
  const syncedAt = new Date();

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
            const storedPrimary = opts.skipPhotoMirror
              ? null
              : await downloadAndStorePhoto(
                  csvPrimary,
                  row.title,
                  row.externalRef,
                );
            const primary = storedPrimary || csvPrimary;
            patch.imageUrl = primary;
            patch.primaryPhotoUrl = primary;
            if (row.imageUrls.length > 0) {
              const existingPhotos = await listVehiclePhotos(existing.id);
              for (const photo of existingPhotos) {
                await deleteVehiclePhoto(photo.id);
              }
              for (let pi = 0; pi < row.imageUrls.length; pi++) {
                const rawUrl = row.imageUrls[pi];
                const stored =
                  pi === 0
                    ? primary
                    : opts.skipPhotoMirror
                      ? rawUrl
                      : (await downloadAndStorePhoto(
                          rawUrl,
                          row.title,
                          row.externalRef,
                        )) || rawUrl;
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
      const primaryUrl = row.imageUrls[0] ?? row.imageUrl;
      const storedImageUrl = opts.skipPhotoMirror
        ? null
        : await downloadAndStorePhoto(
            primaryUrl,
            row.title,
            row.externalRef,
          );
      const primary = storedImageUrl || primaryUrl;
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
      if (vehicleId && row.imageUrls.length > 0) {
        for (let pi = 0; pi < row.imageUrls.length; pi++) {
          const rawUrl = row.imageUrls[pi];
          const stored =
            pi === 0
              ? primary
              : opts.skipPhotoMirror
                ? rawUrl
                : (await downloadAndStorePhoto(
                    rawUrl,
                    row.title,
                    row.externalRef,
                  )) || rawUrl;
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
  };
}
