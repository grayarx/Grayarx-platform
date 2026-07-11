/**
 * Seed a demo dealership, dealer user, and sample vehicles for testing.
 * Safe to re-run — skips creation if records already exist.
 *
 * Run with: npx tsx scripts/seed-demo.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../server/db";
import { dealerships, users, vehicles } from "../drizzle/schema";

const DEALER_EMAIL = process.env.DEMO_DEALER_EMAIL ?? "dealer@grayarx.com";
const DEALER_PASSWORD = process.env.DEMO_DEALER_PASSWORD ?? "Dealer2024!";
const DEALER_NAME = "Demo Dealer";
const DEALERSHIP_NAME = "GrayArx Demo Dealership";
const DEALERSHIP_SHORTCODE = "demo";

const DEMO_VEHICLES = [
  {
    title: "2022 McLaren P1 GTR",
    make: "McLaren",
    model: "P1 GTR",
    year: 2022,
    price: "8950000.00",
    km: 1200,
    fuel: "Petrol",
    transmission: "Automatic",
    bodyType: "Coupe",
    color: "Papaya Orange",
    status: "available" as const,
    location: "Sandton",
    primaryPhotoUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=80",
    imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=80",
    externalRef: "MCL-P1-GTR-001",
  },
  {
    title: "2023 Porsche 911 Carrera S",
    make: "Porsche",
    model: "911 Carrera S",
    year: 2023,
    price: "1890000.00",
    km: 8500,
    fuel: "Petrol",
    transmission: "Automatic",
    bodyType: "Coupe",
    color: "Arctic Grey",
    status: "available" as const,
    location: "Sandton",
    primaryPhotoUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80",
    externalRef: "POR-911-S-002",
  },
  {
    title: "2022 Lamborghini Huracán EVO",
    make: "Lamborghini",
    model: "Huracán EVO",
    year: 2022,
    price: "4750000.00",
    km: 6200,
    fuel: "Petrol",
    transmission: "Automatic",
    bodyType: "Coupe",
    color: "Giallo Midas",
    status: "available" as const,
    location: "Cape Town",
    primaryPhotoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80",
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80",
    externalRef: "LAM-HURA-EVO-003",
  },
  {
    title: "2021 Mercedes-Benz C63 AMG",
    make: "Mercedes-Benz",
    model: "C63 AMG",
    year: 2021,
    price: "1245000.00",
    km: 32000,
    fuel: "Petrol",
    transmission: "Automatic",
    bodyType: "Sedan",
    color: "Obsidian Black",
    status: "available" as const,
    location: "Johannesburg",
    primaryPhotoUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&q=80",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&q=80",
    externalRef: "MBZ-C63-AMG-004",
  },
  {
    title: "2022 Ferrari Roma",
    make: "Ferrari",
    model: "Roma",
    year: 2022,
    price: "5100000.00",
    km: 4800,
    fuel: "Petrol",
    transmission: "Automatic",
    bodyType: "Coupe",
    color: "Rosso Corsa",
    status: "available" as const,
    location: "Pretoria",
    primaryPhotoUrl: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=900&q=80",
    imageUrl: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=900&q=80",
    externalRef: "FER-ROMA-005",
  },
];

async function seedDemo() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed — check DATABASE_URL");

  // 1. Upsert dealership
  const [existingDealership] = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.publicShortcode, DEALERSHIP_SHORTCODE))
    .limit(1);

  let dealershipId: number;

  if (existingDealership) {
    dealershipId = existingDealership.id;
    console.log(`Dealership already exists (id ${dealershipId}).`);
  } else {
    const result: any = await db.insert(dealerships).values({
      name: DEALERSHIP_NAME,
      contactEmail: DEALER_EMAIL,
      contactPhone: "+27101234567",
      region: "Gauteng",
      status: "active",
      plan: "professional",
      publicShortcode: DEALERSHIP_SHORTCODE,
      showroomTheme: "futuristic",
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
    });
    dealershipId = Number(result.insertId ?? result[0]?.insertId ?? 1);
    console.log(`Created dealership (id ${dealershipId}).`);
  }

  // 2. Upsert dealer user
  const email = DEALER_EMAIL.trim().toLowerCase();
  const [existingUser] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = ${email}`)
    .limit(1);

  const passwordHash = await bcrypt.hash(DEALER_PASSWORD, 12);

  if (existingUser) {
    await db
      .update(users)
      .set({ passwordHash, role: "dealer_owner", dealershipId, loginMethod: "email" })
      .where(eq(users.id, existingUser.id));
    console.log(`Dealer user updated (id ${existingUser.id}).`);
  } else {
    await db.insert(users).values({
      openId: `local_dealer_${Date.now()}`,
      email,
      name: DEALER_NAME,
      passwordHash,
      loginMethod: "email",
      role: "dealer_owner",
      dealershipId,
      lastSignedIn: new Date(),
    });
    console.log("New dealer user created.");
  }

  // 3. Add demo vehicles if none exist for this dealership
  const [existingVehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(eq(vehicles.dealershipId, dealershipId))
    .limit(1);

  if (!existingVehicle) {
    for (const v of DEMO_VEHICLES) {
      await db.insert(vehicles).values({
        ...v,
        dealershipId,
        condition: "used",
        views: 0,
        leadCount: 0,
      });
    }
    console.log(`Added ${DEMO_VEHICLES.length} demo vehicles.`);
  } else {
    console.log("Vehicles already exist — skipped.");
  }

  console.log("");
  console.log("=== Demo credentials ===");
  console.log(`Dealer email:    ${DEALER_EMAIL}`);
  console.log(`Dealer password: ${DEALER_PASSWORD}`);
  console.log(`Admin email:     admin@grayarx.com`);
  console.log(`Admin password:  AdminPassword123!`);
  console.log(`Showroom URL:    https://www.grayarx.com/showroom`);
  console.log("");
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error("seed-demo failed:", err);
  process.exit(1);
});
