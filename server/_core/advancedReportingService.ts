/**
 * Advanced Reporting Service for Tier 3 Enterprise
 * Provides 12-month forecasting, trend analysis, and predictive analytics
 */

interface SalesData {
  month: string;
  sales: number;
  revenue: number;
  leads: number;
  conversions: number;
}

interface ForecastResult {
  month: string;
  projected: number;
  low: number;
  high: number;
  confidence: number;
  trend: "up" | "down" | "stable";
}

interface AdvancedAnalytics {
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  conversionRate: number;
  topModels: Array<{ model: string; count: number; revenue: number }>;
  salesTrend: Array<{ period: string; sales: number; revenue: number }>;
  seasonalFactors: Record<string, number>;
  growthRate: number;
}

/**
 * Calculate 12-month sales forecast using exponential smoothing + seasonal decomposition
 */
export function generate12MonthForecast(
  historicalData: SalesData[],
  dealershipMetrics: {
    monthlyVolume: number;
    averagePrice: number;
    conversionRate: number;
  }
): ForecastResult[] {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate seasonal factors from historical data
  const seasonalFactors = calculateSeasonalFactors(historicalData);

  // Calculate trend using linear regression
  const trend = calculateTrend(historicalData);

  // Generate 12-month forecast
  const forecast: ForecastResult[] = [];
  const baseRevenue = dealershipMetrics.monthlyVolume * dealershipMetrics.averagePrice;

  for (let i = 0; i < 12; i++) {
    const month = months[i];
    const seasonalFactor = seasonalFactors[month] || 1;
    const trendFactor = 1 + trend * (i / 12); // Linear trend over 12 months
    const confidenceFactor = Math.max(0.7, 1 - i * 0.02); // Confidence decreases over time

    const projected = Math.round(baseRevenue * seasonalFactor * trendFactor);
    const variance = projected * 0.15; // 15% variance for confidence intervals

    forecast.push({
      month,
      projected,
      low: Math.round(projected - variance),
      high: Math.round(projected + variance),
      confidence: Math.round(85 * confidenceFactor),
      trend: trend > 0.01 ? "up" : trend < -0.01 ? "down" : "stable",
    });
  }

  return forecast;
}

/**
 * Calculate seasonal factors (multiplicative decomposition)
 */
function calculateSeasonalFactors(data: SalesData[]): Record<string, number> {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const factors: Record<string, number> = {};

  // Group data by month and calculate average
  const monthlyAverages: Record<string, number[]> = {};
  months.forEach((m) => (monthlyAverages[m] = []));

  data.forEach((d) => {
    const monthIndex = new Date(`${d.month} 1`).getMonth();
    const month = months[monthIndex];
    monthlyAverages[month].push(d.revenue);
  });

  // Calculate seasonal factors
  const overallAverage =
    data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

  months.forEach((month) => {
    const values = monthlyAverages[month];
    if (values.length > 0) {
      const monthAverage = values.reduce((a, b) => a + b, 0) / values.length;
      factors[month] = monthAverage / overallAverage;
    } else {
      factors[month] = 1;
    }
  });

  return factors;
}

/**
 * Calculate trend using linear regression
 */
