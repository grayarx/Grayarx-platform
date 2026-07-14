import { z } from "zod";
import { router, adminProcedure, founderProcedure } from "../_core/trpc";
import {
  previewPilotCampaign,
  sendPilotBulkCampaign,
  sendPilotSegmentBatch,
  sendPilotTestEmail,
} from "../_core/pilotEmailCampaignService";
import { testEmailDelivery, sendEmailViaResend } from "../_core/resendEmailService";
import { grayArxLogoUrl, grayArxAnimatedLogoUrl, GRAYARX_GMAIL_AVATAR_ADDRESSES, grayArxPilotFromEmail } from "../../shared/emailBranding";
import type { PilotOutreachSegment } from "../../shared/pilotProspectSegments";
import {
  generateSegmentPilotEmailHTML,
  generateSegmentPilotEmailText,
  subjectForSegment,
} from "../_core/pilotEmailTemplate";
import { recordPilotEmailSend } from "../_core/pilotEmailSendLog";

const segmentSchema = z.enum([
  "no_website_social_only",
  "basic_website_no_showroom",
  "after_hours_leak",
  "whatsapp_manual",
]);

export const pilotEmailRouter = router({
  /** Campaign overview — segments, counts, sample HTML */
  preview: adminProcedure.query(async () => previewPilotCampaign()),

  /** Logo + Resend config check */
  brandingCheck: adminProcedure.query(() => ({
    bodyLogoUrl: grayArxLogoUrl(),
    gmailAvatarSourceWebp: grayArxAnimatedLogoUrl(),
    gmailAvatarAddresses: [...GRAYARX_GMAIL_AVATAR_ADDRESSES],
    gmailAvatarDoc: "/docs/EDWARD_STURM_GMAIL_AVATAR.md",
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
  })),

  /** Send yourself a test email with logo + segment template */
  sendTest: founderProcedure
    .input(
      z.object({
        to: z.string().email(),
        segment: segmentSchema.default("basic_website_no_showroom"),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await sendPilotTestEmail(input.to, input.segment);
      return {
        success: result.success,
        messageId: result.id,
        error: result.error,
        logoUrl: grayArxLogoUrl(),
      };
    }),

  /** Verify Resend plumbing (generic test template) */
  testResend: founderProcedure
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ input }) => testEmailDelivery(input.to)),

  /** Dry-run or send one segment batch */
  sendSegment: founderProcedure
    .input(
      z.object({
        segment: segmentSchema,
        dryRun: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) =>
      sendPilotSegmentBatch({
        segment: input.segment as PilotOutreachSegment,
        dryRun: input.dryRun,
      }),
    ),

  /**
   * Send a personalised pilot email to a single DB prospect.
   * Uses that prospect's dealershipName, city, brands, estimatedVolume.
   */
  sendToDbProspect: founderProcedure
    .input(
      z.object({
        email: z.string().email(),
        dealershipName: z.string().min(1).max(255),
        contactName: z.string().max(255).default("there"),
        city: z.string().max(128).optional(),
        brands: z.string().max(500).optional(),
        estimatedVolume: z.number().int().min(0).optional(),
        segment: segmentSchema.default("basic_website_no_showroom"),
        dryRun: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const seg = input.segment as PilotOutreachSegment;
      if (input.dryRun) {
        return { success: true, dryRun: true, email: input.email };
      }
      const html = generateSegmentPilotEmailHTML({
        dealershipName: input.dealershipName,
        contactName: input.contactName,
        city: input.city,
        segment: seg,
        brands: input.brands,
        estimatedVolume: input.estimatedVolume,
      });
      const text = generateSegmentPilotEmailText({
        dealershipName: input.dealershipName,
        contactName: input.contactName,
        city: input.city,
        segment: seg,
        brands: input.brands,
        estimatedVolume: input.estimatedVolume,
      });
      const result = await sendEmailViaResend({
        to: input.email,
        subject: subjectForSegment(seg),
        html,
        from: grayArxPilotFromEmail(),
        replyTo: "hello@grayarx.com",
      });
      if (result.success) {
        recordPilotEmailSend({
          email: input.email,
          prospectId: `db:${input.email.toLowerCase()}`,
          dealershipName: input.dealershipName,
          segment: seg,
          resendId: result.id,
        });
      }
      return { success: result.success, dryRun: false, email: input.email, messageId: result.id, error: result.error };
    }),

  /** Dry-run or send all mailable segments */
  sendBulk: founderProcedure
    .input(
      z.object({
        dryRun: z.boolean().default(true),
        segments: z.array(segmentSchema).optional(),
      }),
    )
    .mutation(async ({ input }) =>
      sendPilotBulkCampaign({
        dryRun: input.dryRun,
        segments: input.segments as PilotOutreachSegment[] | undefined,
      }),
    ),
});
