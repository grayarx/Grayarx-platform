/**
 * Advanced Conversation Memory Service
 * Manages conversation context, history, and persistence
 */

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  language: string;
  startTime: number;
  lastActivityTime: number;
  messages: ConversationMessage[];
  entities: Record<string, string>;
  currentIntent?: string;
  sentiment?: string;
  metadata: Record<string, any>;
  tags: string[];
  summary?: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  intent?: string;
  sentiment?: string;
  entities?: Array<{ type: string; value: string }>;
  metadata?: Record<string, any>;
}

export interface ConversationSummary {
  sessionId: string;
  duration: number;
  messageCount: number;
  mainTopics: string[];
  resolution: "resolved" | "escalated" | "abandoned";
  satisfactionScore?: number;
  summary: string;
}

/**
 * In-memory conversation store (production: use Redis/database)
 */
class ConversationMemoryStore {
  private conversations: Map<string, ConversationContext> = new Map();
  private maxContextSize = 50; // Keep last 50 messages in context
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  createConversation(sessionId: string, userId: string | undefined, language: string): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      userId,
      language,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      messages: [],
      entities: {},
      metadata: {},
      tags: [],
    };

    this.conversations.set(sessionId, context);
    return context;
  }

  getConversation(sessionId: string): ConversationContext | undefined {
    const context = this.conversations.get(sessionId);
    if (context) {
      // Check if session expired
      if (Date.now() - context.lastActivityTime > this.sessionTimeout) {
        this.conversations.delete(sessionId);
        return undefined;
      }
      context.lastActivityTime = Date.now();
    }
    return context;
  }

  addMessage(sessionId: string, message: ConversationMessage): void {
    const context = this.getConversation(sessionId);
    if (!context) return;

    context.messages.push(message);

    // Keep only last N messages in memory
    if (context.messages.length > this.maxContextSize) {
      context.messages = context.messages.slice(-this.maxContextSize);
    }

    context.lastActivityTime = Date.now();
  }

  updateEntities(sessionId: string, entities: Record<string, string>): void {
    const context = this.getConversation(sessionId);
    if (!context) return;

    context.entities = { ...context.entities, ...entities };
    context.lastActivityTime = Date.now();
  }

  updateMetadata(sessionId: string, metadata: Record<string, any>): void {
    const context = this.getConversation(sessionId);
    if (!context) return;

    context.metadata = { ...context.metadata, ...metadata };
    context.lastActivityTime = Date.now();
  }

  addTag(sessionId: string, tag: string): void {
    const context = this.getConversation(sessionId);
    if (!context) return;

    if (!context.tags.includes(tag)) {
      context.tags.push(tag);
    }
  }

  getMessages(sessionId: string, limit?: number): ConversationMessage[] {
    const context = this.getConversation(sessionId);
    if (!context) return [];

    if (limit) {
      return context.messages.slice(-limit);
    }
    return context.messages;
  }

  getContext(sessionId: string): ConversationContext | undefined {
    return this.getConversation(sessionId);
  }

  deleteConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  getAllConversations(): ConversationContext[] {
    return Array.from(this.conversations.values());
  }

  getActiveConversations(): ConversationContext[] {
    const now = Date.now();
    return Array.from(this.conversations.values()).filter(
      (c) => now - c.lastActivityTime < this.sessionTimeout
    );
  }

  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, context] of this.conversations.entries()) {
      if (now - context.lastActivityTime > this.sessionTimeout) {
        this.conversations.delete(sessionId);
      }
    }
  }
}

// Global memory store
const memoryStore = new ConversationMemoryStore();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  memoryStore.cleanup();
}, 5 * 60 * 1000);

/**
 * Create new conversation
 */
export function createConversation(
  sessionId: string,
  userId: string | undefined,
  language: string
): ConversationContext {
  return memoryStore.createConversation(sessionId, userId, language);
}

/**
 * Get conversation context
 */
export function getConversation(sessionId: string): ConversationContext | undefined {
  return memoryStore.getConversation(sessionId);
}

/**
 * Add message to conversation
 */
export function addMessage(sessionId: string, message: ConversationMessage): void {
  memoryStore.addMessage(sessionId, message);
}

/**
 * Update conversation entities
 */
export function updateEntities(sessionId: string, entities: Record<string, string>): void {
  memoryStore.updateEntities(sessionId, entities);
}

/**
 * Update conversation metadata
 */
export function updateMetadata(sessionId: string, metadata: Record<string, any>): void {
  memoryStore.updateMetadata(sessionId, metadata);
}

/**
 * Add tag to conversation
 */
export function addTag(sessionId: string, tag: string): void {
  memoryStore.addTag(sessionId, tag);
}

/**
 * Get conversation messages
 */
export function getMessages(sessionId: string, limit?: number): ConversationMessage[] {
  return memoryStore.getMessages(sessionId, limit);
}

