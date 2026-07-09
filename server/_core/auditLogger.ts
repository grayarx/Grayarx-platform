import { getDb } from "../db";
import { adminAuditLog } from "../../drizzle/schema";

export interface AuditLogEntry {
  adminId: number;
  action: string;
  userId?: number;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action for audit trail
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(adminAuditLog).values({
      adminId: entry.adminId,
      action: entry.action,
      targetUserId: entry.userId,
      changesJson: entry.changes ? JSON.stringify(entry.changes) : null,
      ipAddress: entry.ipAddress || "",
      userAgent: entry.userAgent || "",
    });
  } catch (error) {
    console.error("[AuditLogger] Failed to log action:", error);
  }
}

/**
 * Log user login
 */
export async function logUserLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAuditAction({
    adminId: userId,
    action: "USER_LOGIN",
    userId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log user logout
 */
export async function logUserLogout(userId: number, ipAddress?: string): Promise<void> {
  await logAuditAction({
    adminId: userId,
    action: "USER_LOGOUT",
    userId,
    ipAddress,
  });
}

/**
 * Log password change
 */
export async function logPasswordChange(userId: number, adminId: number, ipAddress?: string): Promise<void> {
  await logAuditAction({
    adminId,
    action: "PASSWORD_CHANGED",
    userId,
    ipAddress,
  });
}

/**
 * Log 2FA enabled
 */
export async function log2FAEnabled(userId: number, method: string, adminId?: number): Promise<void> {
  await logAuditAction({
    adminId: adminId || userId,
    action: "2FA_ENABLED",
    userId,
    changes: { method },
  });
}

/**
 * Log 2FA disabled
 */
export async function log2FADisabled(userId: number, adminId?: number): Promise<void> {
  await logAuditAction({
    adminId: adminId || userId,
    action: "2FA_DISABLED",
    userId,
  });
}

/**
 * Log social account linked
 */
export async function logSocialAccountLinked(userId: number, provider: string, adminId?: number): Promise<void> {
  await logAuditAction({
    adminId: adminId || userId,
    action: "SOCIAL_ACCOUNT_LINKED",
    userId,
    changes: { provider },
  });
}

/**
 * Log social account unlinked
 */
export async function logSocialAccountUnlinked(userId: number, provider: string, adminId?: number): Promise<void> {
  await logAuditAction({
    adminId: adminId || userId,
    action: "SOCIAL_ACCOUNT_UNLINKED",
    userId,
    changes: { provider },
  });
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(email: string, ipAddress?: string, reason?: string): Promise<void> {
  await logAuditAction({
    adminId: 0, // System action
    action: "FAILED_LOGIN",
    changes: { email, reason },
    ipAddress,
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(userId: number, activityType: string, details?: Record<string, any>): Promise<void> {
  await logAuditAction({
    adminId: 0, // System action
    action: "SUSPICIOUS_ACTIVITY",
    userId,
    changes: { activityType, ...details },
  });
}

/**
 * Log admin action on user
 */
export async function logAdminAction(adminId: number, action: string, userId: number, changes?: Record<string, any>): Promise<void> {
  await logAuditAction({
    adminId,
    action: `ADMIN_${action}`,
    userId,
    changes,
  });
}
