/**
 * Widens URL columns in vehicle_photos and vehicles to MEDIUMTEXT so they can
 * store base64 data URLs (needed for Railway where the filesystem is ephemeral).
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

console.log("Running photo URL column migrations...\n");

await conn.execute("ALTER TABLE vehicle_photos MODIFY COLUMN url MEDIUMTEXT NOT NULL");
console.log("  ✓  vehicle_photos.url → MEDIUMTEXT NOT NULL");

await conn.execute("ALTER TABLE vehicles MODIFY COLUMN imageUrl MEDIUMTEXT");
console.log("  ✓  vehicles.imageUrl → MEDIUMTEXT");

await conn.execute("ALTER TABLE vehicles MODIFY COLUMN primaryPhotoUrl MEDIUMTEXT");
console.log("  ✓  vehicles.primaryPhotoUrl → MEDIUMTEXT");

await conn.end();
console.log("\nMigration complete.\n");
