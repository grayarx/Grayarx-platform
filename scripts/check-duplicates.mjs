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
const url = new URL(DATABASE_URL);
const conn = await createConnection({
  host: url.hostname, port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""), ssl: { rejectUnauthorized: false },
});
const [dups] = await conn.execute(
  "SELECT COUNT(*) as cnt, make, model, year FROM vehicles GROUP BY make, model, year HAVING cnt > 1 ORDER BY cnt DESC LIMIT 10"
);
console.log("\nDuplicate vehicles (same make+model+year):");
for (const r of dups) console.log(" ", r.cnt + "x", r.make, r.model, r.year);

const [total] = await conn.execute("SELECT COUNT(*) as cnt FROM vehicles");
const [withPhotos] = await conn.execute(
  "SELECT COUNT(DISTINCT vehicleId) as cnt FROM vehicle_photos"
);
const [nullPhotos] = await conn.execute(
  "SELECT COUNT(*) as cnt FROM vehicles WHERE primaryPhotoUrl IS NULL OR primaryPhotoUrl = ''"
);
console.log("\nTotal vehicles:", total[0].cnt);
console.log("Vehicles with photos in vehicle_photos:", withPhotos[0].cnt);
console.log("Vehicles with NULL primaryPhotoUrl:", nullPhotos[0].cnt);
await conn.end();
