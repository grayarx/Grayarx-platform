import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { calibrateScoringWeights, getScoringConfiguration, calculateLeadScore } from "../leadScoringCalibration";

export const leadScoringRouter = router({
  /**
   * Get calibration recommendations for a dealership
   */
  getCalibration: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "quarter"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const dealershipId = ctx.user.id.toString();
      const calibration = await calibrateScoringWeights(dealershipId, input.period);

      return {
        success: true,
        data: calibration,
      };
    }),

  /**
   * Get current scoring configuration
   */
  getConfiguration: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Unauthorized");

    const dealershipId = ctx.user.id.toString();
    const config = await getScoringConfiguration(dealershipId);

    return {
      success: true,
      data: config,
    };
  }),

  /**
   * Calculate score for a specific lead
   */
  calculateLeadScore: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const dealershipId = ctx.user.id.toString();
      const score = await calculateLeadScore(input.leadId, dealershipId);

      return {
        success: true,
        score,
      };
    }),

  /**
   * Get performance insights and recommendations
   */
  getInsights: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "quarter"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const dealershipId = ctx.user.id.toString();
      const calibration = await calibrateScoringWeights(dealershipId, input.period);

      return {
        success: true,
        metrics: calibration.performanceMetrics,
        suggestions: calibration.suggestions,
        currentWeights: calibration.currentWeights,
        recommendedWeights: calibration.recommendedWeights,
      };
    }),
});
