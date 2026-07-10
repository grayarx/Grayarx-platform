/**
 * Apply raw SQL migrations (0061+) against DATABASE_URL.
 * Safe to re-run — migrations use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = [
  "0061_trade_in_network.sql",
  "0062_trade_in_invites.sql",
  "0063_market_guide_live.sql",
  "0064_compliance_inquiries.sql",
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set — skipping migrations.");
    process.exit(0);
  }

  const url = new URL(connectionString);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port) || 4000,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
  });

  const migrationsDir = path.join(__dirname, "..", "drizzle", "migrations");

  for (const file of MIGRATIONS) {
    const full = path.join(migrationsDir, file);
    if (!fs.existsSync(full)) {
      console.warn(`[migrate] skip missing ${file}`);
      continue;
    }
    const sql = fs.readFileSync(full, "utf8");
    console.log(`[migrate] applying ${file}…`);
    try {
      await conn.query(sql);
      console.log(`[migrate] ✓ ${file}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Duplicate column") || msg.includes("already exists")) {
        console.log(`[migrate] ~ ${file} (already applied)`);
      } else {
        throw err;
      }
    }
  }

  await conn.end();
  console.log("[migrate] done");
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
