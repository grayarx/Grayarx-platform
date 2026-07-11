/**
 * One-shot migration: adds dealershipId column to vehicles table
 * and applies the other pending unique constraints from schema.ts.
 * Reads DATABASE_URL from .env automatically.
 */
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, "..", ".env");

// Parse .env manually (no dotenv required)
const envText = readFileSync(envPath, "utf8");
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

const run = async (label, sql) => {
  try {
    await conn.execute(sql);
    console.log(`  ✓  ${label}`);
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME" || e.code === "ER_DUP_KEYNAME" ||
        e.message?.includes("Duplicate column") || e.message?.includes("already exists")) {
      console.log(`  ⟳  ${label} (already applied)`);
    } else {
      console.error(`  ✗  ${label}:`, e.message);
    }
  }
};

console.log("\nApplying GrayArx schema updates…\n");

// 1. dealershipId on vehicles (the critical tenant-isolation column)
await run(
  "ALTER TABLE vehicles ADD dealershipId int NULL",
  "ALTER TABLE vehicles ADD COLUMN `dealershipId` int NULL"
);

// 2. Unique reference numbers (from schema changes)
await run(
  "ADD UNIQUE: fallback_messages.referenceNumber",
  "ALTER TABLE `fallback_messages` ADD CONSTRAINT `fallback_messages_referenceNumber_unique` UNIQUE (`referenceNumber`)"
);
await run(
  "ADD UNIQUE: test_drive_bookings.referenceNumber",
  "ALTER TABLE `test_drive_bookings` ADD CONSTRAINT `test_drive_bookings_referenceNumber_unique` UNIQUE (`referenceNumber`)"
);

// 3. Stamp existing vehicles to dealership 1 so they don't vanish
await run(
  "UPDATE vehicles SET dealershipId = 1 WHERE dealershipId IS NULL",
  "UPDATE `vehicles` SET `dealershipId` = 1 WHERE `dealershipId` IS NULL"
);

await conn.end();
console.log("\nDone. Schema is up to date.\n");
