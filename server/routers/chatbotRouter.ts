import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getChatbotDeployment,
  upsertChatbotDeployment,
  getOrCreateConversation,
  addChatbotMessage,
  getConversationMessages,
  trackInventoryView,
  markTestDriveBooked,
  markPreApprovalSubmitted,
  getChatbotAnalytics,
  closeConversation,
} from "../_core/chatbotDeploymentService";
import { TRPCError } from "@trpc/server";

export const chatbotRouter = router({
  /**
   * Get chatbot deployment configuration
   */
  getDeployment: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.dealershipId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
    }

    const deployment = await getChatbotDeployment(ctx.user.dealershipId);
    if (!deployment) {
      return null;
    }

    return {
      id: deployment.id,
      deploymentType: deployment.deploymentType,
      webChatbotEnabled: deployment.webChatbotEnabled === 1,
      webChatbotLanguages: deployment.webChatbotLanguages ? JSON.parse(deployment.webChatbotLanguages as any) : ["en"],
      webChatbotPosition: deployment.webChatbotPosition,
      webChatbotTheme: deployment.webChatbotTheme,
      whatsappChatbotEnabled: deployment.whatsappChatbotEnabled === 1,
      whatsappPhoneNumber: deployment.whatsappPhoneNumber,
      autoRespondEnabled: deployment.autoRespondEnabled === 1,
      businessHoursOnly: deployment.businessHoursOnly === 1,
      offHoursMessage: deployment.offHoursMessage,
    };
  }),

  /**
   * Update chatbot deployment configuration
   */
  updateDeployment: protectedProcedure
    .input(
      z.object({
        deploymentType: z.enum(["web", "whatsapp", "both"]).optional(),
        webChatbotEnabled: z.boolean().optional(),
        webChatbotLanguages: z.array(z.string()).optional(),
        webChatbotPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).optional(),
        webChatbotTheme: z.enum(["dark", "light", "custom"]).optional(),
        whatsappChatbotEnabled: z.boolean().optional(),
        whatsappPhoneNumber: z.string().optional(),
        whatsappBusinessAccountId: z.string().optional(),
        autoRespondEnabled: z.boolean().optional(),
        businessHoursOnly: z.boolean().optional(),
        offHoursMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      const updated = await upsertChatbotDeployment(ctx.user.dealershipId, input);
      return updated;
    }),

  /**
   * Get or create a conversation
   */
  getOrCreateConversation: protectedProcedure
    .input(
      z.object({
        chatbotType: z.enum(["web", "whatsapp"]),
        customerId: z.string(),
        customerName: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      const conversation = await getOrCreateConversation(ctx.user.dealershipId, input.chatbotType, input.customerId, {
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
        language: input.language,
      });

      return conversation;
    }),

  /**
   * Add a message to a conversation
   */
  addMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        role: z.enum(["customer", "chatbot", "agent"]),
        content: z.string(),
        messageType: z.enum(["text", "image", "document", "location", "quick_reply"]).optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      await addChatbotMessage(input.conversationId, ctx.user.dealershipId, input.role, input.content, input.messageType || "text", input.metadata);

      return { success: true };
    }),

  /**
   * Get conversation messages
   */
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      const messages = await getConversationMessages(input.conversationId);
      return messages.map((m) => ({
        id: m.id,
        role: m.role,
        messageType: m.messageType,
        content: m.content,
        metadata: m.metadata ? JSON.parse(m.metadata as any) : null,
        createdAt: m.createdAt,
      }));
    }),

  /**
   * Track inventory view
   */
  trackInventoryView: protectedProcedure
    .input(z.object({ conversationId: z.number(), vehicleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      await trackInventoryView(input.conversationId, input.vehicleId);
      return { success: true };
    }),

  /**
   * Mark test drive as booked
   */
  markTestDriveBooked: protectedProcedure
    .input(z.object({ conversationId: z.number(), testDriveId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      await markTestDriveBooked(input.conversationId, input.testDriveId);
      return { success: true };
    }),

  /**
   * Mark pre-approval as submitted
   */
  markPreApprovalSubmitted: protectedProcedure
    .input(z.object({ conversationId: z.number(), preApprovalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      await markPreApprovalSubmitted(input.conversationId, input.preApprovalId);
      return { success: true };
    }),

  /**
   * Get chatbot analytics
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.dealershipId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
    }

    const analytics = await getChatbotAnalytics(ctx.user.dealershipId);
    return analytics;
  }),

  /**
   * Close a conversation
   */
  closeConversation: protectedProcedure
    .input(z.object({ conversationId: z.number(), status: z.enum(["completed", "abandoned"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }

      await closeConversation(input.conversationId, input.status || "completed");
      return { success: true };
    }),
});
