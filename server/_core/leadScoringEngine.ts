/**
 * Lead Scoring Engine
 * Automatically scores leads based on engagement, behavior, and demographics
 */

export interface LeadScore {
  leadId: number;
  totalScore: number; // 0-100
  quality: "hot" | "warm" | "cold"; // hot: 70-100, warm: 40-69, cold: 0-39
  breakdown: {
    engagementScore: number; // 0-30
    behaviorScore: number; // 0-30
    demographicScore: number; // 0-20
    vehicleInterestScore: number; // 0-20
  };
  recommendations: string[];
}

export function scoreLead(leadData: {
  leadId: number;
  source: string;
  message: string;
  vehicleInterest?: string;
  previousInteractions?: number;
  pageViews?: number;
  timeOnSite?: number;
  location?: string;
  budget?: number;
  urgency?: "high" | "medium" | "low";
}): LeadScore {
  const breakdown = {
    engagementScore: calculateEngagementScore(leadData),
    behaviorScore: calculateBehaviorScore(leadData),
    demographicScore: calculateDemographicScore(leadData),
    vehicleInterestScore: calculateVehicleInterestScore(leadData),
  };

  const totalScore =
    breakdown.engagementScore +
    breakdown.behaviorScore +
    breakdown.demographicScore +
    breakdown.vehicleInterestScore;

  const quality = totalScore >= 70 ? "hot" : totalScore >= 40 ? "warm" : "cold";

  const recommendations = generateRecommendations(leadData, totalScore, quality);

  return {
    leadId: leadData.leadId,
    totalScore: Math.min(100, totalScore),
    quality,
    breakdown,
    recommendations,
  };
}

function calculateEngagementScore(leadData: {
  source: string;
  message: string;
  previousInteractions?: number;
}): number {
  let score = 0;

  // Source scoring
  const sourceScores: Record<string, number> = {
    phone_call: 25,
    website_form: 20,
    whatsapp: 22,
    email: 15,
    social_media: 18,
    referral: 28,
    showroom_visit: 30,
  };

  score += sourceScores[leadData.source] || 10;

  // Message quality
  if (leadData.message && leadData.message.length > 50) {
    score += 5; // Detailed message
  }

  // Previous interactions
  if (leadData.previousInteractions) {
    score += Math.min(leadData.previousInteractions * 2, 5); // Cap at 5
  }

  return Math.min(score, 30);
}

function calculateBehaviorScore(leadData: {
  pageViews?: number;
  timeOnSite?: number;
  urgency?: "high" | "medium" | "low";
}): number {
  let score = 0;

  // Page views
  if (leadData.pageViews) {
    if (leadData.pageViews >= 5) score += 15;
    else if (leadData.pageViews >= 3) score += 10;
    else if (leadData.pageViews >= 1) score += 5;
  }

  // Time on site (in minutes)
  if (leadData.timeOnSite) {
    if (leadData.timeOnSite >= 10) score += 10;
    else if (leadData.timeOnSite >= 5) score += 7;
    else if (leadData.timeOnSite >= 2) score += 4;
  }

  // Urgency
  const urgencyScores: Record<string, number> = {
    high: 8,
    medium: 4,
    low: 1,
  };

  score += urgencyScores[leadData.urgency || "low"] || 0;

  return Math.min(score, 30);
}

function calculateDemographicScore(leadData: {
  location?: string;
  budget?: number;
}): number {
  let score = 0;

  // Location scoring (South Africa)
  const highValueLocations = [
    "Johannesburg",
    "Cape Town",
    "Pretoria",
    "Durban",
    "Sandton",
    "Midrand",
  ];

  if (leadData.location && highValueLocations.some((loc) => leadData.location?.includes(loc))) {
    score += 12;
  } else if (leadData.location) {
    score += 8;
  }

  // Budget scoring
  if (leadData.budget) {
    if (leadData.budget >= 300000) score += 8; // High budget
    else if (leadData.budget >= 150000) score += 5; // Medium budget
    else score += 2; // Low budget
  }

  return Math.min(score, 20);
}

function calculateVehicleInterestScore(leadData: {
  vehicleInterest?: string;
}): number {
  let score = 0;

  if (!leadData.vehicleInterest) return 0;

  // Premium vehicles
  const premiumBrands = ["BMW", "Mercedes", "Audi", "Porsche", "Range Rover", "Jaguar"];
  const midRangeBrands = ["Toyota", "Honda", "Volkswagen", "Ford", "Hyundai"];

  if (premiumBrands.some((brand) => leadData.vehicleInterest?.includes(brand))) {
    score += 20;
  } else if (midRangeBrands.some((brand) => leadData.vehicleInterest?.includes(brand))) {
    score += 15;
  } else {
    score += 10;
  }

  return Math.min(score, 20);
}

function generateRecommendations(
  leadData: any,
  totalScore: number,
  quality: "hot" | "warm" | "cold",
): string[] {
  const recommendations: string[] = [];

  if (quality === "hot") {
    recommendations.push("🔥 Priority follow-up within 1 hour");
    recommendations.push("📞 Call or WhatsApp immediately");
    recommendations.push("🎯 Prepare vehicle details for their interest");
  } else if (quality === "warm") {
    recommendations.push("⏰ Follow-up within 24 hours");
    recommendations.push("📧 Send personalized email with vehicle options");
    recommendations.push("💬 Engage via WhatsApp for faster response");
  } else {
    recommendations.push("📋 Add to nurture sequence");
    recommendations.push("📚 Send educational content about vehicles");
    recommendations.push("🔄 Re-engage in 7 days");
  }

  if (!leadData.message || leadData.message.length < 20) {
    recommendations.push("❓ Request more details about their needs");
  }

  if (!leadData.vehicleInterest) {
    recommendations.push("🚗 Ask about preferred vehicle type/brand");
  }

  if (!leadData.budget) {
    recommendations.push("💰 Discuss budget range");
  }

  return recommendations;
}

export function prioritizeLead(leads: LeadScore[]): LeadScore[] {
  return leads.sort((a, b) => {
    // Sort by quality first (hot > warm > cold)
    const qualityOrder = { hot: 0, warm: 1, cold: 2 };
    const qualityDiff = qualityOrder[a.quality] - qualityOrder[b.quality];
    if (qualityDiff !== 0) return qualityDiff;

    // Then by score
    return b.totalScore - a.totalScore;
  });
}

export function getLeadInsights(leads: LeadScore[]): {
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
  topRecommendations: string[];
} {
  const hotLeads = leads.filter((l) => l.quality === "hot").length;
  const warmLeads = leads.filter((l) => l.quality === "warm").length;
  const coldLeads = leads.filter((l) => l.quality === "cold").length;

  const averageScore = leads.length > 0 ? leads.reduce((sum, l) => sum + l.totalScore, 0) / leads.length : 0;

  // Get most common recommendations
  const allRecommendations = leads.flatMap((l) => l.recommendations);
  const recommendationCounts = new Map<string, number>();
  allRecommendations.forEach((rec) => {
    recommendationCounts.set(rec, (recommendationCounts.get(rec) || 0) + 1);
  });

  const topRecommendations = Array.from(recommendationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0]);

  return {
    hotLeads,
    warmLeads,
    coldLeads,
    averageScore: Math.round(averageScore * 100) / 100,
    topRecommendations,
  };
}
