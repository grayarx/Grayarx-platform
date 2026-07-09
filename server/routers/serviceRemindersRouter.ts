import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const serviceRemindersRouter = router({
  // Get maintenance schedule
  getMaintenanceSchedule: protectedProcedure
    .input(z.object({ vehicleId: z.number(), dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        vehicleId: input.vehicleId,
        schedule: [
          { service: "Oil Change", interval: "5000 miles or 6 months", nextDue: "4500 miles", daysUntilDue: 45 },
          { service: "Tire Rotation", interval: "7500 miles", nextDue: "6800 miles", daysUntilDue: 60 },
          { service: "Air Filter", interval: "15000 miles", nextDue: "14200 miles", daysUntilDue: 120 },
          { service: "Cabin Filter", interval: "15000 miles", nextDue: "14200 miles", daysUntilDue: 120 },
          { service: "Brake Inspection", interval: "12000 miles", nextDue: "11500 miles", daysUntilDue: 90 },
          { service: "Fluid Check", interval: "6 months", nextDue: "2 months", daysUntilDue: 60 },
        ],
      };
    }),

  // Create reminder rule
  createReminderRule: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        serviceType: z.string(),
        interval: z.string(),
        reminderDaysBefore: z.number(),
        channel: z.enum(["sms", "email", "both"]),
        messageTemplate: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        ruleId: Math.random(),
        dealershipId: input.dealershipId,
        serviceType: input.serviceType,
        created: true,
      };
    }),

  // Get reminder rules
  getReminderRules: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        rules: [
          {
            id: 1,
            serviceType: "Oil Change",
            interval: "5000 miles or 6 months",
            reminderDaysBefore: 14,
            channel: "both",
            enabled: true,
          },
          {
            id: 2,
            serviceType: "Tire Rotation",
            interval: "7500 miles",
            reminderDaysBefore: 21,
            channel: "sms",
            enabled: true,
          },
          {
            id: 3,
            serviceType: "Air Filter",
            interval: "15000 miles",
            reminderDaysBefore: 30,
            channel: "email",
            enabled: true,
          },
        ],
      };
    }),

  // Send service reminder
  sendServiceReminder: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        vehicleId: z.number(),
        dealershipId: z.number(),
        serviceType: z.string(),
        channel: z.enum(["sms", "email"]),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        customerId: input.customerId,
        serviceType: input.serviceType,
        channel: input.channel,
        reminderSent: true,
        sentAt: new Date(),
      };
    }),

  // Get pending reminders
  getPendingReminders: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        pendingReminders: [
          {
            id: 1,
            customerId: 101,
            vehicleId: 1,
            make: "BMW",
            model: "3 Series",
            serviceType: "Oil Change",
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            mileage: 4500,
            channel: "sms",
            status: "pending",
          },
          {
            id: 2,
            customerId: 102,
            vehicleId: 2,
            make: "Mercedes-Benz",
            model: "C-Class",
            serviceType: "Tire Rotation",
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            mileage: 6800,
            channel: "email",
            status: "pending",
          },
        ],
      };
    }),

  // Get reminder history
  getReminderHistory: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        customerId: z.number().optional(),
        days: z.number().default(90),
      })
    )
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        period: `Last ${input.days} days`,
        reminders: [
          {
            id: 1,
            customerId: 101,
            serviceType: "Oil Change",
            sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            channel: "sms",
            status: "delivered",
            appointmentBooked: true,
          },
          {
            id: 2,
            customerId: 102,
            serviceType: "Tire Rotation",
            sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            channel: "email",
            status: "delivered",
            appointmentBooked: false,
          },
        ],
      };
    }),

  // Update reminder rule
  updateReminderRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.number(),
        dealershipId: z.number(),
        reminderDaysBefore: z.number().optional(),
        channel: z.enum(["sms", "email", "both"]).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        ruleId: input.ruleId,
        updated: true,
      };
    }),

  // Delete reminder rule
  deleteReminderRule: protectedProcedure
    .input(z.object({ ruleId: z.number(), dealershipId: z.number() }))
    .mutation(({ input }) => {
      return {
        success: true,
        ruleId: input.ruleId,
        deleted: true,
      };
    }),

  // Get reminder statistics
  getReminderStats: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(30) }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        period: `Last ${input.days} days`,
        stats: {
          totalRemindersSent: 342,
          deliveryRate: 96.5,
          appointmentBookingRate: 68,
          mostReminderService: "Oil Change",
          preferredChannel: "SMS",
          averageResponseTime: "2.3 days",
        },
      };
    }),

  // Trigger bulk reminders
  triggerBulkReminders: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        serviceType: z.string(),
        channel: z.enum(["sms", "email", "both"]),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        dealershipId: input.dealershipId,
        serviceType: input.serviceType,
        remindersSent: 45,
      };
    }),

  // Test reminder template
  testReminderTemplate: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        template: z.string(),
        channel: z.enum(["sms", "email"]),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        preview: `Your ${input.channel === "sms" ? "SMS" : "email"} reminder: ${input.template}`,
        characterCount: input.template.length,
      };
    }),
});
