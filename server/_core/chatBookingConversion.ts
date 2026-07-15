/**
 * Mark Nala/WhatsApp/webchat conversations that convert into a test-drive booking.
 *
 * Why: agents learn from outcome_success rows in agent_activity. Without this,
 * we log booking_received but never tag the chat as a win — so memory cannot
 * prefer reply patterns that actually convert.
 *
 * POPIA: payload never stores name, phone, email, or message body — only ids,
 * channel, and booking reference.
 */
import { recordOutcome } from "./agentMemory";
import { getDb } from "../db";
import { chatbotConversations, whatsappConversations } from "../../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { markTestDriveBooked } from "./chatbotDeploymentService";

export type ChatBookingChannel = "website" | "whatsapp" | "call" | "web_chat";

export type MarkChatBookingConversionInput = {
  dealershipId: number;
  referenceNumber: string;
  channel: ChatBookingChannel;
  /** Numeric test_drive_bookings.id when available */
  bookingId?: number | null;
  /** Existing WhatsApp / chatbot conversation id when the caller already has it */
  conversationId?: number | null;
  /**
   * Contact used only to look up an open conversation. Never written to
   * agent_activity / outcome payloads.
   */
  customerContact?: string | null;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function contactMatches(stored: string | null | undefined, contact: string, digits: string): boolean {
  if (!stored) return false;
  if (stored === contact) return true;
  if (!digits) return false;
  const storedDigits = digitsOnly(stored);
  if (!storedDigits) return false;
  return storedDigits.endsWith(digits) || digits.endsWith(storedDigits);
}

/**
 * Best-effort: find a chatbot_conversations row for this dealership + contact.
 */
async function findChatbotConversationId(
  dealershipId: number,
  contact: string,
  channel: ChatBookingChannel,
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const digits = digitsOnly(contact);
  if (!digits && !contact.trim()) return null;

  const chatbotType = channel === "whatsapp" ? "whatsapp" : "web";
  const rows = await db
    .select({
      id: chatbotConversations.id,
      customerId: chatbotConversations.customerId,
      customerPhone: chatbotConversations.customerPhone,
    })
    .from(chatbotConversations)
    .where(
      and(
        eq(chatbotConversations.dealershipId, dealershipId),
        eq(chatbotConversations.chatbotType, chatbotType),
      ),
    )
    .orderBy(desc(chatbotConversations.updatedAt))
    .limit(40);

  for (const row of rows) {
    if (
      contactMatches(row.customerPhone, contact, digits) ||
      contactMatches(row.customerId, contact, digits)
    ) {
      return row.id;
    }
  }
  return null;
}

/**
 * Best-effort: find a WhatsApp conversation id (for payload linking only).
 */
async function findWhatsappConversationId(
  dealershipId: number,
  phone: string,
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const digits = digitsOnly(phone);
  if (!digits) return null;

  const rows = await db
    .select({
      id: whatsappConversations.id,
      phoneNumber: whatsappConversations.phoneNumber,
    })
    .from(whatsappConversations)
    .where(eq(whatsappConversations.dealershipId, dealershipId))
    .orderBy(desc(whatsappConversations.lastMessageAt))
    .limit(40);

  for (const row of rows) {
    if (contactMatches(row.phoneNumber, phone, digits)) {
      return row.id;
    }
  }
  return null;
}

/**
 * Record that a chat-originated booking succeeded.
 * Safe to call fire-and-forget; never throws to callers.
 */
export async function markNalaChatBookingConversion(
  input: MarkChatBookingConversionInput,
): Promise<void> {
  try {
    const chatChannels: ChatBookingChannel[] = ["whatsapp", "web_chat"];
    const isChatOrigin =
      chatChannels.includes(input.channel) || Boolean(input.conversationId);

    const contact = input.customerContact?.trim() || null;
    let conversationId = input.conversationId ?? null;
    let chatbotConversationId: number | null = null;

    if (contact && isChatOrigin) {
      chatbotConversationId = await findChatbotConversationId(
        input.dealershipId,
        contact,
        input.channel,
      );
      if (!conversationId) {
        if (input.channel === "whatsapp") {
          conversationId = await findWhatsappConversationId(input.dealershipId, contact);
        }
        conversationId = conversationId ?? chatbotConversationId;
      }
      if (!chatbotConversationId && conversationId == null) {
        // website handoff after web chat may still have a chatbot row
        chatbotConversationId = await findChatbotConversationId(
          input.dealershipId,
          contact,
          "web_chat",
        );
      }
    }

    const detail = [
      `ref ${input.referenceNumber}`,
      `channel ${input.channel}`,
      `dealership ${input.dealershipId}`,
      input.bookingId != null && input.bookingId > 0 ? `bookingId ${input.bookingId}` : null,
      conversationId != null ? `conversationId ${conversationId}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    await recordOutcome({
      agentId: "booking",
      relatedAction: "chat_to_booking",
      outcome: "success",
      detail,
    });

    if (isChatOrigin) {
      await recordOutcome({
        agentId: "whatsapp",
        relatedAction: "chat_to_booking",
        outcome: "success",
        detail,
      });
    }

    // Existing schema flag — only for chatbot_conversations rows.
    const flagId = chatbotConversationId;
    if (flagId != null && input.bookingId != null && input.bookingId > 0) {
      try {
        await markTestDriveBooked(flagId, input.bookingId);
      } catch (err) {
        console.warn("[chatBookingConversion] testDriveBooked flag failed:", err);
      }
    }
  } catch (err) {
    console.warn("[chatBookingConversion] mark failed (non-fatal):", err);
  }
}
