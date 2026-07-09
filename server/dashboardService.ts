import { getDb } from './db';
import { leads, bookings, vehicles } from '../drizzle/schema';
import { eq, gte, lte, and, count, avg, sum } from 'drizzle-orm';
import { TIER_PRICES_ZAR } from '../shared/subscriptionTiers';

export interface KPIMetrics {
  // Lead Metrics
  totalLeads: number;
  leadsThisMonth: number;
  leadsThisWeek: number;
  averageLeadsPerDay: number;
  leadTrend: number; // percentage change from previous period

  // Lead Quality
  qualifiedLeads: number;
  qualificationRate: number; // percentage
  averageLeadScore: number;

  // Response Metrics
  averageResponseTime: number; // milliseconds
  responseTimeP95: number;
  responseTimeP99: number;

  // Conversion Metrics
  testDriveConversions: number;
  conversionRate: number; // percentage
  conversionTrend: number; // percentage change

  // System Metrics
  platformUptime: number; // percentage
  webhookDeliveryRate: number; // percentage
  apiResponseTime: number; // milliseconds

  // Financial Metrics
  estimatedMonthlyRevenue: number;
  estimatedLeadValue: number;
  estimatedROI: number; // percentage
  paybackPeriod: number; // days
}

export interface ROIMetrics {
  // Revenue Metrics
  monthlySubscriptionCost: number;
  estimatedMonthlyRevenue: number;
  netMonthlyProfit: number;
  profitMargin: number; // percentage

  // Lead Economics
  leadsPerMonth: number;
  averageLeadValue: number;
  conversionRate: number;
  revenuePerLead: number;

  // Cost Analysis
  costPerLead: number;
  costPerConversion: number;
  breakEvenLeads: number;

  // Trend Analysis
  monthlyGrowth: number; // percentage
  conversionGrowth: number; // percentage
  revenueGrowth: number; // percentage

  // Payback Analysis
  paybackPeriod: number; // days
  monthsToBreakEven: number;
  annualProjectedRevenue: number;
}

export interface DashboardData {
  kpis: KPIMetrics;
  roi: ROIMetrics;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  generatedAt: Date;
}

export async function calculateKPIMetrics(
  dealershipId: string,
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<KPIMetrics> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  // Calculate date range
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Get leads for current period
  const currentLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.dealershipId, parseInt(dealershipId)),
        gte(leads.createdAt, startDate),
        lte(leads.createdAt, now)
      )
    );

  // Get leads for previous period (for trend calculation)
  const previousStartDate = new Date(startDate);
  previousStartDate.setTime(startDate.getTime() - (now.getTime() - startDate.getTime()));

  const previousLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.dealershipId, parseInt(dealershipId)),
        gte(leads.createdAt, previousStartDate),
        lte(leads.createdAt, startDate)
      )
    );

  // Calculate metrics
  const totalLeads = currentLeads.length;
  const qualifiedLeads = currentLeads.filter((l: any) => l.score >= 70).length;
  const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
  const averageLeadScore =
    totalLeads > 0
      ? currentLeads.reduce((sum: number, l: any) => sum + (l.score || 0), 0) / totalLeads
      : 0;

  // Calculate response time metrics
  const responseTimes = currentLeads
    .map((l: any) => l.responseTime || 0)
    .sort((a: number, b: number) => a - b);

  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const responseTimeP95 =
    responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.95)]
      : 0;

  const responseTimeP99 =
    responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.99)]
      : 0;

  // Get test drive conversions
  const testDriveConversions = currentLeads.filter((l: any) => l.convertedToBooking).length;
  const conversionRate =
    totalLeads > 0 ? (testDriveConversions / totalLeads) * 100 : 0;

  // Calculate trends
  const leadTrend =
    previousLeads.length > 0
      ? ((totalLeads - previousLeads.length) / previousLeads.length) * 100
      : 0;

  const previousConversions = previousLeads.filter((l: any) => l.convertedToBooking).length;
  const previousConversionRate =
    previousLeads.length > 0 ? (previousConversions / previousLeads.length) * 100 : 0;

  const conversionTrend =
    previousConversionRate > 0
      ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100
      : 0;

  // Estimate financial metrics
  const estimatedLeadValue = 10000; // R10,000 average
  const estimatedMonthlyRevenue = testDriveConversions * estimatedLeadValue;
  const subscriptionCost = 7999; // Growth tier default (see shared/subscriptionTiers.ts)
  const estimatedROI =
    subscriptionCost > 0
      ? ((estimatedMonthlyRevenue - subscriptionCost) / subscriptionCost) * 100
      : 0;

  // Calculate payback period
  const paybackPeriod =
    estimatedMonthlyRevenue > 0
      ? Math.ceil((subscriptionCost / estimatedMonthlyRevenue) * 30)
      : 0;

  // Platform metrics (placeholder - would be collected from monitoring)
  const platformUptime = 99.9;
  const webhookDeliveryRate = 99.5;
  const apiResponseTime = 250;

  // Calculate average leads per day
  const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const averageLeadsPerDay = daysDiff > 0 ? totalLeads / daysDiff : 0;

  // Calculate this month and this week
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const thisWeekStart = new Date();
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const leadsThisMonth = currentLeads.filter(
    (l: any) => new Date(l.createdAt).getTime() >= thisMonthStart.getTime()
  ).length;

  const leadsThisWeek = currentLeads.filter(
    (l: any) => new Date(l.createdAt).getTime() >= thisWeekStart.getTime()
  ).length;

  return {
    totalLeads,
    leadsThisMonth,
    leadsThisWeek,
    averageLeadsPerDay,
    leadTrend,
    qualifiedLeads,
    qualificationRate,
    averageLeadScore,
    averageResponseTime,
    responseTimeP95,
    responseTimeP99,
    testDriveConversions,
    conversionRate,
    conversionTrend,
    platformUptime,
    webhookDeliveryRate,
    apiResponseTime,
    estimatedMonthlyRevenue,
    estimatedLeadValue,
    estimatedROI,
    paybackPeriod,
  };
}

