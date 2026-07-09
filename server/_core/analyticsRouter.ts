import { router, protectedProcedure } from "./trpc";
import { z } from "zod";

export const analyticsRouter = router({
  getMetrics: protectedProcedure
    .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
    .query(async ({ ctx, input }) => {
      // In production, fetch from database
      return {
        totalLeads: 1440,
        conversionRate: 4.8,
        avgResponseTime: 28,
        revenueImpact: 2400000,
        trend: "up",
      };
    }),

  getFunnelData: protectedProcedure
    .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
    .query(async ({ ctx, input }) => {
      return [
        { name: "Website Visits", value: 4000 },
        { name: "Form Submissions", value: 3000 },
        { name: "Demo Requests", value: 2200 },
        { name: "Trial Signups", value: 1800 },
        { name: "Paid Conversions", value: 900 },
      ];
    }),

  getAgentPerformance: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(["7d", "30d", "90d", "1y"]),
        agentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return [
        { name: "Mia (Email)", leads: 450, conversions: 89, rate: "19.8%" },
        { name: "Themba (Calls)", leads: 380, conversions: 95, rate: "25%" },
        { name: "Lerato (Booking)", leads: 320, conversions: 280, rate: "87.5%" },
        { name: "Sipho (Prospecting)", leads: 290, conversions: 58, rate: "20%" },
      ];
    }),

  getConversionTrend: protectedProcedure
    .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
    .query(async ({ ctx, input }) => {
      return [
        { month: "Jan", rate: 2.4 },
        { month: "Feb", rate: 2.8 },
        { month: "Mar", rate: 3.2 },
        { month: "Apr", rate: 3.8 },
        { month: "May", rate: 4.2 },
        { month: "Jun", rate: 4.8 },
      ];
    }),

  getChannelBreakdown: protectedProcedure
    .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
    .query(async ({ ctx, input }) => {
      return [
        { name: "Email", value: 35 },
        { name: "Phone", value: 28 },
        { name: "WhatsApp", value: 22 },
        { name: "Web Chat", value: 15 },
      ];
    }),

  exportReport: protectedProcedure
    .input(z.object({ format: z.enum(["pdf", "csv"]), timeRange: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // In production, generate PDF or CSV
      return {
        success: true,
        message: `Report exported as ${input.format.toUpperCase()}`,
        url: `/downloads/analytics-report-${Date.now()}.${input.format}`,
      };
    }),
});
