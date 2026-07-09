/**
 * Lead Scoring Calibration System
 * Imports historical dealership conversion data and fine-tunes scoring multipliers
 * Supports CSV import and automatic calibration based on actual conversion outcomes
 */

import { leadScoringService } from "./leadScoringService";

interface HistoricalLeadRecord {
  leadId: string;
  score: number; // Original score 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  converted: boolean;
  daysToClose: number;
  interactionCount: number;
  daysActive: number;
  testDriveCompleted: boolean;
  financingApplied: boolean;
  tradeInInterest: boolean;
  interestLevel: "hot" | "warm" | "cold";
  stageProgression: number;
  lastContactDaysAgo: number;
  responseTime: number;
  chatbotEngagement?: number;
  emailOpenRate?: number;
  vehicleCategory?: string;
  priceRange?: "budget" | "mid" | "premium" | "luxury";
}

interface CalibrationReport {
  totalRecords: number;
  recordsProcessed: number;
  gradeDistribution: Record<"A" | "B" | "C" | "D" | "F", number>;
  conversionRates: Record<"A" | "B" | "C" | "D" | "F", number>;
  avgTimeToClose: Record<"A" | "B" | "C" | "D" | "F", number>;
  recommendations: string[];
  confidenceScores: Record<"A" | "B" | "C" | "D" | "F", number>;
}

class LeadScoringCalibration {
  /**
   * Import and calibrate lead scoring from historical CSV data
   * CSV format: leadId,score,grade,converted,daysToClose,interactionCount,daysActive,testDriveCompleted,financingApplied,tradeInInterest,interestLevel,stageProgression,lastContactDaysAgo,responseTime,chatbotEngagement,emailOpenRate,vehicleCategory,priceRange
   */
  async importFromCSV(csvContent: string): Promise<CalibrationReport> {
    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",");
    const records: HistoricalLeadRecord[] = [];

