/**
 * Bulk-replaces broken source.unsplash.com photo URLs on imported vehicles
 * with real images.unsplash.com CDN URLs that load without an API key.
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

// Real Unsplash CDN photo IDs — these work without any API key.
// Assigned per make so each brand gets visually appropriate images.
const MAKE_PHOTOS = {
  Ferrari:        ["1492144534655-ae79c964c9d7","1544636331-e26879cd4d9b","1541443131876-a4246b4c8f4f","1503736280353-7e6692767b70","1568605117036-5fe5e7bab0b7"],
  Bugatti:        ["1609521263047-f8f205293f24","1615906655593-ad0386982a0f","1583121274602-3e2820c69888","1558618666-fcd25c85cd64","1492144534655-ae79c964c9d7"],
  Koenigsegg:     ["1471444928139-48c5bf5173f8","1503736280353-7e6692767b70","1544636331-e26879cd4d9b","1568605117036-5fe5e7bab0b7","1541443131876-a4246b4c8f4f"],
  Pagani:         ["1606664515524-ed2f786a0bd6","1568605117036-5fe5e7bab0b7","1503736280353-7e6692767b70","1492144534655-ae79c964c9d7","1541443131876-a4246b4c8f4f"],
  Lamborghini:    ["1525609004556-c46c7d6cf023","1492144534655-ae79c964c9d7","1544636331-e26879cd4d9b","1568605117036-5fe5e7bab0b7","1503736280353-7e6692767b70"],
  McLaren:        ["1558618666-fcd25c85cd64","1606664515524-ed2f786a0bd6","1583121274602-3e2820c69888","1544636331-e26879cd4d9b","1492144534655-ae79c964c9d7"],
  Porsche:        ["1583121274602-3e2820c69888","1558618666-fcd25c85cd64","1525609004556-c46c7d6cf023","1503736280353-7e6692767b70","1568605117036-5fe5e7bab0b7"],
  "Aston Martin": ["1614200187524-dc4b892acf16","1492144534655-ae79c964c9d7","1544636331-e26879cd4d9b","1541443131876-a4246b4c8f4f","1568605117036-5fe5e7bab0b7"],
  Rimac:          ["1593941707882-a56bbc8df3f0","1568605117036-5fe5e7bab0b7","1503736280353-7e6692767b70","1558618666-fcd25c85cd64","1492144534655-ae79c964c9d7"],
  "Mercedes-AMG": ["1618843479313-40f8afb4b4d8","1583121274602-3e2820c69888","1544636331-e26879cd4d9b","1492144534655-ae79c964c9d7","1503736280353-7e6692767b70"],
  "Mercedes-Benz":["1618843479313-40f8afb4b4d8","1558618666-fcd25c85cd64","1544636331-e26879cd4d9b","1568605117036-5fe5e7bab0b7","1492144534655-ae79c964c9d7"],
  Ford:           ["1552519507-da3b142c6e3d","1503736280353-7e6692767b70","1583121274602-3e2820c69888","1492144534655-ae79c964c9d7","1541443131876-a4246b4c8f4f"],
  SSC:            ["1471444928139-48c5bf5173f8","1568605117036-5fe5e7bab0b7","1558618666-fcd25c85cd64","1503736280353-7e6692767b70","1492144534655-ae79c964c9d7"],
  Zenvo:          ["1544636331-e26879cd4d9b","1525609004556-c46c7d6cf023","1492144534655-ae79c964c9d7","1541443131876-a4246b4c8f4f","1568605117036-5fe5e7bab0b7"],
  Hennessey:      ["1503736280353-7e6692767b70","1558618666-fcd25c85cd64","1583121274602-3e2820c69888","1492144534655-ae79c964c9d7","1544636331-e26879cd4d9b"],
  Glickenhaus:    ["1568605117036-5fe5e7bab0b7","1471444928139-48c5bf5173f8","1558618666-fcd25c85cd64","1503736280353-7e6692767b70","1492144534655-ae79c964c9d7"],
  Maserati:       ["1606664515524-ed2f786a0bd6","1544636331-e26879cd4d9b","1492144534655-ae79c964c9d7","1583121274602-3e2820c69888","1541443131876-a4246b4c8f4f"],
  Apollo:         ["1614200187524-dc4b892acf16","1568605117036-5fe5e7bab0b7","1558618666-fcd25c85cd64","1492144534655-ae79c964c9d7","1503736280353-7e6692767b70"],
};

const DEFAULT_PHOTOS = [
  "1492144534655-ae79c964c9d7","1544636331-e26879cd4d9b",
  "1568605117036-5fe5e7bab0b7","1558618666-fcd25c85cd64","1503736280353-7e6692767b70",
];

function photoUrl(id) {
  return `https://images.unsplash.com/photo-${id}?w=1200&auto=format&fit=crop`;
}

// Find all vehicles with broken source.unsplash.com URLs
const [rows] = await conn.execute(
  "SELECT id, make, title, imageUrl, primaryPhotoUrl FROM vehicles WHERE imageUrl LIKE '%source.unsplash.com%' OR primaryPhotoUrl LIKE '%source.unsplash.com%'"
);

console.log(`\nFound ${rows.length} vehicles with broken source.unsplash.com URLs\n`);

let fixed = 0;
for (const vehicle of rows) {
  const photos = MAKE_PHOTOS[vehicle.make] ?? DEFAULT_PHOTOS;
  const primary = photoUrl(photos[0]);

  await conn.execute(
    "UPDATE vehicles SET imageUrl = ?, primaryPhotoUrl = ? WHERE id = ?",
    [primary, primary, vehicle.id]
  );

  // Also update vehicle_photos table if rows exist for this vehicle
  await conn.execute(
    "DELETE FROM vehicle_photos WHERE vehicleId = ?",
    [vehicle.id]
  );
  for (let i = 0; i < photos.length; i++) {
    await conn.execute(
      "INSERT INTO vehicle_photos (vehicleId, url, storageKey, position, caption) VALUES (?, ?, ?, ?, NULL)",
      [vehicle.id, photoUrl(photos[i]), `fixed/${vehicle.id}/${i}`, i]
    );
  }

  console.log(`  ✓  ${vehicle.title} (id ${vehicle.id}) → ${photos.length} photos set`);
  fixed++;
}

await conn.end();
console.log(`\nDone — ${fixed} vehicles updated with real Unsplash photos.\n`);
