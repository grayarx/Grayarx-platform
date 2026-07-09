/**
 * Admin 2FA Enforcement Service
 * Manages 2FA requirements and enforcement for admin users
 */

import { getDb } from "../db";
import { admin2FAEnforcement, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const GRACE_PERIOD_DAYS = 14; // 14 days for admins to set up 2FA
const REMINDER_INTERVAL_DAYS = 3; // Send reminders every 3 days

/**
 * Initialize 2FA enforcement for a new admin user
 */
export async function initializeAdmin2FAEnforcement(
  userId: number,
  gracePeriodDays: number = GRACE_PERIOD_DAYS
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const gracePeriodEndsAt = new Date();
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + gracePeriodDays);

    await db.insert(admin2FAEnforcement).values({
      userId,
      requirementStatus: "required",
      gracePeriodEndsAt,
    });

    return true;
  } catch (error) {
    console.error("Failed to initialize 2FA enforcement:", error);
    return false;
  }
}

/**
 * Get 2FA enforcement status for a user
 */
export async function getAdmin2FAEnforcementStatus(userId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const record = await db
      .select()
      .from(admin2FAEnforcement)
      .where(eq(admin2FAEnforcement.userId, userId))
      .limit(1);

    return record?.[0] || null;
  } catch (error) {
    console.error("Failed to get 2FA enforcement status:", error);
    return null;
  }
}

/**
 * Check if user is required to have 2FA
 */
export async function isAdmin2FARequired(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Check if user is admin
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0 || user[0].role !== "admin") {
      return false;
    }

    // Check enforcement status
    const enforcement = await getAdmin2FAEnforcementStatus(userId);

    if (!enforcement) {
      // Initialize if not exists
      await initializeAdmin2FAEnforcement(userId);
      return true;
    }

    // Check if requirement is active
    if (
      enforcement.requirementStatus === "exempted" ||
      enforcement.requirementStatus === "setup_completed"
    ) {
      return false;
    }

    // Check if grace period has expired
    if (
      enforcement.gracePeriodEndsAt &&
      new Date() > enforcement.gracePeriodEndsAt
    ) {
      return true;
    }

    return enforcement.requirementStatus === "required";
  } catch (error) {
    console.error("Failed to check 2FA requirement:", error);
    return false;
  }
}

/**
 * Check if 2FA setup is completed for admin
 */
export async function isAdmin2FASetupComplete(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const enforcement = await getAdmin2FAEnforcementStatus(userId);

    if (!enforcement) {
      return false;
    }

    return enforcement.requirementStatus === "setup_completed";
  } catch (error) {
    console.error("Failed to check 2FA setup completion:", error);
    return false;
  }
}

/**
 * Mark 2FA setup as completed
 */
export async function markAdmin2FASetupComplete(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db
      .update(admin2FAEnforcement)
      .set({
        requirementStatus: "setup_completed",
        updatedAt: new Date(),
      })
      .where(eq(admin2FAEnforcement.userId, userId));

    return true;
  } catch (error) {
    console.error("Failed to mark 2FA setup complete:", error);
    return false;
  }
}

/**
 * Exempt user from 2FA requirement
 */
export async function exemptAdminFrom2FA(
  userId: number,
  exemptedBy: number,
  reason: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db
      .update(admin2FAEnforcement)
      .set({
        requirementStatus: "exempted",
        exemptionReason: reason,
        exemptedBy,
        updatedAt: new Date(),
      })
      .where(eq(admin2FAEnforcement.userId, userId));

    return true;
  } catch (error) {
    console.error("Failed to exempt user from 2FA:", error);
    return false;
  }
}

/**
 * Send 2FA setup reminder
 */
export async function sendAdmin2FAReminderIfNeeded(
  userId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const enforcement = await getAdmin2FAEnforcementStatus(userId);

    if (!enforcement) {
      return false;
    }

    // Check if reminder should be sent
    const lastReminderSent = enforcement.reminderSentAt
      ? new Date(enforcement.reminderSentAt)
      : null;
    const now = new Date();

    // Send reminder if:
    // 1. No reminder has been sent yet, OR
    // 2. Last reminder was more than REMINDER_INTERVAL_DAYS ago
    const shouldSendReminder =
      !lastReminderSent ||
      now.getTime() - lastReminderSent.getTime() >
        REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

    if (!shouldSendReminder) {
      return false;
    }

    // Update reminder tracking
    await db
      .update(admin2FAEnforcement)
      .set({
        reminderSentAt: now,
        reminderCount: (enforcement.reminderCount || 0) + 1,
        updatedAt: now,
      })
      .where(eq(admin2FAEnforcement.userId, userId));

    // TODO: Send email reminder via emailService
    // await sendAdmin2FAReminder(userId);

    return true;
  } catch (error) {
    console.error("Failed to send 2FA reminder:", error);
    return false;
  }
}

/**
 * Get all admins who haven't completed 2FA setup
 */
export async function getAdminsWithoutCompleted2FA() {
  try {
    const db = await getDb();
    if (!db) return [];

    const records = await db
      .select({
        userId: admin2FAEnforcement.userId,
        requirementStatus: admin2FAEnforcement.requirementStatus,
        gracePeriodEndsAt: admin2FAEnforcement.gracePeriodEndsAt,
        reminderCount: admin2FAEnforcement.reminderCount,
      })
      .from(admin2FAEnforcement)
      .where(
        and(
          eq(admin2FAEnforcement.requirementStatus, "required"),
          // Grace period has not ended yet
          // This will be checked in application logic
        )
      );

    return records;
  } catch (error) {
    console.error("Failed to get admins without 2FA:", error);
    return [];
  }
}

/**
 * Check if admin's grace period has expired
 */
export async function hasAdmin2FAGracePeriodExpired(
  userId: number
): Promise<boolean> {
  try {
    const enforcement = await getAdmin2FAEnforcementStatus(userId);

    if (!enforcement || !enforcement.gracePeriodEndsAt) {
      return false;
    }

    return new Date() > new Date(enforcement.gracePeriodEndsAt);
  } catch (error) {
    console.error("Failed to check grace period:", error);
    return false;
  }
}

/**
 * Get days remaining in grace period
 */
export async function getAdmin2FAGracePeriodDaysRemaining(
  userId: number
): Promise<number> {
  try {
    const enforcement = await getAdmin2FAEnforcementStatus(userId);

    if (!enforcement || !enforcement.gracePeriodEndsAt) {
      return 0;
    }

    const now = new Date();
    const endDate = new Date(enforcement.gracePeriodEndsAt);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysRemaining);
  } catch (error) {
    console.error("Failed to get grace period days remaining:", error);
    return 0;
  }
}

/**
 * Extend grace period for admin
 */
export async function extendAdmin2FAGracePeriod(
  userId: number,
  additionalDays: number = 7
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const enforcement = await getAdmin2FAEnforcementStatus(userId);

    if (!enforcement) {
      return false;
    }

    const currentEndDate = enforcement.gracePeriodEndsAt
      ? new Date(enforcement.gracePeriodEndsAt)
      : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    await db
      .update(admin2FAEnforcement)
      .set({
        gracePeriodEndsAt: newEndDate,
        updatedAt: new Date(),
      })
      .where(eq(admin2FAEnforcement.userId, userId));

    return true;
  } catch (error) {
    console.error("Failed to extend grace period:", error);
    return false;
  }
}