    // Parse CSV
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const record: HistoricalLeadRecord = {
        leadId: values[0],
        score: parseInt(values[1]),
        grade: values[2] as "A" | "B" | "C" | "D" | "F",
        converted: values[3].toLowerCase() === "true",
        daysToClose: parseInt(values[4]),
        interactionCount: parseInt(values[5]),
        daysActive: parseInt(values[6]),
        testDriveCompleted: values[7].toLowerCase() === "true",
        financingApplied: values[8].toLowerCase() === "true",
        tradeInInterest: values[9].toLowerCase() === "true",
        interestLevel: values[10] as "hot" | "warm" | "cold",
        stageProgression: parseInt(values[11]),
        lastContactDaysAgo: parseInt(values[12]),
        responseTime: parseInt(values[13]),
        chatbotEngagement: values[14] ? parseInt(values[14]) : undefined,
        emailOpenRate: values[15] ? parseInt(values[15]) : undefined,
        vehicleCategory: values[16] || undefined,
        priceRange: (values[17] as "budget" | "mid" | "premium" | "luxury") || undefined,
      };
      records.push(record);
    }

    return this.calibrateFromRecords(records);
  }

  /**
   * Calibrate scoring from array of historical lead records
   */
  async calibrateFromRecords(records: HistoricalLeadRecord[]): Promise<CalibrationReport> {
    const report: CalibrationReport = {
      totalRecords: records.length,
      recordsProcessed: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      conversionRates: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      avgTimeToClose: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      recommendations: [],
      confidenceScores: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    };

    // Track metrics by grade
    const gradeMetrics: Record<"A" | "B" | "C" | "D" | "F", { conversions: number; total: number; daysSum: number }> = {
      A: { conversions: 0, total: 0, daysSum: 0 },
      B: { conversions: 0, total: 0, daysSum: 0 },
      C: { conversions: 0, total: 0, daysSum: 0 },
      D: { conversions: 0, total: 0, daysSum: 0 },
      F: { conversions: 0, total: 0, daysSum: 0 },
    };

    // Process each record
    for (const record of records) {
      const grade = record.grade;
      gradeMetrics[grade].total++;
      if (record.converted) {
        gradeMetrics[grade].conversions++;
      }
      gradeMetrics[grade].daysSum += record.daysToClose;

      // Update service calibration
      leadScoringService.updateCalibration(grade, record.converted, record.daysToClose);
      report.recordsProcessed++;
    }

    // Calculate conversion rates and average close times
    for (const grade of ["A", "B", "C", "D", "F"] as const) {
      const metrics = gradeMetrics[grade];
      report.gradeDistribution[grade] = metrics.total;
      report.conversionRates[grade] = metrics.total > 0 ? metrics.conversions / metrics.total : 0;
      report.avgTimeToClose[grade] = metrics.total > 0 ? metrics.daysSum / metrics.total : 0;
    }

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    // Calculate confidence scores based on sample size
    for (const grade of ["A", "B", "C", "D", "F"] as const) {
      const sampleSize = gradeMetrics[grade].total;
      report.confidenceScores[grade] = Math.min(100, (sampleSize / 30) * 100); // 30 samples = 100% confidence
    }

    return report;
  }

  /**
   * Generate calibration recommendations based on data
   */
  private generateRecommendations(report: CalibrationReport): string[] {
    const recommendations: string[] = [];

    // Check if A grade has high conversion rate
    if (report.conversionRates.A < 0.70) {
      recommendations.push(
        "⚠️ Grade A leads have lower than expected conversion rate (85% target). Consider adjusting scoring weights."
      );
    } else if (report.conversionRates.A > 0.90) {
      recommendations.push("✅ Grade A leads performing exceptionally well. Current scoring is accurate.");
    }

    // Check if B grade conversion is reasonable
    if (report.conversionRates.B < 0.50) {
      recommendations.push("⚠️ Grade B conversion rate is low. May need to increase B grade threshold or adjust weights.");
    }

    // Check sample sizes
    if (report.gradeDistribution.A < 10) {
      recommendations.push("📊 Limited A grade samples. Collect more data before finalizing calibration.");
    }

    // Check average close times
    if (report.avgTimeToClose.A > 7) {
      recommendations.push("⏱️ Grade A leads taking longer than expected to close. Review sales process efficiency.");
    }

    // Overall recommendation
    const totalConversions = Object.values(report.conversionRates).reduce((a, b) => a + b, 0) / 5;
    if (totalConversions > 0.40) {
      recommendations.push("🎯 Overall lead quality is good. Scoring system is well-calibrated.");
    } else {
      recommendations.push("🔧 Overall conversion rate is low. Consider reviewing lead qualification criteria.");
    }

    return recommendations;
  }

  /**
   * Get current calibration metrics
   */
  getCurrentCalibration() {
    return leadScoringService.getAllCalibration();
  }

  /**
   * Export calibration report as JSON
   */
  exportCalibrationReport(report: CalibrationReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate sample CSV template for import
   */
  generateSampleCSV(): string {
    const headers = [
      "leadId",
      "score",
      "grade",
      "converted",
      "daysToClose",
      "interactionCount",
      "daysActive",
      "testDriveCompleted",
      "financingApplied",
      "tradeInInterest",
      "interestLevel",
      "stageProgression",
      "lastContactDaysAgo",
      "responseTime",
      "chatbotEngagement",
      "emailOpenRate",
      "vehicleCategory",
      "priceRange",
    ];

    const sampleRows = [
      [
        "LEAD001",
        "85",
        "A",
        "true",
        "4",
        "12",
        "25",
        "true",
        "true",
        "false",
        "hot",
        "4",
        "1",
        "45",
        "85",
        "75",
        "suv",
        "premium",
      ],
      [
        "LEAD002",
        "72",
        "B",
        "true",
        "8",
        "8",
        "18",
        "true",
        "false",
        "true",
        "warm",
        "2",
        "2",
        "120",
        "65",
        "50",
        "sedan",
        "mid",
      ],
      [
        "LEAD003",
        "55",
        "D",
        "false",
        "30",
        "3",
        "10",
        "false",
        "false",
        "false",
        "cold",
        "0",
        "15",
        "480",
        "30",
        "20",
        "hatchback",
        "budget",
      ],
    ];

    const csv = [headers.join(","), ...sampleRows.map((row) => row.join(","))].join("\n");
    return csv;
  }
}

export const leadScoringCalibration = new LeadScoringCalibration();
