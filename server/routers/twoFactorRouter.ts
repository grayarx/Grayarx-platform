import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  generateTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
} from "../_core/twoFactorAuth";

export const twoFactorRouter = router({
  enable2FA: protectedProcedure
    .input(z.object({ method: z.enum(["authenticator", "sms", "email"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.method === "authenticator") {
        const email = ctx.user.email || `user-${ctx.user.id}@grayarx.com`;
        const { secret, qrCode } = await generateTotpSecret(email);
        return { secret, qrCode, method: "authenticator" };
      }
      return { method: input.method, message: "OTP will be sent on next login" };
    }),

  verify2FA: protectedProcedure
    .input(z.object({ code: z.string(), secret: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const isValid = verifyTotpCode(input.secret, input.code);
      if (!isValid) {
        throw new Error("Invalid OTP code");
      }
      return { success: true, message: "2FA verified successfully" };
    }),

  generateBackupCodes: protectedProcedure
    .mutation(async ({ ctx }) => {
      const codes = generateBackupCodes(10);
      return { codes, message: "Backup codes generated. Store them safely!" };
    }),

  disable2FA: protectedProcedure
    .input(z.object({ method: z.enum(["authenticator", "sms", "email"]) }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, message: `${input.method} 2FA disabled` };
    }),

  get2FAStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        userId: ctx.user.id,
        enabled: false,
        methods: [],
        lastVerified: null,
      };
    }),
});
