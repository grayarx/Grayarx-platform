/**
 * One-time account fix: turn a given login into a working dealer.
 *
 * Some accounts (created via signup) end up with role "user" and no linked
 * dealership, so CSV import etc. fail with "Dealer or admin access required" /
 * "No dealership assigned". Set FIX_DEALER_ACCOUNT to a comma-separated list of
 * emails (e.g. on Railway) and redeploy: on boot each account becomes a
 * dealer_owner linked to a normal "GrayArx Test Motors" dealership (created once
 * if missing). Then remove the variable again.
 *
 * Safety: only runs when FIX_DEALER_ACCOUNT is set; only touches the listed
 * emails; idempotent (re-running just re-applies the same values).
 */
import { eq, sql } from "drizzle-orm";
import {
  getDb,
  createDealership,
  getDealershipByShortcode,
  setDealershipShortcode,
} from "../db";
import { users } from "../../drizzle/schema";

const TEST_SHORTCODE = "testmotors";
const TEST_NAME = "GrayArx Test Motors";

async function ensureTestDealershipId(): Promise<number | null> {
  const existing = await getDealershipByShortcode(TEST_SHORTCODE);
  if (existing) return existing.id;
  const created = await createDealership({
    name: TEST_NAME,
    status: "active",
    plan: "professional",
    publicShortcode: TEST_SHORTCODE,
  });
  // Pin the shortcode in case createDealership auto-generated a different one,
  // so future runs find this dealership instead of making duplicates.
  if (created.publicShortcode !== TEST_SHORTCODE) {
    try {
      await setDealershipShortcode(created.id, TEST_SHORTCODE);
    } catch {
      /* shortcode already taken elsewhere — the id is what matters */
    }
  }
  console.log(`[FixDealer] Created dealership id=${created.id} (${TEST_NAME}).`);
  return created.id;
}

export async function fixDealerAccountsIfRequested(): Promise<void> {
  const raw = (process.env.FIX_DEALER_ACCOUNT || "").trim();
  if (!raw) return;

  const db = await getDb();
  if (!db) return;

  const dealershipId = await ensureTestDealershipId();
  if (dealershipId == null) {
    console.log("[FixDealer] Could not resolve a dealership — aborting.");
    return;
  }

  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of emails) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`LOWER(${users.email}) = ${email}`)
      .limit(1);
    if (!u) {
      console.log(`[FixDealer] No account found for ${email} — skipped.`);
      continue;
    }
    await db
      .update(users)
      .set({ role: "dealer_owner", dealershipId })
      .where(eq(users.id, u.id));
    console.log(
      `[FixDealer] ${email} is now a dealer_owner linked to dealership ${dealershipId} (${TEST_NAME}).`,
    );
  }
}
