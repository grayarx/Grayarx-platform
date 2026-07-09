import { getDb } from "../db";
import { chatbotDeployments, chatbotConversations, chatbotMessages } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Chatbot Deployment Service
 * Manages chatbot configuration, deployment options, and conversation tracking
 */

export interface ChatbotConfig {
  deploymentType: "web" | "whatsapp" | "both";
  webChatbotEnabled: boolean;
  webChatbotLanguages: string[];
  webChatbotPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  webChatbotTheme: "dark" | "light" | "custom";
  whatsappChatbotEnabled: boolean;
  whatsappPhoneNumber?: string;
  whatsappBusinessAccountId?: string;
  autoRespondEnabled: boolean;
  businessHoursOnly: boolean;
  offHoursMessage?: string;
}

/**
 * Get chatbot deployment configuration for a dealership
 */
export async function getChatbotDeployment(dealershipId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const deployment = await db
    .select()
    .from(chatbotDeployments)
    .where(eq(chatbotDeployments.dealershipId, dealershipId))
    .limit(1);

  return deployment[0] || null;
}

/**
 * Create or update chatbot deployment configuration
 */
export async function upsertChatbotDeployment(dealershipId: number, config: Partial<ChatbotConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const existing = await getChatbotDeployment(dealershipId);

  if (existing) {
    const updated = await db
      .update(chatbotDeployments)
      .set({
        deploymentType: config.deploymentType || existing.deploymentType,
        webChatbotEnabled: config.webChatbotEnabled !== undefined ? (config.webChatbotEnabled ? 1 : 0) : existing.webChatbotEnabled,
        webChatbotLanguages: config.webChatbotLanguages ? JSON.stringify(config.webChatbotLanguages) : existing.webChatbotLanguages,
        webChatbotPosition: config.webChatbotPosition || existing.webChatbotPosition,
        webChatbotTheme: config.webChatbotTheme || existing.webChatbotTheme,
        whatsappChatbotEnabled: config.whatsappChatbotEnabled !== undefined ? (config.whatsappChatbotEnabled ? 1 : 0) : existing.whatsappChatbotEnabled,
        whatsappPhoneNumber: config.whatsappPhoneNumber || existing.whatsappPhoneNumber,
        whatsappBusinessAccountId: config.whatsappBusinessAccountId || existing.whatsappBusinessAccountId,
        autoRespondEnabled: config.autoRespondEnabled !== undefined ? (config.autoRespondEnabled ? 1 : 0) : existing.autoRespondEnabled,
        businessHoursOnly: config.businessHoursOnly !== undefined ? (config.businessHoursOnly ? 1 : 0) : existing.businessHoursOnly,
        offHoursMessage: config.offHoursMessage || existing.offHoursMessage,
      })
      .where(eq(chatbotDeployments.dealershipId, dealershipId));

    return getChatbotDeployment(dealershipId);
  } else {
    await db.insert(chatbotDeployments).values({
      dealershipId,
      deploymentType: (config.deploymentType || "web") as any,
      webChatbotEnabled: config.webChatbotEnabled !== false ? 1 : 0,
      webChatbotLanguages: config.webChatbotLanguages ? JSON.stringify(config.webChatbotLanguages) : JSON.stringify(["en"]),
      webChatbotPosition: (config.webChatbotPosition || "bottom-right") as any,
      webChatbotTheme: (config.webChatbotTheme || "dark") as any,
      whatsappChatbotEnabled: config.whatsappChatbotEnabled ? 1 : 0,
      whatsappPhoneNumber: config.whatsappPhoneNumber,
      whatsappBusinessAccountId: config.whatsappBusinessAccountId,
      autoRespondEnabled: config.autoRespondEnabled !== false ? 1 : 0,
      businessHoursOnly: config.businessHoursOnly ? 1 : 0,
      offHoursMessage: config.offHoursMessage,
    });

    return getChatbotDeployment(dealershipId);
  }
}

/**
 * Get or create a conversation
 */
