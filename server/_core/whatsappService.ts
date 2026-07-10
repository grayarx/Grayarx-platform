/**
 * WhatsApp Business API Service
 * Handles WhatsApp messaging for dealership enquiries and customer communication
 * Uses Meta WhatsApp Cloud API for real message delivery
 */

import {
  createWhatsappMessage,
  getOrCreateWhatsappConversation,
  updateWhatsappMessageStatus,
  enqueueWhatsappMessage,
  logWhatsappWebhook,
} from "../db";

interface WhatsAppMessage {
  phone: string;
  message: string;
  type: "customer_enquiry" | "dealership_response" | "automated_reply";
  vehicleId?: string;
  dealershipId?: string;
}

interface WhatsAppTemplate {
  name: string;
  language: string;
  parameters?: Record<string, string>;
}

interface MetaMessageResponse {
  messages: Array<{
    id: string;
    message_status: string;
  }>;
}

/**
 * Format phone number to E.164 format for WhatsApp
 */
function formatPhoneNumber(phone: string): string {
  // Remove common formatting
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // If it starts with +, remove it
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // If it starts with 0 (South Africa), replace with 27
  if (cleaned.startsWith("0")) {
    cleaned = "27" + cleaned.substring(1);
  }

  // If it doesn't start with country code, assume South Africa
  if (!cleaned.startsWith("27") && cleaned.length === 9) {
    cleaned = "27" + cleaned;
  }

  return cleaned;
}

/**
 * Send WhatsApp message via Meta API
 */
