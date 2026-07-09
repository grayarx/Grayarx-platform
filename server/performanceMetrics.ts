import { getDb } from "./db";
import { performanceMetrics, leads, bookings } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface DailyMetrics {
  dealershipId: number;
  date: Date;
  leadVolume: number;
  leadConversionRate: number;
  avgResponseTime: number;
  revenueImpact: number;
  costPerLead: number;
  roi: number;
  bookingRate: number;
  preapprovalRate: number;
  avgLeadQuality: number;
}

/**
 * Calculate and store daily performance metrics for a dealership
 */
export async function calculateDailyMetrics(dealershipId: number, date: Date): Promise<DailyMetrics | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Get leads for the day
    const dayLeads = await db
      .select()
      .from(leads)
      .where(and(eq(leads.dealershipId, dealershipId), gte(leads.createdAt, dayStart), lte(leads.createdAt, dayEnd)))
      .execute();

    const leadVolume = dayLeads.length;

    // Calculate conversion rate
    const convertedLeads = dayLeads.filter((l) => l.status === "converted").length;
    const leadConversionRate = leadVolume > 0 ? (convertedLeads / leadVolume) * 100 : 0;

    // Calculate average response time (placeholder - would need actual response data)
    const avgResponseTime = 0;

    // Calculate revenue impact (placeholder)
    const revenueImpact = 0;

    // Calculate cost per lead (placeholder)
    const costPerLead = 0;

    // Calculate ROI (placeholder)
    const roi = 0;

    // Calculate booking rate
    const bookingLeads = dayLeads.filter((l) => l.status === "qualified").length;
    const bookingRate = leadVolume > 0 ? (bookingLeads / leadVolume) * 100 : 0;

    // Calculate preapproval rate (placeholder)
    const preapprovalRate = 0;

    // Calculate average lead quality (placeholder)
    const avgLeadQuality = 0.5;

    const metrics: DailyMetrics = {
      dealershipId,
      date,
      leadVolume,
      leadConversionRate,
      avgResponseTime,
      revenueImpact,
      costPerLead,
      roi,
      bookingRate,
      preapprovalRate,
      avgLeadQuality,
    };

    // Store in database
    await storeMetrics(metrics);

    return metrics;
  } catch (error) {
    console.error("[PerformanceMetrics] Error calculating daily metrics:", error);
    return null;
  }
}

/**
 * Store performance metrics in database
 */
async function storeMetrics(metrics: DailyMetrics): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const existing = await db
      .select()
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.dealershipId, metrics.dealershipId),
          eq(performanceMetrics.date, metrics.date)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(performanceMetrics)
        .set({
          leadVolume: metrics.leadVolume,
          leadConversionRate: String(metrics.leadConversionRate.toFixed(2)),
          avgResponseTime: metrics.avgResponseTime,
          revenueImpact: String(metrics.revenueImpact.toFixed(2)),
          costPerLead: String(metrics.costPerLead.toFixed(2)),
          roi: String(metrics.roi.toFixed(2)),
          bookingRate: String(metrics.bookingRate.toFixed(2)),
          preapprovalRate: String(metrics.preapprovalRate.toFixed(2)),
          avgLeadQuality: String(metrics.avgLeadQuality.toFixed(2)),
          metrics: metrics,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(performanceMetrics.dealershipId, metrics.dealershipId),
            eq(performanceMetrics.date, metrics.date)
          )
        )
        .execute();
    } else {
      await db
        .insert(performanceMetrics)
        .values({
          dealershipId: metrics.dealershipId,
          date: metrics.date,
          leadVolume: metrics.leadVolume,
          leadConversionRate: String(metrics.leadConversionRate.toFixed(2)),
          avgResponseTime: metrics.avgResponseTime,
          revenueImpact: String(metrics.revenueImpact.toFixed(2)),
          costPerLead: String(metrics.costPerLead.toFixed(2)),
          roi: String(metrics.roi.toFixed(2)),
          bookingRate: String(metrics.bookingRate.toFixed(2)),
          preapprovalRate: String(metrics.preapprovalRate.toFixed(2)),
          avgLeadQuality: String(metrics.avgLeadQuality.toFixed(2)),
          metrics: metrics,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    }
  } catch (error) {
    console.error("[PerformanceMetrics] Error storing metrics:", error);
  }
}

/**
 * Get performance metrics for a date range
 */
export async function getMetricsForDateRange(
  dealershipId: number,
  startDate: Date,
  endDate: Date
) {
  try {
    const db = await getDb();
    if (!db) return [];

    const metrics = await db
      .select()
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.dealershipId, dealershipId),
          gte(performanceMetrics.date, startDate),
          lte(performanceMetrics.date, endDate)
        )
      )
      .execute();

    return metrics.map((m) => ({
      ...m,
      leadConversionRate: Number(m.leadConversionRate) || 0,
      revenueImpact: Number(m.revenueImpact) || 0,
      costPerLead: Number(m.costPerLead) || 0,
      roi: Number(m.roi) || 0,
      bookingRate: Number(m.bookingRate) || 0,
      preapprovalRate: Number(m.preapprovalRate) || 0,
      avgLeadQuality: Number(m.avgLeadQuality) || 0,
    }));
  } catch (error) {
    console.error("[PerformanceMetrics] Error getting metrics:", error);
    return [];
  }
}

/**
 * Get summary statistics for a dealership
 */
export async function getPerformanceSummary(dealershipId: number, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const metrics = await getMetricsForDateRange(dealershipId, startDate, endDate);

    if (metrics.length === 0) {
      return {
        dealershipId,
        period: { days, startDate, endDate },
        totalLeads: 0,
        avgConversionRate: 0,
        avgResponseTime: 0,
        totalRevenue: 0,
        avgCostPerLead: 0,
        avgROI: 0,
        avgBookingRate: 0,
        avgPreapprovalRate: 0,
        avgLeadQuality: 0,
      };
    }

    const totalLeads = metrics.reduce((sum, m) => sum + m.leadVolume, 0);
    const avgConversionRate = metrics.reduce((sum, m) => sum + m.leadConversionRate, 0) / metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenueImpact, 0);
    const avgCostPerLead = metrics.reduce((sum, m) => sum + m.costPerLead, 0) / metrics.length;
    const avgROI = metrics.reduce((sum, m) => sum + m.roi, 0) / metrics.length;
    const avgBookingRate = metrics.reduce((sum, m) => sum + m.bookingRate, 0) / metrics.length;
    const avgPreapprovalRate = metrics.reduce((sum, m) => sum + m.preapprovalRate, 0) / metrics.length;
    const avgLeadQuality = metrics.reduce((sum, m) => sum + m.avgLeadQuality, 0) / metrics.length;

    return {
      dealershipId,
      period: { days, startDate, endDate },
      totalLeads,
      avgConversionRate,
      avgResponseTime,
      totalRevenue,
      avgCostPerLead,
      avgROI,
      avgBookingRate,
      avgPreapprovalRate,
      avgLeadQuality,
    };
  } catch (error) {
    console.error("[PerformanceMetrics] Error getting summary:", error);
    return null;
  }
}
