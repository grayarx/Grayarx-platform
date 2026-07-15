/**
 * Fill missing year / fuel / km / transmission on demo exotic stock so the
 * showroom cards look complete for dealer demos. Photos are already present;
 * this only patches null metadata by make+model.
 *
 * Scoped to DEMO_DEALERSHIP_ID (default 1) so real pilot yards are never touched.
 * Never writes prices — R1 placeholders must be fixed by dealers, not heal.
 */
import { getDb, listVehicles, updateVehicle } from "../db";

type Meta = {
  year: number;
  fuel: string;
  km: number;
  transmission: string;
};

const BY_KEY: Record<string, Meta> = {
  "koenigsegg|jesko absolut": { year: 2023, fuel: "Petrol", km: 120, transmission: "Automatic" },
  "mclaren|p1": { year: 2015, fuel: "Hybrid", km: 2800, transmission: "Automatic" },
  "ferrari|enzo": { year: 2003, fuel: "Petrol", km: 4500, transmission: "Manual" },
  "lamborghini|centenario": { year: 2017, fuel: "Petrol", km: 900, transmission: "Automatic" },
  "bugatti|divo": { year: 2021, fuel: "Petrol", km: 350, transmission: "Automatic" },
  "rimac|nevera": { year: 2023, fuel: "Electric", km: 480, transmission: "Automatic" },
  "porsche|911 gt3 rs": { year: 2023, fuel: "Petrol", km: 2100, transmission: "Automatic" },
  "aston martin|valkyrie": { year: 2022, fuel: "Hybrid", km: 600, transmission: "Automatic" },
  "mercedes-amg|one": { year: 2023, fuel: "Hybrid", km: 750, transmission: "Automatic" },
  "pagani|utopia": { year: 2023, fuel: "Petrol", km: 400, transmission: "Manual" },
  "mclaren|senna": { year: 2019, fuel: "Petrol", km: 3200, transmission: "Automatic" },
  "ferrari|f40": { year: 1991, fuel: "Petrol", km: 12000, transmission: "Manual" },
  "lamborghini|revuelto": { year: 2024, fuel: "Hybrid", km: 200, transmission: "Automatic" },
  "pagani|huayra roadster bc": { year: 2020, fuel: "Petrol", km: 1100, transmission: "Automatic" },
  "koenigsegg|agera rs": { year: 2017, fuel: "Petrol", km: 1800, transmission: "Automatic" },
  "bugatti|chiron super sport": { year: 2022, fuel: "Petrol", km: 550, transmission: "Automatic" },
};

function key(make: string | null | undefined, model: string | null | undefined): string {
  return `${(make ?? "").trim().toLowerCase()}|${(model ?? "").trim().toLowerCase()}`;
}

function demoDealershipId(): number {
  const n = Number(process.env.DEMO_DEALERSHIP_ID || process.env.WHATSAPP_DEALERSHIP_ID || "1");
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function healDemoInventoryMetadata(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const dealershipId = demoDealershipId();
  const rows = await listVehicles(500, { dealershipId, excludeSold: true });
  let updated = 0;

  for (const v of rows) {
    const meta = BY_KEY[key(v.make, v.model)];
    if (!meta) continue;

    const patch: Partial<Meta> & { year?: number; fuel?: string; km?: number; transmission?: string } = {};
    if (v.year == null) patch.year = meta.year;
    if (!v.fuel?.trim()) patch.fuel = meta.fuel;
    if (v.km == null || v.km === 0 || v.km === 1) patch.km = meta.km;
    if (!v.transmission?.trim()) patch.transmission = meta.transmission;

    if (Object.keys(patch).length === 0) continue;
    await updateVehicle(v.id, patch);
    updated += 1;
  }

  if (updated > 0) {
    console.log(
      `[Startup] Healed metadata on ${updated} demo vehicle(s) (dealership ${dealershipId})`,
    );
  }
  return updated;
}
