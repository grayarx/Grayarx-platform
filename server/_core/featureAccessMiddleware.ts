import { TRPCError } from "@trpc/server";
import { checkFeatureAccess, getSubscriptionTier } from "../featureAccessControl";

/**
 * Middleware to enforce feature access control on tRPC procedures
 * Usage: protectedProcedure.use(requireFeature("api_access"))
 */
export function requireFeature(featureId: string) {
  return async ({ ctx, next }: any) => {
    if (!ctx.user?.dealershipId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not associated with a dealership",
      });
    }

    const { hasAccess, tier, reason } = await checkFeatureAccess(ctx.user.dealershipId, featureId);

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Feature access denied: ${reason}. Current tier: ${tier}`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Middleware to check if dealership is on a specific tier or higher
 * Usage: protectedProcedure.use(requireTier("professional"))
 */
export function requireTier(minimumTier: "starter" | "professional" | "enterprise") {
  const tierHierarchy = { starter: 1, professional: 2, enterprise: 3 };

  return async ({ ctx, next }: any) => {
    if (!ctx.user?.dealershipId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not associated with a dealership",
      });
    }

    const currentTier = await getSubscriptionTier(ctx.user.dealershipId);

    if (!currentTier) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active subscription found",
      });
    }

    if ((tierHierarchy[currentTier] || 0) < (tierHierarchy[minimumTier] || 0)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires ${minimumTier} tier or higher. You are on ${currentTier} tier.`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Middleware to log feature access attempts
 */
export function logFeatureAccess(featureId: string) {
  return async ({ ctx, next }: any) => {
    const result = await next({ ctx });

    // Log successful access
    if (ctx.user?.dealershipId) {
      try {
        // TODO: Log to feature_access_logs table
        console.log(`[Feature Access] ${ctx.user.dealershipId} accessed ${featureId}`);
      } catch (error) {
        console.error("Error logging feature access:", error);
      }
    }

    return result;
  };
}
