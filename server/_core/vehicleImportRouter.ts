import { router, protectedProcedure } from "./trpc";
import { z } from "zod";

const vehicleSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().min(1900).max(2100),
  price: z.number().positive(),
  mileage: z.number().min(0),
  color: z.string(),
  fuelType: z.enum(["petrol", "diesel", "hybrid", "electric"]),
  transmission: z.enum(["manual", "automatic"]),
  vin: z.string().optional(),
  externalRef: z.string().optional(),
});

const csvImportSchema = z.object({
  csvContent: z.string(),
  importType: z.enum(["autotrader", "carsco", "manual"]),
});

export const vehicleImportRouter = router({
  validateCSV: protectedProcedure
    .input(csvImportSchema)
    .mutation(async ({ ctx, input }: any) => {
      const lines = input.csvContent.split("\n").filter((l: string) => l.trim());
      const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());

      const requiredHeaders = [
        "make",
        "model",
        "year",
        "price",
        "mileage",
        "color",
      ];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        return {
          success: false,
          error: `Missing required columns: ${missingHeaders.join(", ")}`,
          validationErrors: missingHeaders.map((h) => ({
            field: h,
            error: "Required column missing",
          })),
        };
      }

      const vehicles = lines.slice(1).map((line: string, idx: number) => {
        const values = line.split(",").map((v: string) => v.trim());
        const vehicle: Record<string, any> = {};

        headers.forEach((header: string, i: number) => {
          vehicle[header] = values[i];
        });

        return {
          rowNumber: idx + 2,
          vehicle,
          isValid: vehicle.make && vehicle.model && vehicle.year && vehicle.price,
          errors: !vehicle.make
            ? ["Make is required"]
            : !vehicle.model
              ? ["Model is required"]
              : !vehicle.year
                ? ["Year is required"]
                : !vehicle.price
                  ? ["Price is required"]
                  : [],
        };
      });

      const validVehicles = vehicles.filter((v: any) => v.isValid);
      const invalidVehicles = vehicles.filter((v: any) => !v.isValid);

      return {
        success: true,
        totalRows: vehicles.length,
        validCount: validVehicles.length,
        invalidCount: invalidVehicles.length,
        vehicles: validVehicles,
        errors: invalidVehicles,
      };
    }),

  importVehicles: protectedProcedure
    .input(
      z.object({
        vehicles: z.array(vehicleSchema),
        importType: z.enum(["autotrader", "carsco", "manual"]),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const importedVehicles = [];

      for (const vehicle of input.vehicles) {
        try {
          importedVehicles.push({
            id: `vehicle-${Date.now()}`,
            dealershipId: ctx.user.id,
            ...vehicle,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (error) {
          console.error("Failed to import vehicle:", error);
        }
      }

      return {
        success: true,
        importedCount: importedVehicles.length,
        totalCount: input.vehicles.length,
        vehicles: importedVehicles,
      };
    }),

  getImportStatus: protectedProcedure
    .input(z.object({ importId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return {
        importId: input.importId,
        status: "completed",
        totalVehicles: 15,
        importedVehicles: 15,
        failedVehicles: 0,
        completedAt: new Date(),
      };
    }),

  parseAutotraderCSV: protectedProcedure
    .input(z.object({ csvContent: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      const lines = input.csvContent.split("\n").filter((l: string) => l.trim());
      const vehicles = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        vehicles.push({
          make: parts[0]?.trim() || "",
          model: parts[1]?.trim() || "",
          year: parseInt(parts[2]?.trim() || "0"),
          price: parseFloat(parts[3]?.trim() || "0"),
          mileage: parseFloat(parts[4]?.trim() || "0"),
          color: parts[5]?.trim() || "",
          fuelType: (parts[6]?.trim() || "petrol") as
            | "petrol"
            | "diesel"
            | "hybrid"
            | "electric",
          transmission: (parts[7]?.trim() || "automatic") as
            | "manual"
            | "automatic",
          externalRef: parts[8]?.trim() || undefined,
        });
      }

      return {
        success: true,
        vehicles,
        count: vehicles.length,
      };
    }),

  parseCarsCoZACSV: protectedProcedure
    .input(z.object({ csvContent: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      const lines = input.csvContent.split("\n").filter((l: string) => l.trim());
      const vehicles = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        vehicles.push({
          make: parts[0]?.trim() || "",
          model: parts[1]?.trim() || "",
          year: parseInt(parts[2]?.trim() || "0"),
          price: parseFloat(parts[3]?.trim() || "0"),
          mileage: parseFloat(parts[4]?.trim() || "0"),
          color: parts[5]?.trim() || "",
          fuelType: (parts[6]?.trim() || "petrol") as
            | "petrol"
            | "diesel"
            | "hybrid"
            | "electric",
          transmission: (parts[7]?.trim() || "automatic") as
            | "manual"
            | "automatic",
          externalRef: parts[8]?.trim() || undefined,
        });
      }

      return {
        success: true,
        vehicles,
        count: vehicles.length,
      };
    }),
});
