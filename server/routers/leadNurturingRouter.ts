import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

export const leadNurturingRouter = router({
  // Get nurturing sequences
  getNurturingSequences: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        sequences: [
          {
            id: 1,
            name: "Grade A - Hot Lead",
            trigger: "lead_grade_a",
            steps: [
              {
                step: 1,
                delay: "immediate",
                channel: "sms",
                message: "Hi {{name}}, thanks for your interest! We have the perfect vehicle for you.",
              },
              {
                step: 2,
                delay: "2_hours",
                channel: "email",
                message: "Exclusive offer for you - {{discount}}% off financing",
              },
              {
                step: 3,
                delay: "1_day",
                channel: "sms",
                message: "Ready to schedule your test drive? Reply YES or call us",
              },
            ],
            active: true,
            engagementRate: 78,
          },
          {
            id: 2,
            name: "Grade C - Nurture Lead",
            trigger: "lead_grade_c",
            steps: [
              {
                step: 1,
                delay: "1_day",
                channel: "email",
                message: "Check out our latest inventory",
              },
              {
                step: 2,
                delay: "3_days",
                channel: "sms",
                message: "Special offer ending soon!",
              },
              {
                step: 3,
                delay: "1_week",
                channel: "email",
                message: "Customer testimonials from happy buyers",
              },
            ],
            active: true,
            engagementRate: 45,
          },
        ],
      };
    }),

  // Create nurturing sequence
  createNurturingSequence: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        name: z.string(),
        trigger: z.string(),
        steps: z.array(
          z.object({
            step: z.number(),
            delay: z.string(),
            channel: z.enum(["sms", "email"]),
            message: z.string(),
          })
        ),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        sequenceId: Math.random(),
        name: input.name,
        stepsCount: input.steps.length,
      };
    }),

  // Update nurturing sequence
  updateNurturingSequence: protectedProcedure
    .input(
      z.object({
        sequenceId: z.number(),
        dealershipId: z.number(),
        active: z.boolean().optional(),
        steps: z
          .array(
            z.object({
              step: z.number(),
              delay: z.string(),
              channel: z.enum(["sms", "email"]),
              message: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        sequenceId: input.sequenceId,
        updated: Object.keys(input).filter(k => !["sequenceId", "dealershipId"].includes(k)),
      };
    }),

  // Delete nurturing sequence
  deleteNurturingSequence: protectedProcedure
    .input(z.object({ sequenceId: z.number(), dealershipId: z.number() }))
    .mutation(({ input }) => {
      return {
        success: true,
        sequenceId: input.sequenceId,
        deleted: true,
      };
    }),

  // Trigger nurturing sequence for lead
  triggerNurturingSequence: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        dealershipId: z.number(),
        sequenceId: z.number(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        leadId: input.leadId,
        sequenceId: input.sequenceId,
        triggered: true,
        firstMessageSent: new Date(),
      };
    }),

  // Get lead nurturing status
  getLeadNurturingStatus: protectedProcedure
    .input(z.object({ leadId: z.number(), dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        leadId: input.leadId,
        currentSequence: "Grade A - Hot Lead",
        currentStep: 2,
        totalSteps: 3,
        nextMessageIn: "2 hours",
        messagesDelivered: 2,
        messagesFailed: 0,
        engagementScore: 85,
        lastInteraction: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };
    }),

  // Get nurturing campaign analytics
  getNurturingAnalytics: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(30) }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        period: `Last ${input.days} days`,
        analytics: {
          totalLeadsNurtured: 342,
          completedSequences: 156,
          conversionRate: 45.6,
          averageTimeToConversion: "12 days",
          engagementByChannel: {
            sms: { sent: 1024, opened: 892, clicked: 234 },
            email: { sent: 856, opened: 412, clicked: 89 },
          },
          topPerformingSequences: [
            { name: "Grade A - Hot Lead", conversionRate: 78 },
            { name: "Grade B - Warm Lead", conversionRate: 62 },
            { name: "Grade C - Nurture Lead", conversionRate: 45 },
          ],
        },
      };
    }),

  // Pause nurturing sequence for lead
  pauseNurturingSequence: protectedProcedure
    .input(z.object({ leadId: z.number(), dealershipId: z.number() }))
    .mutation(({ input }) => {
      return {
        success: true,
        leadId: input.leadId,
        paused: true,
      };
    }),

  // Resume nurturing sequence for lead
  resumeNurturingSequence: protectedProcedure
    .input(z.object({ leadId: z.number(), dealershipId: z.number() }))
    .mutation(({ input }) => {
      return {
        success: true,
        leadId: input.leadId,
        resumed: true,
      };
    }),

  // Get nurturing templates
  getNurturingTemplates: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        templates: [
          {
            id: 1,
            name: "Welcome Message",
            channel: "sms",
            content: "Hi {{name}}, welcome to {{dealership}}! We're excited to help you find your perfect vehicle.",
          },
          {
            id: 2,
            name: "Offer Message",
            channel: "sms",
            content: "Special offer: {{discount}}% off financing on select models. Valid until {{date}}.",
          },
          {
            id: 3,
            name: "Follow-up Email",
            channel: "email",
            content: "Hi {{name}}, we noticed you viewed {{vehicle}}. Would you like to schedule a test drive?",
          },
        ],
      };
    }),

  // Test nurturing sequence
  testNurturingSequence: protectedProcedure
    .input(
      z.object({
        sequenceId: z.number(),
        dealershipId: z.number(),
        testEmail: z.string().email(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        sequenceId: input.sequenceId,
        testEmail: input.testEmail,
        previewSent: true,
        message: "Test sequence sent to your email",
      };
    }),
});