/**
 * Get conversation context for LLM
 */
export function getContextForLLM(sessionId: string): string {
  const context = getConversation(sessionId);
  if (!context) return "";

  let contextStr = "";

  // Add entities
  if (Object.keys(context.entities).length > 0) {
    contextStr += "Known information:\n";
    for (const [key, value] of Object.entries(context.entities)) {
      contextStr += `- ${key}: ${value}\n`;
    }
    contextStr += "\n";
  }

  // Add recent message history
  const recentMessages = context.messages.slice(-5);
  if (recentMessages.length > 0) {
    contextStr += "Recent conversation:\n";
    for (const msg of recentMessages) {
      contextStr += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
    }
  }

  return contextStr;
}

/**
 * Generate conversation summary
 */
export function generateSummary(sessionId: string): ConversationSummary | undefined {
  const context = getConversation(sessionId);
  if (!context) return undefined;

  const duration = Date.now() - context.startTime;
  const messageCount = context.messages.length;

  // Extract main topics from intents
  const intents = new Set<string>();
  for (const msg of context.messages) {
    if (msg.intent) {
      intents.add(msg.intent);
    }
  }

  // Generate text summary
  let summaryText = `Conversation about ${Array.from(intents).join(", ") || "general inquiry"}. `;
  summaryText += `${messageCount} messages exchanged. `;

  if (context.entities.dealership) {
    summaryText += `Dealership: ${context.entities.dealership}. `;
  }

  if (context.tags.includes("escalated")) {
    summaryText += "Escalated to human support.";
  } else if (context.tags.includes("resolved")) {
    summaryText += "Successfully resolved.";
  }

  const resolution = context.tags.includes("escalated")
    ? "escalated"
    : context.tags.includes("resolved")
      ? "resolved"
      : "abandoned";

  return {
    sessionId,
    duration,
    messageCount,
    mainTopics: Array.from(intents),
    resolution,
    summary: summaryText,
  };
}

/**
 * Export conversation
 */
export function exportConversation(sessionId: string, format: "json" | "csv" | "txt"): string {
  const context = getConversation(sessionId);
  if (!context) return "";

  switch (format) {
    case "json":
      return JSON.stringify(context, null, 2);

    case "csv":
      let csv = "Timestamp,Role,Content,Intent,Sentiment\n";
      for (const msg of context.messages) {
        const timestamp = new Date(msg.timestamp).toISOString();
        const content = msg.content.replace(/"/g, '""');
        csv += `"${timestamp}","${msg.role}","${content}","${msg.intent || ""}","${msg.sentiment || ""}"\n`;
      }
      return csv;

    case "txt":
      let txt = `Conversation ${sessionId}\n`;
      txt += `Duration: ${Math.round((Date.now() - context.startTime) / 1000)} seconds\n`;
      txt += `Language: ${context.language}\n\n`;

      for (const msg of context.messages) {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        txt += `[${time}] ${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      }
      return txt;

    default:
      return "";
  }
}

/**
 * Search conversations
 */
export function searchConversations(
  query: string,
  userId?: string
): Array<{ sessionId: string; relevance: number }> {
  const allConversations = memoryStore.getAllConversations();
  const queryLower = query.toLowerCase();

  const results = allConversations
    .filter((c) => !userId || c.userId === userId)
    .map((c) => {
      let relevance = 0;

      // Check entities
      for (const [key, value] of Object.entries(c.entities)) {
        if (value.toLowerCase().includes(queryLower)) {
          relevance += 2;
        }
      }

      // Check messages
      for (const msg of c.messages) {
        if (msg.content.toLowerCase().includes(queryLower)) {
          relevance += 1;
        }
      }

      // Check tags
      for (const tag of c.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          relevance += 1.5;
        }
      }

      return { sessionId: c.sessionId, relevance };
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  return results;
}

/**
 * Delete conversation
 */
export function deleteConversation(sessionId: string): void {
  memoryStore.deleteConversation(sessionId);
}

/**
 * Get conversation statistics
 */
export function getConversationStats(): {
  totalConversations: number;
  activeConversations: number;
  averageMessageCount: number;
  averageDuration: number;
} {
  const all = memoryStore.getAllConversations();
  const active = memoryStore.getActiveConversations();

  const avgMessageCount =
    all.length > 0 ? all.reduce((sum, c) => sum + c.messages.length, 0) / all.length : 0;

  const avgDuration =
    all.length > 0
      ? all.reduce((sum, c) => sum + (Date.now() - c.startTime), 0) / all.length
      : 0;

  return {
    totalConversations: all.length,
    activeConversations: active.length,
    averageMessageCount: Math.round(avgMessageCount),
    averageDuration: Math.round(avgDuration / 1000),
  };
}
