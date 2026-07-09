/**
 * Seed / secure the primary master Administrator account directly in the
 * live TiDB Cloud database. Safe to re-run: if the account already exists,
 * its password is re-hashed and its role is force-set to "admin".
 *
 * Run with: npx tsx scripts/seed-admin.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";

const ADMIN_EMAIL = "admin@grayarx.com";
const ADMIN_PASSWORD = "AdminPassword123!";
const ADMIN_NAME = "GrayArx Administrator";

async function seedAdmin() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed — check DATABASE_URL in .env");
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        role: "admin",
        loginMethod: "email",
        name: ADMIN_NAME,
      })
      .where(eq(users.id, existing.id));

    console.log("✅ Existing admin account updated & secured.");
    console.log(`   id: ${existing.id}`);
  } else {
    const openId = `local_admin_${Date.now()}`;
    await db.insert(users).values({
      openId,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      loginMethod: "email",
      role: "admin",
      lastSignedIn: new Date(),
    });

    console.log("✅ New master admin account created.");
  }

  console.log("");
  console.log("   Email:    " + ADMIN_EMAIL);
  console.log("   Password: " + ADMIN_PASSWORD);
  console.log("");
  console.log("You can now sign in at /login with these credentials.");

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Failed to seed admin account:", err);
  process.exit(1);
});
