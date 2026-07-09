/**
 * WhatsApp Router - tRPC procedures for WhatsApp Business API
 * Implements real Meta WhatsApp Cloud API integration
 */

import { protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  handleIncomingWhatsAppMessage,
  notifyDealershipWhatsApp,
} from "../_core/whatsappService";
import {
  getWhatsappMessages,
  getOrCreateWhatsappConversation,
  getWhatsappConversation,
} from "../db";

export const whatsappRouter = {
  /**
   * Get WhatsApp setup guide
   */
  getSetupGuide: protectedProcedure.query(async () => {
    return {
      title: "WhatsApp Business API Setup Guide",
      steps: [
        {
          step: 1,
          title: "Create Meta Business Account",
          description: "Go to business.facebook.com and create a business account",
          link: "https://business.facebook.com",
        },
        {
          step: 2,
          title: "Apply for WhatsApp Business API",
          description: "Request access to WhatsApp Business API from Meta",
          link: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
        },
        {
          step: 3,
          title: "Get API Credentials",
          description: "Obtain your Business Account ID, Phone Number ID, and Access Token",
          fields: ["WHATSAPP_BUSINESS_ACCOUNT_ID", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
        },
        {
          step: 4,
          title: "Configure Webhook",
          description: "Set up webhook to receive incoming messages",
          webhookUrl: "/api/webhooks/whatsapp",
          verifyToken: "grayarx_whatsapp_webhook_verify",
        },
        {
          step: 5,
          title: "Create Message Templates",
          description: "Pre-approve message templates for sending",
          templates: [
            "lead_acknowledgment",
            "booking_confirmation",
            "test_drive_reminder",
            "vehicle_enquiry",
            "trade_in_valuation",
            "follow_up",
          ],
        },
      ],
      estimatedTime: "24-48 hours",
      support: "contact@grayarx.com",
    };
  }),

  /**
   * Generate WhatsApp message templates
   */
  generateMessageTemplates: protectedProcedure.query(async () => {
    return {
      templates: [
        {
          name: "lead_acknowledgment",
          category: "MARKETING",
          language: "en",
          body: "Hi {{customer_name}}, thanks for your interest in {{dealership_name}}! We've received your enquiry and will get back to you within 2 hours. In the meantime, feel free to explore our showroom.",
          variables: ["customer_name", "dealership_name"],
        },
        {
          name: "booking_confirmation",
          category: "UTILITY",
          language: "en",
          body: "Hi {{customer_name}}, your test drive is confirmed! 🎉\n\nVehicle: {{vehicle_description}}\nDate: {{test_drive_date}}\nTime: {{test_drive_time}}\nLocation: {{dealership_address}}\n\nSee you soon!",
          variables: ["customer_name", "vehicle_description", "test_drive_date", "test_drive_time", "dealership_address"],
        },
        {
          name: "test_drive_reminder",
          category: "UTILITY",
          language: "en",
          body: "Hi {{customer_name}}, reminder: Your test drive is tomorrow at {{test_drive_time}}! We're looking forward to seeing you.",
          variables: ["customer_name", "test_drive_time"],
        },
        {
          name: "vehicle_enquiry",
          category: "MARKETING",
          language: "en",
          body: "Hi {{customer_name}}, thanks for your enquiry about the {{vehicle_description}}! Here are the details:\n\nPrice: {{price}}\nMileage: {{mileage}}\nCondition: {{condition}}\n\nWould you like to book a test drive?",
          variables: ["customer_name", "vehicle_description", "price", "mileage", "condition"],
        },
        {
          name: "trade_in_valuation",
          category: "MARKETING",
          language: "en",
          body: "Hi {{customer_name}}, we've valued your {{vehicle_year}} {{vehicle_make}} {{vehicle_model}}!\n\nMarket Value: {{market_value}}\nOur Offer: {{trade_in_value}}\n\nInterested? Let's discuss!",
          variables: ["customer_name", "vehicle_year", "vehicle_make", "vehicle_model", "market_value", "trade_in_value"],
        },
        {
          name: "follow_up",
          category: "MARKETING",
          language: "en",
          body: "Hi {{customer_name}}, just checking in! Are you still interested in the {{vehicle_description}}? We'd love to help you get behind the wheel. Reply CALL to speak with a sales agent.",
          variables: ["customer_name", "vehicle_description"],
        },
      ],
    };
  }),

  /**
   * Send WhatsApp message (real API call)
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string().optional(),
        templateName: z.string().optional(),
        variables: z.any().optional(),
        dealershipId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate input
        if (!input.message && !input.templateName) {
          return {
            success: false,
            error: "Either message or templateName must be provided",
          };
        }

        // Send text message
        if (input.message) {
          const result = await sendWhatsAppMessage({
            phone: input.phoneNumber,
            message: input.message,
            type: "dealership_response",
            dealershipId: input.dealershipId?.toString(),
          });

          return {
            success: result.success,
            messageId: result.messageId,
            phoneNumber: input.phoneNumber,
            status: result.success ? "sent" : "failed",
            error: result.error,
          };
        }

        // Send template message
        if (input.templateName) {
          const result = await sendWhatsAppTemplate(input.phoneNumber, {
            name: input.templateName,
            language: "en",
            parameters: input.variables,
          });

          return {
            success: result.success,
            messageId: result.messageId,
            phoneNumber: input.phoneNumber,
            template: input.templateName,
            status: result.success ? "sent" : "failed",
            error: result.error,
          };
        }

        return {
          success: false,
          error: "No message or template provided",
        };
      } catch (error) {
        console.error("[WhatsAppRouter] Error sending message:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get WhatsApp conversation history (real database query)
   */
  getConversationHistory: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().optional(),
        phoneNumber: z.string().optional(),
        dealershipId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        let conversation;

        // Get conversation by ID or phone number
        if (input.conversationId) {
          conversation = await getWhatsappConversation(input.conversationId);
        } else if (input.phoneNumber) {
          conversation = await getOrCreateWhatsappConversation(
            input.dealershipId,
            input.phoneNumber
          );
        }

        if (!conversation) {
          return {
            success: false,
            error: "Conversation not found",
            messages: [],
          };
        }

        // Get messages from database
        const messages = await getWhatsappMessages(conversation.id, input.limit);

        return {
          success: true,
          conversationId: conversation.id,
          phoneNumber: conversation.phoneNumber,
          status: conversation.status,
          messages: messages.map((msg) => ({
            id: msg.id,
            timestamp: msg.createdAt.toISOString(),
            sender: msg.direction === "inbound" ? "customer" : "dealership",
            message: msg.content,
            type: msg.messageType,
            status: msg.status,
            mediaUrl: msg.mediaUrl,
          })),
          lastMessageAt: conversation.lastMessageAt?.toISOString(),
        };
      } catch (error) {
        console.error("[WhatsAppRouter] Error getting conversation history:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          messages: [],
        };
      }
    }),

  /**
   * Configure WhatsApp credentials (validates connection)
   */
  configureCredentials: protectedProcedure
    .input(
      z.object({
        businessAccountId: z.string(),
        phoneNumberId: z.string(),
        accessToken: z.string(),
      })
    )
    .mutation(async ({ input: creds }) => {
      try {
        // Validate credentials by making a test API call
        const testUrl = `https://graph.facebook.com/v18.0/${creds.phoneNumberId}`;

        const response = await fetch(testUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${creds.accessToken}`,
          },
        });

        const isValid = response.ok;

        if (isValid) {
          console.log("[WhatsApp] Credentials validated successfully");
        } else {
          console.warn("[WhatsApp] Credential validation failed:", response.status);
        }

        return {
          success: isValid,
          message: isValid
            ? "WhatsApp credentials configured successfully"
            : "Failed to validate WhatsApp credentials",
          configured: {
            businessAccountId: creds.businessAccountId.substring(0, 5) + "***",
            phoneNumberId: creds.phoneNumberId.substring(0, 5) + "***",
            accessToken: creds.accessToken.substring(0, 5) + "***",
          },
          isValid,
        };
      } catch (error) {
        console.error("[WhatsAppRouter] Error configuring credentials:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          isValid: false,
        };
      }
    }),

  /**
   * Get WhatsApp status
   */
  getStatus: protectedProcedure.query(async () => {
    const isConfigured = !!(
      (process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      process.env.WHATSAPP_ACCESS_TOKEN
    );

    return {
      isConfigured,
      isConnected: isConfigured,
      message: isConfigured
        ? "WhatsApp Business API is configured and ready to use"
        : "WhatsApp Business API not yet configured. Follow the setup guide to get started.",
      setupGuideUrl: "/admin/whatsapp-setup",
      webhookUrl: "/api/webhooks/whatsapp",
      verifyToken: "grayarx_whatsapp_webhook_verify",
    };
  }),

  /**
   * Test send message (for debugging)
   */
  testSendMessage: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendWhatsAppMessage({
          phone: input.phoneNumber,
          message: input.message,
          type: "automated_reply",
        });

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("[WhatsAppRouter] Error in test send:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
};
