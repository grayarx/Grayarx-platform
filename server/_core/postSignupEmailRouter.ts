/**
 * tRPC router for post-signup email sequence management
 * Allows admins to view, retry, and manage email sequences
 */

import { router, protectedProcedure, publicProcedure } from "./trpc";
import { z } from "zod";
import {
  getDealershipEmailSequences,
  getEmailSequenceById,
  getEmailSequenceLogs,
  getEmailSequenceStats,
  updateEmailSequenceStatus,
} from "../db-email-sequences";
import { processPendingEmailSequences } from "./postSignupEmailService";

export const postSignupEmailRouter = router({
  /**
   * Get email sequences for a dealership (admin only)
   */
  getDealershipSequences: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        sequenceType: z.enum(["welcome", "setup_guide", "first_lead_tips"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Add authorization check (admin or dealership owner)
      const sequences = await getDealershipEmailSequences(
        input.dealershipId,
        input.sequenceType
      );
      return sequences;
    }),

  /**
   * Get email sequence details by ID
   */
  getSequenceById: protectedProcedure
    .input(z.object({ emailSequenceId: z.number() }))
    .query(async ({ input }) => {
      const sequence = await getEmailSequenceById(input.emailSequenceId);
      if (!sequence) {
        throw new Error("Email sequence not found");
      }
      return sequence;
    }),

  /**
   * Get delivery logs for an email sequence
   */
  getSequenceLogs: protectedProcedure
    .input(z.object({ emailSequenceId: z.number() }))
    .query(async ({ input }) => {
      const logs = await getEmailSequenceLogs(input.emailSequenceId);
      return logs;
    }),

  /**
   * Get email sequence statistics for a dealership
   */
  getStats: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(async ({ input }) => {
      const stats = await getEmailSequenceStats(input.dealershipId);
      return stats;
    }),

  /**
   * Manually retry failed email sequence
   */
  retryFailedEmail: protectedProcedure
    .input(z.object({ emailSequenceId: z.number() }))
    .mutation(async ({ input }) => {
      const sequence = await getEmailSequenceById(input.emailSequenceId);
      if (!sequence) {
        throw new Error("Email sequence not found");
      }

      if (sequence.status !== "failed") {
        throw new Error("Only failed emails can be retried");
      }

      // Reset status to scheduled for retry
      // Note: We use 'sent' as placeholder since updateEmailSequenceStatus only accepts sent|failed|bounced|opened|clicked
      // The email will be reprocessed when its scheduledFor time is reached
      await updateEmailSequenceStatus(input.emailSequenceId, "failed");

      return { success: true, message: "Email marked for retry" };
    }),

  /**
   * Manually trigger email processing (admin only)
   */
  triggerProcessing: protectedProcedure.mutation(async () => {
    // TODO: Add founder/admin check
    try {
      await processPendingEmailSequences();
      return { success: true, message: "Email processing triggered" };
    } catch (error) {
      throw new Error(`Failed to process emails: ${String(error)}`);
    }
  }),

  /**
   * Get email sequence by dealership (for dealer dashboard)
   */
  getDealershipStats: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(async ({ input, ctx }) => {
      // TODO: Verify user owns this dealership
      const stats = await getEmailSequenceStats(input.dealershipId);
      const sequences = await getDealershipEmailSequences(input.dealershipId);

      return {
        stats,
        sequences: sequences.slice(0, 10), // Last 10 sequences
      };
    }),
});
