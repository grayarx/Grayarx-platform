/**
 * Remove GrayArx demo inventory from the database.
 *
 * The public /showroom is a platform-wide marketplace (see server/routers.ts
 * `showroom.list` — no dealershipId => all available stock), so the seeded
 * "GrayArx Demo Dealership" exotic cars show up there. This script deletes
 * those demo vehicles (and their photo rows) so only real dealer stock shows.
 *
 * Why they won't come back:
 *  - The vehicle-creating seed in server/_core/index.ts only runs when the DB
 *    has ZERO dealerships.
 *  - server/_core/demoInventoryHeal.ts only PATCHES metadata, it never inserts.
 *
 * SAFETY:
 *  - Dry-run by default: prints what WOULD be deleted, changes nothing.
 *  - Pass --confirm (or CONFIRM=1) to actually delete.
 *  - Only targets a dealership that looks like the demo one (shortcode "demo"
 *    or name containing "GrayArx demo"). Override with --force (use with
 *    DEMO_DEALERSHIP_ID) only if you are certain.
 *  - By default it deletes vehicles + their photos. Add --purge-dealership to
 *    also remove the demo dealership row and its demo users.
 *
 * Usage (needs DATABASE_URL in the environment / .env):
 *   node scripts/remove-demo-inventory.mjs                 # dry run
 *   node scripts/remove-demo-inventory.mjs --confirm       # delete demo cars
 *   DEMO_DEALERSHIP_ID=1 node scripts/remove-demo-inventory.mjs --confirm --force
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const args = new Set(process.argv.slice(2));
const CONFIRM = args.has("--confirm") || process.env.CONFIRM === "1";
const FORCE = args.has("--force");
const PURGE_DEALERSHIP = args.has("--purge-dealership");

function looksLikeDemo(d) {
  const name = (d.name || "").toLowerCase();
  const sc = (d.publicShortcode || "").toLowerCase();
  return sc === "demo" || name.includes("grayarx demo") || name.includes("demo dealership");
}

async function main() {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error("DATABASE_URL is not set — aborting.");
    process.exit(1);
  }

  const url = new URL(cs);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port) || 4000,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true },
  });

  try {
    // Resolve the demo dealership.
    const envId = process.env.DEMO_DEALERSHIP_ID ? Number(process.env.DEMO_DEALERSHIP_ID) : null;
    let dealership = null;

    if (envId) {
      const [rows] = await conn.query(
        "SELECT id, name, publicShortcode, status FROM dealerships WHERE id = ? LIMIT 1",
        [envId],
      );
      dealership = rows[0] ?? null;
      if (!dealership) {
        console.error(`No dealership found with id ${envId}.`);
        process.exit(1);
      }
    } else {
      const [rows] = await conn.query(
        "SELECT id, name, publicShortcode, status FROM dealerships " +
          "WHERE publicShortcode = 'demo' OR LOWER(name) LIKE '%grayarx demo%' " +
          "ORDER BY id LIMIT 1",
      );
      dealership = rows[0] ?? null;
      if (!dealership) {
        console.log(
          "No demo dealership found (shortcode 'demo' / name like 'GrayArx demo…'). Nothing to do.",
        );
        process.exit(0);
      }
    }

    if (!looksLikeDemo(dealership) && !FORCE) {
      console.error(
        `Refusing: dealership id=${dealership.id} name="${dealership.name}" ` +
          `shortcode="${dealership.publicShortcode}" does not look like the demo dealership.\n` +
          "Re-run with --force (and DEMO_DEALERSHIP_ID) only if you are certain.",
      );
      process.exit(1);
    }

    const did = dealership.id;
    const [[{ cnt }]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM vehicles WHERE dealershipId = ?",
      [did],
    );
    const [sample] = await conn.query(
      "SELECT id, title FROM vehicles WHERE dealershipId = ? ORDER BY id LIMIT 25",
      [did],
    );

    console.log(
      `Demo dealership: id=${did} name="${dealership.name}" ` +
        `shortcode="${dealership.publicShortcode}" status="${dealership.status}"`,
    );
    console.log(`Vehicles under this dealership: ${cnt}`);
    for (const v of sample) console.log(`   - #${v.id} ${v.title}`);
    if (cnt > sample.length) console.log(`   … and ${cnt - sample.length} more`);

    if (!CONFIRM) {
      console.log(
        "\nDRY RUN — nothing was deleted." +
          "\nRe-run with --confirm to delete these vehicles and their photos." +
          (PURGE_DEALERSHIP
            ? "\n(--purge-dealership is set: the dealership row + demo users would also be removed.)"
            : ""),
      );
      process.exit(0);
    }

    // Delete photos first (vehicle_photos.vehicleId -> vehicles.id), then vehicles.
    const [photoRes] = await conn.query(
      "DELETE FROM vehicle_photos WHERE vehicleId IN (SELECT id FROM vehicles WHERE dealershipId = ?)",
      [did],
    );
    const [vehRes] = await conn.query("DELETE FROM vehicles WHERE dealershipId = ?", [did]);
    console.log(
      `\nDeleted ${vehRes.affectedRows} vehicle(s) and ${photoRes.affectedRows} photo row(s) ` +
        `for dealership ${did}.`,
    );

    if (PURGE_DEALERSHIP) {
      const [userRes] = await conn.query("DELETE FROM users WHERE dealershipId = ?", [did]);
      const [delRes] = await conn.query("DELETE FROM dealerships WHERE id = ?", [did]);
      console.log(
        `Purged dealership row (${delRes.affectedRows}) and ${userRes.affectedRows} demo user(s).`,
      );
    }

    console.log("Done. The public showroom will no longer list these demo cars.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
