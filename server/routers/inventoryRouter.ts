import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { parseCSV } from "../csvParser";

export type Vehicle = typeof vehicles.$inferSelect;

export const inventoryRouter = router({
  preview: protectedProcedure
    .input(z.object({ csvContent: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = parseCSV(input.csvContent);
        return {
          headers: result.headers,
          rows: result.rows,
          errors: result.errors,
          warnings: result.warnings,
          repairs: result.repairs,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to parse CSV: ${error.message}`,
        });
      }
    }),

  commit: protectedProcedure
    .input(z.object({ csvContent: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = parseCSV(input.csvContent);

        if (result.errors.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `CSV has ${result.errors.length} errors`,
          });
        }

        const makeField = result.headers.find(
          (h) => h.toLowerCase() === "make" || h.toLowerCase() === "brand"
        );
        const modelField = result.headers.find(
          (h) => h.toLowerCase() === "model" || h.toLowerCase() === "name"
        );
        const yearField = result.headers.find(
          (h) => h.toLowerCase() === "year" || h.toLowerCase() === "model_year"
        );
        const priceField = result.headers.find(
          (h) => h.toLowerCase() === "price" || h.toLowerCase() === "cost"
        );
        const mileageField = result.headers.find(
          (h) => h.toLowerCase() === "mileage" || h.toLowerCase() === "km"
        );
        const colorField = result.headers.find(
          (h) => h.toLowerCase() === "color" || h.toLowerCase() === "colour"
        );
        const transmissionField = result.headers.find(
          (h) => h.toLowerCase() === "transmission" || h.toLowerCase() === "gearbox"
        );
        const fuelField = result.headers.find(
          (h) => h.toLowerCase() === "fuel" || h.toLowerCase() === "fuel_type"
        );

        let imported = 0;

        for (const row of result.rows) {
          try {
            const make = makeField ? row[makeField]?.trim() : "";
            const model = modelField ? row[modelField]?.trim() : "";
            const year = yearField ? parseInt(row[yearField] || "0") : 0;
            const price = priceField
              ? parseFloat(row[priceField]?.replace(/[^0-9.]/g, "") || "0")
              : 0;
            const km = mileageField
              ? parseInt(row[mileageField]?.replace(/[^0-9]/g, "") || "0")
              : 0;
            const color = colorField ? row[colorField]?.trim() : "";
            const transmission = transmissionField ? row[transmissionField]?.trim() : "";
            const fuel = fuelField ? row[fuelField]?.trim() : "";

            if (!make || !model) continue;

            const title = `${year} ${make} ${model}`;

            await db.insert(vehicles).values({
              title,
              ownerUserId: ctx.user.id,
              make,
              model,
              year,
              price: price.toString(),
              km,
              color,
              transmission,
              fuel,
              status: "available",
            });

            imported++;
          } catch (error) {
            console.error("Failed to import vehicle row:", error);
          }
        }

        return {
          success: true,
          imported,
          total: result.rows.length,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to import CSV",
        });
      }
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.ownerUserId, ctx.user.id))
          .limit(input.limit)
          .offset(input.offset);

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list vehicles",
        });
      }
    }),

  markSold: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const existing = await db
          .select()
          .from(vehicles)
          .where(
            and(eq(vehicles.id, input.id), eq(vehicles.ownerUserId, ctx.user.id))
          );

        if (existing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vehicle not found",
          });
        }

        await db
          .update(vehicles)
          .set({ status: "sold", updatedAt: new Date() })
          .where(eq(vehicles.id, input.id));

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark vehicle as sold",
        });
      }
    }),

  markAvailable: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const existing = await db
          .select()
          .from(vehicles)
          .where(
            and(eq(vehicles.id, input.id), eq(vehicles.ownerUserId, ctx.user.id))
          );

        if (existing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vehicle not found",
          });
        }

        await db
          .update(vehicles)
          .set({ status: "available", updatedAt: new Date() })
          .where(eq(vehicles.id, input.id));

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark vehicle as available",
        });
      }
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const allVehicles = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.ownerUserId, ctx.user.id));

      const available = allVehicles.filter((v) => v.status === "available").length;
      const sold = allVehicles.filter((v) => v.status === "sold").length;
      const total = allVehicles.length;

      return {
        total,
        available,
        sold,
        availablePercentage: total > 0 ? Math.round((available / total) * 100) : 0,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get inventory statistics",
      });
    }
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const existing = await db
          .select()
          .from(vehicles)
          .where(
            and(eq(vehicles.id, input.id), eq(vehicles.ownerUserId, ctx.user.id))
          );

        if (existing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vehicle not found",
          });
        }

        await db.delete(vehicles).where(eq(vehicles.id, input.id));

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete vehicle",
        });
      }
    }),

  getAvailable: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = await db
          .select()
          .from(vehicles)
          .where(
            and(
              eq(vehicles.ownerUserId, ctx.user.id),
              eq(vehicles.status, "available")
            )
          )
          .limit(input.limit)
          .offset(input.offset);

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list available vehicles",
        });
      }
    }),
});
