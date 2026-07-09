import { getDb } from "./db";
import { leadQualityFactors, leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface LeadQualityScores {
  sourceScore: number;
  languageScore: number;
  responseTimeScore: number;
  engagementScore: number;
  vehicleTypeScore: number;
  priceRangeScore: number;
  locationScore: number;
  urgencyScore: number;
  contactQualityScore: number;
  historyScore: number;
  overallScore: number;
}

/**
 * Calculate lead quality score based on 10 factors
 */
export async function calculateLeadQualityScore(leadId: number): Promise<LeadQualityScores | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const leadData = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (leadData.length === 0) return null;

    const lead = leadData[0];

    const scores: LeadQualityScores = {
      sourceScore: calculateSourceScore(lead.source || ""),
      languageScore: calculateLanguageScore(lead.language || "en"),
      responseTimeScore: calculateResponseTimeScore(lead.createdAt),
      engagementScore: calculateEngagementScore(lead.notes || ""),
      vehicleTypeScore: 0.5,
      priceRangeScore: 0.5,
      locationScore: 0.5,
      urgencyScore: calculateUrgencyScore(lead.status),
      contactQualityScore: calculateContactQualityScore(lead.email, lead.phone),
      historyScore: 0.5,
      overallScore: 0,
    };

    const weights = {
      sourceScore: 0.1,
      languageScore: 0.08,
      responseTimeScore: 0.12,
      engagementScore: 0.1,
      vehicleTypeScore: 0.08,
      priceRangeScore: 0.08,
      locationScore: 0.08,
      urgencyScore: 0.12,
      contactQualityScore: 0.12,
      historyScore: 0.12,
    };

    scores.overallScore =
      (scores.sourceScore * weights.sourceScore +
        scores.languageScore * weights.languageScore +
        scores.responseTimeScore * weights.responseTimeScore +
        scores.engagementScore * weights.engagementScore +
        scores.vehicleTypeScore * weights.vehicleTypeScore +
        scores.priceRangeScore * weights.priceRangeScore +
        scores.locationScore * weights.locationScore +
        scores.urgencyScore * weights.urgencyScore +
        scores.contactQualityScore * weights.contactQualityScore +
        scores.historyScore * weights.historyScore) *
      100;

    await storeLeadQualityScores(leadId, scores);

    return scores;
  } catch (error) {
    console.error("[LeadQualityScorer] Error calculating quality score:", error);
    return null;
  }
}

/**
 * Store lead quality scores in database
 */
async function storeLeadQualityScores(leadId: number, scores: LeadQualityScores): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const existing = await db
      .select()
      .from(leadQualityFactors)
      .where(eq(leadQualityFactors.leadId, leadId))
      .limit(1);

    const scoreValues = {
      sourceScore: String((scores.sourceScore || 0).toFixed(2)),
      languageScore: String((scores.languageScore || 0).toFixed(2)),
      responseTimeScore: String((scores.responseTimeScore || 0).toFixed(2)),
      engagementScore: String((scores.engagementScore || 0).toFixed(2)),
      vehicleTypeScore: String((scores.vehicleTypeScore || 0).toFixed(2)),
      priceRangeScore: String((scores.priceRangeScore || 0).toFixed(2)),
      locationScore: String((scores.locationScore || 0).toFixed(2)),
      urgencyScore: String((scores.urgencyScore || 0).toFixed(2)),
      contactQualityScore: String((scores.contactQualityScore || 0).toFixed(2)),
      historyScore: String((scores.historyScore || 0).toFixed(2)),
      overallScore: String((scores.overallScore || 0).toFixed(2)),
    };

    if (existing.length > 0) {
      await db
        .update(leadQualityFactors)
        .set({
          sourceScore: scoreValues.sourceScore,
          languageScore: scoreValues.languageScore,
          responseTimeScore: scoreValues.responseTimeScore,
          engagementScore: scoreValues.engagementScore,
          vehicleTypeScore: scoreValues.vehicleTypeScore,
          priceRangeScore: scoreValues.priceRangeScore,
          locationScore: scoreValues.locationScore,
          urgencyScore: scoreValues.urgencyScore,
          contactQualityScore: scoreValues.contactQualityScore,
          historyScore: scoreValues.historyScore,
          overallScore: scoreValues.overallScore,
          factors: scores,
          updatedAt: new Date(),
        })
        .where(eq(leadQualityFactors.leadId, leadId))
        .execute();
    } else {
      await db
        .insert(leadQualityFactors)
        .values({
          leadId,
          sourceScore: scoreValues.sourceScore,
          languageScore: scoreValues.languageScore,
          responseTimeScore: scoreValues.responseTimeScore,
          engagementScore: scoreValues.engagementScore,
          vehicleTypeScore: scoreValues.vehicleTypeScore,
          priceRangeScore: scoreValues.priceRangeScore,
          locationScore: scoreValues.locationScore,
          urgencyScore: scoreValues.urgencyScore,
          contactQualityScore: scoreValues.contactQualityScore,
          historyScore: scoreValues.historyScore,
          overallScore: scoreValues.overallScore,
          factors: scores,
          updatedAt: new Date(),
        })
        .execute();
    }
  } catch (error) {
    console.error("[AuditLogger] Error storing scores:", error);
  }
}

