/**
 * Chatbot Conversation Management Service
 * Handles conversation context, memory, and state management
 */

import { SupportedLanguage } from "./chatbotLanguageService";

export interface ConversationContext {
  sessionId: string;
  language: SupportedLanguage;
  userId?: string;
  dealershipName?: string;
  vehicleType?: string;
  currentIntent?: string;
  sentiment?: "positive" | "neutral" | "negative" | "frustrated";
  messageCount: number;
  startedAt: Date;
  lastMessageAt: Date;
  entities: Record<string, string>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  language: SupportedLanguage;
}

/**
 * In-memory conversation store (in production, use Redis or database)
 */
const conversationStore = new Map<string, ConversationContext>();
const messageStore = new Map<string, Message[]>();

/**
 * Create a new conversation session
 */
export function createConversation(
  sessionId: string,
  language: SupportedLanguage,
  userId?: string
): ConversationContext {
  const context: ConversationContext = {
    sessionId,
    language,
    userId,
    messageCount: 0,
    startedAt: new Date(),
    lastMessageAt: new Date(),
    entities: {},
  };

  conversationStore.set(sessionId, context);
  messageStore.set(sessionId, []);

  return context;
}

/**
 * Get conversation context
 */
export function getConversation(sessionId: string): ConversationContext | null {
  return conversationStore.get(sessionId) || null;
}

/**
 * Update conversation context
 */
export function updateConversation(
  sessionId: string,
  updates: Partial<ConversationContext>
): ConversationContext | null {
  const context = conversationStore.get(sessionId);
  if (!context) return null;

  const updated = { ...context, ...updates, lastMessageAt: new Date() };
  conversationStore.set(sessionId, updated);

  return updated;
}

/**
 * Add message to conversation history
 */
export function addMessage(
  sessionId: string,
  message: Omit<Message, "id" | "timestamp">
): Message | null {
  const conversation = getConversation(sessionId);
  if (!conversation) return null;

  const newMessage: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...message,
    timestamp: new Date(),
  };

  const messages = messageStore.get(sessionId) || [];
  messages.push(newMessage);
  messageStore.set(sessionId, messages);

  // Update conversation message count
  updateConversation(sessionId, { messageCount: messages.length });

  return newMessage;
}

/**
 * Get conversation history
 */
export function getConversationHistory(sessionId: string, limit: number = 10): Message[] {
  const messages = messageStore.get(sessionId) || [];
  return messages.slice(-limit);
}

/**
 * Extract entities from user message (dealership name, vehicle type, etc.)
 */
export function extractEntities(text: string): Record<string, string> {
  const entities: Record<string, string> = {};

  // Simple entity extraction patterns
  const patterns = {
    dealershipName: /(?:dealership|dealer|company|business)[\s:]*([A-Z][a-zA-Z\s&]+)/i,
    vehicleType: /(?:car|vehicle|truck|sedan|suv|model)[\s:]*([A-Z][a-zA-Z0-9\s-]+)/i,
    location: /(?:in|at|from|located)[\s:]*([A-Z][a-zA-Z\s]+)/i,
    phone: /(?:\+27|0)[0-9]{9}/,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      entities[key] = match[1].trim();
    }
  }

  return entities;
}

/**
 * Detect user intent from message
 */
export function detectIntent(text: string): string {
  const lowerText = text.toLowerCase();

  const intents: Record<string, string[]> = {
    pricing: ["price", "cost", "how much", "fee", "subscription", "plan", "affordable"],
    features: ["feature", "capability", "function", "what can", "does it", "support"],
    onboarding: ["start", "setup", "install", "begin", "get started", "onboard", "join"],
    support: ["help", "issue", "problem", "error", "bug", "broken", "not working"],
    integration: ["integrate", "connect", "sync", "api", "third party", "plugin"],
    demo: ["demo", "show", "example", "trial", "test", "see"],
    pilot: ["pilot", "early access", "beta", "limited", "5 dealerships"],
  };

  for (const [intent, keywords] of Object.entries(intents)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return intent;
      }
    }
  }

  return "general";
}

