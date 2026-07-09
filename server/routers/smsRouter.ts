/**
 * SMS Router - tRPC procedures for Twilio SMS messaging
 * Handles SMS communication with customers
 */

import { protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { sendSMS, getTwilioStatus } from "../_core/twilioService";
import {
  getWhatsappMessages,
  getOrCreateWhatsappConversation,
  createWhatsappMessage,
} from "../db";

export const smsRouter = {
  /**
   * Get SMS service status
   */
  getStatus: protectedProcedure.query(async () => {
    const status = getTwilioStatus();
    return {
      configured: status.configured,
      mode: status.mode,
      hasAccountSid: status.hasAccountSid,
      hasAuthToken: status.hasAuthToken,
      hasPhoneNumber: status.hasPhoneNumber,
      message:
        status.mode === "mock"
          ? "SMS service running in Sandbox mode (testing)"
          : "SMS service ready for production",
    };
  }),

  /**
   * Send SMS message to customer
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        phone: z.string().describe("Customer phone number"),
        message: z.string().describe("Message content"),
        dealershipId: z.number().optional(),
        vehicleId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendSMS(input.phone, input.message);

        // Store in database if dealership is provided
        if (input.dealershipId) {
          try {
            const conversation = await getOrCreateWhatsappConversation(
              input.dealershipId,
              input.phone,
              input.vehicleId
            );

            await createWhatsappMessage({
              conversationId: conversation.id,
              direction: "outbound",
              messageType: "text",
              content: input.message,
              metaMessageId: result.messageId,
              status: result.success ? "sent" : "failed",
            });
          } catch (error) {
            console.error("[SMS Router] Failed to store message:", error);
          }
        }

        return {
          success: result.success,
          messageId: result.messageId,
          mode: result.mode,
          error: result.error,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          mode: "error",
        };
      }
    }),

  /**
   * Send bulk SMS to multiple customers
   */
  sendBulk: protectedProcedure
    .input(
      z.object({
        recipients: z
          .array(
            z.object({
              phone: z.string(),
              message: z.string(),
              dealershipId: z.number().optional(),
            })
          )
          .describe("Array of recipients"),
      })
    )
    .mutation(async ({ input }) => {
      const results = [];

      for (const recipient of input.recipients) {
        const result = await sendSMS(recipient.phone, recipient.message);
        results.push({
          phone: recipient.phone,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });

        // Small delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return {
        total: results.length,
        successful,
        failed,
        results,
      };
    }),

  /**
   * Send SMS to dealership about new lead
   */
  notifyDealership: protectedProcedure
    .input(
      z.object({
        dealershipPhone: z.string(),
        leadName: z.string(),
        leadPhone: z.string(),
        vehicleInterest: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const notification = `
🔔 New Lead Alert!
Name: ${input.leadName}
Phone: ${input.leadPhone}
${input.vehicleInterest ? `Vehicle: ${input.vehicleInterest}` : ""}
${input.message ? `Message: ${input.message}` : ""}
      `.trim();

      const result = await sendSMS(input.dealershipPhone, notification);

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    }),

  /**
   * Get conversation history (SMS messages)
   */
  getConversationHistory: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        customerPhone: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const conversation = await getOrCreateWhatsappConversation(
          input.dealershipId,
          input.customerPhone
        );

        const messages = await getWhatsappMessages(conversation.id);

        return {
          conversationId: conversation.id,
          customerPhone: input.customerPhone,
          messages: messages.map((msg) => ({
            id: msg.id,
            direction: msg.direction,
            content: msg.content,
            status: msg.status,
            timestamp: msg.createdAt,
          })),
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to fetch conversation",
          messages: [],
        };
      }
    }),

  /**
   * Test SMS sending
   */
  testSend: protectedProcedure
    .input(
      z.object({
        phone: z.string().describe("Test phone number"),
      })
    )
    .mutation(async ({ input }) => {
      const testMessage = "🧪 Test message from GrayArx SMS Service - If you received this, SMS is working!";

      const result = await sendSMS(input.phone, testMessage);

      return {
        success: result.success,
        messageId: result.messageId,
        mode: result.mode,
        message: result.success
          ? "Test SMS sent successfully!"
          : `Failed to send test SMS: ${result.error}`,
        error: result.error,
      };
    }),

  /**
   * Get SMS setup guide
   */
  getSetupGuide: protectedProcedure.query(async () => {
    const status = getTwilioStatus();

    return {
      title: "Twilio SMS Setup Guide",
      currentStatus: status,
      steps: [
        {
          step: 1,
          title: "Create Twilio Account",
          description: "Sign up at twilio.com and verify your account",
          link: "https://www.twilio.com/console",
        },
        {
          step: 2,
          title: "Get Twilio Credentials",
          description: "Copy your Account SID and Auth Token from the console",
          fields: ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY"],
        },
        {
          step: 3,
          title: "Purchase Phone Number",
          description: "Buy a phone number (SMS + WhatsApp capable)",
          link: "https://www.twilio.com/console/phone-numbers/incoming",
        },
        {
          step: 4,
          title: "Configure Credentials",
          description: "Set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_PHONE_NUMBER",
          fields: ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY", "TWILIO_PHONE_NUMBER"],
        },
        {
          step: 5,
          title: "Test SMS",
          description: "Use testSend endpoint to verify SMS is working",
          endpoint: "sms.testSend",
        },
      ],
      notes: [
        status.mode === "mock"
          ? "Currently in Sandbox mode - SMS messages are simulated for testing"
          : "Production mode - SMS messages will be sent to real numbers",
        "Each SMS costs approximately $0.0075 USD",
        "South African numbers are fully supported",
      ],
    };
  }),
};
