import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { whatsappIntegrationService } from "../_core/whatsappIntegration";

export const whatsappIntegrationRouter = router({
  /**
   * Initialize WhatsApp integration (admin only)
   */
  initialize: protectedProcedure
    .input(
      z.object({
        businessAccountId: z.string(),
        apiToken: z.string(),
        phoneNumberId: z.string(),
        businessPhoneNumber: z.string(),
        webhookToken: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const success = whatsappIntegrationService.initialize({
        ...input,
        enabled: true,
      });

      if (!success) {
        throw new Error("Failed to initialize WhatsApp integration");
      }

      return {
        success: true,
        message: "WhatsApp integration initialized successfully",
      };
    }),

  /**
   * Get WhatsApp integration status (public)
   */
  getStatus: publicProcedure.query(() => {
    return whatsappIntegrationService.getStatus();
  }),

  /**
   * Send message via WhatsApp (protected)
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappIntegrationService.sendMessage(input.phoneNumber, input.message);

      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      return result;
    }),

  /**
   * Send template message via WhatsApp (protected)
   */
  sendTemplateMessage: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        templateName: z.string(),
        parameters: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappIntegrationService.sendTemplateMessage(
        input.phoneNumber,
        input.templateName,
        input.parameters
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to send template message");
      }

      return result;
    }),

  /**
   * Send media message via WhatsApp (protected)
   */
  sendMediaMessage: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        mediaUrl: z.string().url(),
        mediaType: z.enum(["image", "document", "video", "audio"]),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappIntegrationService.sendMediaMessage(
        input.phoneNumber,
        input.mediaUrl,
        input.mediaType,
        input.caption
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to send media message");
      }

      return result;
    }),

  /**
   * Disable WhatsApp integration (admin only)
   */
  disable: protectedProcedure.mutation(({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    whatsappIntegrationService.disable();

    return {
      success: true,
      message: "WhatsApp integration disabled",
    };
  }),

  /**
   * Handle WhatsApp webhook (public - requires token validation)
   */
  handleWebhook: publicProcedure
    .input(z.object({}).passthrough())
    .mutation(async (opts: any) => {
      const input = opts.input as Record<string, any>;
      const success = await whatsappIntegrationService.handleWebhookMessage(input);

      return {
        success,
        message: success ? "Webhook processed" : "Webhook processing failed",
      };
    }),
});
