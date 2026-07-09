import { router, protectedProcedure } from "./trpc";
import { z } from "zod";
import {
  sendProspectEmail,
  trackEmailOpen,
  trackEmailClick,
  handleEmailBounce,
  getEmailCampaignStats,
  getDealershipEmailStats,
  getProspectEmailHistory,
  createEmailTemplate,
  getEmailTemplates,
  scheduleEmail,
  sendBatchEmails,
  handleUnsubscribe,
} from "./emailSendingService";

const sendEmailSchema = z.object({
  prospectId: z.string(),
  dealershipId: z.string(),
  recipientEmail: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

const trackingSchema = z.object({
  emailId: z.string(),
  prospectId: z.string(),
});

export const emailSendingRouter = router({
  sendProspectEmail: protectedProcedure
    .input(sendEmailSchema)
    .mutation(async ({ ctx, input }: any) => {
      try {
        const result = await sendProspectEmail(
          input.prospectId,
          input.dealershipId,
          input.recipientEmail,
          input.subject,
          input.body
        );

        return {
          success: true,
          emailId: result.emailId,
          trackingPixelId: result.trackingPixelId,
          sentAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to send email",
        };
      }
    }),

  trackEmailOpen: protectedProcedure
    .input(
      trackingSchema.extend({
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const event = await trackEmailOpen(input.emailId, input.prospectId, {
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        });

        return {
          success: true,
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to track email open",
        };
      }
    }),

  trackEmailClick: protectedProcedure
    .input(
      trackingSchema.extend({
        linkUrl: z.string().url(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const event = await trackEmailClick(
          input.emailId,
          input.prospectId,
          input.linkUrl,
          {
            userAgent: input.userAgent,
            ipAddress: input.ipAddress,
          }
        );

        return {
          success: true,
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to track email click",
        };
      }
    }),

  handleEmailBounce: protectedProcedure
    .input(
      trackingSchema.extend({
        bounceReason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const event = await handleEmailBounce(
          input.emailId,
          input.prospectId,
          input.bounceReason
        );

        return {
          success: true,
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to handle bounce",
        };
      }
    }),

  getEmailCampaignStats: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      try {
        const stats = await getEmailCampaignStats(input.campaignId);

        return {
          success: true,
          stats,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to get campaign stats",
        };
      }
    }),

  getDealershipEmailStats: protectedProcedure
    .input(z.object({ dealershipId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      try {
        const stats = await getDealershipEmailStats(input.dealershipId);

        return {
          success: true,
          stats,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to get dealership stats",
        };
      }
    }),

  getProspectEmailHistory: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      try {
        const history = await getProspectEmailHistory(input.prospectId);

        return {
          success: true,
          emails: history,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to get email history",
        };
      }
    }),

  getEmailTemplates: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const templates = await getEmailTemplates();

      return {
        success: true,
        templates,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to get templates",
      };
    }
  }),

  createEmailTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        subject: z.string(),
        body: z.string(),
        variables: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const template = await createEmailTemplate(
          input.name,
          input.subject,
          input.body,
          input.variables
        );

        return {
          success: true,
          template,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to create template",
        };
      }
    }),

  scheduleEmail: protectedProcedure
    .input(
      sendEmailSchema.extend({
        scheduledFor: z.date(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const campaign = await scheduleEmail(
          input.prospectId,
          input.dealershipId,
          input.recipientEmail,
          input.subject,
          input.body,
          input.scheduledFor
        );

        return {
          success: true,
          campaign,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to schedule email",
        };
      }
    }),

  sendBatchEmails: protectedProcedure
    .input(
      z.object({
        emails: z.array(sendEmailSchema),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const result = await sendBatchEmails(input.emails);

        return {
          success: true,
          totalSent: result.totalSent,
          totalFailed: result.totalFailed,
          results: result.results,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to send batch emails",
        };
      }
    }),

  handleUnsubscribe: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        dealershipId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const result = await handleUnsubscribe(input.prospectId, input.dealershipId);

        return {
          success: true,
          result,
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to unsubscribe",
        };
      }
    }),
});
