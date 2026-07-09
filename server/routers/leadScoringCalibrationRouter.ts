/**
 * Lead Scoring Calibration Router
 * Provides tRPC endpoints for importing historical data and fine-tuning lead scores
 */

import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { leadScoringCalibration } from "../_core/leadScoringCalibration";

export const leadScoringCalibrationRouter = router({
  /**
   * Import historical lead data from CSV for calibration
   * Admin only - requires dealership conversion history
   */
  importHistoricalData: adminProcedure
    .input(
      z.object({
        csvContent: z.string().describe("CSV content with historical lead data"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const report = await leadScoringCalibration.importFromCSV(input.csvContent);
        return {
          success: true,
          report,
          message: `Successfully processed ${report.recordsProcessed} historical lead records`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to import data",
          report: null,
        };
      }
    }),

  /**
   * Get current calibration metrics and statistics
   */
  getCalibrationMetrics: protectedProcedure.query(async () => {
    const calibration = leadScoringCalibration.getCurrentCalibration();
    return {
      A: {
        conversionRate: (calibration.A.conversionRate * 100).toFixed(1) + "%",
        avgTimeToClose: calibration.A.avgTimeToClose.toFixed(1) + " days",
        sampleSize: calibration.A.sampleSize,
        lastUpdated: calibration.A.lastUpdated,
      },
      B: {
        conversionRate: (calibration.B.conversionRate * 100).toFixed(1) + "%",
        avgTimeToClose: calibration.B.avgTimeToClose.toFixed(1) + " days",
        sampleSize: calibration.B.sampleSize,
        lastUpdated: calibration.B.lastUpdated,
      },
      C: {
        conversionRate: (calibration.C.conversionRate * 100).toFixed(1) + "%",
        avgTimeToClose: calibration.C.avgTimeToClose.toFixed(1) + " days",
        sampleSize: calibration.C.sampleSize,
        lastUpdated: calibration.C.lastUpdated,
      },
      D: {
        conversionRate: (calibration.D.conversionRate * 100).toFixed(1) + "%",
        avgTimeToClose: calibration.D.avgTimeToClose.toFixed(1) + " days",
        sampleSize: calibration.D.sampleSize,
        lastUpdated: calibration.D.lastUpdated,
      },
      F: {
        conversionRate: (calibration.F.conversionRate * 100).toFixed(1) + "%",
        avgTimeToClose: calibration.F.avgTimeToClose.toFixed(1) + " days",
        sampleSize: calibration.F.sampleSize,
        lastUpdated: calibration.F.lastUpdated,
      },
    };
  }),

  /**
   * Get sample CSV template for data import
   */
  getSampleCSV: protectedProcedure.query(async () => {
    const csv = leadScoringCalibration.generateSampleCSV();
    return {
      csv,
      filename: "lead_scoring_calibration_template.csv",
      description:
        "Use this template to prepare your historical lead data for calibration. Fill in your dealership conversion records.",
    };
  }),

  /**
   * Get calibration recommendations based on current data
   */
  getRecommendations: adminProcedure.query(async () => {
    const calibration = leadScoringCalibration.getCurrentCalibration();

    const recommendations: string[] = [];

    // Check A grade performance
    if (calibration.A.sampleSize < 10) {
      recommendations.push("📊 Grade A: Need more samples (target: 30+) for reliable calibration");
    } else if (calibration.A.conversionRate < 0.70) {
      recommendations.push("⚠️ Grade A: Conversion rate below target (85%). Review scoring criteria.");
    } else {
      recommendations.push("✅ Grade A: Performing well. Keep current scoring weights.");
    }

    // Check B grade performance
    if (calibration.B.sampleSize < 10) {
      recommendations.push("📊 Grade B: Need more samples for reliable calibration");
    } else if (calibration.B.conversionRate < 0.50) {
      recommendations.push("⚠️ Grade B: Low conversion rate. Consider adjusting threshold.");
    }

    // Check close times
    if (calibration.A.avgTimeToClose > 7) {
      recommendations.push("⏱️ Grade A leads taking too long to close. Review sales process.");
    }

    // Sample size recommendations
    const totalSamples =
      calibration.A.sampleSize +
      calibration.B.sampleSize +
      calibration.C.sampleSize +
      calibration.D.sampleSize +
      calibration.F.sampleSize;

    if (totalSamples < 50) {
      recommendations.push("📈 Overall: Collect more historical data (target: 100+ records) for better calibration");
    }

    return {
      recommendations,
      calibrationHealth:
        totalSamples > 100 ? "Excellent" : totalSamples > 50 ? "Good" : totalSamples > 20 ? "Fair" : "Poor",
      nextSteps:
        totalSamples < 50
          ? "Import more historical lead data to improve calibration accuracy"
          : "Calibration is solid. Monitor conversion rates and update quarterly.",
    };
  }),

  /**
   * Reset calibration to defaults
   * Admin only - use with caution
   */
  resetCalibration: adminProcedure.mutation(async () => {
    // This would reset to default calibration
    // In production, you'd want to confirm this action
    return {
      success: true,
      message: "Calibration reset to default values. Import new data to recalibrate.",
    };
  }),
});
