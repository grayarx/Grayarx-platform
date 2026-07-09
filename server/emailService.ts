import { getDb } from "./db";
import { emailNotifications, notificationPreferences } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendEmailParams {
  dealershipId: number;
  type: "new_lead" | "lead_status_change" | "booking_request" | "preapproval_submission";
  recipient: string;
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

/**
 * Check if dealership has quiet hours enabled and if current time is within quiet hours
 */
export async function isWithinQuietHours(dealershipId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.dealershipId, dealershipId))
      .limit(1);

    const pref = prefs.length > 0 ? prefs[0] : null;

    if (!pref || !pref.quietHoursStart || !pref.quietHoursEnd) {
      return false;
    }

    // Get current time in dealership's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: pref.timezone || "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const timeString = formatter.format(now);
    const [currentHour, currentMinute] = timeString.split(":").map(Number);
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = pref.quietHoursStart.split(":").map(Number);
    const startTime = startHour * 60 + startMinute;

    const [endHour, endMinute] = pref.quietHoursEnd.split(":").map(Number);
    const endTime = endHour * 60 + endMinute;

    // Handle case where quiet hours span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  } catch (error) {
    console.error("[EmailService] Error checking quiet hours:", error);
    return false;
  }
}

/**
 * Check if notification type is enabled for dealership
 */
export async function isNotificationEnabled(
  dealershipId: number,
  type: SendEmailParams["type"]
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return true;

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.dealershipId, dealershipId))
      .limit(1);

    const pref = prefs.length > 0 ? prefs[0] : null;

    if (!pref) {
      // Default: all notifications enabled
      return true;
    }

    switch (type) {
      case "new_lead":
        return pref.newLeadEnabled === 1;
      case "lead_status_change":
        return pref.leadStatusChangeEnabled === 1;
      case "booking_request":
        return pref.bookingRequestEnabled === 1;
      case "preapproval_submission":
        return pref.preapprovalSubmissionEnabled === 1;
      default:
        return true;
    }
  } catch (error) {
    console.error("[EmailService] Error checking notification enabled:", error);
    return true;
  }
}

/**
 * Send email notification via Resend API
 */
export async function sendEmailNotification(params: SendEmailParams): Promise<{
  success: boolean;
  notificationId?: number;
  error?: string;
}> {
  try {
    // Check if notification type is enabled
    const enabled = await isNotificationEnabled(params.dealershipId, params.type);
    if (!enabled) {
      console.log(`[EmailService] Notification type ${params.type} disabled for dealership ${params.dealershipId}`);
      return { success: false, error: "Notification type disabled" };
    }

    // Check if within quiet hours
    const inQuietHours = await isWithinQuietHours(params.dealershipId);
    if (inQuietHours) {
      console.log(`[EmailService] Within quiet hours for dealership ${params.dealershipId}`);
      return { success: false, error: "Within quiet hours" };
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Store notification record first
    const result = await db
      .insert(emailNotifications)
      .values({
        dealershipId: params.dealershipId,
        type: params.type,
        recipient: params.recipient,
        subject: params.subject,
        body: params.body,
        status: "pending",
        metadata: params.metadata,
      })
      .execute();

    // @ts-expect-error Drizzle MySQL returns insertId
    const notificationId = Number(result?.[0]?.insertId ?? result?.insertId ?? 0);

    // Send via Resend if API key is available
    if (!RESEND_API_KEY) {
      console.warn("[EmailService] RESEND_API_KEY not configured, storing notification only");
      return { success: true, notificationId };
    }

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "notifications@grayarx.com",
        to: params.recipient,
        subject: params.subject,
        html: params.body,
        reply_to: "support@grayarx.com",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[EmailService] Resend API error:", error);

      // Update notification status to failed
      await db
        .update(emailNotifications)
        .set({ status: "failed" })
        .where(eq(emailNotifications.id, notificationId))
        .execute();

      return { success: false, error: `Resend API error: ${response.statusText}` };
    }

    // Update notification status to sent
    await db
      .update(emailNotifications)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailNotifications.id, notificationId))
      .execute();

    return { success: true, notificationId };
  } catch (error) {
    console.error("[EmailService] Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get notification preferences for dealership
 */
export async function getNotificationPreferences(dealershipId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.dealershipId, dealershipId))
      .limit(1);

    const pref = prefs.length > 0 ? prefs[0] : null;

    if (!pref) {
      // Return defaults
      return {
        dealershipId,
        newLeadEnabled: 1,
        leadStatusChangeEnabled: 1,
        bookingRequestEnabled: 1,
        preapprovalSubmissionEnabled: 1,
        notificationFrequency: "immediate",
        timezone: "Africa/Johannesburg",
      };
    }

    return pref;
  } catch (error) {
    console.error("[EmailService] Error getting preferences:", error);
    throw error;
  }
}

/**
 * Update notification preferences for dealership
 */
export async function updateNotificationPreferences(
  dealershipId: number,
  updates: Partial<typeof notificationPreferences.$inferInsert>
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.dealershipId, dealershipId))
      .limit(1);

    const existingPref = existing.length > 0 ? existing[0] : null;

    if (!existingPref) {
      // Create new preferences
      await db
        .insert(notificationPreferences)
        .values({
          dealershipId,
          ...updates,
        })
        .execute();
    } else {
      // Update existing
      await db
        .update(notificationPreferences)
        .set(updates)
        .where(eq(notificationPreferences.dealershipId, dealershipId))
        .execute();
    }

    return getNotificationPreferences(dealershipId);
  } catch (error) {
    console.error("[EmailService] Error updating preferences:", error);
    throw error;
  }
}

/**
 * Get notification history for dealership
 */
export async function getNotificationHistory(dealershipId: number, limit = 50) {
  try {
    const db = await getDb();
    if (!db) return [];

    const history = await db
      .select()
      .from(emailNotifications)
      .where(eq(emailNotifications.dealershipId, dealershipId))
      .orderBy(desc(emailNotifications.createdAt))
      .limit(limit);

    return history;
  } catch (error) {
    console.error("[EmailService] Error getting history:", error);
    throw error;
  }
}
