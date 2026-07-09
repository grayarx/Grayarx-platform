/**
 * Lead Scoring Calibration Tests
 * Verifies historical data import and calibration accuracy
 */

import { describe, it, expect, beforeEach } from "vitest";
import { leadScoringService } from "./_core/leadScoringService";
import { leadScoringCalibration } from "./_core/leadScoringCalibration";

describe("Lead Scoring Calibration", () => {
  beforeEach(() => {
    // Reset calibration before each test
  });

  it("should calculate lead scores correctly", () => {
    const factors = {
      daysActive: 25,
      interactionCount: 12,
      testDriveCompleted: true,
      financingApplied: true,
      lastContactDaysAgo: 1,
      interestLevel: "hot" as const,
      stageProgression: 4,
      responseTime: 45,
      chatbotEngagement: 85,
      emailOpenRate: 75,
      tradeInInterest: true,
    };

    const score = leadScoringService.calculateScore(factors);
    expect(score.score).toBeGreaterThan(75);
    expect(score.grade).toBe("A");
    expect(score.confidence).toBeGreaterThan(70);
  });

  it("should generate correct grade for score ranges", () => {
    expect(leadScoringService.getGrade(85)).toBe("A");
    expect(leadScoringService.getGrade(72)).toBe("B");
    expect(leadScoringService.getGrade(65)).toBe("C");
    expect(leadScoringService.getGrade(55)).toBe("D");
    expect(leadScoringService.getGrade(30)).toBe("F");
  });

  it("should import and calibrate from CSV", async () => {
    const csvContent = `leadId,score,grade,converted,daysToClose,interactionCount,daysActive,testDriveCompleted,financingApplied,tradeInInterest,interestLevel,stageProgression,lastContactDaysAgo,responseTime,chatbotEngagement,emailOpenRate,vehicleCategory,priceRange
LEAD001,85,A,true,4,12,25,true,true,false,hot,4,1,45,85,75,suv,premium
LEAD002,72,B,true,8,8,18,true,false,true,warm,2,2,120,65,50,sedan,mid
LEAD003,55,D,false,30,3,10,false,false,false,cold,0,15,480,30,20,hatchback,budget`;

    const report = await leadScoringCalibration.importFromCSV(csvContent);

    expect(report.totalRecords).toBe(3);
    expect(report.recordsProcessed).toBe(3);
    expect(report.gradeDistribution.A).toBe(1);
    expect(report.gradeDistribution.B).toBe(1);
    expect(report.gradeDistribution.D).toBe(1);
  });

  it("should generate sample CSV template", () => {
    const csv = leadScoringCalibration.generateSampleCSV();
    expect(csv).toContain("leadId");
    expect(csv).toContain("LEAD001");
    expect(csv).toContain("true");
    expect(csv).toContain("false");
  });

  it("should provide calibration metrics", () => {
    const metrics = leadScoringCalibration.getCurrentCalibration();
    expect(metrics.A).toBeDefined();
    expect(metrics.B).toBeDefined();
    expect(metrics.C).toBeDefined();
    expect(metrics.D).toBeDefined();
    expect(metrics.F).toBeDefined();
  });

  it("should calculate confidence scores based on sample size", () => {
    const factors = {
      daysActive: 5,
      interactionCount: 2,
      testDriveCompleted: false,
      financingApplied: false,
      lastContactDaysAgo: 30,
      interestLevel: "cold" as const,
      stageProgression: 0,
      responseTime: 480,
    };

    const score = leadScoringService.calculateScore(factors);
    expect(score.confidence).toBeLessThan(70);
  });

  it("should score hot leads higher than cold leads", () => {
    const hotFactors = {
      daysActive: 30,
      interactionCount: 15,
      testDriveCompleted: true,
      financingApplied: true,
      lastContactDaysAgo: 1,
      interestLevel: "hot" as const,
      stageProgression: 4,
      responseTime: 30,
    };

    const coldFactors = {
      daysActive: 5,
      interactionCount: 1,
      testDriveCompleted: false,
      financingApplied: false,
      lastContactDaysAgo: 30,
      interestLevel: "cold" as const,
      stageProgression: 0,
      responseTime: 600,
    };

    const hotScore = leadScoringService.calculateScore(hotFactors);
    const coldScore = leadScoringService.calculateScore(coldFactors);

    expect(hotScore.score).toBeGreaterThan(coldScore.score);
  });

  it("should update calibration with conversion data", () => {
    const initialMetrics = leadScoringService.getCalibrationMetrics("A");
    const initialConversionRate = initialMetrics.conversionRate;

    // Simulate a converted lead
    leadScoringService.updateCalibration("A", true, 5);

    const updatedMetrics = leadScoringService.getCalibrationMetrics("A");
    expect(updatedMetrics.sampleSize).toBe(initialMetrics.sampleSize + 1);
  });
});
