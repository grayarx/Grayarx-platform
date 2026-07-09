import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendSMS, sendWhatsApp, getTwilioStatus } from "./twilioService";

/**
 * SMS/WhatsApp notifications router
 * Handles sending and tracking notifications for bookings, leads, and payouts
 */
export const notificationsRouter = router({
  // Send SMS notification
  sendSMS: protectedProcedure
    .input(
      z.object({
        recipientPhone: z.string(),
        message: z.string(),
        notificationType: z.enum([
          "booking_confirmation",
          "booking_reminder",
          "lead_alert",
          "payout_notification",
          "system_alert",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create notification record
      const result = await db
        .insert(notifications)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          recipientPhone: input.recipientPhone,
          notificationType: input.notificationType,
          channel: "sms",
          messageContent: input.message,
          status: "pending",
        } as any);

      const notificationId = (result as any)[0]?.insertId || 1;

      // Send via Twilio (real or mock mode)
      const sendResult = await sendSMS(input.recipientPhone, input.message);

      // Update notification status
      const status = sendResult.success ? "sent" : "failed";
      const failureReason = sendResult.error || null;

      await db
        .update(notifications)
        .set({
          status,
          sentAt: sendResult.success ? new Date() : null,
          failureReason,
        })
        .where(eq(notifications.id, notificationId));

      return {
        notificationId,
        status,
        messageId: sendResult.messageId,
        mode: sendResult.mode,
        message: sendResult.success ? "SMS sent successfully" : `SMS failed: ${sendResult.error}`,
      };
    }),

  // Send WhatsApp notification
  sendWhatsApp: protectedProcedure
    .input(
      z.object({
        recipientPhone: z.string(),
        message: z.string(),
        notificationType: z.enum([
          "booking_confirmation",
          "booking_reminder",
          "lead_alert",
          "payout_notification",
          "system_alert",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create notification record
      const result = await db
        .insert(notifications)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          recipientPhone: input.recipientPhone,
          notificationType: input.notificationType,
          channel: "whatsapp",
          messageContent: input.message,
          status: "pending",
        } as any);

      const notificationId = (result as any)[0]?.insertId || 1;

      // Send via Twilio (real or mock mode)
      const sendResult = await sendWhatsApp(input.recipientPhone, input.message);

      // Update notification status
      const status = sendResult.success ? "delivered" : "failed";
      const failureReason = sendResult.error || null;

      await db
        .update(notifications)
        .set({
          status,
          sentAt: sendResult.success ? new Date() : null,
          failureReason,
        })
        .where(eq(notifications.id, notificationId));

      return {
        notificationId,
        status,
        messageId: sendResult.messageId,
        mode: sendResult.mode,
        message: sendResult.success ? "WhatsApp message sent successfully" : `WhatsApp failed: ${sendResult.error}`,
      };
    }),

  // Send email notification
  sendEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        subject: z.string(),
        message: z.string(),
        notificationType: z.enum([
          "booking_confirmation",
          "booking_reminder",
          "lead_alert",
          "payout_notification",
          "system_alert",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // In production, this would call SendGrid or similar
      // For now, create a notification record
      const result = await db
        .insert(notifications)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          recipientPhone: input.recipientEmail, // Store email in phone field for simplicity
          notificationType: input.notificationType,
          channel: "email",
          messageContent: input.message,
          status: "pending",
        } as any);

      const notificationId = (result as any)[0]?.insertId || 1;

      // Simulate sending
      setTimeout(async () => {
        const db2 = await getDb();
        if (db2) {
          await db2
            .update(notifications)
            .set({
              status: "sent",
              sentAt: new Date(),
            })
            .where(eq(notifications.id, notificationId));
        }
      }, 500);

      return {
        notificationId,
        status: "pending",
        message: "Email queued for delivery",
      };
    }),

  // Get notification history
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        status: z.enum(["pending", "sent", "failed", "delivered"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.dealershipId, ctx.user?.dealershipId || 0))
        .orderBy(desc(notifications.createdAt));

      const notifs = await query;

      let filtered = notifs;
      if (input.status) {
        filtered = notifs.filter((n) => n.status === input.status);
      }

      return filtered.slice(input.offset, input.offset + input.limit);
    }),

  // Get Twilio status
  getTwilioStatus: publicProcedure.query(async () => {
    return getTwilioStatus();
  }),

  // Get notification statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.dealershipId, ctx.user?.dealershipId || 0));

    const sent = notifs.filter((n) => n.status === "sent").length;
    const delivered = notifs.filter((n) => n.status === "delivered").length;
    const failed = notifs.filter((n) => n.status === "failed").length;
    const pending = notifs.filter((n) => n.status === "pending").length;

    const bySMS = notifs.filter((n) => n.channel === "sms").length;
    const byWhatsApp = notifs.filter((n) => n.channel === "whatsapp").length;
    const byEmail = notifs.filter((n) => n.channel === "email").length;

    return {
      totalSent: sent,
      totalDelivered: delivered,
      totalFailed: failed,
      totalPending: pending,
      bySMS,
      byWhatsApp,
      byEmail,
      successRate: notifs.length > 0 ? ((sent + delivered) / notifs.length) * 100 : 0,
    };
  }),

  // Retry failed notification
  retry: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const notif = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId))
        .limit(1);

      if (!notif || notif.length === 0) {
        throw new Error("Notification not found");
      }

      // Reset status to pending for retry
      await db
        .update(notifications)
        .set({
          status: "pending",
          failureReason: null,
        })
        .where(eq(notifications.id, input.notificationId));

      return { success: true, message: "Notification queued for retry" };
    }),

  // Send booking confirmation
  sendBookingConfirmation: protectedProcedure
    .input(
      z.object({
        customerPhone: z.string(),
        customerName: z.string(),
        bookingDate: z.string(),
        bookingTime: z.string(),
        dealershipName: z.string(),
        channel: z.enum(["sms", "whatsapp"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const message = `Hi ${input.customerName}, your test drive booking at ${input.dealershipName} is confirmed for ${input.bookingDate} at ${input.bookingTime}. We look forward to seeing you!`;

      if (input.channel === "sms") {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db
          .insert(notifications)
          .values({
            dealershipId: ctx.user?.dealershipId || 0,
            recipientPhone: input.customerPhone,
            notificationType: "booking_confirmation",
            channel: "sms",
            messageContent: message,
            status: "pending",
          } as any);
        return { success: true, notificationId: (result as any)[0]?.insertId || 1 };
      } else {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db
          .insert(notifications)
          .values({
            dealershipId: ctx.user?.dealershipId || 0,
            recipientPhone: input.customerPhone,
            notificationType: "booking_confirmation",
            channel: "whatsapp",
            messageContent: message,
            status: "pending",
          } as any);
        return { success: true, notificationId: (result as any)[0]?.insertId || 1 };
      }
    }),

  // Send booking reminder
  sendBookingReminder: protectedProcedure
    .input(
      z.object({
        customerPhone: z.string(),
        customerName: z.string(),
        bookingDate: z.string(),
        bookingTime: z.string(),
        dealershipName: z.string(),
        channel: z.enum(["sms", "whatsapp"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const message = `Hi ${input.customerName}, reminder: your test drive at ${input.dealershipName} is tomorrow at ${input.bookingTime}. See you then!`;

      if (input.channel === "sms") {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db
          .insert(notifications)
          .values({
            dealershipId: ctx.user?.dealershipId || 0,
            recipientPhone: input.customerPhone,
            notificationType: "booking_reminder",
            channel: "sms",
            messageContent: message,
            status: "pending",
          } as any);
        return { success: true, notificationId: (result as any)[0]?.insertId || 1 };
      } else {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db
          .insert(notifications)
          .values({
            dealershipId: ctx.user?.dealershipId || 0,
            recipientPhone: input.customerPhone,
            notificationType: "booking_reminder",
            channel: "whatsapp",
            messageContent: message,
            status: "pending",
          } as any);
        return { success: true, notificationId: (result as any)[0]?.insertId || 1 };
      }
    }),

  // Send lead alert
  sendLeadAlert: protectedProcedure
    .input(
      z.object({
        dealershipPhone: z.string(),
        dealershipName: z.string(),
        leadName: z.string(),
        vehicleInterest: z.string(),
        channel: z.enum(["sms", "whatsapp"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const message = `New lead alert for ${input.dealershipName}: ${input.leadName} is interested in ${input.vehicleInterest}. Check your dashboard for details.`;

      if (input.channel === "sms") {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db
          .insert(notifications)
          .values({
            dealershipId: ctx.user?.dealershipId || 0,
            recipientPhone: input.dealershipPhone,
            notificationType: "lead_alert",
            channel: "sms",
            messageContent: message,
            status: "pending",
          } as any);
        return { success: true, notificationId: (result as any)[0]?.insertId || 1 };
      } else {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db
          .insert(notifications)
          .values({
            dealershipId: ctx.user?.dealershipId || 0,
            recipientPhone: input.dealershipPhone,
            notificationType: "lead_alert",
            channel: "whatsapp",
            messageContent: message,
            status: "pending",
          } as any);
        return { success: true, notificationId: (result as any)[0]?.insertId || 1 };
      }
    }),
});
