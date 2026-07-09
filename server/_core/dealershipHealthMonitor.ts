/**
 * Dealership Health Monitor - Extends Kagiso with dealership-specific metrics
 * 
 * Tracks:
 * - Dealership platform usage and engagement
 * - Churn risk indicators
 * - Upsell opportunities
 * - Feature adoption
 * - Support ticket trends
 */

import { invokeLLM } from "./llm";

export interface DealershipHealthMetrics {
  dealershipId: string;
  dealershipName: string;
  
  // Engagement
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  lastActivityAt: Date;
  
  // Usage
  leadsProcessed: number;
  bookingsCreated: number;
  emailsSent: number;
  callsPlaced: number;
  averageResponseTime: number; // seconds
  
  // Performance
  leadConversionRate: number; // %
  bookingShowupRate: number; // %
  customerSatisfactionScore: number; // 0-100
  
  // Churn Risk
  churnRiskScore: number; // 0-100 (higher = more at risk)
  churnIndicators: string[];
  
  // Upsell Opportunities
  upsellOpportunities: {
    type: string;
    description: string;
    estimatedValue: number;
    readiness: "high" | "medium" | "low";
  }[];
  
  // Feature Adoption
  featuresUsed: string[];
  unusedFeatures: string[];
  adoptionScore: number; // 0-100
  
  // Support
  supportTicketsOpen: number;
  supportTicketsTotalThisMonth: number;
  averageResolutionTime: number; // hours
  
  // Health Score
  overallHealthScore: number; // 0-100
  healthStatus: "excellent" | "good" | "at-risk" | "critical";
  lastAssessmentAt: Date;
}

/**
 * Calculate dealership health metrics
 */