function calculateTrend(data: SalesData[]): number {
  if (data.length < 2) return 0;

  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data.map((d) => d.revenue);

  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce(
    (sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean),
    0
  );
  const denominator = x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Generate advanced sales analytics
 */
export function generateAdvancedAnalytics(
  salesData: SalesData[],
  vehicleData: Array<{ model: string; price: number; count: number }>
): AdvancedAnalytics {
  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalLeads = salesData.reduce((sum, d) => sum + d.leads, 0);
  const totalConversions = salesData.reduce((sum, d) => sum + d.conversions, 0);

  // Calculate average price
  const averagePrice =
    totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

  // Calculate conversion rate
  const conversionRate =
    totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) / 100 : 0;

  // Get top models by revenue
  const topModels = vehicleData
    .map((v) => ({
      model: v.model,
      count: v.count,
      revenue: v.price * v.count,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate sales trend
  const salesTrend = salesData.map((d) => ({
    period: d.month,
    sales: d.sales,
    revenue: d.revenue,
  }));

  // Calculate seasonal factors
  const seasonalFactors = calculateSeasonalFactors(salesData);

  // Calculate growth rate (month-over-month)
  const growthRate =
    salesData.length >= 2
      ? ((salesData[salesData.length - 1].revenue -
          salesData[0].revenue) /
          salesData[0].revenue) *
        100
      : 0;

  return {
    totalSales,
    totalRevenue,
    averagePrice,
    conversionRate,
    topModels,
    salesTrend,
    seasonalFactors,
    growthRate: Math.round(growthRate * 100) / 100,
  };
}

/**
 * Generate predictive insights based on trends
 */
export function generatePredictiveInsights(
  forecast: ForecastResult[],
  analytics: AdvancedAnalytics
): Array<{
  insight: string;
  severity: "low" | "medium" | "high";
  recommendation: string;
}> {
  const insights: Array<{
    insight: string;
    severity: "low" | "medium" | "high";
    recommendation: string;
  }> = [];

  // Check for declining trend
  const upTrends = forecast.filter((f) => f.trend === "up").length;
  const downTrends = forecast.filter((f) => f.trend === "down").length;

  if (downTrends > upTrends) {
    insights.push({
      insight: "Sales trend is declining over the forecast period",
      severity: "high",
      recommendation:
        "Review marketing strategy and increase lead generation efforts",
    });
  }

  // Check for low conversion rate
  if (analytics.conversionRate < 10) {
    insights.push({
      insight: "Conversion rate is below industry average (10%)",
      severity: "high",
      recommendation:
        "Analyze sales process and implement conversion optimization",
    });
  }

  // Check for seasonal dips
  const minConfidence = Math.min(...forecast.map((f) => f.confidence));
  if (minConfidence < 70) {
    insights.push({
      insight: "Forecast confidence is declining in later months",
      severity: "medium",
      recommendation:
        "Plan for potential market volatility and maintain flexible inventory",
    });
  }

  // Check for growth opportunities
  if (analytics.growthRate > 15) {
    insights.push({
      insight: "Strong growth trajectory detected",
      severity: "low",
      recommendation:
        "Consider expanding inventory or opening new locations to capitalize on growth",
    });
  }

  // Check for inventory efficiency
  if (analytics.topModels.length > 0) {
    const topModelShare =
      analytics.topModels[0].count /
      analytics.topModels.reduce((sum, m) => sum + m.count, 0);
    if (topModelShare > 0.3) {
      insights.push({
        insight: "Top model dominates inventory (>30%)",
        severity: "medium",
        recommendation:
          "Diversify inventory to reduce risk and appeal to broader customer base",
      });
    }
  }

  return insights;
}

/**
 * Calculate KPI dashboard metrics
 */
export function calculateKPIDashboard(
  analytics: AdvancedAnalytics,
  forecast: ForecastResult[]
) {
  const avgProjectedRevenue = Math.round(
    forecast.reduce((sum, f) => sum + f.projected, 0) / forecast.length
  );

  const avgProjectedSales = Math.round(
    (analytics.totalSales / (forecast.length * 12)) * forecast.length
  );

  const projectedGrowth =
    ((forecast[11].projected - forecast[0].projected) / forecast[0].projected) *
    100;

  return {
    currentMonthRevenue: analytics.totalRevenue,
    averageMonthlyRevenue: Math.round(analytics.totalRevenue / 12),
    projectedAnnualRevenue: avgProjectedRevenue * 12,
    projectedMonthlyRevenue: avgProjectedRevenue,
    projectedMonthlySales: avgProjectedSales,
    conversionRate: analytics.conversionRate,
    averagePrice: analytics.averagePrice,
    growthRate: analytics.growthRate,
    projectedGrowth: Math.round(projectedGrowth * 100) / 100,
    topPerformingModel: analytics.topModels[0]?.model || "N/A",
    inventoryTurnover: Math.round(
      (analytics.totalSales / 12) * 30 // Assuming average 30-day inventory
    ),
  };
}

/**
 * Generate custom report data
 */
export function generateCustomReport(
  metrics: string[],
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
  data: Record<string, any>
) {
  const reportData: Record<string, any> = {};

  metrics.forEach((metric) => {
    switch (metric) {
      case "total_sales":
        reportData.total_sales = data.totalSales || 0;
        break;
      case "total_revenue":
        reportData.total_revenue = data.totalRevenue || 0;
        break;
      case "average_price":
        reportData.average_price = data.averagePrice || 0;
        break;
      case "conversion_rate":
        reportData.conversion_rate = data.conversionRate || 0;
        break;
      case "inventory_value":
        reportData.inventory_value = data.inventoryValue || 0;
        break;
      case "customer_satisfaction":
        reportData.customer_satisfaction = data.satisfaction || 0;
        break;
      case "service_revenue":
        reportData.service_revenue = data.serviceRevenue || 0;
        break;
      case "lead_count":
        reportData.lead_count = data.leads || 0;
        break;
    }
  });

  return {
    period,
    metrics: reportData,
    generatedAt: new Date().toISOString(),
    nextUpdate:
      period === "daily"
        ? new Date(Date.now() + 86400000).toISOString()
        : period === "weekly"
          ? new Date(Date.now() + 604800000).toISOString()
          : new Date(Date.now() + 2592000000).toISOString(),
  };
}