export async function getOrCreateConversation(
  dealershipId: number,
  chatbotType: "web" | "whatsapp",
  customerId: string,
  customerInfo?: { name?: string; email?: string; phone?: string; language?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const existing = await db
    .select()
    .from(chatbotConversations)
    .where(and(eq(chatbotConversations.dealershipId, dealershipId), eq(chatbotConversations.customerId, customerId), eq(chatbotConversations.chatbotType, chatbotType)))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const result = await db.insert(chatbotConversations).values({
    dealershipId,
    chatbotType,
    customerId,
    customerName: customerInfo?.name,
    customerEmail: customerInfo?.email,
    customerPhone: customerInfo?.phone,
    language: (customerInfo?.language || "en") as any,
  });

  return db
    .select()
    .from(chatbotConversations)
    .where(eq(chatbotConversations.dealershipId, dealershipId))
    .orderBy((t) => t.id)
    .limit(1);
}

/**
 * Add a message to a conversation
 */
export async function addChatbotMessage(
  conversationId: number,
  dealershipId: number,
  role: "customer" | "chatbot" | "agent",
  content: string,
  messageType: "text" | "image" | "document" | "location" | "quick_reply" = "text",
  metadata?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.insert(chatbotMessages).values({
    conversationId,
    dealershipId,
    role,
    messageType: messageType as any,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  // Update conversation's last message and message count
  const conversation = await db.select().from(chatbotConversations).where(eq(chatbotConversations.id, conversationId)).limit(1);

  if (conversation[0]) {
    await db
      .update(chatbotConversations)
      .set({
        lastMessage: content,
        messageCount: (conversation[0].messageCount || 0) + 1,
      })
      .where(eq(chatbotConversations.id, conversationId));
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db.select().from(chatbotMessages).where(eq(chatbotMessages.conversationId, conversationId));
}

/**
 * Track inventory view in conversation
 */
export async function trackInventoryView(conversationId: number, vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const conversation = await db.select().from(chatbotConversations).where(eq(chatbotConversations.id, conversationId)).limit(1);

  if (conversation[0]) {
    const viewed = (conversation[0].inventoryViewed as any) || [];
    if (!viewed.includes(vehicleId)) {
      viewed.push(vehicleId);
      await db
        .update(chatbotConversations)
        .set({
          inventoryViewed: JSON.stringify(viewed),
        })
        .where(eq(chatbotConversations.id, conversationId));
    }
  }
}

/**
 * Mark test drive as booked in conversation
 */
export async function markTestDriveBooked(conversationId: number, testDriveId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(chatbotConversations)
    .set({
      testDriveBooked: 1,
      testDriveId,
    })
    .where(eq(chatbotConversations.id, conversationId));
}

/**
 * Mark pre-approval as submitted in conversation
 */
export async function markPreApprovalSubmitted(conversationId: number, preApprovalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(chatbotConversations)
    .set({
      preApprovalSubmitted: 1,
      preApprovalId,
    })
    .where(eq(chatbotConversations.id, conversationId));
}

/**
 * Get chatbot analytics for a dealership
 */
export async function getChatbotAnalytics(dealershipId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const deployment = await getChatbotDeployment(dealershipId);
  if (!deployment) {
    return null;
  }

  const conversations = await db
    .select()
    .from(chatbotConversations)
    .where(eq(chatbotConversations.dealershipId, dealershipId));

  const webConversations = conversations.filter((c) => c.chatbotType === "web").length;
  const whatsappConversations = conversations.filter((c) => c.chatbotType === "whatsapp").length;
  const testDrivesBooked = conversations.filter((c) => c.testDriveBooked).length;
  const preApprovalsSubmitted = conversations.filter((c) => c.preApprovalSubmitted).length;

  return {
    totalConversations: conversations.length,
    webConversations,
    whatsappConversations,
    testDrivesBooked,
    preApprovalsSubmitted,
    conversionRate: conversations.length > 0 ? ((testDrivesBooked + preApprovalsSubmitted) / conversations.length) * 100 : 0,
    averageMessagesPerConversation: conversations.length > 0 ? conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0) / conversations.length : 0,
  };
}

/**
 * Close a conversation
 */
export async function closeConversation(conversationId: number, status: "completed" | "abandoned" = "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(chatbotConversations)
    .set({
      conversationStatus: status as any,
    })
    .where(eq(chatbotConversations.id, conversationId));
}