export async function calculateDealershipHealth(input: {
  dealershipId: string;
  dealershipName: string;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  lastActivityAt: Date;
  leadsProcessed: number;
  bookingsCreated: number;
  emailsSent: number;
  callsPlaced: number;
  averageResponseTime: number;
  leadConversionRate: number;
  bookingShowupRate: number;
  customerSatisfactionScore: number;
  supportTicketsOpen: number;
  supportTicketsTotalThisMonth: number;
  averageResolutionTime: number;
}): Promise<DealershipHealthMetrics> {
  // Calculate churn risk
  const daysSinceLastActivity = Math.floor(
    (new Date().getTime() - input.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const churnRiskScore = calculateChurnRisk({
    daysSinceLastActivity,
    monthlyActiveUsers: input.monthlyActiveUsers,
    leadsProcessed: input.leadsProcessed,
    customerSatisfactionScore: input.customerSatisfactionScore,
    supportTicketsOpen: input.supportTicketsOpen,
  });

  const churnIndicators = identifyChurnIndicators({
    daysSinceLastActivity,
    monthlyActiveUsers: input.monthlyActiveUsers,
    leadConversionRate: input.leadConversionRate,
    customerSatisfactionScore: input.customerSatisfactionScore,
  });

  // Identify upsell opportunities
  const upsellOpportunities = identifyUpsellOpportunities({
    leadsProcessed: input.leadsProcessed,
    bookingsCreated: input.bookingsCreated,
    monthlyActiveUsers: input.monthlyActiveUsers,
    leadConversionRate: input.leadConversionRate,
  });

  // Calculate adoption score
  const adoptionScore = calculateAdoptionScore({
    emailsSent: input.emailsSent,
    callsPlaced: input.callsPlaced,
    bookingsCreated: input.bookingsCreated,
    leadsProcessed: input.leadsProcessed,
  });

  // Calculate overall health score
  const overallHealthScore = calculateOverallHealth({
    monthlyActiveUsers: input.monthlyActiveUsers,
    leadConversionRate: input.leadConversionRate,
    customerSatisfactionScore: input.customerSatisfactionScore,
    churnRiskScore,
    adoptionScore,
    supportTicketsOpen: input.supportTicketsOpen,
  });

  const healthStatus =
    overallHealthScore >= 80
      ? "excellent"
      : overallHealthScore >= 60
        ? "good"
        : overallHealthScore >= 40
          ? "at-risk"
          : "critical";

  return {
    dealershipId: input.dealershipId,
    dealershipName: input.dealershipName,
    dailyActiveUsers: input.dailyActiveUsers,
    weeklyActiveUsers: input.weeklyActiveUsers,
    monthlyActiveUsers: input.monthlyActiveUsers,
    lastActivityAt: input.lastActivityAt,
    leadsProcessed: input.leadsProcessed,
    bookingsCreated: input.bookingsCreated,
    emailsSent: input.emailsSent,
    callsPlaced: input.callsPlaced,
    averageResponseTime: input.averageResponseTime,
    leadConversionRate: input.leadConversionRate,
    bookingShowupRate: input.bookingShowupRate,
    customerSatisfactionScore: input.customerSatisfactionScore,
    churnRiskScore,
    churnIndicators,
    upsellOpportunities,
    featuresUsed: ["email", "calling", "booking", "whatsapp"],
    unusedFeatures: ["tradein", "preapproval"],
    adoptionScore,
    supportTicketsOpen: input.supportTicketsOpen,
    supportTicketsTotalThisMonth: input.supportTicketsTotalThisMonth,
    averageResolutionTime: input.averageResolutionTime,
    overallHealthScore,
    healthStatus,
    lastAssessmentAt: new Date(),
  };
}

/**
 * Calculate churn risk score (0-100, higher = more at risk)
 */
function calculateChurnRisk(input: {
  daysSinceLastActivity: number;
  monthlyActiveUsers: number;
  leadsProcessed: number;
  customerSatisfactionScore: number;
  supportTicketsOpen: number;
}): number {
  let score = 0;

  // Inactivity (max 40 points)
  if (input.daysSinceLastActivity > 30) score += 40;
  else if (input.daysSinceLastActivity > 14) score += 25;
  else if (input.daysSinceLastActivity > 7) score += 10;

  // Low usage (max 30 points)
  if (input.monthlyActiveUsers === 0) score += 30;
  else if (input.monthlyActiveUsers < 3) score += 15;

  // Low lead processing (max 20 points)
  if (input.leadsProcessed < 10) score += 20;
  else if (input.leadsProcessed < 50) score += 10;

  // Low satisfaction (max 10 points)
  if (input.customerSatisfactionScore < 50) score += 10;
  else if (input.customerSatisfactionScore < 70) score += 5;

  // High support tickets (max 10 points)
  if (input.supportTicketsOpen > 5) score += 10;

  return Math.min(100, score);
}

/**
 * Identify specific churn indicators
 */
function identifyChurnIndicators(input: {
  daysSinceLastActivity: number;
  monthlyActiveUsers: number;
  leadConversionRate: number;
  customerSatisfactionScore: number;
}): string[] {
  const indicators: string[] = [];

  if (input.daysSinceLastActivity > 30) {
    indicators.push("No activity in 30+ days");
  }
  if (input.monthlyActiveUsers === 0) {
    indicators.push("No active users");
  }
  if (input.leadConversionRate < 5) {
    indicators.push("Very low lead conversion rate");
  }
  if (input.customerSatisfactionScore < 60) {
    indicators.push("Low customer satisfaction");
  }

  return indicators;
}

/**
 * Identify upsell opportunities
 */
function identifyUpsellOpportunities(input: {
  leadsProcessed: number;
  bookingsCreated: number;
  monthlyActiveUsers: number;
  leadConversionRate: number;
}): DealershipHealthMetrics["upsellOpportunities"] {
  const opportunities: DealershipHealthMetrics["upsellOpportunities"] = [];

  // High volume dealership
  if (input.leadsProcessed > 500) {
    opportunities.push({
      type: "Premium Analytics",
      description: "Advanced reporting and predictive analytics",
      estimatedValue: 5000,
      readiness: "high",
    });
  }

  // Growing dealership
  if (input.leadConversionRate > 20 && input.monthlyActiveUsers > 5) {
    opportunities.push({
      type: "Team Expansion",
      description: "Add more team members with priority support",
      estimatedValue: 3000,
      readiness: "high",
    });
  }

  // Multi-location potential
  if (input.monthlyActiveUsers > 10) {
    opportunities.push({
      type: "Multi-Location",
      description: "Manage multiple dealership locations",
      estimatedValue: 8000,
      readiness: "medium",
    });
  }

  // Trade-in integration
  if (input.bookingsCreated > 100) {
    opportunities.push({
      type: "Trade-In Integration",
      description: "Automated trade-in valuations",
      estimatedValue: 2000,
      readiness: "medium",
    });
  }

  return opportunities;
}

/**
 * Calculate feature adoption score
 */
function calculateAdoptionScore(input: {
  emailsSent: number;
  callsPlaced: number;
  bookingsCreated: number;
  leadsProcessed: number;
}): number {
  const maxEmailsPerMonth = 1000;
  const maxCallsPerMonth = 500;
  const maxBookingsPerMonth = 200;
  const maxLeadsPerMonth = 1000;

  const emailScore = Math.min(100, (input.emailsSent / maxEmailsPerMonth) * 100);
  const callScore = Math.min(100, (input.callsPlaced / maxCallsPerMonth) * 100);
  const bookingScore = Math.min(100, (input.bookingsCreated / maxBookingsPerMonth) * 100);
  const leadScore = Math.min(100, (input.leadsProcessed / maxLeadsPerMonth) * 100);

  return Math.round((emailScore + callScore + bookingScore + leadScore) / 4);
}

/**
 * Calculate overall health score
 */
function calculateOverallHealth(input: {
  monthlyActiveUsers: number;
  leadConversionRate: number;
  customerSatisfactionScore: number;
  churnRiskScore: number;
  adoptionScore: number;
  supportTicketsOpen: number;
}): number {
  // Weighted scoring
  const usageScore = Math.min(100, (input.monthlyActiveUsers / 10) * 100); // 0-10 users = 0-100
  const conversionScore = Math.min(100, input.leadConversionRate * 5); // 0-20% = 0-100
  const satisfactionScore = input.customerSatisfactionScore; // Already 0-100
  const churnScore = 100 - input.churnRiskScore; // Invert churn risk
  const adoptionScore = input.adoptionScore; // Already 0-100
  const supportScore = Math.max(0, 100 - input.supportTicketsOpen * 10); // Fewer tickets = higher score

  const weights = {
    usage: 0.2,
    conversion: 0.2,
    satisfaction: 0.2,
    churn: 0.15,
    adoption: 0.15,
    support: 0.1,
  };

  const score =
    usageScore * weights.usage +
    conversionScore * weights.conversion +
    satisfactionScore * weights.satisfaction +
    churnScore * weights.churn +
    adoptionScore * weights.adoption +
    supportScore * weights.support;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Generate health report for dealership
 */
export async function generateHealthReport(
  metrics: DealershipHealthMetrics
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a dealership success analyst. Generate a brief health report (200-300 words) based on metrics.
Be professional, actionable, and positive. Highlight wins and opportunities.`,
        },
        {
          role: "user",
          content: `Generate a health report for ${metrics.dealershipName}:
Health Status: ${metrics.healthStatus}
Overall Score: ${metrics.overallHealthScore}/100
Monthly Active Users: ${metrics.monthlyActiveUsers}
Leads Processed: ${metrics.leadsProcessed}
Lead Conversion Rate: ${metrics.leadConversionRate}%
Customer Satisfaction: ${metrics.customerSatisfactionScore}/100
Churn Risk: ${metrics.churnRiskScore}/100
Adoption Score: ${metrics.adoptionScore}/100
Support Tickets: ${metrics.supportTicketsOpen} open
Upsell Opportunities: ${metrics.upsellOpportunities.length}

Churn Indicators: ${metrics.churnIndicators.join(", ") || "None"}`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === "string" ? content : "Health report generation failed";
  } catch (error) {
    console.error("[HealthMonitor] Report generation failed:", error);
    return `Health Status: ${metrics.healthStatus}. Overall Score: ${metrics.overallHealthScore}/100.`;
  }
}
