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
  "0065_pilot_email_sends.sql",
  "0065_dealership_whatsapp_phone_number_id.sql",
  "0066_dealership_llm_model.sql",
  "0067_onboarding_whatsapp_phone_number_id.sql",
  "0068_agent_display_name_optout_group.sql",
  "0069_dealer_groups.sql",
  "0070_brand_logo_url_mediumtext.sql",
  "0071_stock_sync.sql",
  "0072_vehicle_status_fix.sql",
  "0073_purge_bounce_prospects.sql",
];

/** Run once: wipe Sipho prospects so only named/principal emails are re-added. */
async function purgeBounceProspectsOnce(conn) {
  const shot = "0073_purge_all_prospects_for_email_quality";
  const [rows] = await conn.query(
    "SELECT `name` FROM `_grayarx_one_shots` WHERE `name` = ? LIMIT 1",
    [shot],
  );
  if (Array.isArray(rows) && rows.length > 0) {
    console.log(`[migrate] ~ ${shot} (already applied)`);
    return;
  }
  console.log(`[migrate] applying ${shot}…`);
  // Call attempts reference prospect ids (no FK) — clear both.
  await conn.query("DELETE FROM `call_attempts`");
  const [result] = await conn.query("DELETE FROM `prospects`");
  const deleted = result?.affectedRows ?? 0;
  await conn.query("INSERT INTO `_grayarx_one_shots` (`name`) VALUES (?)", [shot]);
  console.log(`[migrate] ✓ ${shot} (deleted ${deleted} prospects)`);
}

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
      if (
        msg.includes("Duplicate column") ||
        msg.includes("Duplicate key") ||
        msg.includes("already exists")
      ) {
        console.log(`[migrate] ~ ${file} (already applied)`);
      } else {
        throw err;
      }
    }
  }

  // After schema one-shots table exists, purge bounce-bait prospects once.
  await purgeBounceProspectsOnce(conn);

  await conn.end();
  console.log("[migrate] done");
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
