import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  listComplianceInquiries,
  markComplianceInquiryRead,
  recordComplianceInquiry,
  countUnreadComplianceInquiries,
  deleteComplianceInquiry,
  markComplianceInquiryFollowUp,
} from "../_core/complianceMailbox";
import { checkRateLimit, callerIp, RATE_LIMITS } from "../_core/rateLimit";

function isFounderOrAdmin(user: { role?: string | null } | null | undefined): boolean {
  return user?.role === "founder" || user?.role === "admin";
}

export const complianceMailboxRouter = router({
  /** Public contact form on /legal — routes to privacy@ or legal@ monitoring. */
  submit: publicProcedure
    .input(
      z.object({
        mailbox: z.enum(["privacy", "legal", "hello"]),
        name: z.string().min(2).max(120),
        email: z.string().email(),
        subject: z.string().min(3).max(200),
        message: z.string().min(10).max(8000),
        honeypot: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.honeypot?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Submission rejected." });
      }
      const ip = callerIp(ctx.req);
      const rl = checkRateLimit(`compliance.submit:${ip}`, 5, 60 * 60 * 1000);
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many messages. Please email us directly or try again later.",
        });
      }

      const id = await recordComplianceInquiry({
        mailbox: input.mailbox,
        source: "web_form",
        senderName: input.name,
        senderEmail: input.email,
        subject: input.subject,
        message: input.message,
      });

      return { success: true as const, inquiryId: id };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    if (!isFounderOrAdmin(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return listComplianceInquiries(100);
  }),

  /** Live inbound readiness: MX + webhook secret (founder console). */
  inboundStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!isFounderOrAdmin(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const { checkInboundMxHealth } = await import("../_core/complianceMailbox");
    const mx = await checkInboundMxHealth("grayarx.com");
    const webhookSecret = Boolean(process.env.RESEND_INBOUND_WEBHOOK_SECRET);
    const resendKey = Boolean(process.env.RESEND_API_KEY);
    return {
      ...mx,
      webhookSecretConfigured: webhookSecret,
      resendApiKeyConfigured: resendKey,
      webhookUrl: "https://www.grayarx.com/api/webhooks/resend-inbound",
      replyTargets: [
        "hello@grayarx.com",
        "privacy@grayarx.com",
        "legal@grayarx.com",
        "mia@grayarx.com",
        "prospector@grayarx.com",
        "pilot@grayarx.com",
      ],
      ready: mx.canReceiveMail && webhookSecret && resendKey,
    };
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!isFounderOrAdmin(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return countUnreadComplianceInquiries();
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await markComplianceInquiryRead(input.id);
      return { success: true as const };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteComplianceInquiry(input.id);
      return { success: true as const };
    }),

  markFollowUp: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await markComplianceInquiryFollowUp(input.id);
      return { success: true as const };
    }),
});
