import { z } from "zod";
import { router, adminProcedure, founderProcedure } from "../_core/trpc";
import {
  previewPilotCampaign,
  sendPilotBulkCampaign,
  sendPilotSegmentBatch,
  sendPilotTestEmail,
} from "../_core/pilotEmailCampaignService";
import { testEmailDelivery } from "../_core/resendEmailService";
import { grayArxLogoUrl, grayArxAnimatedLogoUrl, GRAYARX_GMAIL_AVATAR_ADDRESSES } from "../../shared/emailBranding";
import type { PilotOutreachSegment } from "../../shared/pilotProspectSegments";

const segmentSchema = z.enum([
  "no_website_social_only",
  "basic_website_no_showroom",
  "after_hours_leak",
  "whatsapp_manual",
]);

export const pilotEmailRouter = router({
  /** Campaign overview — segments, counts, sample HTML */
  preview: adminProcedure.query(() => previewPilotCampaign()),

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
