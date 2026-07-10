/**
 * Create or reset the founder login (email + password) in the live DB.
 * Safe to re-run — updates password hash and forces role to founder.
 *
 *   set FOUNDER_EMAIL=grayarx@gmail.com
 *   set FOUNDER_PASSWORD=YourSecurePassword
 *   npx tsx scripts/seed-founder.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { FOUNDER_EMAILS } from "../shared/founderAccess";

const email = (process.env.FOUNDER_EMAIL ?? FOUNDER_EMAILS[0]).trim().toLowerCase();
const password = process.env.FOUNDER_PASSWORD?.trim();

if (!password || password.length < 8) {
  console.error("Set FOUNDER_PASSWORD (min 8 chars) before running this script.");
  process.exit(1);
}

async function seedFounder() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed — check DATABASE_URL");

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = ${email}`)
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({
        email,
        passwordHash,
        role: "founder",
        loginMethod: "email",
        name: existing[0].name ?? "GrayArx Founder",
      })
      .where(eq(users.id, existing[0].id));

    console.log(`Founder account updated (id ${existing[0].id}).`);
  } else {
    const openId = `local_founder_${Date.now()}`;
    await db.insert(users).values({
      openId,
      email,
      name: "GrayArx Founder",
      passwordHash,
      loginMethod: "email",
      role: "founder",
      lastSignedIn: new Date(),
    });
    console.log("New founder account created.");
  }

  console.log(`Sign in at /login with ${email}`);
  process.exit(0);
}

seedFounder().catch((err) => {
  console.error("seed-founder failed:", err);
  process.exit(1);
});
