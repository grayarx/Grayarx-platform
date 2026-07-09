import { router, protectedProcedure } from "./trpc";
import { z } from "zod";

export const agentsEnhancedRouter = router({
  getAgentStats: protectedProcedure
    .input(z.object({ agentId: z.string(), timeRange: z.enum(["7d", "30d", "90d"]) }))
    .query(async ({ ctx, input }) => {
      // In production, fetch from database
      return {
        agentId: input.agentId,
        performanceScore: 92,
        sentimentScore: 4.2,
        conversions: 89,
        callsHandled: 450,
        avgResponseTime: 28,
        avgCallDuration: 8.42,
        positiveInteractions: 85,
        neutralInteractions: 12,
        negativeInteractions: 3,
      };
    }),

  getCallTranscription: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .query(async ({ ctx, input }) => {
      // In production, fetch from database
      return {
        callId: input.callId,
        agentName: "Themba",
        duration: "8:42",
        sentiment: "positive",
        sentimentScore: 4.5,
        keyPoints: [
          "Customer interested in finance options",
          "Requested test drive for Friday",
          "Mentioned budget constraint (R200k)",
          "Interested in fuel efficiency",
        ],
        transcript: `Themba: Hello, thank you for calling Premium Motors. How can I assist you today?
Customer: Hi, I'm looking for a fuel-efficient sedan around R200k.
Themba: Excellent choice! We have several options. Are you looking for new or pre-owned?
Customer: Pre-owned would be better for my budget.
Themba: Perfect. I have a 2022 Toyota Corolla that just came in. Would you like to schedule a test drive?
Customer: Yes, that sounds great. What days are you open?
Themba: We're open Monday to Saturday. How about Friday afternoon?
Customer: Friday works perfectly for me.`,
      };
    }),

  getSentimentAnalysis: protectedProcedure
    .input(z.object({ agentId: z.string(), timeRange: z.enum(["7d", "30d", "90d"]) }))
    .query(async ({ ctx, input }) => {
      // In production, fetch from database
      return {
        agentId: input.agentId,
        overallSentiment: 4.2,
        positive: 85,
        neutral: 12,
        negative: 3,
        trend: "improving",
        topPositiveTopics: [
          "Product features",
          "Customer service",
          "Pricing",
        ],
        topNegativeTopics: [
          "Wait times",
          "Availability",
        ],
      };
    }),

  getPerformanceTrend: protectedProcedure
    .input(z.object({ agentId: z.string(), timeRange: z.enum(["7d", "30d", "90d"]) }))
    .query(async ({ ctx, input }) => {
      // In production, fetch from database
      return [
        { week: "W1", score: 88 },
        { week: "W2", score: 89 },
        { week: "W3", score: 91 },
        { week: "W4", score: 92 },
      ];
    }),

  getAgentInsights: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // In production, fetch from database
      return {
        strengths: [
          {
            title: "Excellent Conversion Rate",
            description: "25% conversion rate, 5% above platform average",
            impact: "high",
          },
        ],
        recommendations: [
          {
            title: "Sentiment Optimization",
            description: "Reduce negative interactions by 2% to reach 5-star performance",
            impact: "medium",
          },
          {
            title: "Response Time Improvement",
            description: "Reducing to 30 seconds could improve conversion by 3-5%",
            impact: "medium",
          },
        ],
      };
    }),

  enableCallTranscription: protectedProcedure
    .input(z.object({ agentId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // In production, update database
      return {
        success: true,
        message: `Call transcription ${input.enabled ? "enabled" : "disabled"} for ${input.agentId}`,
      };
    }),

  enableSentimentAnalysis: protectedProcedure
    .input(z.object({ agentId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // In production, update database
      return {
        success: true,
        message: `Sentiment analysis ${input.enabled ? "enabled" : "disabled"} for ${input.agentId}`,
      };
    }),

  syncCalendar: protectedProcedure
    .input(z.object({ agentId: z.string(), calendarId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // In production, sync with Google Calendar API
      return {
        success: true,
        message: `Calendar synced for ${input.agentId}`,
        syncedEvents: 12,
      };
    }),
});
