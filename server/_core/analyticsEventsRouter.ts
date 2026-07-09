import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { analyticsEvents } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const analyticsEventsRouter = router({
  // Track custom event
  trackEvent: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        eventData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .insert(analyticsEvents)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          eventType: input.eventType,
          eventDataJson: JSON.stringify(input.eventData || {}),
          timestamp: new Date(),
        } as any);

      return { success: true };
    }),

  // Get metrics for a period
  getMetrics: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(["7d", "30d", "90d", "1y"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let startDate = input.startDate;
      let endDate = input.endDate || new Date();

      if (!startDate) {
        const daysBack = input.timeRange === "7d" ? 7 : input.timeRange === "30d" ? 30 : input.timeRange === "90d" ? 90 : 365;
        startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
      }

      const events = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.dealershipId, ctx.user?.dealershipId || 0),
            gte(analyticsEvents.timestamp, startDate),
            lte(analyticsEvents.timestamp, endDate)
          )
        );

      const leadEvents = events.filter((e) => e.eventType === "lead_created").length;
      const contactEvents = events.filter((e) => e.eventType === "contact_made").length;
      const bookingEvents = events.filter((e) => e.eventType === "booking_created").length;
      const saleEvents = events.filter((e) => e.eventType === "sale_completed").length;

      return {
        totalLeads: leadEvents,
        totalContacts: contactEvents,
        totalBookings: bookingEvents,
        totalSales: saleEvents,
        conversionRate: leadEvents > 0 ? (saleEvents / leadEvents) * 100 : 0,
        revenue: saleEvents * 25000,
      };
    }),

  // Get conversion funnel
  getFunnel: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(["7d", "30d", "90d", "1y"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const daysBack = input.timeRange === "7d" ? 7 : input.timeRange === "30d" ? 30 : input.timeRange === "90d" ? 90 : 365;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const events = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.dealershipId, ctx.user?.dealershipId || 0),
            gte(analyticsEvents.timestamp, startDate)
          )
        );

      const leads = events.filter((e) => e.eventType === "lead_created").length;
      const contacts = events.filter((e) => e.eventType === "contact_made").length;
      const bookings = events.filter((e) => e.eventType === "booking_created").length;
      const sales = events.filter((e) => e.eventType === "sale_completed").length;

      return {
        stage1_leads: leads,
        stage2_contacts: contacts,
        stage2_to_stage3_rate: leads > 0 ? (contacts / leads) * 100 : 0,
        stage3_bookings: bookings,
        stage3_to_stage4_rate: contacts > 0 ? (bookings / contacts) * 100 : 0,
        stage4_sales: sales,
        stage4_conversion_rate: bookings > 0 ? (sales / bookings) * 100 : 0,
      };
    }),

  // Get events
  listEvents: protectedProcedure
    .input(
      z.object({
        eventType: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let events = await db
        .select()
        .from(analyticsEvents)
        .where(eq(analyticsEvents.dealershipId, ctx.user?.dealershipId || 0))
        .orderBy(desc(analyticsEvents.timestamp));

      if (input.eventType) {
        events = events.filter((e) => e.eventType === input.eventType);
      }

      return events
        .slice(input.offset, input.offset + input.limit);
    }),
});
