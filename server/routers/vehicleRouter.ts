import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { vehicles } from "../../drizzle/schema";
import { eq, and, ilike, gte, lte } from "drizzle-orm";

export const vehicleRouter = router({
  // Get all vehicles with filtering
  list: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      status: z.enum(["available", "sold", "reserved", "fix"]).optional(),
      condition: z.enum(["new", "used", "demo", "certified"]).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions: any[] = [];
      
      if (input.status) conditions.push(eq(vehicles.status, input.status));
      if (input.condition) conditions.push(eq(vehicles.condition, input.condition));
      if (input.minPrice) conditions.push(gte(vehicles.price, input.minPrice.toString()));
      if (input.maxPrice) conditions.push(lte(vehicles.price, input.maxPrice.toString()));
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          ilike(vehicles.vin, searchTerm) ||
          ilike(vehicles.make, searchTerm) ||
          ilike(vehicles.model, searchTerm)
        );
      }

      const result = await db
        .select()
        .from(vehicles)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  // Get vehicle by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result: any[] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, input.id));

      return result[0] || null;
    }),

  // Create vehicle
  create: protectedProcedure
    .input(z.object({
      vin: z.string(),
      make: z.string(),
      model: z.string(),
      year: z.number(),
      color: z.string().optional(),
      km: z.number().default(0),
      price: z.number(),
      condition: z.enum(["new", "used", "demo", "certified"]),
      fuel: z.string().optional(),
      transmission: z.string().optional(),
      primaryPhotoUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result: any = await db.insert(vehicles).values({
        title: `${input.make} ${input.model} ${input.year}`,
        vin: input.vin,
        make: input.make,
        model: input.model,
        year: input.year,
        color: input.color,
        km: input.km,
        price: input.price.toString(),
        condition: input.condition,
        fuel: input.fuel,
        transmission: input.transmission,
        primaryPhotoUrl: input.primaryPhotoUrl,
        status: "available",
      });

      return result;
    }),

  // Update vehicle
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      updates: z.object({
        price: z.number().optional(),
        status: z.enum(["available", "sold", "reserved", "fix"]).optional(),
        km: z.number().optional(),
        primaryPhotoUrl: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: any = {};
      if (input.updates.price !== undefined) updates.price = input.updates.price.toString();
      if (input.updates.status !== undefined) updates.status = input.updates.status;
      if (input.updates.km !== undefined) updates.km = input.updates.km;
      if (input.updates.primaryPhotoUrl !== undefined) updates.primaryPhotoUrl = input.updates.primaryPhotoUrl;

      await db
        .update(vehicles)
        .set(updates)
        .where(eq(vehicles.id, input.id));

      return { success: true };
    }),

  // Get vehicle statistics
  stats: protectedProcedure
    .input(z.object({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allVehicles: any[] = await db
        .select()
        .from(vehicles);

      return {
        total: allVehicles.length,
        available: allVehicles.filter((v: any) => v.status === "available").length,
        sold: allVehicles.filter((v: any) => v.status === "sold").length,
        reserved: allVehicles.filter((v: any) => v.status === "reserved").length,
        fix: allVehicles.filter((v: any) => v.status === "fix").length,
        averagePrice: allVehicles.reduce((sum: number, v: any) => sum + Number(v.price), 0) / allVehicles.length || 0,
      };
    }),
});
