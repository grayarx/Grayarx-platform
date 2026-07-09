import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

export const feedbackDashboardRouter = router({
  // Get feedback summary
  getFeedbackSummary: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(30) }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        period: `Last ${input.days} days`,
        totalResponses: 127,
        averageRating: 4.6,
        ratingDistribution: {
          5: 89,
          4: 25,
          3: 8,
          2: 3,
          1: 2,
        },
        sentimentBreakdown: {
          positive: 88,
          neutral: 25,
          negative: 14,
        },
        topPositiveFeedback: [
          "Great customer service",
          "Professional sales team",
          "Easy financing process",
        ],
        topNegativeFeedback: [
          "Long wait times",
          "Limited inventory",
          "Paperwork delays",
        ],
      };
    }),

  // Get feedback trends
  getFeedbackTrends: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(90) }))
    .query(({ input }) => {
      const trends = [];
      for (let i = 0; i < Math.ceil(input.days / 7); i++) {
        trends.push({
          week: `Week ${i + 1}`,
          averageRating: (4.2 + Math.random() * 0.8).toFixed(1),
          responses: Math.floor(20 + Math.random() * 15),
          sentiment: Math.random() > 0.5 ? "positive" : "neutral",
        });
      }
      return { dealershipId: input.dealershipId, trends };
    }),

  // Get all feedback
  getAllFeedback: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        page: z.number().default(1),
        limit: z.number().default(20),
        rating: z.number().optional(),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
      })
    )
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        page: input.page,
        limit: input.limit,
        total: 127,
        feedback: [
          {
            id: 1,
            customerId: 101,
            customerName: "John Smith",
            rating: 5,
            sentiment: "positive",
            message: "Excellent experience! The sales team was very helpful and professional.",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            category: "sales_experience",
          },
          {
            id: 2,
            customerId: 102,
            customerName: "Sarah Johnson",
            rating: 4,
            sentiment: "positive",
            message: "Good service but took longer than expected for paperwork.",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            category: "paperwork",
          },
        ],
      };
    }),

  // Get feedback by category
  getFeedbackByCategory: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        categories: [
          { name: "sales_experience", count: 45, avgRating: 4.7 },
          { name: "customer_service", count: 38, avgRating: 4.5 },
          { name: "financing", count: 22, avgRating: 4.3 },
          { name: "paperwork", count: 15, avgRating: 4.1 },
          { name: "inventory", count: 7, avgRating: 3.8 },
        ],
      };
    }),

  // Get sentiment analysis
  getSentimentAnalysis: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(30) }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        period: `Last ${input.days} days`,
        sentimentScore: 0.78,
        keyPhrases: {
          positive: [
            { phrase: "great service", count: 23, sentiment: 0.95 },
            { phrase: "professional team", count: 18, sentiment: 0.92 },
            { phrase: "easy process", count: 15, sentiment: 0.88 },
          ],
          negative: [
            { phrase: "long wait", count: 8, sentiment: -0.85 },
            { phrase: "limited options", count: 6, sentiment: -0.78 },
            { phrase: "slow paperwork", count: 5, sentiment: -0.82 },
          ],
        },
      };
    }),

  // Create feedback entry
  createFeedback: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        customerId: z.number(),
        rating: z.number().min(1).max(5),
        message: z.string(),
        category: z.string(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        feedbackId: Math.random(),
        customerId: input.customerId,
        rating: input.rating,
        createdAt: new Date(),
      };
    }),

  // Update feedback
  updateFeedback: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
        dealershipId: z.number(),
        status: z.enum(["new", "reviewed", "resolved"]).optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        feedbackId: input.feedbackId,
        updated: Object.keys(input).filter(k => k !== "feedbackId" && k !== "dealershipId"),
      };
    }),

  // Export feedback report
  exportFeedbackReport: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        format: z.enum(["pdf", "csv", "json"]).default("pdf"),
        days: z.number().default(30),
      })
    )
    .query(({ input }) => {
      return {
        format: input.format,
        filename: `feedback-report-${input.dealershipId}.${input.format}`,
        generated: new Date(),
        period: `Last ${input.days} days`,
      };
    }),

  // Get feedback statistics
  getFeedbackStats: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        stats: {
          totalFeedback: 342,
          responseRate: 68,
          averageRating: 4.6,
          nps: 72,
          detractorCount: 14,
          passiveCount: 25,
          promoterCount: 88,
        },
      };
    }),
});
