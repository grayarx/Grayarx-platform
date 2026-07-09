import { getDb } from "./db";
import { dealershipAuditLogs } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export type AuditAction = "create" | "update" | "delete" | "status_change" | "export" | "import" | "login" | "logout";
export type AuditResourceType = "lead" | "vehicle" | "booking" | "preapproval" | "settings" | "user" | "dealership";

export interface AuditLogParams {
  dealershipId?: number;
  userId?: number;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: number;
  resourceName?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: AuditLogParams): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[AuditLogger] Database not available, skipping audit log");
      return 0;
    }

    const result = await db
      .insert(dealershipAuditLogs)
      .values({
        dealershipId: params.dealershipId,
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        oldValue: params.oldValue,
        newValue: params.newValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        description: params.description,
        createdAt: new Date(),
      })
      .execute();

    // @ts-expect-error Drizzle MySQL returns insertId
    return Number(result?.[0]?.insertId ?? result?.insertId ?? 0);
  } catch (error) {
    console.error("[AuditLogger] Error logging audit event:", error);
    return 0;
  }
}

/**
 * Get audit logs for a dealership
 */
export async function getAuditLogs(
  dealershipId: number,
  filters?: {
    userId?: number;
    action?: AuditAction;
    resourceType?: AuditResourceType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  try {
    const db = await getDb();
    if (!db) return [];

    let conditions: any[] = [eq(dealershipAuditLogs.dealershipId, dealershipId)];

    if (filters?.userId) {
      conditions.push(eq(dealershipAuditLogs.userId, filters.userId));
    }

    if (filters?.action) {
      conditions.push(eq(dealershipAuditLogs.action, filters.action));
    }

    if (filters?.resourceType) {
      conditions.push(eq(dealershipAuditLogs.resourceType, filters.resourceType));
    }

    const query = db
      .select()
      .from(dealershipAuditLogs)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(dealershipAuditLogs.createdAt))
      .limit(filters?.limit ?? 100);

    const logs = await query.execute();

    // Filter by date range if provided
    if (filters?.startDate || filters?.endDate) {
      return logs.filter((log) => {
        if (filters.startDate && log.createdAt < filters.startDate) return false;
        if (filters.endDate && log.createdAt > filters.endDate) return false;
        return true;
      });
    }

    return logs;
  } catch (error) {
    console.error("[AuditLogger] Error getting audit logs:", error);
    return [];
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditHistory(
  dealershipId: number,
  resourceType: AuditResourceType,
  resourceId: number
) {
  try {
    const db = await getDb();
    if (!db) return [];

    const logs = await db
      .select()
      .from(dealershipAuditLogs)
      .where(
        and(
          eq(dealershipAuditLogs.dealershipId, dealershipId),
          eq(dealershipAuditLogs.resourceType, resourceType),
          eq(dealershipAuditLogs.resourceId, resourceId)
        )
      )
      .orderBy(desc(dealershipAuditLogs.createdAt))
      .execute();

    return logs;
  } catch (error) {
    console.error("[AuditLogger] Error getting resource history:", error);
    return [];
  }
}

/**
 * Get audit statistics for dealership
 */
export async function getAuditStatistics(dealershipId: number, days = 30) {
  try {
    const db = await getDb();
    if (!db) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db
      .select()
      .from(dealershipAuditLogs)
      .where(eq(dealershipAuditLogs.dealershipId, dealershipId))
      .execute();

    const recentLogs = logs.filter((log) => log.createdAt >= startDate);

    // Count by action
    const byAction: Record<string, number> = {};
    recentLogs.forEach((log) => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
    });

    // Count by resource type
    const byResourceType: Record<string, number> = {};
    recentLogs.forEach((log) => {
      byResourceType[log.resourceType] = (byResourceType[log.resourceType] || 0) + 1;
    });

    // Count by user
    const byUser: Record<number, number> = {};
    recentLogs.forEach((log) => {
      if (log.userId) {
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
      }
    });

    return {
      totalEvents: recentLogs.length,
      period: { days, startDate },
      byAction,
      byResourceType,
      byUser,
    };
  } catch (error) {
    console.error("[AuditLogger] Error getting statistics:", error);
    return null;
  }
}

/**
 * Export audit logs to CSV format
 */
export async function exportAuditLogsCSV(dealershipId: number, filters?: Parameters<typeof getAuditLogs>[1]) {
  try {
    const logs = await getAuditLogs(dealershipId, filters);

    const headers = ["ID", "User ID", "Action", "Resource Type", "Resource ID", "Resource Name", "IP Address", "Created At"];

    const rows = logs.map((log) => [
      log.id,
      log.userId || "",
      log.action,
      log.resourceType,
      log.resourceId || "",
      log.resourceName || "",
      log.ipAddress || "",
      log.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    return csv;
  } catch (error) {
    console.error("[AuditLogger] Error exporting audit logs:", error);
    throw error;
  }
}
