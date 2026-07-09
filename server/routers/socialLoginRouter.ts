import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  linkSocialAccount,
  unlinkSocialAccount,
  getSocialAccounts,
  verifyGoogleToken,
  verifyAppleToken,
} from "../_core/socialAuth";

export const socialLoginRouter = router({
  linkAccount: protectedProcedure
    .input(z.object({
      provider: z.enum(["google", "apple"]),
      providerId: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await linkSocialAccount(
        ctx.user.id,
        input.provider,
        input.providerId,
        input.email,
        input.name,
        input.avatarUrl
      );
      return { success: true, message: `${input.provider} account linked` };
    }),

  unlinkAccount: protectedProcedure
    .input(z.object({ provider: z.enum(["google", "apple"]) }))
    .mutation(async ({ input, ctx }) => {
      await unlinkSocialAccount(ctx.user.id, input.provider);
      return { success: true, message: `${input.provider} account unlinked` };
    }),

  getLinkedAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      const accounts = await getSocialAccounts(ctx.user.id);
      return accounts;
    }),

  verifyGoogleToken: publicProcedure
    .input(z.object({ idToken: z.string() }))
    .mutation(async ({ input }) => {
      const result = await verifyGoogleToken(input.idToken);
      return result;
    }),

  verifyAppleToken: publicProcedure
    .input(z.object({ idToken: z.string() }))
    .mutation(async ({ input }) => {
      const result = await verifyAppleToken(input.idToken);
      return result;
    }),
});