function calculateSourceScore(source: string): number {
  const sourceWeights: Record<string, number> = {
    website: 0.8,
    referral: 0.9,
    social_media: 0.7,
    phone: 0.85,
    email: 0.75,
    import: 0.5,
    api: 0.8,
  };
  return sourceWeights[source] || 0.5;
}

function calculateLanguageScore(language: string): number {
  const saLanguages = ["en", "af", "zu", "xh", "st", "tn", "ve", "ss", "ts", "nd", "pt"];
  return saLanguages.includes(language.toLowerCase()) ? 0.9 : 0.5;
}

function calculateResponseTimeScore(createdAt: Date): number {
  const now = new Date();
  const ageMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

  if (ageMinutes < 5) return 1.0;
  if (ageMinutes < 30) return 0.9;
  if (ageMinutes < 60) return 0.8;
  if (ageMinutes < 240) return 0.7;
  if (ageMinutes < 1440) return 0.5;
  return 0.3;
}

function calculateEngagementScore(notes: string): number {
  if (!notes || notes.length === 0) return 0.3;
  if (notes.length < 20) return 0.5;
  if (notes.length < 100) return 0.7;
  return 0.9;
}

function calculateUrgencyScore(status: string): number {
  const urgencyMap: Record<string, number> = {
    new: 1.0,
    contacted: 0.8,
    qualified: 0.7,
    converted: 0.2,
    lost: 0.1,
  };
  return urgencyMap[status] || 0.5;
}

function calculateContactQualityScore(email: string, phone: string): number {
  let score = 0;

  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    score += 0.5;
  }

  if (phone && phone.replace(/\D/g, "").length >= 10) {
    score += 0.5;
  }

  return Math.min(score, 1.0);
}

/**
 * Get lead quality insights
 */
export async function getLeadQualityInsights(leadId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const factors = await db
      .select()
      .from(leadQualityFactors)
      .where(eq(leadQualityFactors.leadId, leadId))
      .limit(1);

    if (factors.length === 0) return null;

    const factor = factors[0];
    const overallScore = Number(factor.overallScore) || 0;

    return {
      leadId,
      overallScore,
      quality: overallScore >= 70 ? "High" : overallScore >= 40 ? "Medium" : "Low",
      factors: {
        source: { score: Number(factor.sourceScore) || 0, weight: 0.1 },
        language: { score: Number(factor.languageScore) || 0, weight: 0.08 },
        responseTime: { score: Number(factor.responseTimeScore) || 0, weight: 0.12 },
        engagement: { score: Number(factor.engagementScore) || 0, weight: 0.1 },
        vehicleType: { score: Number(factor.vehicleTypeScore) || 0, weight: 0.08 },
        priceRange: { score: Number(factor.priceRangeScore) || 0, weight: 0.08 },
        location: { score: Number(factor.locationScore) || 0, weight: 0.08 },
        urgency: { score: Number(factor.urgencyScore) || 0, weight: 0.12 },
        contactQuality: { score: Number(factor.contactQualityScore) || 0, weight: 0.12 },
        history: { score: Number(factor.historyScore) || 0, weight: 0.12 },
      },
      topStrengths: getTopFactors(factor, 3, true),
      topWeaknesses: getTopFactors(factor, 3, false),
      updatedAt: factor.updatedAt,
    };
  } catch (error) {
    console.error("[LeadQualityScorer] Error getting insights:", error);
    return null;
  }
}

function getTopFactors(
  factor: any,
  count: number,
  isStrengths: boolean
): Array<{ name: string; score: number }> {
  const factors = [
    { name: "Source", score: Number(factor.sourceScore) || 0 },
    { name: "Language", score: Number(factor.languageScore) || 0 },
    { name: "Response Time", score: Number(factor.responseTimeScore) || 0 },
    { name: "Engagement", score: Number(factor.engagementScore) || 0 },
    { name: "Vehicle Type", score: Number(factor.vehicleTypeScore) || 0 },
    { name: "Price Range", score: Number(factor.priceRangeScore) || 0 },
    { name: "Location", score: Number(factor.locationScore) || 0 },
    { name: "Urgency", score: Number(factor.urgencyScore) || 0 },
    { name: "Contact Quality", score: Number(factor.contactQualityScore) || 0 },
    { name: "History", score: Number(factor.historyScore) || 0 },
  ];

  if (isStrengths) {
    return factors.sort((a, b) => b.score - a.score).slice(0, count);
  } else {
    return factors.sort((a, b) => a.score - b.score).slice(0, count);
  }
}
