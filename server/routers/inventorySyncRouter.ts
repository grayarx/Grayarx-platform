/**
 * Live stock sync — dealer configures a CSV feed URL; cron / Sync now commits it.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getDealershipById,
  updateDealershipStockSync,
} from "../db";
import {
  assertSafeFeedUrl,
  syncDealershipStock,
} from "../_core/inventorySyncService";
import { protectedProcedure, router } from "../_core/trpc";

function requireDealershipId(user: {
  role?: string | null;
  dealershipId?: number | null;
}): number {
  if (user.dealershipId != null) return user.dealershipId;
  if (user.role === "founder" || user.role === "admin") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Select a dealership context to configure stock sync",
    });
  }
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "No dealership linked to this account",
  });
}

export const inventorySyncRouter = router({
  /** Current feed settings + last run for this dealership. */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const dealershipId = requireDealershipId(ctx.user);
    const dealer = await getDealershipById(dealershipId);
    if (!dealer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Dealership not found" });
    }
    return {
      feedUrl: dealer.stockSyncFeedUrl ?? "",
      enabled: Boolean(dealer.stockSyncEnabled),
      markMissingAsSold: Boolean(dealer.stockSyncMarkMissingAsSold),
      skipPhotoMirror: dealer.stockSyncSkipPhotoMirror == null
        ? true
        : Boolean(dealer.stockSyncSkipPhotoMirror),
      lastAt: dealer.stockSyncLastAt?.toISOString() ?? null,
      lastResult: dealer.stockSyncLastResult ?? null,
      scheduleHint: "Nightly via POST /api/scheduled/inventory-sync (external cron)",
    };
  }),

  saveConfig: protectedProcedure
    .input(
      z.object({
        feedUrl: z.string().max(500).optional(),
        enabled: z.boolean().optional(),
        markMissingAsSold: z.boolean().optional(),
        skipPhotoMirror: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dealershipId = requireDealershipId(ctx.user);
      const url = input.feedUrl?.trim() ?? undefined;
      if (url) {
        try {
          assertSafeFeedUrl(url);
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e instanceof Error ? e.message : "Invalid feed URL",
          });
        }
      }
      if (input.enabled && !url) {
        const existing = await getDealershipById(dealershipId);
        if (!existing?.stockSyncFeedUrl && !url) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Set a feed URL before enabling nightly sync",
          });
        }
      }
      await updateDealershipStockSync(dealershipId, {
        ...(input.feedUrl !== undefined
          ? { stockSyncFeedUrl: url || null }
          : {}),
        ...(input.enabled !== undefined
          ? { stockSyncEnabled: input.enabled }
          : {}),
        ...(input.markMissingAsSold !== undefined
          ? { stockSyncMarkMissingAsSold: input.markMissingAsSold }
          : {}),
        ...(input.skipPhotoMirror !== undefined
          ? { stockSyncSkipPhotoMirror: input.skipPhotoMirror }
          : {}),
      });
      return { success: true as const };
    }),

  /**
   * Run sync immediately from the saved feed URL, or from an optional pasted CSV.
   */
  syncNow: protectedProcedure
    .input(
      z
        .object({
          csv: z.string().min(1).max(2_000_000).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const dealershipId = requireDealershipId(ctx.user);
      const result = await syncDealershipStock(dealershipId, {
        csvOverride: input?.csv,
        ownerUserId: ctx.user.id,
      });
      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Stock sync failed",
        });
      }
      return result;
    }),

  /** @deprecated — use syncNow */
  executeSyncNow: protectedProcedure.mutation(async ({ ctx }) => {
    const dealershipId = requireDealershipId(ctx.user);
    const result = await syncDealershipStock(dealershipId, {
      ownerUserId: ctx.user.id,
    });
    return {
      success: result.success,
      message: result.success
        ? "Inventory sync completed"
        : result.error || "Inventory sync failed",
      totalVehiclesAdded: result.created,
      totalVehiclesUpdated: result.updated,
      markedSold: result.markedSold,
      error: result.error,
    };
  }),

  /** @deprecated — use getConfig */
  getSyncScheduleStatus: protectedProcedure.query(async ({ ctx }) => {
    const dealershipId = requireDealershipId(ctx.user);
    const dealer = await getDealershipById(dealershipId);
    return {
      isEnabled: Boolean(dealer?.stockSyncEnabled),
      schedule: "0 3 * * *",
      timezone: "Africa/Johannesburg",
      lastSync: dealer?.stockSyncLastAt?.toISOString() ?? null,
      nextSync: null,
      message: dealer?.stockSyncEnabled
        ? "Nightly stock sync is enabled — ensure cron hits /api/scheduled/inventory-sync"
        : "Nightly stock sync is off — save a feed URL and enable it on Import Inventory",
    };
  }),

  setScheduleEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const dealershipId = requireDealershipId(ctx.user);
      if (input.enabled) {
        const dealer = await getDealershipById(dealershipId);
        if (!dealer?.stockSyncFeedUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Set a stock feed URL before enabling nightly sync",
          });
        }
      }
      await updateDealershipStockSync(dealershipId, {
        stockSyncEnabled: input.enabled,
      });
      return {
        success: true as const,
        enabled: input.enabled,
        message: input.enabled
          ? "Nightly inventory sync enabled"
          : "Nightly inventory sync disabled",
      };
    }),
});
