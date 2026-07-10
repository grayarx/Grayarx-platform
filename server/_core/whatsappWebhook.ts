/**
 * WhatsApp Webhook Handler
 * Receives and processes incoming messages from Meta WhatsApp Cloud API
 */

import { eq } from "drizzle-orm";
import {
  getOrCreateWhatsappConversation,
  createWhatsappMessage,
  logWhatsappWebhook,
  markWhatsappWebhookProcessed,
} from "../db";
import { getDb } from "../db";
import { whatsappMessages } from "../../drizzle/schema";

// In-memory dedup — survives DB failures; holds last 2000 message IDs
const _processedMessageIds = new Set<string>();
function isDuplicateMessage(metaId: string): boolean {
  if (_processedMessageIds.has(metaId)) return true;
  _processedMessageIds.add(metaId);
  if (_processedMessageIds.size > 2000) {
    const first = _processedMessageIds.values().next().value;
    if (first !== undefined) _processedMessageIds.delete(first);
  }
  return false;
}
import { validateWhatsAppWebhookSignature } from "./whatsappService";

interface MetaWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
  };
  document?: {
    id: string;
    mime_type: string;
    filename: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  video?: {
    id: string;
    mime_type: string;
  };
}

interface MetaWebhookStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data: {
      messaging_product: string;
      details: string;
    };
  }>;
}

interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      messages?: MetaWebhookMessage[];
      statuses?: MetaWebhookStatus[];
    };
    field: string;
  }>;
}

interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

/**
 * Process incoming webhook from Meta
 */
export async function processWhatsAppWebhook(
  payload: MetaWebhookPayload,
  dealershipId: number
): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Log webhook for debugging
    const webhookLog = await logWhatsappWebhook({
      dealershipId,
      eventType: "webhook_received",
      payload: payload as any,
    });

    // Process each entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Process incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            try {
              await processIncomingMessage(message, dealershipId, value.metadata.phone_number_id);
              processed++;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Unknown error";
              console.error("[WhatsAppWebhook] Error processing message:", errorMsg);
              errors.push(`Message ${message.id}: ${errorMsg}`);
            }
          }
        }

        // Process message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            try {
              await processStatusUpdate(status, dealershipId);
              processed++;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Unknown error";
              console.error("[WhatsAppWebhook] Error processing status:", errorMsg);
              errors.push(`Status ${status.id}: ${errorMsg}`);
            }
          }
        }
      }
    }

    // Mark webhook as processed
    await markWhatsappWebhookProcessed(webhookLog.id, errors.length > 0 ? errors.join("; ") : undefined);

    return {
      success: errors.length === 0,
      processed,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsAppWebhook] Error processing webhook:", errorMsg);
    return {
      success: false,
      processed: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Process incoming message from customer
 */
async function processIncomingMessage(
  message: MetaWebhookMessage,
  dealershipId: number,
  phoneNumberId: string
): Promise<void> {
  const customerPhone = message.from;

  // Deduplicate: skip if we've already processed this Meta message ID.
  // Uses in-memory Set so it always works even when DB is unavailable.
  if (message.id && isDuplicateMessage(message.id)) {
    console.log(`[WhatsAppWebhook] Skipping duplicate message ${message.id}`);
    return;
  }

  // Get or create conversation
  const conversation = await getOrCreateWhatsappConversation(dealershipId, customerPhone);

  // Determine message type and content
  let messageType: "text" | "image" | "document" | "audio" | "video" = "text";
  let content = "";
  let mediaUrl: string | undefined;

  if (message.text) {
    messageType = "text";
    content = message.text.body;
  } else if (message.image) {
    messageType = "image";
    content = `[Image: ${message.image.id}]`;
    mediaUrl = await getMediaUrl(message.image.id, phoneNumberId);
  } else if (message.document) {
    messageType = "document";
    content = `[Document: ${message.document.filename}]`;
    mediaUrl = await getMediaUrl(message.document.id, phoneNumberId);
  } else if (message.audio) {
    messageType = "audio";
    content = `[Audio message]`;
    mediaUrl = await getMediaUrl(message.audio.id, phoneNumberId);
  } else if (message.video) {
    messageType = "video";
    content = `[Video message]`;
    mediaUrl = await getMediaUrl(message.video.id, phoneNumberId);
  }

  // Store inbound once here (with Meta message id). Reply handler must not re-persist.
  await createWhatsappMessage({
    conversationId: conversation.id,
    direction: "inbound",
    messageType,
    content,
    mediaUrl,
    metaMessageId: message.id,
    status: "delivered",
  });

  console.log(
    `[WhatsAppWebhook] Received ${messageType} from +${customerPhone}: ${content.substring(0, 50)}...`
  );

  // For text messages, generate and send auto-response.
  // Inbound row was already stored above — skip a second persist.
  if (messageType === "text") {
    try {
      const { handleIncomingWhatsAppMessage } = await import("./whatsappService");
      await handleIncomingWhatsAppMessage(customerPhone, content, dealershipId.toString(), {
        alreadyPersisted: true,
        phoneNumberId,
      });
    } catch (error) {
      console.error("[WhatsAppWebhook] Error generating auto-response:", error);
    }
  }
}

/**
 * Process message status update
 */
async function processStatusUpdate(
  status: MetaWebhookStatus,
  dealershipId: number
): Promise<void> {
  // Status updates are tracked for delivery confirmation
  // In production, you might want to update the message status in the database
  console.log(
    `[WhatsAppWebhook] Message ${status.id} status: ${status.status} (to ${status.recipient_id})`
  );

  if (status.errors) {
    console.error("[WhatsAppWebhook] Message delivery error:", status.errors);
  }
}

/**
 * Get media URL from Meta
 * Requires making an API call to download the media
 */
async function getMediaUrl(mediaId: string, phoneNumberId: string): Promise<string | undefined> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!accessToken) return undefined;

    const url = `https://graph.facebook.com/v22.0/${mediaId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn("[WhatsAppWebhook] Failed to get media URL:", response.status);
      return undefined;
    }

    const data = (await response.json()) as { url?: string };
    return data.url;
  } catch (error) {
    console.error("[WhatsAppWebhook] Error getting media URL:", error);
    return undefined;
  }
}

/**
 * Verify webhook token (for Meta webhook setup)
 */
export function verifyWebhookToken(token: string): boolean {
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "grayarx_whatsapp_webhook_verify";
  return token === expectedToken;
}

/**
 * Validate webhook signature from Meta
 */
export function validateWebhookSignature(
  signature: string,
  payload: string
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // Allow local/dev without Meta secrets; production must set WHATSAPP_APP_SECRET.
    if (process.env.NODE_ENV === "production") {
      console.warn("[WhatsAppWebhook] WHATSAPP_APP_SECRET not configured — rejecting");
      return false;
    }
    console.warn("[WhatsAppWebhook] WHATSAPP_APP_SECRET not configured — skipping signature check (non-production)");
    return true;
  }

  return validateWhatsAppWebhookSignature(signature, payload, appSecret);
}
