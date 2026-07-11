/**
 * Removes the first-import duplicate vehicles (IDs 90001–90016).
 * These are exact duplicates of the second import (90017–90066).
 * Deletes vehicle_photos rows first, then the vehicles.
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
const url = new URL(DATABASE_URL);
const conn = await createConnection({
  host: url.hostname, port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""), ssl: { rejectUnauthorized: false },
});

// The first CSV import — duplicates of the second import (90017–90066)
const DUPLICATE_IDS = [90001,90002,90003,90004,90005,90006,90007,90008,90009,90010,90011,90012,90013,90014,90015,90016];

console.log(`\nRemoving ${DUPLICATE_IDS.length} duplicate vehicles (IDs ${DUPLICATE_IDS[0]}–${DUPLICATE_IDS[DUPLICATE_IDS.length-1]})...\n`);

// First show what we're deleting
const [toDelete] = await conn.execute(
  `SELECT id, title FROM vehicles WHERE id IN (${DUPLICATE_IDS.join(",")}) ORDER BY id`
);
for (const v of toDelete) {
  console.log(`  ✗ [${v.id}] ${v.title}`);
}

// Delete vehicle_photos first (foreign key constraint)
await conn.execute(
  `DELETE FROM vehicle_photos WHERE vehicleId IN (${DUPLICATE_IDS.join(",")})`
);

// Delete the vehicles
await conn.execute(
  `DELETE FROM vehicles WHERE id IN (${DUPLICATE_IDS.join(",")})`
);

const [remaining] = await conn.execute("SELECT COUNT(*) as cnt FROM vehicles");
console.log(`\n✅ Done. ${DUPLICATE_IDS.length} duplicates removed. ${remaining[0].cnt} vehicles remain.\n`);

await conn.end();
