/**
 * Marketing Agent - WhatsApp Business API Management
 * 
 * Handles WhatsApp Business API setup, messaging, and dealership integration.
 * This agent manages the WhatsApp channel for customer enquiries and notifications.
 */

import { invokeLLM } from "./llm";

interface WhatsAppConfig {
  dealershipId: string;
  businessPhoneNumber: string;
  businessAccountId: string;
  apiAccessToken: string;
  isActive: boolean;
  messageTemplates: Record<string, string>;
}

interface WhatsAppMessage {
  to: string;
  from: string;
  body: string;
  messageType: "text" | "template" | "media";
  templateName?: string;
  mediaUrl?: string;
}

interface WhatsAppInbound {
  from: string;
  to: string;
  body: string;
  timestamp: number;
  messageId: string;
}

/**
 * Generate WhatsApp Business API setup guide for dealership
 */
export async function generateWhatsAppSetupGuide(dealershipName: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a WhatsApp Business API setup expert. Provide clear, step-by-step instructions for setting up WhatsApp Business API for a dealership. Include:
1. Prerequisites and requirements
2. Account creation steps
3. Phone number verification
4. API credential setup
5. Integration with GrayArx platform
6. Testing procedures

Format as a professional guide with sections and bullet points.`,
      },
      {
        role: "user",
        content: `Create a setup guide for ${dealershipName} to integrate WhatsApp Business API with GrayArx platform.`,
      },
    ],
  });

  return response.choices[0]?.message.content as string;
}

/**
 * Generate WhatsApp message templates for dealership
 */
export async function generateWhatsAppTemplates(dealershipName: string, dealershipType: string): Promise<Record<string, string>> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a WhatsApp messaging expert for automotive dealerships. Generate professional WhatsApp message templates that are:
- Concise (WhatsApp is conversational)
- Professional yet friendly
- Compliant with WhatsApp Business API guidelines
- Multilingual-ready (will be translated later)

Return ONLY a JSON object with template names as keys and messages as values. No markdown, no explanations.`,
      },
      {
        role: "user",
        content: `Generate WhatsApp message templates for ${dealershipName} (${dealershipType}). Include templates for:
- Lead acknowledgment
- Test drive booking confirmation
- Vehicle enquiry response
- Trade-in valuation notification
- Finance pre-approval notification
- Follow-up reminder`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "whatsapp_templates",
        strict: true,
        schema: {
          type: "object",
          properties: {
            lead_acknowledgment: { type: "string" },
            test_drive_confirmation: { type: "string" },
            vehicle_enquiry: { type: "string" },
            trade_in_notification: { type: "string" },
            finance_notification: { type: "string" },
            follow_up_reminder: { type: "string" },
          },
          required: [
            "lead_acknowledgment",
            "test_drive_confirmation",
            "vehicle_enquiry",
            "trade_in_notification",
            "finance_notification",
            "follow_up_reminder",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = response.choices[0]?.message.content;
    if (typeof content === "string") {
      return JSON.parse(content) as Record<string, string>;
    }
    return (content as unknown) as Record<string, string>;
  } catch {
    return {
      lead_acknowledgment: "Thank you for your interest! We'll get back to you shortly.",
      test_drive_confirmation: "Your test drive is confirmed. See you soon!",
      vehicle_enquiry: "Thanks for the enquiry. Let me get you more details.",
      trade_in_notification: "Your trade-in valuation is ready. Check it out!",
      finance_notification: "Your finance pre-approval is complete!",
      follow_up_reminder: "Just checking in - still interested in this vehicle?",
    };
  }
}

/**
 * Process inbound WhatsApp message and generate response
 */
export async function processWhatsAppInbound(
  message: WhatsAppInbound,
  dealershipName: string,
  dealershipContext: string
): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a professional WhatsApp assistant for ${dealershipName} dealership. 
Context: ${dealershipContext}

Guidelines:
- Keep responses concise (WhatsApp is conversational)
- Be friendly and professional
- Offer next steps (book test drive, get valuation, etc.)
- If complex question, offer to connect with salesperson
- Always include dealership phone number for urgent matters
- Use WhatsApp-appropriate tone (less formal than email)`,
      },
      {
        role: "user",
        content: `Customer message: "${message.body}"

Respond with a helpful WhatsApp message (max 2-3 sentences). Be conversational.`,
      },
    ],
  });

  return response.choices[0]?.message.content as string;
}

/**
 * Generate WhatsApp campaign for dealership
 */
export async function generateWhatsAppCampaign(
  dealershipName: string,
  campaignType: "new_inventory" | "special_offer" | "follow_up" | "testimonial",
  campaignData: Record<string, unknown>
): Promise<{ message: string; mediaUrl?: string }> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a WhatsApp marketing expert for automotive dealerships. Create engaging WhatsApp campaign messages that:
- Are concise and conversational
- Include a clear call-to-action
- Are compliant with WhatsApp Business guidelines
- Drive engagement and conversions`,
      },
      {
        role: "user",
        content: `Create a ${campaignType} WhatsApp campaign for ${dealershipName}.
Campaign data: ${JSON.stringify(campaignData)}

Generate a message that will be sent to customers via WhatsApp.`,
      },
    ],
  });

  return {
    message: response.choices[0]?.message.content as string,
  };
}

