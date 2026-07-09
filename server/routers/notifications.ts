import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  sendSMS,
  sendEmail,
  notifyLeadReceived,
  notifyBookingConfirmed,
  sendFollowupReminder,
} from "../_core/notificationService";
import {
  sendWhatsAppMessage,
  handleIncomingWhatsAppMessage,
  notifyDealershipWhatsApp,
} from "../_core/whatsappService";
import {
  syncAllInventory,
  updateVehiclePrices,
  removeUnlistedVehicles,
} from "../_core/inventorySyncService";

export const notificationsRouter = router({
  // SMS Notifications
  sendSMS: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendSMS({
        phone: input.phone,
        message: input.message,
        type: "custom",
      });
    }),

  // Email Notifications
  sendEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        subject: z.string(),
        htmlContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendEmail({
        email: input.email,
        subject: input.subject,
        htmlContent: input.htmlContent,
        type: "custom",
      });
    }),

  // Notify lead received
  notifyLeadReceived: protectedProcedure
    .input(
      z.object({
        dealershipPhone: z.string(),
        dealershipEmail: z.string().email(),
        customerName: z.string(),
        customerPhone: z.string(),
        customerEmail: z.string().email(),
        vehicleInterest: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await notifyLeadReceived(input.dealershipPhone, input.dealershipEmail, {
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        vehicleInterest: input.vehicleInterest,
        message: input.message,
      });
    }),

  // Notify booking confirmed
  notifyBookingConfirmed: protectedProcedure
    .input(
      z.object({
        customerPhone: z.string(),
        customerEmail: z.string().email(),
        dealershipName: z.string(),
        vehicleDetails: z.string(),
        testDriveDate: z.string(),
        testDriveTime: z.string(),
        dealershipPhone: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await notifyBookingConfirmed(input.customerPhone, input.customerEmail, {
        dealershipName: input.dealershipName,
        vehicleDetails: input.vehicleDetails,
        testDriveDate: input.testDriveDate,
        testDriveTime: input.testDriveTime,
        dealershipPhone: input.dealershipPhone,
      });
    }),

  // Send follow-up reminder
  sendFollowupReminder: protectedProcedure
    .input(
      z.object({
        customerPhone: z.string(),
        customerEmail: z.string().email(),
        dealershipName: z.string(),
        vehicleDetails: z.string(),
        dealershipPhone: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendFollowupReminder(input.customerPhone, input.customerEmail, {
        dealershipName: input.dealershipName,
        vehicleDetails: input.vehicleDetails,
        dealershipPhone: input.dealershipPhone,
      });
    }),

  // WhatsApp Messages
  sendWhatsApp: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendWhatsAppMessage({
        phone: input.phone,
        message: input.message,
        type: "customer_enquiry",
      });
    }),

  // Handle incoming WhatsApp
  handleIncomingWhatsApp: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        message: z.string(),
        dealershipId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await handleIncomingWhatsAppMessage(
        input.phone,
        input.message,
        input.dealershipId
      );
    }),

  // Notify dealership via WhatsApp
  notifyDealershipWhatsApp: protectedProcedure
    .input(
      z.object({
        dealershipPhone: z.string(),
        customerName: z.string(),
        customerPhone: z.string(),
        vehicleInterest: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await notifyDealershipWhatsApp(input.dealershipPhone, {
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        vehicleInterest: input.vehicleInterest,
        message: input.message,
      });
    }),

  // Inventory Sync
  syncAllInventory: protectedProcedure
    .input(z.object({ dealershipId: z.string() }))
    .mutation(async ({ input }) => {
      return await syncAllInventory(input.dealershipId);
    }),

  // Update vehicle prices
  updateVehiclePrices: protectedProcedure
    .input(z.object({ dealershipId: z.string() }))
    .mutation(async ({ input }) => {
      return await updateVehiclePrices(input.dealershipId);
    }),

  // Remove unlisted vehicles
  removeUnlistedVehicles: protectedProcedure
    .input(z.object({ dealershipId: z.string() }))
    .mutation(async ({ input }) => {
      return await removeUnlistedVehicles(input.dealershipId);
    }),
});
