import { router, protectedProcedure } from "./trpc";
import { z } from "zod";
import { exportReport, ComparisonReportData } from "./reportExportService";

/**
 * Export Router
 * Handles report exports (PDF, CSV) for comparison analytics
 */

export const exportRouter = router({
  /**
   * Export comparison report as PDF
   */
  exportComparisonReportPDF: protectedProcedure
    .input(
      z.object({
        period1: z.object({
          label: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          metrics: z.object({
            totalLeads: z.number(),
            totalSales: z.number(),
            conversionRate: z.number(),
            totalRevenue: z.number(),
            avgROI: z.number(),
          }),
        }),
        period2: z.object({
          label: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          metrics: z.object({
            totalLeads: z.number(),
            totalSales: z.number(),
            conversionRate: z.number(),
            totalRevenue: z.number(),
            avgROI: z.number(),
          }),
        }),
        comparisons: z.array(
          z.object({
            metric: z.string(),
            period1Value: z.number(),
            period2Value: z.number(),
            change: z.number(),
            changePercent: z.number(),
            trend: z.enum(["up", "down", "neutral"]),
          })
        ),
        insights: z.object({
          bestImprovement: z.string(),
          worstPerformance: z.string(),
          overallTrend: z.string(),
          recommendations: z.array(z.string()),
        }),
        dealershipName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const reportData: ComparisonReportData = {
        ...input,
        generatedAt: new Date().toISOString(),
      };

      const { buffer, filename, mimeType } = await exportReport(reportData, "pdf");

      return {
        success: true,
        filename,
        mimeType,
        size: buffer.length,
        base64: buffer.toString("base64"),
      };
    }),

  /**
   * Export comparison report as CSV
   */
  exportComparisonReportCSV: protectedProcedure
    .input(
      z.object({
        period1: z.object({
          label: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          metrics: z.object({
            totalLeads: z.number(),
            totalSales: z.number(),
            conversionRate: z.number(),
            totalRevenue: z.number(),
            avgROI: z.number(),
          }),
        }),
        period2: z.object({
          label: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          metrics: z.object({
            totalLeads: z.number(),
            totalSales: z.number(),
            conversionRate: z.number(),
            totalRevenue: z.number(),
            avgROI: z.number(),
          }),
        }),
        comparisons: z.array(
          z.object({
            metric: z.string(),
            period1Value: z.number(),
            period2Value: z.number(),
            change: z.number(),
            changePercent: z.number(),
            trend: z.enum(["up", "down", "neutral"]),
          })
        ),
        insights: z.object({
          bestImprovement: z.string(),
          worstPerformance: z.string(),
          overallTrend: z.string(),
          recommendations: z.array(z.string()),
        }),
        dealershipName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const reportData: ComparisonReportData = {
        ...input,
        generatedAt: new Date().toISOString(),
      };

      const { buffer, filename, mimeType } = await exportReport(reportData, "csv");

      return {
        success: true,
        filename,
        mimeType,
        size: buffer.length,
        base64: buffer.toString("base64"),
      };
    }),

  /**
   * Get export format options
   */
  getExportFormats: protectedProcedure.query(async () => {
    return {
      formats: [
        {
          id: "pdf",
          name: "PDF Report",
          description: "Professional PDF with formatted metrics and insights",
          icon: "file-pdf",
          mimeType: "application/pdf",
        },
        {
          id: "csv",
          name: "CSV Spreadsheet",
          description: "Spreadsheet format for data analysis and import",
          icon: "file-csv",
          mimeType: "text/csv",
        },
      ],
    };
  }),
});
