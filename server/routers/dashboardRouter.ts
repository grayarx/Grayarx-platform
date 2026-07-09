import { protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { calculateKPIMetrics, calculateROIMetrics, getDashboardData } from "../dashboardService";

export const dashboardRouter = {
  // Get KPI metrics for current period
  getKPIs: protectedProcedure
    .input(
      z.object({
        dealershipId: z.string(),
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify dealership ownership
      if (ctx.user.dealershipId && ctx.user.dealershipId !== parseInt(input.dealershipId)) {
        throw new Error("Unauthorized: Cannot access other dealership's data");
      }

      const kpis = await calculateKPIMetrics(input.dealershipId, input.period);
      return kpis;
    }),

  // Get ROI metrics
  getROI: protectedProcedure
    .input(
      z.object({
        dealershipId: z.string(),
        subscriptionTier: z.enum(["starter", "professional", "enterprise"]).default("professional"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify dealership ownership
      if (ctx.user.dealershipId && ctx.user.dealershipId !== parseInt(input.dealershipId)) {
        throw new Error("Unauthorized: Cannot access other dealership's data");
      }

      const roi = await calculateROIMetrics(input.dealershipId, input.subscriptionTier);
      return roi;
    }),

  // Get complete dashboard data
  getDashboard: protectedProcedure
    .input(
      z.object({
        dealershipId: z.string(),
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
        subscriptionTier: z.enum(["starter", "professional", "enterprise"]).default("professional"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify dealership ownership
      if (ctx.user.dealershipId && ctx.user.dealershipId !== parseInt(input.dealershipId)) {
        throw new Error("Unauthorized: Cannot access other dealership's data");
      }

      const dashboardData = await getDashboardData(
        input.dealershipId,
        input.period,
        input.subscriptionTier
      );
      return dashboardData;
    }),

  // Get historical KPI data for charts
  getKPIHistory: protectedProcedure
    .input(
      z.object({
        dealershipId: z.string(),
        days: z.number().min(7).max(365).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify dealership ownership
      if (ctx.user.dealershipId && ctx.user.dealershipId !== parseInt(input.dealershipId)) {
        throw new Error("Unauthorized: Cannot access other dealership's data");
      }

      // Generate historical data points
      const history = [];
      const today = new Date();

      for (let i = input.days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // For now, return placeholder data
        // In production, this would query aggregated metrics from database
        history.push({
          date: date.toISOString().split("T")[0],
          leads: Math.floor(Math.random() * 50) + 10,
          conversions: Math.floor(Math.random() * 15) + 2,
          revenue: Math.floor(Math.random() * 150000) + 20000,
          score: Math.floor(Math.random() * 30) + 60,
        });
      }

      return history;
    }),

  // Get comparison data (current vs previous period)
  getComparison: protectedProcedure
    .input(
      z.object({
        dealershipId: z.string(),
        period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify dealership ownership
      if (ctx.user.dealershipId && ctx.user.dealershipId !== parseInt(input.dealershipId)) {
        throw new Error("Unauthorized: Cannot access other dealership's data");
      }

      const currentKPIs = await calculateKPIMetrics(input.dealershipId, input.period);

      // Calculate previous period KPIs
      const previousPeriod = input.period === "year" ? "quarter" : input.period;
      const previousKPIs = await calculateKPIMetrics(input.dealershipId, previousPeriod);

      return {
        current: currentKPIs,
        previous: previousKPIs,
        comparison: {
          leadsChange: currentKPIs.totalLeads - previousKPIs.totalLeads,
          leadsChangePercent: currentKPIs.leadTrend,
          conversionChange: currentKPIs.conversionRate - previousKPIs.conversionRate,
          conversionChangePercent: currentKPIs.conversionTrend,
          revenueChange: currentKPIs.estimatedMonthlyRevenue - previousKPIs.estimatedMonthlyRevenue,
          roiChange: currentKPIs.estimatedROI - previousKPIs.estimatedROI,
        },
      };
    }),

  // Export dashboard data as CSV
  exportDashboard: protectedProcedure
    .input(
      z.object({
        dealershipId: z.string(),
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify dealership ownership
      if (ctx.user.dealershipId && ctx.user.dealershipId !== parseInt(input.dealershipId)) {
        throw new Error("Unauthorized: Cannot access other dealership's data");
      }

      const kpis = await calculateKPIMetrics(input.dealershipId, input.period);
      const roi = await calculateROIMetrics(input.dealershipId, "professional");

      // Generate CSV content
      const csvContent = `GrayArx Dashboard Export - ${new Date().toISOString()}

KPI Metrics (${input.period})
Total Leads,${kpis.totalLeads}
Leads This Month,${kpis.leadsThisMonth}
Leads This Week,${kpis.leadsThisWeek}
Average Leads Per Day,${kpis.averageLeadsPerDay.toFixed(2)}
Lead Trend (%),${kpis.leadTrend.toFixed(2)}

Lead Quality
Qualified Leads,${kpis.qualifiedLeads}
Qualification Rate (%),${kpis.qualificationRate.toFixed(2)}
Average Lead Score,${kpis.averageLeadScore.toFixed(2)}

Response Metrics
Average Response Time (ms),${kpis.averageResponseTime.toFixed(0)}
Response Time P95 (ms),${kpis.responseTimeP95.toFixed(0)}
Response Time P99 (ms),${kpis.responseTimeP99.toFixed(0)}

Conversion Metrics
Test Drive Conversions,${kpis.testDriveConversions}
Conversion Rate (%),${kpis.conversionRate.toFixed(2)}
Conversion Trend (%),${kpis.conversionTrend.toFixed(2)}

System Metrics
Platform Uptime (%),${kpis.platformUptime}
Webhook Delivery Rate (%),${kpis.webhookDeliveryRate}
API Response Time (ms),${kpis.apiResponseTime}

Financial Metrics
Estimated Monthly Revenue (R),${kpis.estimatedMonthlyRevenue.toFixed(2)}
Estimated Lead Value (R),${kpis.estimatedLeadValue.toFixed(2)}
Estimated ROI (%),${kpis.estimatedROI.toFixed(2)}
Payback Period (days),${kpis.paybackPeriod}

ROI Analysis
Monthly Subscription Cost (R),${roi.monthlySubscriptionCost}
Estimated Monthly Revenue (R),${roi.estimatedMonthlyRevenue.toFixed(2)}
Net Monthly Profit (R),${roi.netMonthlyProfit.toFixed(2)}
Profit Margin (%),${roi.profitMargin.toFixed(2)}

Lead Economics
Leads Per Month,${roi.leadsPerMonth}
Average Lead Value (R),${roi.averageLeadValue}
Conversion Rate (%),${roi.conversionRate.toFixed(2)}
Revenue Per Lead (R),${roi.revenuePerLead.toFixed(2)}

Cost Analysis
Cost Per Lead (R),${roi.costPerLead.toFixed(2)}
Cost Per Conversion (R),${roi.costPerConversion.toFixed(2)}
Break-even Leads,${roi.breakEvenLeads}

Growth Metrics
Monthly Growth (%),${roi.monthlyGrowth.toFixed(2)}
Conversion Growth (%),${roi.conversionGrowth.toFixed(2)}
Revenue Growth (%),${roi.revenueGrowth.toFixed(2)}

Payback Analysis
Payback Period (days),${roi.paybackPeriod}
Months to Break-even,${roi.monthsToBreakEven}
Annual Projected Revenue (R),${roi.annualProjectedRevenue.toFixed(2)}
`;

      return {
        csv: csvContent,
        filename: `grayarx-dashboard-${input.dealershipId}-${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),
};
