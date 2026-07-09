/**
 * Lead Scoring Algorithm - Enhanced with Calibration
 * Calculates lead quality scores based on engagement patterns and conversion likelihood
 * Includes dealership-specific calibration and performance tracking
 */

interface LeadScoringFactors {
  daysActive: number;
  interactionCount: number;
  testDriveCompleted: boolean;
  financingApplied: boolean;
  lastContactDaysAgo: number;
  interestLevel: "hot" | "warm" | "cold";
  stageProgression: number;
  responseTime: number; // minutes
  vehicleCategory?: string; // luxury, suv, sedan, etc
  priceRange?: "budget" | "mid" | "premium" | "luxury";
  chatbotEngagement?: number; // 0-100 score from chatbot NLP
  emailOpenRate?: number; // 0-100
  tradeInInterest?: boolean;
}

interface LeadScore {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  factors: Record<string, number>;
  recommendation: string;
  confidence: number; // 0-100 confidence in this score
}

interface CalibrationMetrics {
  conversionRate: number; // actual conversion rate for this grade
  avgTimeToClose: number; // days
  sampleSize: number;
  lastUpdated: Date;
}

class LeadScoringService {
  // Base scoring weights (total = 100)
  private weights = {
    interestLevel: 25,
    stageProgression: 20,
    engagement: 20,
    recency: 15,
    conversion: 20,
  };

  // Dealership-specific calibration data (updated based on actual conversion data)
  private calibration: Record<"A" | "B" | "C" | "D" | "F", CalibrationMetrics> = {
    A: { conversionRate: 0.85, avgTimeToClose: 5, sampleSize: 0, lastUpdated: new Date() },
    B: { conversionRate: 0.65, avgTimeToClose: 8, sampleSize: 0, lastUpdated: new Date() },
    C: { conversionRate: 0.40, avgTimeToClose: 14, sampleSize: 0, lastUpdated: new Date() },
    D: { conversionRate: 0.20, avgTimeToClose: 21, sampleSize: 0, lastUpdated: new Date() },
    F: { conversionRate: 0.05, avgTimeToClose: 45, sampleSize: 0, lastUpdated: new Date() },
  };

  calculateScore(factors: LeadScoringFactors): LeadScore {
    const componentScores: Record<string, number> = {};

    // Interest Level Score (0-25)
    componentScores.interestLevel = this.scoreInterestLevel(factors.interestLevel);

    // Stage Progression Score (0-20)
    componentScores.stageProgression = this.scoreStageProgression(factors.stageProgression);

    // Engagement Score (0-20)
    componentScores.engagement = this.scoreEngagement(
      factors.interactionCount,
      factors.daysActive,
      factors.responseTime,
      factors.chatbotEngagement,
      factors.emailOpenRate
    );

    // Recency Score (0-15)
    componentScores.recency = this.scoreRecency(factors.lastContactDaysAgo);

    // Conversion Likelihood Score (0-20)
    componentScores.conversion = this.scoreConversionLikelihood(
      factors.testDriveCompleted,
      factors.financingApplied,
      factors.tradeInInterest
    );

    const totalScore = Object.values(componentScores).reduce((a, b) => a + b, 0);
    const grade = this.getGrade(totalScore);
    const recommendation = this.getRecommendation(totalScore, factors);
    const confidence = this.calculateConfidence(factors);

    return {
      score: Math.round(totalScore),
      grade,
      factors: componentScores,
      recommendation,
      confidence,
    };
  }

  private scoreInterestLevel(level: "hot" | "warm" | "cold"): number {
    switch (level) {
      case "hot":
        return 25;
      case "warm":
        return 15;
      case "cold":
        return 5;
    }
  }

  private scoreStageProgression(stage: number): number {
    // 0 = inquiry, 1 = test_drive, 2 = negotiation, 3 = finance, 4 = closing, 5 = closed
    return Math.min(stage * 4, 20);
  }

  private scoreEngagement(
    interactions: number,
    daysActive: number,
    responseTime: number,
    chatbotEngagement?: number,
    emailOpenRate?: number
  ): number {
    let score = 0;

    // Interaction frequency (adjusted for quality)
    if (interactions > 15) score += 8;
    else if (interactions > 10) score += 7;
    else if (interactions > 5) score += 5;
    else if (interactions > 2) score += 3;
    else score += 1;

    // Duration of engagement
    if (daysActive > 30) score += 7;
    else if (daysActive > 14) score += 5;
    else if (daysActive > 7) score += 3;
    else score += 1;

    // Response time (faster is better)
    if (responseTime < 60) score += 5;
    else if (responseTime < 240) score += 3;
    else score += 1;

    // Chatbot engagement quality (if available)
    if (chatbotEngagement) {
      if (chatbotEngagement > 80) score += 2;
      else if (chatbotEngagement > 60) score += 1;
    }

    // Email engagement (if available)
    if (emailOpenRate) {
      if (emailOpenRate > 70) score += 2;
      else if (emailOpenRate > 40) score += 1;
    }

    return Math.min(score, 20);
  }

