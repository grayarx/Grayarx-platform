import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { recordComplianceInquiry } from "../_core/complianceMailbox";
import { checkRateLimit, callerIp } from "../_core/rateLimit";

export const legalSignOffRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        type: z.enum(["dealer_agreement", "popia_consent"]),
        dealershipLegalName: z.string().min(2).max(200),
        companyRegistration: z.string().min(2).max(64),
        signatoryName: z.string().min(2).max(120),
        signatoryTitle: z.string().min(2).max(120),
        contactEmail: z.string().email(),
        contactPhone: z.string().min(6).max(40).optional(),
        registeredAddress: z.string().min(5).max(500).optional(),
        agreed: z.literal(true),
        honeypot: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.honeypot?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Submission rejected." });
      }
      const ip = callerIp(ctx.req);
      const rl = checkRateLimit(`legalSignOff:${ip}`, 3, 60 * 60 * 1000);
      if (!rl.ok) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many submissions. Try again later." });
      }

      const label =
        input.type === "dealer_agreement" ? "Dealer Agreement (signed online)" : "POPIA Consent Form (signed online)";

      const message = [
        `Type: ${label}`,
        `Dealership: ${input.dealershipLegalName}`,
        `Company reg: ${input.companyRegistration}`,
        `Signatory: ${input.signatoryName} (${input.signatoryTitle})`,
        `Email: ${input.contactEmail}`,
        input.contactPhone ? `Phone: ${input.contactPhone}` : null,
        input.registeredAddress ? `Address: ${input.registeredAddress}` : null,
        "",
        "Electronic acceptance: YES — submitted via grayarx.com legal sign-off form.",
        `Timestamp: ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n");

      const id = await recordComplianceInquiry({
        mailbox: "legal",
        source: "web_form",
        senderName: input.signatoryName,
        senderEmail: input.contactEmail,
        subject: `${label} — ${input.dealershipLegalName}`,
        message,
        metadata: { type: input.type, companyRegistration: input.companyRegistration },
      });

      return { success: true as const, inquiryId: id };
    }),
});
