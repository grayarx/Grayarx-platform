/**
 * Checks current photo state across all vehicles
 */
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(join(__dir, "..", ".env"), "utf8");
let DATABASE_URL = "";
for (const line of envText.split("\n")) {
  const m = line.match(/^DATABASE_URL=["']?(.+?)["']?\s*$/);
  if (m) { DATABASE_URL = m[1]; break; }
}
if (!DATABASE_URL) throw new Error("DATABASE_URL not found in .env");

const url = new URL(DATABASE_URL);
const conn = await createConnection({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: false },
});

const [vehicles] = await conn.execute(
  "SELECT id, make, model, title, imageUrl, primaryPhotoUrl FROM vehicles ORDER BY id LIMIT 20"
);

console.log(`\n=== VEHICLE PHOTO SNAPSHOT (first 20) ===\n`);
for (const v of vehicles) {
  console.log(`[${v.id}] ${v.title}`);
  console.log(`  imageUrl: ${v.imageUrl || "(null)"}`);
  console.log(`  primaryPhotoUrl: ${v.primaryPhotoUrl || "(null)"}`);
}

const [photoRows] = await conn.execute(
  "SELECT vehicleId, COUNT(*) as cnt FROM vehicle_photos GROUP BY vehicleId ORDER BY vehicleId LIMIT 20"
);
console.log(`\n=== vehicle_photos photo count per vehicle (first 20 vehicles) ===`);
for (const row of photoRows) {
  console.log(`  vehicleId=${row.vehicleId}: ${row.cnt} photos`);
}

const [total] = await conn.execute("SELECT COUNT(*) as cnt FROM vehicles");
const [photoTotal] = await conn.execute("SELECT COUNT(DISTINCT vehicleId) as cnt FROM vehicle_photos");
console.log(`\nTotal vehicles: ${total[0].cnt}`);
console.log(`Vehicles with photos in vehicle_photos: ${photoTotal[0].cnt}`);

await conn.end();
