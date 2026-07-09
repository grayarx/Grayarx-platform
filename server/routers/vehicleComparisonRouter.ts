import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { vehicles } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export const vehicleComparisonRouter = router({
  // Get vehicles for comparison
  getVehicles: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      vehicleIds: z.array(z.number()).min(1).max(5),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const vehicleList = await db
        .select()
        .from(vehicles)
        .where(inArray(vehicles.id, input.vehicleIds));

      return vehicleList.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        year: v.year,
        price: Number(v.price),
        km: v.km,
        transmission: v.transmission,
        fuel: v.fuel,
        color: v.color,
        vin: v.vin,
        features: v.features && typeof v.features === 'string' ? JSON.parse(v.features) : Array.isArray(v.features) ? v.features : [],
        serviceHistory: v.serviceHistory,
        condition: v.condition,
        primaryPhotoUrl: v.primaryPhotoUrl,
      }));
    }),

  // Compare vehicles side-by-side
  compareVehicles: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      vehicleIds: z.array(z.number()).min(2).max(5),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const vehicleList = await db
        .select()
        .from(vehicles)
        .where(inArray(vehicles.id, input.vehicleIds));

      const comparison = {
        vehicles: vehicleList.map(v => ({
          id: v.id,
          name: `${v.year} ${v.make} ${v.model}`,
          price: Number(v.price),
          km: v.km,
          transmission: v.transmission,
          fuel: v.fuel,
          color: v.color,
          serviceHistory: v.serviceHistory,
          condition: v.condition,
          primaryPhotoUrl: v.primaryPhotoUrl,
        })),
        specs: {
          priceRange: {
            min: Math.min(...vehicleList.map(v => Number(v.price) || 0)),
            max: Math.max(...vehicleList.map(v => Number(v.price) || 0)),
            difference: Math.max(...vehicleList.map(v => Number(v.price) || 0)) - Math.min(...vehicleList.map(v => Number(v.price) || 0)),
          },
          kmRange: {
            min: Math.min(...vehicleList.map(v => v.km || 0)),
            max: Math.max(...vehicleList.map(v => v.km || 0)),
          },
          yearRange: {
            min: Math.min(...vehicleList.map(v => v.year || 0)),
            max: Math.max(...vehicleList.map(v => v.year || 0)),
          },
          fuelTypes: [...new Set(vehicleList.map(v => v.fuel))],
          transmissions: [...new Set(vehicleList.map(v => v.transmission))],
        },
        recommendation: vehicleList.reduce((best, v) => {
          if (!best) return v;
          // Simple scoring: lower price + lower km = better
          const bestScore = Number(best.price || 0) + (best.km || 0) / 100000;
          const vScore = Number(v.price || 0) + (v.km || 0) / 100000;
          return vScore < bestScore ? v : best;
        }),
      };

      return comparison;
    }),

  // Generate comparison report
  generateComparisonReport: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      vehicleIds: z.array(z.number()).min(2).max(5),
      format: z.enum(["json", "csv", "pdf"]).default("json"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const vehicleList = await db
        .select()
        .from(vehicles)
        .where(inArray(vehicles.id, input.vehicleIds));

      const report = {
        title: "Vehicle Comparison Report",
        generatedAt: new Date().toISOString(),
        vehicles: vehicleList.map(v => ({
          id: v.id,
          name: `${v.year} ${v.make} ${v.model}`,
          vin: v.vin,
          price: Number(v.price),
          km: v.km,
          transmission: v.transmission,
          fuel: v.fuel,
          color: v.color,
          condition: v.condition,
          features: v.features && typeof v.features === 'string' ? JSON.parse(v.features) : Array.isArray(v.features) ? v.features : [],
        })),
        summary: {
          cheapest: vehicleList.reduce((min, v) => (Number(v.price) || 0) < (Number(min.price) || 0) ? v : min),
          lowestKm: vehicleList.reduce((min, v) => (v.km || 0) < (min.km || 0) ? v : min),
          newest: vehicleList.reduce((newest, v) => (v.year || 0) > (newest.year || 0) ? v : newest),
        },
      };

      if (input.format === "csv") {
        const headers = ["Name", "Price", "KM", "Transmission", "Fuel", "Condition"];
        const rows = vehicleList.map(v => [
          `${v.year} ${v.make} ${v.model}`,
          Number(v.price),
          v.km,
          v.transmission,
          v.fuel,
          v.condition,
        ]);
        return {
          format: "csv",
          data: [headers, ...rows].map(row => row.join(",")).join("\n"),
        };
      }

      return { format: input.format, data: report };
    }),

  // Get vehicle features comparison
  compareFeatures: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      vehicleIds: z.array(z.number()).min(2).max(5),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const vehicleList = await db
        .select()
        .from(vehicles)
        .where(inArray(vehicles.id, input.vehicleIds));

      // Extract all unique features
      const allFeatures = new Set<string>();
      vehicleList.forEach(v => {
        if (v.features) {
          const features = typeof v.features === 'string' ? JSON.parse(v.features) : Array.isArray(v.features) ? v.features : [];
          features.forEach((f: string) => allFeatures.add(f));
        }
      });

      const featureComparison = Array.from(allFeatures).map(feature => ({
        feature,
        vehicles: vehicleList.map(v => ({
          id: v.id,
          name: `${v.year} ${v.make} ${v.model}`,
          hasFeature: v.features ? (typeof v.features === 'string' ? JSON.parse(v.features) : Array.isArray(v.features) ? v.features : []).includes(feature) : false,
        })),
      }));

      return featureComparison;
    }),

  // Calculate total cost of ownership
  calculateTCO: protectedProcedure
    .input(z.object({
      dealershipId: z.number(),
      vehicleIds: z.array(z.number()).min(1).max(5),
      yearsOwned: z.number().default(5),
      annualMileage: z.number().default(12000),
      fuelPrice: z.number().default(1.5), // per liter
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const vehicleList = await db
        .select()
        .from(vehicles)
        .where(inArray(vehicles.id, input.vehicleIds));

      const tcoCalculations = vehicleList.map(v => {
        const purchasePrice = Number(v.price) || 0;
        const totalKm = input.annualMileage * input.yearsOwned;
        const fuelCost = (totalKm / 100) * input.fuelPrice; // Simplified fuel cost
        const maintenanceCost = totalKm * 0.0005; // ZAR 0.0005 per km estimate
        const depreciation = purchasePrice * 0.6; // Assume 60% depreciation
        const insurance = 1200 * input.yearsOwned; // ZAR 1200/year estimate
        const totalCost = purchasePrice + fuelCost + maintenanceCost + insurance;
        const costPerKm = totalCost / totalKm;

        return {
          vehicleId: v.id,
          vehicleName: `${v.year} ${v.make} ${v.model}`,
          purchasePrice,
          fuelCost: Math.round(fuelCost * 100) / 100,
          maintenanceCost: Math.round(maintenanceCost * 100) / 100,
          insurance,
          totalCost: Math.round(totalCost * 100) / 100,
          costPerKm: Math.round(costPerKm * 100) / 100,
          residualValue: Math.round((purchasePrice - depreciation) * 100) / 100,
        };
      });

      return {
        period: `${input.yearsOwned} years`,
        annualMileage: input.annualMileage,
        calculations: tcoCalculations,
        cheapestOption: tcoCalculations.reduce((min, c) => (c.totalCost < min.totalCost ? c : min)),
      };
    }),
});