export async function sendWhatsAppMessage(
  message: WhatsAppMessage
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Accept either env name — docs use PHONE_NUMBER_ID; older code used BUSINESS_PHONE_ID.
    const whatsappBusinessPhoneId =
      process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!whatsappBusinessPhoneId || !whatsappAccessToken) {
      console.warn("[WhatsAppService] WhatsApp credentials missing");
      return { success: false, error: "WhatsApp credentials not configured" };
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(message.phone);

    // Get or create conversation
    const dealershipId = message.dealershipId ? Number(message.dealershipId) : 0;
    if (dealershipId > 0) {
      try {
        await getOrCreateWhatsappConversation(
          dealershipId,
          formattedPhone,
          message.vehicleId ? Number(message.vehicleId) : undefined
        );
      } catch (error) {
        console.error("[WhatsAppService] Failed to create conversation:", error);
      }
    }

    // Call Meta WhatsApp Cloud API (facebook graph — not Instagram)
    const metaUrl = `https://graph.facebook.com/v18.0/${whatsappBusinessPhoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message.message,
      },
    };

    console.log(`[WhatsApp] Sending to +${formattedPhone}: ${message.message.substring(0, 50)}...`);

    const response = await fetch(metaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${whatsappAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[WhatsApp] API Error:", errorData);
      return {
        success: false,
        error: `WhatsApp API error: ${response.status} ${JSON.stringify(errorData)}`,
      };
    }

    const data = (await response.json()) as MetaMessageResponse;
    const metaMessageId = data.messages?.[0]?.id;

    if (!metaMessageId) {
      return {
        success: false,
        error: "No message ID returned from WhatsApp API",
      };
    }

    // Store message in database
    if (dealershipId > 0) {
      try {
        await createWhatsappMessage({
          conversationId: dealershipId, // Will be updated to actual conversation ID
          direction: "outbound",
          messageType: "text",
          content: message.message,
          metaMessageId,
          status: "sent",
        });
      } catch (error) {
        console.error("[WhatsAppService] Failed to store message:", error);
      }
    }

    console.log(`[WhatsApp] Message sent successfully: ${metaMessageId}`);

    return {
      success: true,
      messageId: metaMessageId,
    };
  } catch (error) {
    console.error("[WhatsAppService] Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send WhatsApp template message via Meta API
 */
export async function sendWhatsAppTemplate(
  phone: string,
  template: WhatsAppTemplate
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const whatsappBusinessPhoneId =
      process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!whatsappBusinessPhoneId || !whatsappAccessToken) {
      console.warn("[WhatsAppService] WhatsApp credentials missing");
      return { success: false, error: "WhatsApp credentials not configured" };
    }

    const formattedPhone = formatPhoneNumber(phone);

    const metaUrl = `https://graph.facebook.com/v18.0/${whatsappBusinessPhoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: template.name,
        language: {
          code: template.language,
        },
        parameters: template.parameters
          ? {
              body: {
                parameters: Object.values(template.parameters),
              },
            }
          : undefined,
      },
    };

    console.log(`[WhatsApp] Sending template ${template.name} to +${formattedPhone}`);

    const response = await fetch(metaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${whatsappAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[WhatsApp] Template API Error:", errorData);
      return {
        success: false,
        error: `WhatsApp API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as MetaMessageResponse;
    const metaMessageId = data.messages?.[0]?.id;

    if (!metaMessageId) {
      return {
        success: false,
        error: "No message ID returned from WhatsApp API",
      };
    }

    console.log(`[WhatsApp] Template sent successfully: ${metaMessageId}`);

    return {
      success: true,
      messageId: metaMessageId,
    };
  } catch (error) {
    console.error("[WhatsAppService] Error sending WhatsApp template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handle incoming WhatsApp message from customer (called by webhook)
 * Uses multilingual Nala pipeline (same as web showroom chat).
 *
 * When `alreadyPersisted` is true (webhook path), skip writing the inbound
 * row again — the webhook already stored it with the Meta message id.
 */
export async function handleIncomingWhatsAppMessage(
  phone: string,
  message: string,
  dealershipId: string,
  options?: { alreadyPersisted?: boolean },
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const dealershipIdNum = Number(dealershipId);

    const { listVehicles, getVehicle } = await import("../db");
    const { getDealershipById } = await import("../db");
    const {
      parseVehicleTitleFromMessage,
      findVehicleFromMessage,
      vehicleRowToContext,
    } = await import("./nalaReplyOrchestrator");
    const { resolveRoutedReply } = await import("./agentIntentRouter");
    const { scoreListingDeal } = await import("../../shared/priceIntelligence");

    const dealership = await getDealershipById(dealershipIdNum);
    const dealerName = dealership?.name ?? "GrayArx Dealership";

    const allVehicles = await listVehicles(200);

    let vehicleId: number | undefined;
    const parsedTitle = parseVehicleTitleFromMessage(message);
    if (parsedTitle) {
      const hay = parsedTitle.toLowerCase();
      const match = allVehicles.find(
        (v) =>
          (v.title ?? "").toLowerCase().includes(hay) ||
          hay.includes((v.title ?? "").toLowerCase().slice(0, 20)),
      );
      if (match?.id) vehicleId = Number(match.id);
    }
    if (!vehicleId) {
      const matched = findVehicleFromMessage(message, allVehicles);
      if (matched?.id) vehicleId = Number(matched.id);
    }

    const topDealHints = allVehicles
      .filter((v) => v.status === "available" && v.price && Number(v.price) > 1)
      .map((v) => ({
        v,
        score: scoreListingDeal(Number(v.price), {
          make: v.make,
          model: v.model,
          year: v.year,
          mileageKm: v.km,
          title: v.title,
        }),
      }))
      .filter((x) => x.score?.rating === "great")
      .sort((a, b) => (b.score?.deltaPct ?? 0) - (a.score?.deltaPct ?? 0))
      .slice(0, 3)
      .map(({ v }) => ({ title: v.title ?? "Vehicle", price: v.price }));

    const conversation = await getOrCreateWhatsappConversation(
      dealershipIdNum,
      formattedPhone,
      vehicleId,
    );

    if (vehicleId && !conversation.vehicleId) {
      vehicleId = conversation.vehicleId ?? vehicleId;
    } else if (conversation.vehicleId) {
      vehicleId = conversation.vehicleId;
    }

    // Webhook path already persisted the inbound with metaMessageId — avoid duplicates.
    if (!options?.alreadyPersisted) {
      await createWhatsappMessage({
        conversationId: conversation.id,
        direction: "inbound",
        messageType: "text",
        content: message,
        status: "delivered",
      });
    }

    let vehicleCtx = null;
    if (vehicleId) {
      const row = await getVehicle(vehicleId);
      if (row) vehicleCtx = vehicleRowToContext(row);
    }

    const result = await resolveRoutedReply({
      message,
      vehicle: vehicleCtx,
      vehicleId,
      dealershipId: dealershipIdNum,
      dealershipName: dealerName,
      businessHoursOverride: dealership?.businessHoursJson ?? undefined,
      customerPhone: formattedPhone,
      channel: "whatsapp",
      includeDealScore: true,
      inventoryHints: topDealHints,
    });

    console.log(
      `[WhatsApp ${result.agent}] +${formattedPhone} lang=${result.language} intent=${result.intent}`,
    );

    await sendWhatsAppMessage({
      phone: formattedPhone,
      message: result.reply,
      type: "automated_reply",
      dealershipId,
      vehicleId: vehicleId ? String(vehicleId) : undefined,
    });

    return { success: true, response: result.reply };
  } catch (error) {
    console.error("[WhatsAppService] Error handling incoming message:", error);
    return replyOnlyFallback(phone, message, dealershipId, error);
  }
}

/** When DB/conversation persistence fails, still send a Nala reply via Meta API. */
async function replyOnlyFallback(
  phone: string,
  message: string,
  dealershipId: string,
  cause: unknown,
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const { resolveRoutedReply } = await import("./agentIntentRouter");
    const result = await resolveRoutedReply({
      message,
      vehicle: null,
      dealershipId: Number(dealershipId) || 1,
      dealershipName: "GrayArx",
      customerPhone: formattedPhone,
      channel: "whatsapp",
    });
    const sent = await sendWhatsAppMessage({
      phone: formattedPhone,
      message: result.reply,
      type: "automated_reply",
      dealershipId,
    });
    if (!sent.success) {
      return { success: false, error: sent.error ?? "Failed to send WhatsApp reply" };
    }
    console.warn(
      `[WhatsAppService] Reply-only fallback used for +${formattedPhone} after: ${
        cause instanceof Error ? cause.message : "unknown error"
      }`,
    );
    return { success: true, response: result.reply };
  } catch (fallbackError) {
    console.error("[WhatsAppService] Reply-only fallback failed:", fallbackError);
    return {
      success: false,
      error: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
    };
  }
}

/**
 * Parse enquiry type from customer message
 */
function parseEnquiryType(
  message: string
): "vehicle_enquiry" | "test_drive" | "price_enquiry" | "finance" | "other" {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("test drive") ||
    lowerMessage.includes("drive") ||
    lowerMessage.includes("book")
  ) {
    return "test_drive";
  }

  if (
    lowerMessage.includes("price") ||
    lowerMessage.includes("cost") ||
    lowerMessage.includes("how much")
  ) {
    return "price_enquiry";
  }

  if (
    lowerMessage.includes("finance") ||
    lowerMessage.includes("loan") ||
    lowerMessage.includes("payment")
  ) {
    return "finance";
  }

  if (
    lowerMessage.includes("interested") ||
    lowerMessage.includes("want") ||
    lowerMessage.includes("looking")
  ) {
    return "vehicle_enquiry";
  }

  return "other";
}

/**
 * Send WhatsApp notification to dealership about new lead
 */
export async function notifyDealershipWhatsApp(
  dealershipPhone: string,
  leadData: {
    customerName: string;
    customerPhone: string;
    vehicleInterest?: string;
    message?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const notification = `
🔔 New Lead Alert!
Name: ${leadData.customerName}
Phone: ${leadData.customerPhone}
${leadData.vehicleInterest ? `Vehicle: ${leadData.vehicleInterest}` : ""}
${leadData.message ? `Message: ${leadData.message}` : ""}
    `.trim();

    const result = await sendWhatsAppMessage({
      phone: dealershipPhone,
      message: notification,
      type: "customer_enquiry",
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error("[WhatsAppService] Error notifying dealership:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate webhook signature from Meta.
 * Meta sends `X-Hub-Signature-256: sha256=<hex>` — strip the prefix before compare.
 */
export function validateWhatsAppWebhookSignature(
  signature: string,
  payload: string,
  appSecret: string
): boolean {
  if (!signature || !appSecret) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const expectedHex = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  const providedHex = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const provided = Buffer.from(providedHex, "hex");
    if (expected.length === 0 || expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/**
 * Process message delivery status update from webhook
 */
export async function processMessageStatusUpdate(
  metaMessageId: string,
  status: "sent" | "delivered" | "read" | "failed"
): Promise<void> {
  try {
    // Find message by metaMessageId and update status
    // This would require a database query helper
    console.log(`[WhatsApp] Message ${metaMessageId} status: ${status}`);
  } catch (error) {
    console.error("[WhatsAppService] Error processing status update:", error);
  }
}
