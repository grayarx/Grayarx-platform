import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./trpc";

interface ComparisonSpec {
  label: string;
  value: string | number | boolean;
}

interface VehicleComparisonData {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  specs: Record<string, ComparisonSpec>;
}

interface SavedComparison {
  comparisonId: string;
  userId: string;
  vehicleIds: number[];
  createdAt: Date;
  name: string;
  notes?: string;
}

interface ComparisonHistory {
  comparisonId: string;
  vehicleIds: number[];
  timestamp: Date;
  userId?: string;
}

// Mock storage
const savedComparisons = new Map<string, SavedComparison>();
const comparisonHistory: ComparisonHistory[] = [];

/**
 * Generate comparison data for vehicles
 */
export const generateComparison = async (vehicleIds: number[]): Promise<VehicleComparisonData[]> => {
  // Mock vehicle data for comparison
  const mockVehicles: Record<number, VehicleComparisonData> = {
    1: {
      id: 1,
      make: "BMW",
      model: "X5",
      year: 2024,
      price: 1200000,
      mileage: 5000,
      fuelType: "Diesel",
      transmission: "Automatic",
      bodyType: "SUV",
      color: "Black",
      specs: {
        engine: { label: "Engine", value: "3.0L Twin-Turbo" },
        horsepower: { label: "Horsepower", value: 335 },
        torque: { label: "Torque", value: "330 lb-ft" },
        acceleration: { label: "0-60 mph", value: "5.2s" },
        topSpeed: { label: "Top Speed", value: "155 mph" },
        fuelEconomy: { label: "Fuel Economy", value: "22 mpg" },
        seating: { label: "Seating", value: 5 },
        warranty: { label: "Warranty", value: "3 years" },
      },
    },
    2: {
      id: 2,
      make: "Mercedes-Benz",
      model: "GLE",
      year: 2024,
      price: 1350000,
      mileage: 3000,
      fuelType: "Diesel",
      transmission: "Automatic",
      bodyType: "SUV",
      color: "Silver",
      specs: {
        engine: { label: "Engine", value: "3.0L Twin-Turbo" },
        horsepower: { label: "Horsepower", value: 362 },
        torque: { label: "Torque", value: "369 lb-ft" },
        acceleration: { label: "0-60 mph", value: "5.0s" },
        topSpeed: { label: "Top Speed", value: "160 mph" },
        fuelEconomy: { label: "Fuel Economy", value: "21 mpg" },
        seating: { label: "Seating", value: 5 },
        warranty: { label: "Warranty", value: "3 years" },
      },
    },
    3: {
      id: 3,
      make: "Audi",
      model: "Q7",
      year: 2024,
      price: 1100000,
      mileage: 8000,
      fuelType: "Petrol",
      transmission: "Automatic",
      bodyType: "SUV",
      color: "White",
      specs: {
        engine: { label: "Engine", value: "3.0L TFSI" },
        horsepower: { label: "Horsepower", value: 335 },
        torque: { label: "Torque", value: "325 lb-ft" },
        acceleration: { label: "0-60 mph", value: "5.3s" },
        topSpeed: { label: "Top Speed", value: "155 mph" },
        fuelEconomy: { label: "Fuel Economy", value: "20 mpg" },
        seating: { label: "Seating", value: 7 },
        warranty: { label: "Warranty", value: "3 years" },
      },
    },
  };

  return vehicleIds
    .map((id) => mockVehicles[id])
    .filter((v) => v !== undefined);
};

/**
 * Save comparison
 */
export const saveComparison = async (
  userId: string,
  vehicleIds: number[],
  name: string,
  notes?: string
): Promise<SavedComparison> => {
  const comparisonId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const comparison: SavedComparison = {
    comparisonId,
    userId,
    vehicleIds,
    createdAt: new Date(),
    name,
    notes,
  };

  savedComparisons.set(comparisonId, comparison);

  return comparison;
};

/**
 * Get saved comparison
 */
export const getSavedComparison = async (comparisonId: string): Promise<SavedComparison | null> => {
  return savedComparisons.get(comparisonId) || null;
};

/**
 * List user's saved comparisons
 */