  private scoreRecency(lastContactDaysAgo: number): number {
    if (lastContactDaysAgo <= 1) return 15;
    if (lastContactDaysAgo <= 3) return 12;
    if (lastContactDaysAgo <= 7) return 9;
    if (lastContactDaysAgo <= 14) return 6;
    if (lastContactDaysAgo <= 30) return 3;
    return 0;
  }

  private scoreConversionLikelihood(
    testDriveCompleted: boolean,
    financingApplied: boolean,
    tradeInInterest?: boolean
  ): number {
    let score = 0;
    if (testDriveCompleted) score += 12;
    if (financingApplied) score += 8;
    if (tradeInInterest) score += 5; // Trade-in interest is strong signal
    return Math.min(score, 20);
  }

  private calculateConfidence(factors: LeadScoringFactors): number {
    let confidence = 50; // Base confidence

    // More interactions = higher confidence
    if (factors.interactionCount > 10) confidence += 20;
    else if (factors.interactionCount > 5) confidence += 10;

    // Longer engagement = higher confidence
    if (factors.daysActive > 30) confidence += 15;
    else if (factors.daysActive > 14) confidence += 10;

    // Completed actions = higher confidence
    if (factors.testDriveCompleted) confidence += 15;
    if (factors.financingApplied) confidence += 10;

    return Math.min(confidence, 100);
  }

  public getGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  }

  private getRecommendation(score: number, factors: LeadScoringFactors): string {
    if (score >= 80) {
      return "🔥 Hot lead - Prioritize immediate follow-up. High conversion probability. Expected close: 5 days.";
    } else if (score >= 70) {
      return "✅ Qualified lead - Schedule test drive or follow-up call within 24 hours. Expected close: 8 days.";
    } else if (score >= 60) {
      return "📞 Warm lead - Add to nurture campaign. Follow up within 3 days. Expected close: 14 days.";
    } else if (score >= 50) {
      return "⏳ Developing lead - Monitor engagement. Provide additional resources. Expected close: 21 days.";
    } else {
      return "❄️ Cold lead - Consider re-engagement campaign or deprioritize. Low conversion probability.";
    }
  }

  // Update calibration based on actual conversion data
  updateCalibration(grade: "A" | "B" | "C" | "D" | "F", converted: boolean, daysToClose: number): void {
    const metrics = this.calibration[grade];
    const newSampleSize = metrics.sampleSize + 1;
    const oldConversionRate = metrics.conversionRate;
    const newConversionRate = (oldConversionRate * metrics.sampleSize + (converted ? 1 : 0)) / newSampleSize;
    const oldAvgTime = metrics.avgTimeToClose;
    const newAvgTime = (oldAvgTime * metrics.sampleSize + daysToClose) / newSampleSize;

    this.calibration[grade] = {
      conversionRate: newConversionRate,
      avgTimeToClose: newAvgTime,
      sampleSize: newSampleSize,
      lastUpdated: new Date(),
    };
  }

  // Get calibration metrics for a grade
  getCalibrationMetrics(grade: "A" | "B" | "C" | "D" | "F"): CalibrationMetrics {
    return this.calibration[grade];
  }

  // Get all calibration data
  getAllCalibration(): Record<"A" | "B" | "C" | "D" | "F", CalibrationMetrics> {
    return this.calibration;
  }

  // Batch score multiple leads
  scoreLeads(leadsList: LeadScoringFactors[]): LeadScore[] {
    return leadsList.map((factors) => this.calculateScore(factors));
  }

  // Get top leads by score
  getTopLeads(leadsList: LeadScoringFactors[], count: number = 10): Array<LeadScore & { index: number }> {
    const scores = leadsList.map((factors, index) => ({
      ...this.calculateScore(factors),
      index,
    }));

    return scores.sort((a, b) => b.score - a.score).slice(0, count);
  }

  // Get leads by grade
  getLeadsByGrade(leadsList: LeadScoringFactors[], grade: "A" | "B" | "C" | "D" | "F"): LeadScore[] {
    return leadsList
      .map((factors) => this.calculateScore(factors))
      .filter((score) => score.grade === grade);
  }

  // Get hot leads (A grade) with high confidence
  getHotLeads(leadsList: LeadScoringFactors[], minConfidence: number = 70): LeadScore[] {
    return leadsList
      .map((factors) => this.calculateScore(factors))
      .filter((score) => score.grade === "A" && score.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  }
}

export const leadScoringService = new LeadScoringService();
