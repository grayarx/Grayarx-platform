import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";

/**
 * Admin-only procedure wrapper
 * Ensures only users with admin role can access the procedure
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource. Admin access required.",
    });
  }

  return next({ ctx });
});

/**
 * Check if user is admin
 */
export function isAdmin(role?: string): boolean {
  return role === "admin";
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: "Administrator",
    user: "User",
    dealer: "Dealer",
    consultant: "Consultant",
  };
  return roleNames[role] || role;
}

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    admin: 100,
    dealer: 50,
    consultant: 25,
    user: 10,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}