export const listUserComparisons = async (userId: string): Promise<SavedComparison[]> => {
  const comparisons: SavedComparison[] = [];
  savedComparisons.forEach((comp) => {
    if (comp.userId === userId) {
      comparisons.push(comp);
    }
  });
  return comparisons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * Delete saved comparison
 */
export const deleteComparison = async (comparisonId: string, userId: string): Promise<boolean> => {
  const comparison = savedComparisons.get(comparisonId);
  if (!comparison || comparison.userId !== userId) {
    return false;
  }
  savedComparisons.delete(comparisonId);
  return true;
};

/**
 * Update comparison
 */
export const updateComparison = async (
  comparisonId: string,
  userId: string,
  updates: { name?: string; notes?: string; vehicleIds?: number[] }
): Promise<SavedComparison | null> => {
  const comparison = savedComparisons.get(comparisonId);
  if (!comparison || comparison.userId !== userId) {
    return null;
  }

  const updated: SavedComparison = {
    ...comparison,
    ...updates,
  };

  savedComparisons.set(comparisonId, updated);
  return updated;
};

/**
 * Add to comparison history
 */
export const addToHistory = async (vehicleIds: number[], userId?: string): Promise<void> => {
  comparisonHistory.push({
    comparisonId: `hist-${Date.now()}`,
    vehicleIds,
    timestamp: new Date(),
    userId,
  });

  // Keep only last 50 comparisons
  if (comparisonHistory.length > 50) {
    comparisonHistory.shift();
  }
};

/**
 * Get comparison history
 */
export const getComparisonHistory = async (userId?: string): Promise<ComparisonHistory[]> => {
  if (userId) {
    return comparisonHistory.filter((h) => h.userId === userId).slice(-10);
  }
  return comparisonHistory.slice(-10);
};

/**
 * Generate comparison PDF
 */
export const generateComparisonPDF = async (vehicleIds: number[]): Promise<Buffer> => {
  const comparison = await generateComparison(vehicleIds);

  const pdfContent = `
    Vehicle Comparison Report
    Generated: ${new Date().toLocaleDateString()}
    
    ${comparison
      .map(
        (v) => `
    ${v.year} ${v.make} ${v.model}
    Price: R${v.price.toLocaleString("en-ZA")}
    Mileage: ${v.mileage?.toLocaleString()} km
    Fuel Type: ${v.fuelType}
    Transmission: ${v.transmission}
    Body Type: ${v.bodyType}
    Color: ${v.color}
    `
      )
      .join("\n")}
  `;

  return Buffer.from(pdfContent);
};

/**
 * Get comparison statistics
 */
export const getComparisonStats = async (): Promise<{
  totalComparisons: number;
  averageVehiclesPerComparison: number;
  mostComparedMake: string | null;
}> => {
  const totalComparisons = comparisonHistory.length;
  const totalVehicles = comparisonHistory.reduce((sum, h) => sum + h.vehicleIds.length, 0);
  const averageVehiclesPerComparison = totalComparisons > 0 ? totalVehicles / totalComparisons : 0;

  return {
    totalComparisons,
    averageVehiclesPerComparison,
    mostComparedMake: null,
  };
};

/**
 * tRPC Router for vehicle comparison
 */
export const vehicleComparisonRouter = router({
  /**
   * Generate comparison data
   */
  generate: publicProcedure
    .input(z.object({ vehicleIds: z.array(z.number()).min(2).max(4) }))
    .query(async ({ input }) => {
      await addToHistory(input.vehicleIds);
      return await generateComparison(input.vehicleIds);
    }),

  /**
   * Save comparison
   */
  save: protectedProcedure
    .input(
      z.object({
        vehicleIds: z.array(z.number()).min(2).max(4),
        name: z.string().min(1).max(100),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await saveComparison(ctx.user?.id.toString() || "unknown", input.vehicleIds, input.name, input.notes);
    }),

  /**
   * Get saved comparison
   */
  getSaved: publicProcedure
    .input(z.object({ comparisonId: z.string() }))
    .query(async ({ input }) => {
      const comparison = await getSavedComparison(input.comparisonId);
      if (!comparison) return null;
      return {
        ...comparison,
        data: await generateComparison(comparison.vehicleIds),
      };
    }),

  /**
   * List user's comparisons
   */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    return await listUserComparisons(ctx.user?.id.toString() || "unknown");
  }),

  /**
   * Delete comparison
   */
  delete: protectedProcedure
    .input(z.object({ comparisonId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const success = await deleteComparison(input.comparisonId, ctx.user?.id.toString() || "unknown");
      return { success, comparisonId: input.comparisonId };
    }),

  /**
   * Update comparison
   */
  update: protectedProcedure
    .input(
      z.object({
        comparisonId: z.string(),
        name: z.string().optional(),
        notes: z.string().optional(),
        vehicleIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await updateComparison(input.comparisonId, ctx.user?.id.toString() || "unknown", {
        name: input.name,
        notes: input.notes,
        vehicleIds: input.vehicleIds,
      });
    }),

  /**
   * Get history
   */
  getHistory: publicProcedure.query(async () => {
    return await getComparisonHistory();
  }),

  /**
   * Generate PDF
   */
  generatePDF: publicProcedure
    .input(z.object({ vehicleIds: z.array(z.number()).min(2).max(4) }))
    .mutation(async ({ input }) => {
      const pdf = await generateComparisonPDF(input.vehicleIds);
      return {
        success: true,
        fileName: `comparison-${Date.now()}.pdf`,
        size: pdf.length,
      };
    }),

  /**
   * Get statistics
   */
  getStats: publicProcedure.query(async () => {
    return await getComparisonStats();
  }),
});
