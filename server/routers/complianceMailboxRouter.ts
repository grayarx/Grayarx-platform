import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  listComplianceInquiries,
  markComplianceInquiryRead,
  recordComplianceInquiry,
  countUnreadComplianceInquiries,
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
});
