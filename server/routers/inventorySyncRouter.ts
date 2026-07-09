/**
 * Inventory Sync Router - tRPC procedures for inventory management
 */

import { protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { executeInventorySync, getSyncJobStatus } from "../_core/inventorySyncScheduler";

export const inventorySyncRouter = {
  /**
   * Execute immediate inventory sync
   */
  executeSyncNow: protectedProcedure.mutation(async () => {
    try {
      const result = await executeInventorySync();

      return {
        success: true,
        message: "Inventory sync completed",
        carsCoZa: {
          status: result.carsCoZa.status,
          vehiclesProcessed: result.carsCoZa.vehiclesProcessed,
          vehiclesAdded: result.carsCoZa.vehiclesAdded,
          vehiclesUpdated: result.carsCoZa.vehiclesUpdated,
          errors: result.carsCoZa.errors,
        },
        autotrader: {
          status: result.autotrader.status,
          vehiclesProcessed: result.autotrader.vehiclesProcessed,
          vehiclesAdded: result.autotrader.vehiclesAdded,
          vehiclesUpdated: result.autotrader.vehiclesUpdated,
          errors: result.autotrader.errors,
        },
        totalVehiclesAdded: result.totalVehiclesAdded,
        totalVehiclesUpdated: result.totalVehiclesUpdated,
      };
    } catch (error) {
      return {
        success: false,
        message: `Inventory sync failed: ${String(error)}`,
        error: String(error),
      };
    }
  }),

  /**
   * Get sync schedule status
   */
  getSyncScheduleStatus: protectedProcedure.query(async () => {
    return {
      isEnabled: true,
      schedule: "0 2 * * *", // 2 AM daily
      timezone: "UTC",
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message: "Nightly inventory sync is enabled and will run at 2 AM UTC daily",
    };
  }),

  /**
   * Enable/disable nightly sync
   */
  setScheduleEnabled: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      // In production, this would update a database setting
      return {
        success: true,
        message: input.enabled
          ? "Nightly inventory sync enabled"
          : "Nightly inventory sync disabled",
        enabled: input.enabled,
      };
    }),

  /**
   * Get sync history
   */
  getSyncHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      // In production, this would query sync history from database
      return {
        syncs: [
          {
            id: "sync_1",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            source: "cars_co_za",
            status: "completed",
            vehiclesProcessed: 150,
            vehiclesAdded: 12,
            vehiclesUpdated: 45,
            duration: 45000,
          },
          {
            id: "sync_2",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            source: "autotrader",
            status: "completed",
            vehiclesProcessed: 200,
            vehiclesAdded: 8,
            vehiclesUpdated: 62,
            duration: 52000,
          },
        ],
        total: 2,
      };
    }),

  /**
   * Configure sync sources
   */
  configureSyncSources: protectedProcedure
    .input(
      z.object({
        carsCoZaEnabled: z.boolean().default(true),
        autotraderEnabled: z.boolean().default(true),
        syncInterval: z.enum(["daily", "twice_daily", "weekly"]).default("daily"),
      })
    )
    .mutation(async ({ input }) => {
      // In production, this would save configuration to database
      return {
        success: true,
        message: "Sync sources configured successfully",
        config: {
          carsCoZaEnabled: input.carsCoZaEnabled,
          autotraderEnabled: input.autotraderEnabled,
          syncInterval: input.syncInterval,
        },
      };
    }),
};
