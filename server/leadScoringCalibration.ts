import { getDb } from "./db";
import { leads } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface ScoringWeights {
  responseTime: number; // 0-100
  conversionRate: number; // 0-100
  qualityScore: number; // 0-100
  engagementLevel: number; // 0-100
  sourceQuality: number; // 0-100
}

export interface CalibrationResult {
  currentWeights: ScoringWeights;
  recommendedWeights: ScoringWeights;
  performanceMetrics: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    averageQualityScore: number;
    highQualityLeads: number;
    lowQualityLeads: number;
  };
  suggestions: string[];
}

// Default scoring weights
const DEFAULT_WEIGHTS: ScoringWeights = {
  responseTime: 20,
  conversionRate: 30,
  qualityScore: 25,
  engagementLevel: 15,
  sourceQuality: 10,
};

/**
 * Calculate lead score based on multiple factors
 */
export async function calculateLeadScore(
  leadId: number,
  dealershipId: string,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const leadData = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.dealershipId, parseInt(dealershipId))));

    if (leadData.length === 0) return 0;

    const lead = leadData[0];
    let score = 0;

    // Quality score (from database)
    const qualityScore = lead.qualityScore ? parseFloat(lead.qualityScore.toString()) * 100 : 50;
    score += (qualityScore * weights.qualityScore) / 100;

    // Conversion score (if converted)
    if (lead.status === "converted") {
      score += (100 * weights.conversionRate) / 100;
    } else if (lead.status === "qualified") {
      score += (70 * weights.conversionRate) / 100;
    } else if (lead.status === "contacted") {
      score += (40 * weights.conversionRate) / 100;
    }

    // Source quality score
    const sourceScores: Record<string, number> = {
      website: 85,
      whatsapp: 80,
      phone: 75,
      email: 70,
      referral: 90,
      organic: 85,
      paid: 70,
    };
    const sourceScore = sourceScores[lead.source || "website"] || 70;
    score += (sourceScore * weights.sourceQuality) / 100;

    // Engagement level (based on notes length and status progression)
    const engagementScore = Math.min(100, (lead.notes?.length || 0) / 10 + (lead.status === "converted" ? 50 : 0));
    score += (engagementScore * weights.engagementLevel) / 100;

    // Response time score (assume faster response for earlier created leads)
    const responseTimeScore = 80; // Default high score
    score += (responseTimeScore * weights.responseTime) / 100;

    return Math.min(100, Math.round(score));
  } catch (error) {
    console.error("Failed to calculate lead score:", error);
    return 0;
  }
}

/**
 * Analyze dealership data and recommend scoring weights
 */
export async function calibrateScoringWeights(
  dealershipId: string,
  period: "week" | "month" | "quarter" = "month"
): Promise<CalibrationResult> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    // Get all leads in period
    const allLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.dealershipId, parseInt(dealershipId)),
          gte(leads.createdAt, startDate),
          lte(leads.createdAt, now)
        )
      );

    if (allLeads.length === 0) {
      return {
        currentWeights: DEFAULT_WEIGHTS,
        recommendedWeights: DEFAULT_WEIGHTS,
        performanceMetrics: {
          totalLeads: 0,
          convertedLeads: 0,
          conversionRate: 0,
          averageQualityScore: 0,
          highQualityLeads: 0,
          lowQualityLeads: 0,
        },
        suggestions: ["No leads in this period. Collect more data to calibrate scoring."],
      };
    }

    // Calculate metrics
    const convertedLeads = allLeads.filter((l) => l.status === "converted").length;
    const conversionRate = (convertedLeads / allLeads.length) * 100;
    const qualityScores = allLeads
      .map((l) => (l.qualityScore ? parseFloat(l.qualityScore.toString()) * 100 : 50))
      .filter((s) => s > 0);
    const averageQualityScore =
      qualityScores.length > 0 ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) : 50;
    const highQualityLeads = allLeads.filter((l) => {
      const qs = l.qualityScore ? parseFloat(l.qualityScore.toString()) * 100 : 50;
      return qs >= 75;
    }).length;
    const lowQualityLeads = allLeads.filter((l) => {
      const qs = l.qualityScore ? parseFloat(l.qualityScore.toString()) * 100 : 50;
      return qs < 40;
    }).length;

    // Recommend weights based on performance
    const recommendedWeights = { ...DEFAULT_WEIGHTS };

    // If conversion rate is low, increase weight on factors that correlate with conversions
    if (conversionRate < 20) {
      recommendedWeights.responseTime = 25;
      recommendedWeights.conversionRate = 35;
      recommendedWeights.qualityScore = 20;
      recommendedWeights.engagementLevel = 15;
      recommendedWeights.sourceQuality = 5;
    }
    // If conversion rate is high, maintain current weights
    else if (conversionRate > 50) {
      recommendedWeights.responseTime = 15;
      recommendedWeights.conversionRate = 35;
      recommendedWeights.qualityScore = 25;
      recommendedWeights.engagementLevel = 15;
      recommendedWeights.sourceQuality = 10;
    }

    // Generate suggestions
    const suggestions: string[] = [];

    if (conversionRate < 20) {
      suggestions.push("Low conversion rate detected. Focus on lead quality and engagement.");
    }
    if (conversionRate > 60) {
      suggestions.push("Excellent conversion rate! Your current scoring weights are working well.");
    }
    if (averageQualityScore < 50) {
      suggestions.push("Average lead quality is below 50%. Consider refining your targeting criteria.");
    }
    if (highQualityLeads < allLeads.length * 0.3) {
      suggestions.push("Less than 30% of leads are high quality. Review your lead qualification process.");
    }
    if (lowQualityLeads > allLeads.length * 0.3) {
      suggestions.push("More than 30% of leads are low quality. Improve your lead filtering.");
    }

    return {
      currentWeights: DEFAULT_WEIGHTS,
      recommendedWeights,
      performanceMetrics: {
        totalLeads: allLeads.length,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageQualityScore,
        highQualityLeads,
        lowQualityLeads,
      },
      suggestions,
    };
  } catch (error) {
    console.error("Failed to calibrate scoring weights:", error);
    return {
      currentWeights: DEFAULT_WEIGHTS,
      recommendedWeights: DEFAULT_WEIGHTS,
      performanceMetrics: {
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        averageQualityScore: 0,
        highQualityLeads: 0,
        lowQualityLeads: 0,
      },
      suggestions: ["Error calibrating scoring weights. Please try again."],
    };
  }
}

/**
 * Get scoring configuration for a dealership
 */
export async function getScoringConfiguration(dealershipId: string) {
  try {
    const calibration = await calibrateScoringWeights(dealershipId, "month");

    return {
      dealershipId,
      weights: calibration.recommendedWeights,
      lastUpdated: new Date(),
      performanceMetrics: calibration.performanceMetrics,
    };
  } catch (error) {
    console.error("Failed to get scoring configuration:", error);
    return {
      dealershipId,
      weights: DEFAULT_WEIGHTS,
      lastUpdated: new Date(),
      performanceMetrics: {
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        averageQualityScore: 0,
        highQualityLeads: 0,
        lowQualityLeads: 0,
      },
    };
  }
}
