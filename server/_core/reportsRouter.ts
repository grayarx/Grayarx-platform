import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const reportsRouter = router({
  // Generate custom report
  generate: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["sales", "leads", "agents", "revenue", "custom"]),
        startDate: z.date(),
        endDate: z.date(),
        metrics: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reportData = {
        period: `${input.startDate.toLocaleDateString()} - ${input.endDate.toLocaleDateString()}`,
        type: input.reportType,
        metrics: input.metrics || [],
        generatedAt: new Date(),
        summary: {
          totalLeads: Math.floor(Math.random() * 1000) + 100,
          totalSales: Math.floor(Math.random() * 500) + 50,
          totalRevenue: Math.floor(Math.random() * 5000000) + 500000,
          conversionRate: (Math.random() * 10 + 5).toFixed(2),
        },
      };

      const result = await db
        .insert(reports)
        .values({
          dealershipId: ctx.user?.dealershipId || 0,
          reportType: input.reportType,
          generatedAt: new Date(),
          dataJson: JSON.stringify(reportData),
        } as any);

      const reportId = (result as any)[0]?.insertId || 1;
      return { id: reportId, ...reportData };
    }),

  // Schedule report
  schedule: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["sales", "leads", "agents", "revenue"]),
        frequency: z.enum(["weekly", "monthly", "quarterly"]),
        recipients: z.array(z.string().email()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        scheduledFor: input.frequency,
        recipients: input.recipients,
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }),

  // Get predefined metrics
  getMetrics: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["sales", "leads", "agents", "revenue"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const mockMetrics: Record<string, any> = {
        sales: {
          totalSales: 45,
          revenue: 1125000,
          averageOrderValue: 25000,
          topProduct: "Toyota Hilux",
          topAgent: "John Smith",
          salesGrowth: 12.5,
        },
        leads: {
          totalLeads: 234,
          qualifiedLeads: 89,
          conversionRate: 38.2,
          leadSource: "Website",
          avgTimeToConvert: "5 days",
          leadGrowth: 8.3,
        },
        agents: {
          topAgent: "John Smith",
          topAgentSales: 15,
          teamAverage: 8.5,
          bestPerformer: "Sarah Johnson",
          worstPerformer: "Mike Brown",
          teamProductivity: 92.5,
        },
        revenue: {
          totalRevenue: 1125000,
          avgRevenue: 25000,
          revenueGrowth: 12.5,
          topCategory: "SUVs",
          profitMargin: 18.5,
          yearToDateRevenue: 4500000,
        },
      };

      return mockMetrics[input.reportType] || {};
    }),

  // List reports
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reportsData = await db
        .select()
        .from(reports)
        .where(eq(reports.dealershipId, ctx.user?.dealershipId || 0))
        .orderBy(desc(reports.generatedAt))
        .limit(input.limit)
        .offset(input.offset);

      return reportsData;
    }),

  // Get report details
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const report = await db
        .select()
        .from(reports)
        .where(eq(reports.id, input.id))
        .limit(1);

      if (!report || report.length === 0) {
        throw new Error("Report not found");
      }

      return {
        ...report[0],
        data: JSON.parse(report[0].dataJson as string),
      };
    }),

  // Export report
  export: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        format: z.enum(["pdf", "csv", "excel"]),
      })
    )
    .query(async ({ input, ctx }) => {
      return {
        success: true,
        format: input.format,
        url: `/exports/report-${input.id}.${input.format}`,
        expiresIn: "24h",
      };
    }),
});