/**
 * Analyze sentiment of user message
 */
export function analyzeSentiment(text: string): "positive" | "neutral" | "negative" | "frustrated" {
  const lowerText = text.toLowerCase();

  const positiveWords = ["great", "good", "excellent", "amazing", "love", "perfect", "thanks", "thank you", "helpful"];
  const negativeWords = ["bad", "poor", "terrible", "awful", "hate", "useless", "broken", "not working"];
  const frustratedWords = ["frustrated", "angry", "upset", "annoyed", "fed up", "why", "still", "not"];

  let positiveScore = 0;
  let negativeScore = 0;
  let frustratedScore = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveScore++;
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeScore++;
  }

  for (const word of frustratedWords) {
    if (lowerText.includes(word)) frustratedScore++;
  }

  if (frustratedScore > 0) return "frustrated";
  if (negativeScore > positiveScore) return "negative";
  if (positiveScore > 0) return "positive";

  return "neutral";
}

/**
 * Build context summary for LLM
 */
export function buildContextSummary(sessionId: string): string {
  const conversation = getConversation(sessionId);
  if (!conversation) return "";

  const parts: string[] = [];

  if (conversation.dealershipName) {
    parts.push(`Dealership: ${conversation.dealershipName}`);
  }

  if (conversation.vehicleType) {
    parts.push(`Vehicle Interest: ${conversation.vehicleType}`);
  }

  if (conversation.currentIntent) {
    parts.push(`Current Topic: ${conversation.currentIntent}`);
  }

  if (conversation.sentiment && conversation.sentiment !== "neutral") {
    parts.push(`User Sentiment: ${conversation.sentiment}`);
  }

  if (Object.keys(conversation.entities).length > 0) {
    parts.push(`Known Information: ${JSON.stringify(conversation.entities)}`);
  }

  return parts.length > 0 ? `\nContext: ${parts.join(", ")}` : "";
}

/**
 * Check if conversation should be escalated
 */
export function shouldEscalate(sessionId: string): boolean {
  const conversation = getConversation(sessionId);
  if (!conversation) return false;

  // Escalate if user is frustrated
  if (conversation.sentiment === "frustrated") return true;

  // Escalate if conversation is too long without resolution
  if (conversation.messageCount > 20) return true;

  // Escalate if user explicitly asks for human support
  const messages = getConversationHistory(sessionId, 1);
  if (messages.length > 0) {
    const lastMessage = messages[0].content.toLowerCase();
    if (
      lastMessage.includes("human") ||
      lastMessage.includes("agent") ||
      lastMessage.includes("support") ||
      lastMessage.includes("person")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Clear conversation (for testing or privacy)
 */
export function clearConversation(sessionId: string): boolean {
  conversationStore.delete(sessionId);
  messageStore.delete(sessionId);
  return true;
}

/**
 * Get all active conversations (for admin/monitoring)
 */
export function getActiveConversations(): ConversationContext[] {
  return Array.from(conversationStore.values());
}

/**
 * Get conversation statistics
 */
export function getConversationStats(): {
  totalConversations: number;
  averageMessageCount: number;
  languageDistribution: Record<SupportedLanguage, number>;
  sentimentDistribution: Record<string, number>;
} {
  const conversations = Array.from(conversationStore.values());

  const languageDistribution: Record<SupportedLanguage, number> = {
    en: 0,
    af: 0,
    zu: 0,
    xh: 0,
    st: 0,
    tn: 0,
    ve: 0,
  };

  const sentimentDistribution: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
    frustrated: 0,
  };

  let totalMessages = 0;

  for (const conv of conversations) {
    languageDistribution[conv.language]++;
    if (conv.sentiment) {
      sentimentDistribution[conv.sentiment]++;
    }
    totalMessages += conv.messageCount;
  }

  return {
    totalConversations: conversations.length,
    averageMessageCount: conversations.length > 0 ? totalMessages / conversations.length : 0,
    languageDistribution,
    sentimentDistribution,
  };
}
