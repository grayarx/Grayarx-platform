/**
 * SMS Webhook Handler
 * Processes incoming SMS messages from Twilio
 */

import { createHmac } from "crypto";
import type { Request, Response } from "express";
// Database operations handled by db helpers
import { getOrCreateWhatsappConversation, createWhatsappMessage, updateWhatsappMessageStatus } from "../db";

interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MessageStatus?: string;
  [key: string]: string | undefined;
}

/**
 * Validate Twilio webhook signature
 * Ensures the webhook came from Twilio
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  // Sort params and create data string
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  // Create HMAC-SHA1 signature
  const hash = createHmac("sha1", authToken).update(data).digest("base64");

  return hash === signature;
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If starts with 27 (SA), keep as is
  if (digits.startsWith("27")) {
    return `+${digits}`;
  }

  // If starts with 0 (local SA), convert to 27
  if (digits.startsWith("0")) {
    return `+27${digits.slice(1)}`;
  }

  // Otherwise assume international format
  return `+${digits}`;
}

/**
 * Process incoming SMS message
 */
export async function processIncomingSMS(payload: TwilioWebhookPayload): Promise<void> {
  try {
    const customerPhone = normalizePhone(payload.From);
    const dealershipPhone = normalizePhone(payload.To);
    const messageContent = payload.Body || "";
    const messageSid = payload.MessageSid;

    // Find dealership by phone number
    // TODO: Implement dealership lookup by phone
    const dealershipId = 1; // Placeholder

    // Get or create conversation
    const conversation = await getOrCreateWhatsappConversation(dealershipId, customerPhone);

    // Store incoming message
    const message = await createWhatsappMessage({
      conversationId: conversation.id,
      direction: "inbound",
      messageType: "text",
      content: messageContent,
      metaMessageId: messageSid,
      status: "delivered",
    });

    console.log(`[SMS Webhook] Stored incoming message from ${customerPhone}: "${messageContent.substring(0, 50)}..."`);

    // TODO: Trigger auto-response or agent notification
  } catch (error) {
    console.error("[SMS Webhook] Error processing incoming message:", error);
    throw error;
  }
}

/**
 * Process message status update
 */
export async function processMessageStatus(payload: TwilioWebhookPayload): Promise<void> {
  try {
    const messageSid = payload.MessageSid;
    const status = payload.MessageStatus;

    if (!status) return;

    // Find message by Twilio SID
    // TODO: Implement lookup
    console.log(`[SMS Webhook] Message ${messageSid} status: ${status}`);

    // Map Twilio status to our status
    const statusMap: Record<string, "sent" | "delivered" | "failed" | "read"> = {
      queued: "sent",
      sending: "sent",
      sent: "sent",
      delivered: "delivered",
      failed: "failed",
      undelivered: "failed",
      read: "read",
    };

    const mappedStatus = statusMap[status] || "sent";

    // TODO: Update message status in database
    console.log(`[SMS Webhook] Updated message status to: ${mappedStatus}`);
  } catch (error) {
    console.error("[SMS Webhook] Error processing status update:", error);
    throw error;
  }
}

/**
 * Express middleware for SMS webhook
 */
export function createSMSWebhookHandler() {
  return async (req: Request, res: Response) => {
    try {
      // Get Twilio auth token from environment
      const authToken = process.env.TWILIO_API_KEY;
      if (!authToken) {
        console.warn("[SMS Webhook] TWILIO_API_KEY not configured");
        return res.status(400).json({ error: "Twilio not configured" });
      }

      // Validate signature
      const signature = req.headers["x-twilio-signature"] as string;
      if (!signature) {
        console.warn("[SMS Webhook] Missing X-Twilio-Signature header");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const url = `${process.env.WEBHOOK_URL || "https://yourdomain.com"}/api/webhooks/sms`;
      const isValid = validateTwilioSignature(url, req.body, signature, authToken);

      if (!isValid) {
        console.warn("[SMS Webhook] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Process webhook
      const payload = req.body as TwilioWebhookPayload;

      if (payload.MessageStatus) {
        // Status update
        await processMessageStatus(payload);
      } else if (payload.Body) {
        // Incoming message
        await processIncomingSMS(payload);
      }

      // Return 200 OK to acknowledge receipt
      res.status(200).send("");
    } catch (error) {
      console.error("[SMS Webhook] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Webhook verification handler
 * Twilio sends GET request to verify webhook URL
 */
export function createSMSWebhookVerificationHandler() {
  return (req: Request, res: Response) => {
    try {
      // Get Twilio auth token from environment
      const authToken = process.env.TWILIO_API_KEY;
      if (!authToken) {
        console.warn("[SMS Webhook] TWILIO_API_KEY not configured");
        return res.status(400).send("Twilio not configured");
      }

      // Get signature from header
      const signature = req.headers["x-twilio-signature"] as string;
      if (!signature) {
        console.warn("[SMS Webhook] Missing X-Twilio-Signature header");
        return res.status(401).send("Invalid signature");
      }

      // Validate signature
      const url = `${process.env.WEBHOOK_URL || "https://yourdomain.com"}/api/webhooks/sms`;
      const isValid = validateTwilioSignature(url, req.query as Record<string, string>, signature, authToken);

      if (!isValid) {
        console.warn("[SMS Webhook] Invalid signature on verification");
        return res.status(401).send("Invalid signature");
      }

      console.log("[SMS Webhook] Verification successful");
      res.status(200).send("OK");
    } catch (error) {
      console.error("[SMS Webhook] Verification error:", error);
      res.status(500).send("Internal server error");
    }
  };
}

/**
 * Test webhook handler
 * For testing webhook processing without Twilio
 */
export async function testSMSWebhook(payload: Partial<TwilioWebhookPayload>): Promise<void> {
  const fullPayload: TwilioWebhookPayload = {
    MessageSid: payload.MessageSid || "SM1234567890abcdef",
    AccountSid: payload.AccountSid || "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    From: payload.From || "+27821234567",
    To: payload.To || "+27821234567",
    Body: payload.Body || "Test message",
    NumMedia: payload.NumMedia || "0",
    ...payload,
  };

  if (fullPayload.MessageStatus) {
    await processMessageStatus(fullPayload);
  } else if (fullPayload.Body) {
    await processIncomingSMS(fullPayload);
  }
}