export async function calculateROIMetrics(
  dealershipId: string,
  subscriptionTier: 'starter' | 'professional' | 'enterprise' = 'professional'
): Promise<ROIMetrics> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const subscriptionCosts = TIER_PRICES_ZAR;

  const monthlySubscriptionCost = subscriptionCosts[subscriptionTier];

  // Get current month metrics
  const now = new Date();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.dealershipId, parseInt(dealershipId)),
        gte(leads.createdAt, monthStart),
        lte(leads.createdAt, now)
      )
    );

  const leadsPerMonth = monthLeads.length;
  const testDriveConversions = monthLeads.filter((l: any) => l.convertedToBooking).length;
  const conversionRate = leadsPerMonth > 0 ? (testDriveConversions / leadsPerMonth) * 100 : 0;

  // Financial calculations
  const averageLeadValue = 10000; // R10,000
  const estimatedMonthlyRevenue = testDriveConversions * averageLeadValue;
  const netMonthlyProfit = estimatedMonthlyRevenue - monthlySubscriptionCost;
  const profitMargin =
    estimatedMonthlyRevenue > 0
      ? (netMonthlyProfit / estimatedMonthlyRevenue) * 100
      : -(monthlySubscriptionCost / averageLeadValue) * 100;

  // Cost analysis
  const costPerLead = leadsPerMonth > 0 ? monthlySubscriptionCost / leadsPerMonth : monthlySubscriptionCost;
  const costPerConversion =
    testDriveConversions > 0 ? monthlySubscriptionCost / testDriveConversions : monthlySubscriptionCost;

  // Break-even calculation
  const breakEvenLeads = Math.ceil(monthlySubscriptionCost / averageLeadValue);

  // Get previous month for growth calculation
  const previousMonthStart = new Date();
  previousMonthStart.setMonth(now.getMonth() - 1);
  previousMonthStart.setDate(1);
  previousMonthStart.setHours(0, 0, 0, 0);

  const previousMonthEnd = new Date(monthStart);
  previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

  const previousMonthLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.dealershipId, parseInt(dealershipId)),
        gte(leads.createdAt, previousMonthStart),
        lte(leads.createdAt, previousMonthEnd)
      )
    );

  const previousLeadsPerMonth = previousMonthLeads.length;
  const previousConversions = previousMonthLeads.filter((l: any) => l.convertedToBooking).length;
  const previousConversionRate =
    previousLeadsPerMonth > 0 ? (previousConversions / previousLeadsPerMonth) * 100 : 0;
  const previousMonthlyRevenue = previousConversions * averageLeadValue;

  // Growth calculations
  const monthlyGrowth =
    previousLeadsPerMonth > 0
      ? ((leadsPerMonth - previousLeadsPerMonth) / previousLeadsPerMonth) * 100
      : 0;

  const conversionGrowth =
    previousConversionRate > 0
      ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100
      : 0;

  const revenueGrowth =
    previousMonthlyRevenue > 0
      ? ((estimatedMonthlyRevenue - previousMonthlyRevenue) / previousMonthlyRevenue) * 100
      : 0;

  // Payback period
  const paybackPeriod =
    estimatedMonthlyRevenue > 0
      ? Math.ceil((monthlySubscriptionCost / estimatedMonthlyRevenue) * 30)
      : 999;

  const monthsToBreakEven =
    netMonthlyProfit > 0
      ? 1
      : estimatedMonthlyRevenue > 0
        ? Math.ceil(monthlySubscriptionCost / estimatedMonthlyRevenue)
        : 999;

  // Annual projection
  const annualProjectedRevenue = estimatedMonthlyRevenue * 12;

  const revenuePerLead = leadsPerMonth > 0 ? estimatedMonthlyRevenue / leadsPerMonth : 0;

  return {
    monthlySubscriptionCost,
    estimatedMonthlyRevenue,
    netMonthlyProfit,
    profitMargin,
    leadsPerMonth,
    averageLeadValue,
    conversionRate,
    revenuePerLead,
    costPerLead,
    costPerConversion,
    breakEvenLeads,
    monthlyGrowth,
    conversionGrowth,
    revenueGrowth,
    paybackPeriod,
    monthsToBreakEven,
    annualProjectedRevenue,
  };
}

export async function getDashboardData(
  dealershipId: string,
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month',
  subscriptionTier: 'starter' | 'professional' | 'enterprise' = 'professional'
): Promise<DashboardData> {
  const kpis = await calculateKPIMetrics(dealershipId, period);
  const roi = await calculateROIMetrics(dealershipId, subscriptionTier);

  return {
    kpis,
    roi,
    period,
    generatedAt: new Date(),
  };
}
