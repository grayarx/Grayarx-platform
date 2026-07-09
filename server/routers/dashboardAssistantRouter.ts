import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { answerDashboardAssistant } from "../_core/dashboardAssistantService";
import { isFounderOrAdmin } from "../../shared/userRoles";
import { OWNER_QUICK_PROMPTS } from "../../shared/dashboardAssistant";
import { DEALER_HELP_QUICK_PROMPTS } from "../../shared/dealerHelpAssistant";
import { AGENTS } from "../../shared/agents";

export const dashboardAssistantRouter = router({
  config: protectedProcedure.query(({ ctx }) => {
    const isOwner = isFounderOrAdmin(ctx.user);
    return {
      mode: isOwner ? ("owner" as const) : ("dealer" as const),
      label: isOwner ? "Ask Kagiso" : "Help",
      title: isOwner ? AGENTS.improvement.displayName : "GrayArx Help",
      subtitle: isOwner ? AGENTS.improvement.role : "Support & how-to",
      avatarUrl: isOwner ? AGENTS.improvement.avatarUrl : "",
      quickPrompts: isOwner ? [...OWNER_QUICK_PROMPTS] : [...DEALER_HELP_QUICK_PROMPTS],
      greeting: isOwner
        ? [
            "Hey — I'm **Kagiso**, your platform ops assistant.",
            "",
            "Ask where your agents are, what they've been doing, dashboard stats, or how to find anything in GrayArx.",
          ].join("\n")
        : [
            "Hi — I'm the **GrayArx Help** assistant for your dealership.",
            "",
            "Ask how to use the console, find a page, or **report a bug**.",
          ].join("\n"),
      placeholder: isOwner ? "Where are my agents?" : "How do I import CSV?",
    };
  }),

  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return answerDashboardAssistant({
        message: input.message,
        userName: ctx.user.name ?? ctx.user.email,
        userRole: ctx.user.role,
        dealershipId: ctx.user.dealershipId,
      });
    }),
});
