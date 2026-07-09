import { getDb } from "../db";
import {
  users,
  adminAuditLog,
  userLoginHistory,
  userActivityLog,
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendPasswordResetEmail } from "./emailService";
import { generatePasswordResetToken } from "./customAuth";

/**
 * Get paginated list of users (admin only)
 */
export async function listUsers(
  page: number = 1,
  limit: number = 20,
  filters?: {
    role?: string;
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const offset = (page - 1) * limit;

  let query: any = db.select().from(users);

  if (filters?.role) {
    query = query.where(eq(users.role, filters.role as any));
  }

  // TODO: Add search filter for name/email

  const total = await db.select().from(users);
  const data = await query.limit(limit).offset(offset);

  return {
    data,
    total: total.length,
    page,
    limit,
    pages: Math.ceil(total.length / limit),
  };
}

/**
 * Get detailed user info with login history
 */
export async function getUserDetails(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) throw new Error("User not found");

  const loginHistory = await db
    .select()
    .from(userLoginHistory)
    .where(eq(userLoginHistory.userId, userId))
    .orderBy(desc(userLoginHistory.createdAt))
    .limit(50);

  const activityLog = await db
    .select()
    .from(userActivityLog)
    .where(eq(userActivityLog.userId, userId))
    .orderBy(desc(userActivityLog.createdAt))
    .limit(100);

  return {
    user: user[0],
    loginHistory,
    activityLog,
  };
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  adminId: number,
  targetUserId: number,
  newRole: string,
  ipAddress?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!user.length) throw new Error("User not found");

  const oldRole = user[0].role;

  // Update user role
  await db
    .update(users)
    .set({ role: newRole as any })
    .where(eq(users.id, targetUserId));

  // Log admin action
  await db.insert(adminAuditLog).values({
    adminId,
    action: "update_role",
    targetUserId,
    changesJson: JSON.stringify({ oldRole, newRole }),
    ipAddress,
  });
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPassword(
  adminId: number,
  targetUserId: number,
  ipAddress?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!user.length) throw new Error("User not found");
  if (!user[0].email) throw new Error("User has no email address");

  // Generate password reset token
  const token = await generatePasswordResetToken(user[0].id);

  // Send password reset email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user[0].email, resetUrl);

  // Log admin action
  await db.insert(adminAuditLog).values({
    adminId,
    action: "reset_password",
    targetUserId,
    changesJson: JSON.stringify({ email: user[0].email }),
    ipAddress,
  });
}

/**
 * Disable user account (admin only)
 */
export async function disableUser(
  adminId: number,
  targetUserId: number,
  ipAddress?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!user.length) throw new Error("User not found");

  // Update user (set a flag or change role)
  // For now, we'll just log the action
  // In production, you'd add an 'isActive' or 'status' field to users table

  // Log admin action
  await db.insert(adminAuditLog).values({
    adminId,
    action: "disable_user",
    targetUserId,
    changesJson: JSON.stringify({ status: "disabled" }),
    ipAddress,
  });
}

/**
 * Delete user account (admin only, soft delete)
 */
export async function deleteUser(
  adminId: number,
  targetUserId: number,
  ipAddress?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!user.length) throw new Error("User not found");

  // Soft delete: anonymize user data
  await db
    .update(users)
    .set({
      name: "[Deleted User]",
      email: null,
      passwordHash: null,
    })
    .where(eq(users.id, targetUserId));

  // Log admin action
  await db.insert(adminAuditLog).values({
    adminId,
    action: "delete_user",
    targetUserId,
    changesJson: JSON.stringify({ status: "deleted" }),
    ipAddress,
  });
}

/**
 * Get login history for user
 */
export async function getUserLoginHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return await db
    .select()
    .from(userLoginHistory)
    .where(eq(userLoginHistory.userId, userId))
    .orderBy(desc(userLoginHistory.createdAt))
    .limit(limit);
}

/**
 * Get activity log for user
 */
export async function getUserActivityLog(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return await db
    .select()
    .from(userActivityLog)
    .where(eq(userActivityLog.userId, userId))
    .orderBy(desc(userActivityLog.createdAt))
    .limit(limit);
}

/**
 * Get admin audit log
 */
export async function getAdminAuditLog(
  page: number = 1,
  limit: number = 50,
  filters?: {
    adminId?: number;
    action?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const offset = (page - 1) * limit;

  let query: any = db.select().from(adminAuditLog);

  if (filters?.adminId) {
    query = query.where(eq(adminAuditLog.adminId, filters.adminId));
  }

  if (filters?.action) {
    query = query.where(eq(adminAuditLog.action, filters.action));
  }

  const total = await db.select().from(adminAuditLog);
  const data = await query
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data,
    total: total.length,
    page,
    limit,
    pages: Math.ceil(total.length / limit),
  };
}

/**
 * Log user activity
 */
export async function logUserActivity(
  userId: number,
  action: string,
  resourceType?: string,
  resourceId?: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.insert(userActivityLog).values({
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  userId: number,
  status: "success" | "failed" | "2fa_pending",
  loginMethod: string,
  ipAddress?: string,
  userAgent?: string,
  failureReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.insert(userLoginHistory).values({
    userId,
    status,
    loginMethod,
    ipAddress: ipAddress || "",
    userAgent: userAgent || null,
    failureReason: failureReason || null,
  });
}