/**
 * Validate WhatsApp Business API credentials
 */
export async function validateWhatsAppCredentials(config: Partial<WhatsAppConfig>): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.businessPhoneNumber) {
    errors.push("Business phone number is required");
  } else if (!/^\+\d{1,3}\d{6,14}$/.test(config.businessPhoneNumber)) {
    errors.push("Invalid phone number format. Use +countrycode format");
  }

  if (!config.businessAccountId) {
    errors.push("Business Account ID is required");
  }

  if (!config.apiAccessToken) {
    errors.push("API Access Token is required");
  } else if (config.apiAccessToken.length < 20) {
    warnings.push("API token seems too short. Verify it's correct");
  }

  if (!config.dealershipId) {
    errors.push("Dealership ID is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format WhatsApp message for API submission
 */
export function formatWhatsAppMessage(message: WhatsAppMessage): Record<string, unknown> {
  if (message.messageType === "template") {
    return {
      messaging_product: "whatsapp",
      to: message.to,
      type: "template",
      template: {
        name: message.templateName,
        language: {
          code: "en_US",
        },
      },
    };
  }

  if (message.messageType === "media") {
    return {
      messaging_product: "whatsapp",
      to: message.to,
      type: "image",
      image: {
        link: message.mediaUrl,
      },
    };
  }

  return {
    messaging_product: "whatsapp",
    to: message.to,
    type: "text",
    text: {
      body: message.body,
    },
  };
}

/**
 * Track WhatsApp message delivery and read status
 */
export interface WhatsAppDeliveryStatus {
  messageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: number;
  recipientNumber: string;
  errorMessage?: string;
}

/**
 * Generate WhatsApp analytics report
 */
export async function generateWhatsAppAnalytics(
  dealershipName: string,
  metrics: {
    messagesSent: number;
    messagesDelivered: number;
    messagesRead: number;
    responseRate: number;
    averageResponseTime: number;
  }
): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a WhatsApp marketing analytics expert. Generate a professional analytics report summary.`,
      },
      {
        role: "user",
        content: `Generate a WhatsApp analytics report for ${dealershipName} with these metrics:
- Messages sent: ${metrics.messagesSent}
- Messages delivered: ${metrics.messagesDelivered}
- Messages read: ${metrics.messagesRead}
- Response rate: ${metrics.responseRate}%
- Average response time: ${metrics.averageResponseTime} minutes

Provide insights and recommendations.`,
      },
    ],
  });

  return response.choices[0]?.message.content as string;
}
