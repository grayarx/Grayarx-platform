/**
 * Nala Enhanced - 24/7 Dealership Support Agent
 * 
 * Handles:
 * - General dealership queries (how-to, troubleshooting)
 * - FAQ resolution
 * - Booking agent routing
 * - Feature requests
 * - Escalation to human support
 * - Multi-language support
 */

import { invokeLLM } from "./llm";

export interface DealershipQuery {
  id: string;
  dealershipId: string;
  dealershipName: string;
  senderName: string;
  senderEmail: string;
  query: string;
  category: "how-to" | "troubleshooting" | "booking" | "feature-request" | "other";
  language: string;
  timestamp: Date;
}

export interface NalaResponse {
  id: string;
  queryId: string;
  responseType: "faq" | "booking-handoff" | "feature-request" | "escalation";
  message: string;
  actionItems?: {
    action: string;
    description: string;
    link?: string;
  }[];
  escalationReason?: string;
  respondedAt: Date;
}

/**
 * Classify dealership query
 */
export async function classifyQuery(query: string): Promise<DealershipQuery["category"]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Classify this dealership support query into one category:
- "how-to": Questions about how to use features
- "troubleshooting": Technical issues or bugs
- "booking": Questions about test drive bookings
- "feature-request": Requests for new features
- "other": Everything else

Return ONLY the category name, nothing else.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    const content = response.choices[0].message.content;
    const category = typeof content === "string" ? content.toLowerCase().trim() : "other";
    
    if (["how-to", "troubleshooting", "booking", "feature-request"].includes(category)) {
      return category as DealershipQuery["category"];
    }
    return "other";
  } catch (error) {
    console.error("[Nala] Query classification failed:", error);
    return "other";
  }
}

/**
 * Generate FAQ-based response
 */
export async function generateFAQResponse(
  query: string,
  dealershipName: string,
  language: string = "en"
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are Nala, GrayArx's 24/7 dealership support agent. Answer this support query helpfully and concisely.
Be friendly, professional, and action-oriented.
If you don't know the answer, offer to escalate to a human.
Keep response under 200 words.
${language !== "en" ? `Respond in ${language}.` : ""}`,
        },
        {
          role: "user",
          content: `Dealership: ${dealershipName}
Query: ${query}`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === "string" ? content : "I'd be happy to help. Could you provide more details?";
  } catch (error) {
    console.error("[Nala] FAQ response generation failed:", error);
    return "I'm having trouble processing your query. Let me connect you with a human agent.";
  }
}

/**
 * Generate booking handoff message
 */
export async function generateBookingHandoff(
  dealershipName: string,
  originalQuery: string
): Promise<string> {
  return `Hi! I can help with that. Let me connect you with Lerato, our Booking Agent, who specializes in test drive scheduling.

Your query: "${originalQuery}"

Lerato will be with you shortly to help you book a test drive or manage your calendar. Thanks for choosing GrayArx!`;
}

/**
 * Generate feature request acknowledgment
 */
export async function generateFeatureRequestAck(
  dealershipName: string,
  featureRequest: string
): Promise<string> {
  return `Thanks for the feature request! We love hearing how we can improve GrayArx.

Your suggestion: "${featureRequest}"

I've logged this with our product team. We review all dealership feedback monthly and prioritize based on impact and demand. You'll hear back from us within 48 hours.

In the meantime, is there anything else I can help you with?`;
}

/**
 * Generate escalation message
 */
export async function generateEscalationMessage(
  dealershipName: string,
  reason: string
): Promise<string> {
  return `I appreciate you reaching out! This query needs a human touch, so I'm escalating you to our support team.

Reason: ${reason}

A GrayArx team member will contact you within 2 hours during business hours (Mon-Fri, 8am-6pm SAST).

In the meantime, here are some resources that might help:
- Knowledge Base: https://help.grayarx.com
- Video Tutorials: https://learn.grayarx.com
- Community Forum: https://community.grayarx.com

Thanks for your patience!`;
}

/**
 * Process dealership query and generate response
 */
export async function processDealershipQuery(
  query: DealershipQuery
): Promise<NalaResponse> {
  const category = await classifyQuery(query.query);

  let response: NalaResponse;

  switch (category) {
    case "how-to":
    case "troubleshooting":
    case "other": {
      const message = await generateFAQResponse(query.query, query.dealershipName, query.language);
      response = {
        id: `response-${Date.now()}`,
        queryId: query.id,
        responseType: "faq",
        message,
        respondedAt: new Date(),
      };
      break;
    }

    case "booking": {
      const message = await generateBookingHandoff(query.dealershipName, query.query);
      response = {
        id: `response-${Date.now()}`,
        queryId: query.id,
        responseType: "booking-handoff",
        message,
        respondedAt: new Date(),
      };
      break;
    }

    case "feature-request": {
      const message = await generateFeatureRequestAck(query.dealershipName, query.query);
      response = {
        id: `response-${Date.now()}`,
        queryId: query.id,
        responseType: "feature-request",
        message,
        respondedAt: new Date(),
      };
      break;
    }

    default: {
      const message = await generateEscalationMessage(
        query.dealershipName,
        "Complex query requiring human expertise"
      );
      response = {
        id: `response-${Date.now()}`,
        queryId: query.id,
        responseType: "escalation",
        message,
        escalationReason: "Unable to resolve automatically",
        respondedAt: new Date(),
      };
    }
  }

  return response;
}

/**
 * Generate action items for complex queries
 */
export async function generateActionItems(
  query: string,
  category: DealershipQuery["category"]
): Promise<NalaResponse["actionItems"]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Generate 2-3 specific action items to resolve this support query.
Return JSON array with:
- action (string): Action name
- description (string): What to do
- link (string, optional): URL if applicable

Return ONLY valid JSON array, no markdown.`,
        },
        {
          role: "user",
          content: `Query: ${query}
Category: ${category}

Generate action items to resolve this.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "action_items",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                description: { type: "string" },
                link: { type: "string" },
              },
              required: ["action", "description"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("[Nala] Action items generation failed:", error);
    return [];
  }
}

/**
 * Generate knowledge base article
 */
export async function generateKBArticle(topic: string): Promise<{
  title: string;
  content: string;
  faqs: { question: string; answer: string }[];
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Write a knowledge base article for GrayArx dealership users.
Return JSON with:
- title (string): Article title
- content (string): Main article (300-500 words)
- faqs (array): 3-5 FAQ items with question and answer

Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: `Write a KB article about: ${topic}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "kb_article",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "content", "faqs"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return {
      title: topic,
      content: "Article generation failed",
      faqs: [],
    };
  } catch (error) {
    console.error("[Nala] KB article generation failed:", error);
    return {
      title: topic,
      content: "Article generation failed",
      faqs: [],
    };
  }
}
