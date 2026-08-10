/**
 * One-time cleanup of the seeded "GrayArx Demo Dealership" stock.
 *
 * The public marketplace already hides the demo yard (see showroom.list), but
 * the demo cars still exist in the database, so anyone logged into the demo
 * dealership still sees them. Set the env var PURGE_DEMO_INVENTORY=1 (e.g. on
 * Railway) and redeploy: on boot this deletes the demo dealership's vehicles
 * and their photos, then you can remove the variable again.
 *
 * Safety:
 *  - Only runs when PURGE_DEMO_INVENTORY is truthy.
 *  - Only targets the demo dealership resolved by getDemoDealershipId()
 *    (DEMO_DEALERSHIP_ID env, else the `demo` shortcode / "GrayArx demo" name).
 *  - Idempotent: after the first run there is nothing left to delete.
 *  - The vehicle-creating seed only runs on an empty DB, so demo cars will not
 *    reappear once deleted.
 */
import { inArray } from "drizzle-orm";
import { getDb, getDemoDealershipId } from "../db";
import { vehicles, vehiclePhotos, dealerships } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function isEnabled(): boolean {
  const v = (process.env.PURGE_DEMO_INVENTORY || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export async function purgeDemoInventoryIfRequested(): Promise<void> {
  if (!isEnabled()) return;

  const db = await getDb();
  if (!db) return;

  const demoId = await getDemoDealershipId();
  if (demoId == null) {
    console.log("[PurgeDemo] No demo dealership found — nothing to purge.");
    return;
  }

  const [dealer] = await db
    .select({ id: dealerships.id, name: dealerships.name })
    .from(dealerships)
    .where(eq(dealerships.id, demoId))
    .limit(1);

  const ids = (
    await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.dealershipId, demoId))
  ).map((r) => r.id);

  if (ids.length === 0) {
    console.log(
      `[PurgeDemo] Demo dealership ${demoId} (${dealer?.name ?? "?"}) already has no vehicles.`,
    );
    return;
  }

  await db.delete(vehiclePhotos).where(inArray(vehiclePhotos.vehicleId, ids));
  await db.delete(vehicles).where(eq(vehicles.dealershipId, demoId));

  console.log(
    `[PurgeDemo] Removed ${ids.length} demo vehicle(s) from dealership ${demoId} ` +
      `(${dealer?.name ?? "?"}). You can now unset PURGE_DEMO_INVENTORY.`,
  );
}
