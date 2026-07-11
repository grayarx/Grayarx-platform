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

const fn = (id) => `https://images.unsplash.com/photo-${id}?w=1200&auto=format&fit=crop&q=80`;

const PATCHES = [
  {
    id: 60002, label: "Koenigsegg Jesko",
    photos: ["1471444928139-48c5bf5173f8","1503376780353-7e6692767b70","1571607388263-1044f9ea01af","1551830820-c5f8ff967b32","1526726538690-5cbf90d3ede4"],
  },
  {
    id: 60003, label: "Chevrolet Corvette C8",
    photos: ["1552519507-da3b142c6e3d","1617614025543-ad4cc52d5e4c","1503376780353-7e6692767b70","1493238792000-8113da705763","1568605117036-5fe5e7bab0b7"],
  },
];

for (const { id, label, photos } of PATCHES) {
  await conn.execute(
    "UPDATE vehicles SET imageUrl=?, primaryPhotoUrl=? WHERE id=?",
    [fn(photos[0]), fn(photos[0]), id]
  );
  await conn.execute("DELETE FROM vehicle_photos WHERE vehicleId=?", [id]);
  const captions = ["Hero shot","Side profile","Rear view","Interior","Detail"];
  for (let i = 0; i < photos.length; i++) {
    await conn.execute(
      "INSERT INTO vehicle_photos (vehicleId, url, storageKey, position, caption) VALUES (?,?,?,?,?)",
      [id, fn(photos[i]), `patch/${id}/${i}`, i, captions[i]]
    );
  }
  console.log(`✓ ${label} — 5 photos set`);
}

await conn.end();
console.log("Done");
