import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./trpc";

type VehicleStatus = "available" | "sold" | "archived" | "reserved";

interface VehicleAvailability {
  vehicleId: number;
  status: VehicleStatus;
  lastStatusUpdate: Date;
  soldDate?: Date;
  reservedBy?: string;
  reservedUntil?: Date;
}

interface VehicleStatusUpdate {
  vehicleId: number;
  newStatus: VehicleStatus;
  reason?: string;
  updatedBy: string;
  updatedAt: Date;
}

// Mock storage for vehicle statuses
const vehicleStatuses = new Map<number, VehicleAvailability>();

/**
 * Get vehicle availability status
 */
export const getVehicleAvailability = async (vehicleId: number): Promise<VehicleAvailability | null> => {
  const status = vehicleStatuses.get(vehicleId);
  return status || { vehicleId, status: "available", lastStatusUpdate: new Date() };
};

/**
 * Update vehicle status
 */
export const updateVehicleStatus = async (
  vehicleId: number,
  newStatus: VehicleStatus,
  reason?: string,
  updatedBy?: string
): Promise<VehicleStatusUpdate> => {
  const current = vehicleStatuses.get(vehicleId) || {
    vehicleId,
    status: "available" as const,
    lastStatusUpdate: new Date(),
  };

  const updated: VehicleAvailability = {
    ...current,
    status: newStatus,
    lastStatusUpdate: new Date(),
    ...(newStatus === "sold" && { soldDate: new Date() }),
    ...(newStatus === "reserved" && { reservedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
  };

  vehicleStatuses.set(vehicleId, updated);

  return {
    vehicleId,
    newStatus,
    reason,
    updatedBy: updatedBy || "system",
    updatedAt: new Date(),
  };
};

/**
 * Get available vehicles count
 */
export const getAvailableVehiclesCount = async (): Promise<number> => {
  let count = 0;
  vehicleStatuses.forEach((status) => {
    if (status.status === "available") count++;
  });
  return count;
};

/**
 * Get vehicles by status
 */
export const getVehiclesByStatus = async (status: VehicleStatus): Promise<number[]> => {
  const vehicles: number[] = [];
  vehicleStatuses.forEach((v, vehicleId) => {
    if (v.status === status) vehicles.push(vehicleId);
  });
  return vehicles;
};

/**
 * Check if vehicle is available for purchase
 */
export const isVehicleAvailable = async (vehicleId: number): Promise<boolean> => {
  const availability = await getVehicleAvailability(vehicleId);
  return availability?.status === "available";
};

/**
 * Reserve vehicle
 */
export const reserveVehicle = async (vehicleId: number, reservedBy: string): Promise<boolean> => {
  const current = vehicleStatuses.get(vehicleId);
  if (current && current.status !== "available") {
    return false;
  }

  const reserved: VehicleAvailability = {
    vehicleId,
    status: "reserved",
    lastStatusUpdate: new Date(),
    reservedBy,
    reservedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  vehicleStatuses.set(vehicleId, reserved);
  return true;
};

/**
 * Release reservation
 */
export const releaseReservation = async (vehicleId: number): Promise<boolean> => {
  const current = vehicleStatuses.get(vehicleId);
  if (current?.status !== "reserved") {
    return false;
  }

  vehicleStatuses.set(vehicleId, {
    vehicleId,
    status: "available",
    lastStatusUpdate: new Date(),
  });

  return true;
};

/**
 * Mark vehicle as sold
 */
export const markVehicleAsSold = async (vehicleId: number): Promise<boolean> => {
  vehicleStatuses.set(vehicleId, {
    vehicleId,
    status: "sold",
    lastStatusUpdate: new Date(),
    soldDate: new Date(),
  });
  return true;
};

/**
 * Get status history for vehicle
 */
export const getStatusHistory = async (vehicleId: number): Promise<VehicleStatusUpdate[]> => {
  // Mock history
  return [
    {
      vehicleId,
      newStatus: "available",
      reason: "Added to inventory",
      updatedBy: "system",
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  ];
};

/**
 * Get availability statistics
 */
export const getAvailabilityStats = async (): Promise<{
  total: number;
  available: number;
  sold: number;
  reserved: number;
  archived: number;
}> => {
  const stats = {
    total: vehicleStatuses.size,
    available: 0,
    sold: 0,
    reserved: 0,
    archived: 0,
  };

  vehicleStatuses.forEach((v) => {
    if (v.status === "available") stats.available++;
    else if (v.status === "sold") stats.sold++;
    else if (v.status === "reserved") stats.reserved++;
    else if (v.status === "archived") stats.archived++;
  });

  return stats;
};

/**
 * Bulk update vehicle statuses
 */
export const bulkUpdateVehicleStatuses = async (
  updates: Array<{ vehicleId: number; status: VehicleStatus }>
): Promise<VehicleStatusUpdate[]> => {
  const results: VehicleStatusUpdate[] = [];

  for (const update of updates) {
    const result = await updateVehicleStatus(update.vehicleId, update.status, "bulk_update", "system");
    results.push(result);
  }

  return results;
};

/**
 * tRPC Router for vehicle availability
 */
export const vehicleAvailabilityRouter = router({
  /**
   * Get availability status for a vehicle
   */
  getStatus: publicProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    return await getVehicleAvailability(input.vehicleId);
  }),

  /**
   * Update vehicle status (protected - admin only)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        vehicleId: z.number(),
        newStatus: z.enum(["available", "sold", "archived", "reserved"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await updateVehicleStatus(input.vehicleId, input.newStatus, input.reason, ctx.user?.id.toString());
    }),

  /**
   * Get available vehicles count
   */
  getAvailableCount: publicProcedure.query(async () => {
    return await getAvailableVehiclesCount();
  }),

  /**
   * Get vehicles by status
   */
  getByStatus: publicProcedure
    .input(z.object({ status: z.enum(["available", "sold", "archived", "reserved"]) }))
    .query(async ({ input }) => {
      return await getVehiclesByStatus(input.status);
    }),

  /**
   * Check if vehicle is available
   */
  isAvailable: publicProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    return await isVehicleAvailable(input.vehicleId);
  }),

  /**
   * Reserve vehicle
   */
  reserve: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const success = await reserveVehicle(input.vehicleId, ctx.user?.email || "unknown");
      return { success, vehicleId: input.vehicleId };
    }),

  /**
   * Release reservation
   */
  releaseReservation: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await releaseReservation(input.vehicleId);
      return { success, vehicleId: input.vehicleId };
    }),

  /**
   * Mark as sold
   */
  markSold: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await markVehicleAsSold(input.vehicleId);
      return { success, vehicleId: input.vehicleId };
    }),

  /**
   * Get status history
   */
  getHistory: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      return await getStatusHistory(input.vehicleId);
    }),

  /**
   * Get availability statistics
   */
  getStats: publicProcedure.query(async () => {
    return await getAvailabilityStats();
  }),

  /**
   * Bulk update statuses
   */
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            vehicleId: z.number(),
            status: z.enum(["available", "sold", "archived", "reserved"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return await bulkUpdateVehicleStatuses(input.updates);
    }),
});
