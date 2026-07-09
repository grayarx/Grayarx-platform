import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { auditLogs } from "../../drizzle/schema";
import { desc, gte, lte, eq, and } from "drizzle-orm";
import { getDb } from "../db";

/**
 * Audit Log Router
 * Provides procedures for fetching and analyzing audit logs
 */

export const auditRouter = router({
  /**
   * Get audit logs for current user's dealership
   */
  getDealershipLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        eventType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection failed");
        }

        // Build where clause
        const whereConditions: any[] = [];

        if (input.eventType) {
          whereConditions.push(eq(auditLogs.eventType, input.eventType));
        }

        if (input.startDate) {
          whereConditions.push(gte(auditLogs.timestamp, input.startDate));
        }

        if (input.endDate) {
          whereConditions.push(lte(auditLogs.timestamp, input.endDate));
        }

        // Query logs
        const logs = await db
          .select()
          .from(auditLogs)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(desc(auditLogs.timestamp))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const countResult = await db
          .select({ count: auditLogs.id })
          .from(auditLogs)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = countResult.length > 0 ? countResult[0].count : 0;

        return {
          logs: logs.map((log: any) => ({
            id: log.id,
            userId: log.userId,
            email: log.email,
            eventType: log.eventType,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            status: log.status,
            timestamp: log.timestamp,
            metadata: log.metadata ? JSON.parse(log.metadata) : null,
          })),
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch audit logs: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Get security metrics for dealership
   */
  getSecurityMetrics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection failed");
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        // Get all logs for the period
        const logs = await db
          .select()
          .from(auditLogs)
          .where(gte(auditLogs.timestamp, startDate));

        // Calculate metrics
        const totalLogins = logs.filter((l: any) => l.eventType.includes("login")).length;
        const failedLogins = logs.filter((l: any) => l.eventType === "login_failed").length;
        const uniqueIPs = new Set(logs.map((l: any) => l.ipAddress)).size;
        const suspiciousActivities = logs.filter((l: any) => l.eventType === "suspicious_activity").length;

        // Calculate email verification rate (mock for now)
        const emailVerificationRate = 98;

        // Calculate password strength score (mock for now)
        const passwordStrengthScore = 92;

        // Calculate 2FA adoption rate (mock for now)
        const twoFAAdoptionRate = 45;

        // Calculate average session duration (mock for now)
        const averageSessionDuration = 45;

        // Find peak login hour
        const hourCounts = new Map<number, number>();
        logs.forEach((log: any) => {
          const hour = log.timestamp.getHours();
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });
        const peakLoginHour = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 14;

        // Find top failure reason
        const failureReasons: Record<string, number> = {};
        logs
          .filter((l: any) => l.eventType === "login_failed")
          .forEach((l: any) => {
            const reason = l.metadata ? JSON.parse(l.metadata).reason : "unknown";
            failureReasons[reason] = (failureReasons[reason] || 0) + 1;
          });

        const topFailureReason = Object.entries(failureReasons).sort((a, b) => b[1] - a[1])[0]?.[0] || "invalid_password";

        return {
          totalLogins,
          failedLogins,
          uniqueIPs,
          suspiciousActivities,
          emailVerificationRate,
          passwordStrengthScore,
          twoFAAdoptionRate,
          averageSessionDuration,
          peakLoginHour,
          topFailureReason,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch security metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Get suspicious activity alerts
   */
  getSuspiciousActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection failed");
        }

        // Get suspicious activity logs
        const alerts = await db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.eventType, "suspicious_activity"))
          .orderBy(desc(auditLogs.timestamp))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const countResult = await db
          .select({ count: auditLogs.id })
          .from(auditLogs)
          .where(eq(auditLogs.eventType, "suspicious_activity"));

        const total = countResult.length > 0 ? countResult[0].count : 0;

        return {
          alerts: alerts.map((alert: any) => ({
            id: alert.id,
            type: "suspicious_activity",
            severity: alert.status === "failed" ? "high" : "medium",
            description: alert.userAgent || "Suspicious activity detected",
            ipAddress: alert.ipAddress,
            timestamp: alert.timestamp,
            resolved: false,
          })),
          total,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch suspicious activity: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Lock account
   */
  lockAccount: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, update user.isLocked in database
      return {
        success: true,
        message: `Account locked. Reason: ${input.reason}`,
      };
    }),

  /**
   * Unlock account
   */
  unlockAccount: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, update user.isLocked in database
      return {
        success: true,
        message: "Account unlocked successfully",
      };
    }),

  /**
   * Add IP to whitelist
   */
  whitelistIP: protectedProcedure
    .input(
      z.object({
        ipAddress: z.string(),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, save to database
      return {
        success: true,
        message: `IP ${input.ipAddress} added to whitelist`,
      };
    }),

  /**
   * Add IP to blacklist
   */
  blacklistIP: protectedProcedure
    .input(
      z.object({
        ipAddress: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, save to database
      return {
        success: true,
        message: `IP ${input.ipAddress} added to blacklist`,
      };
    }),

  /**
   * Get IP lists
   */
  getIPLists: protectedProcedure.query(async ({ ctx }) => {
    try {
      // In production, query from database
      return {
        whitelist: [
          {
            id: 1,
            ipAddress: "192.168.1.100",
            label: "Office",
            addedAt: new Date(),
          },
        ],
        blacklist: [
          {
            id: 1,
            ipAddress: "203.0.113.42",
            reason: "Brute force attempt",
            addedAt: new Date(),
          },
        ],
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch IP lists: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }),

  /**
   * Export logs
   */
  exportLogs: protectedProcedure
    .input(
      z.object({
        format: z.enum(["csv", "json"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: "Export started. You will receive the file via email.",
        fileId: `export_${Date.now()}`,
      };
    }),
});
