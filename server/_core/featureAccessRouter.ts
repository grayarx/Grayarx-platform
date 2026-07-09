import { protectedProcedure, router, publicProcedure } from "./trpc";
import { getDb } from "../db";
import { subscriptions, dealerships } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  checkFeatureAccess,
  getAccessibleFeatures,
  getSubscriptionTier,
  getSubscriptionDetails,
  isSubscriptionExpiringsoon,
  FEATURE_DEFINITIONS,
  SubscriptionTier,
} from "../featureAccessControl";

/**
 * Feature Access Control Router
 * Handles feature access checks, subscription management, and admin operations
 */
export const featureAccessRouter = router({
  /**
   * Check if current dealership has access to a feature
   */
  checkFeatureAccess: protectedProcedure
    .input(z.object({ featureId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not associated with a dealership",
        });
      }

      const result = await checkFeatureAccess(ctx.user.dealershipId, input.featureId);
      return result;
    }),

  /**
   * Get all accessible features for current dealership
   */
  getAccessibleFeatures: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.dealershipId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not associated with a dealership",
      });
    }

    return await getAccessibleFeatures(ctx.user.dealershipId);
  }),

  /**
   * Get subscription details for current dealership
   */
  getSubscriptionDetails: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.dealershipId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not associated with a dealership",
      });
    }

    return await getSubscriptionDetails(ctx.user.dealershipId);
  }),

  /**
   * Check if subscription is expiring soon
   */
  isSubscriptionExpiringoon: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.dealershipId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not associated with a dealership",
      });
    }

    return await isSubscriptionExpiringsoon(ctx.user.dealershipId);
  }),

  /**
   * Get feature definitions (for UI)
   */
  getFeatureDefinitions: publicProcedure.query(() => {
    return Object.values(FEATURE_DEFINITIONS);
  }),

  /**
   * Admin: Get all dealership subscriptions
   */
  getAllSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin/founder
    if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view all subscriptions",
      });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allSubscriptions = await db
      .select()
      .from(subscriptions)
      .limit(1000);

    return allSubscriptions;
  }),

  /**
   * Admin: Update dealership subscription tier
   */
  updateSubscriptionTier: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        tier: z.enum(["starter", "professional", "enterprise"]),
        renewalDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin/founder
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update subscriptions",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const nextRenewalDate = input.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db
        .update(subscriptions)
        .set({
          plan: input.tier,
          nextRenewalDate: nextRenewalDate,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.dealershipId, input.dealershipId));

      return { success: true, message: `Updated ${input.dealershipId} to ${input.tier} tier` };
    }),

  /**
   * Admin: Suspend dealership subscription
   */
  suspendSubscription: protectedProcedure
    .input(z.object({ dealershipId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can suspend subscriptions",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(subscriptions)
        .set({
          status: "paused",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.dealershipId, input.dealershipId));

      return { success: true, message: `Suspended subscription for dealership ${input.dealershipId}` };
    }),

  /**
   * Admin: Cancel dealership subscription
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ dealershipId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can cancel subscriptions",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.dealershipId, input.dealershipId));

      return { success: true, message: `Cancelled subscription for dealership ${input.dealershipId}` };
    }),

  /**
   * Admin: Extend subscription renewal date
   */
  extendSubscription: protectedProcedure
    .input(z.object({ dealershipId: z.number(), monthsToAdd: z.number().min(1).max(36) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can extend subscriptions",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.dealershipId, input.dealershipId))
        .limit(1);

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      const currentRenewalDate = new Date(subscription.nextRenewalDate);
      const newRenewalDate = new Date(currentRenewalDate.getTime() + input.monthsToAdd * 30 * 24 * 60 * 60 * 1000);

      await db
        .update(subscriptions)
        .set({
          nextRenewalDate: newRenewalDate,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.dealershipId, input.dealershipId));

      return {
        success: true,
        message: `Extended subscription by ${input.monthsToAdd} months`,
        newRenewalDate,
      };
    }),

  /**
   * Get subscription statistics (admin only)
   */
  getSubscriptionStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view subscription stats",
      });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allSubscriptions = await db.select().from(subscriptions).limit(10000);

    const stats = {
      totalDealerships: allSubscriptions.length,
      byTier: {
        starter: allSubscriptions.filter((s) => s.plan === "starter").length,
        professional: allSubscriptions.filter((s) => s.plan === "professional").length,
        enterprise: allSubscriptions.filter((s) => s.plan === "enterprise").length,
      },
      byStatus: {
        active: allSubscriptions.filter((s) => s.status === "active").length,
        cancelled: allSubscriptions.filter((s) => s.status === "cancelled").length,
        paused: allSubscriptions.filter((s) => s.status === "paused").length,
      },
      monthlyRecurringRevenue: allSubscriptions.reduce((sum, s) => sum + (Number(s.monthlyPriceZar) || 0), 0),
    };

    return stats;
  }),
});
