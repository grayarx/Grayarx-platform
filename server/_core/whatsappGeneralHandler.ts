/**
 * WhatsApp General Inquiry Handler
 * Extends Lerato (booking agent) to handle FAQs and general questions
 * Falls back to FAQ bot when question is not about test drive booking
 */

import { findFAQAnswer, formatFAQForWhatsApp } from "./faqBot";

export interface WhatsAppMessage {
  from: string;
  body: string;
  timestamp: Date;
}

export interface WhatsAppResponse {
  to: string;
  message: string;
  type: "booking" | "faq" | "escalation";
}

/**
 * Determine if message is about test drive booking
 */
function isBookingRelated(message: string): boolean {
  const bookingKeywords = [
    "test drive",
    "book",
    "schedule",
    "appointment",
    "when",
    "time",
    "available",
    "slot",
    "reserve",
  ];

  const lowerMessage = message.toLowerCase();
  return bookingKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Handle general WhatsApp inquiry
 * Routes to booking agent or FAQ bot based on message content
 */
export async function handleWhatsAppInquiry(msg: WhatsAppMessage): Promise<WhatsAppResponse> {
  // Check if it's a booking-related question
  if (isBookingRelated(msg.body)) {
    // Route to Lerato (booking agent)
    return {
      to: msg.from,
      message: `Hi! 👋 I'm Lerato, your booking assistant. I'd love to help you schedule a test drive!\n\nWhich vehicle are you interested in? Just send me the make and model, and I'll check availability for you.`,
      type: "booking",
    };
  }

  // Try to find FAQ answer
  const faqAnswer = findFAQAnswer(msg.body);

  if (faqAnswer) {
    // Found a matching FAQ
    return {
      to: msg.from,
      message: formatFAQForWhatsApp(faqAnswer),
      type: "faq",
    };
  }

  // No match found - escalate to support
  return {
    to: msg.from,
    message: `Thanks for your question! 🤔\n\nI couldn't find a direct answer, but our team can help.\n\n📧 Email: grayarx@gmail.com\n📞 Call: 079 491 5187\n\nWe typically respond within 24 hours. Looking forward to helping you!`,
    type: "escalation",
  };
}

/**
 * Generate quick reply suggestions based on message
 */
export function generateQuickReplies(message: string): string[] {
  const lowerMessage = message.toLowerCase();

  // Booking-related suggestions
  if (isBookingRelated(message)) {
    return [
      "View available times",
      "Confirm booking",
      "Change date/time",
      "Cancel booking",
    ];
  }

  // FAQ-related suggestions
  if (
    lowerMessage.includes("price") ||
    lowerMessage.includes("cost") ||
    lowerMessage.includes("how much")
  ) {
    return [
      "View pricing plans",
      "Start free trial",
      "Compare plans",
      "Contact sales",
    ];
  }

  if (
    lowerMessage.includes("feature") ||
    lowerMessage.includes("what") ||
    lowerMessage.includes("can")
  ) {
    return [
      "See all agents",
      "Watch demo",
      "Read case study",
      "Talk to team",
    ];
  }

  // Default suggestions
  return [
    "View pricing",
    "Start free trial",
    "Contact support",
    "View features",
  ];
}

/**
 * Format FAQ answer specifically for WhatsApp
 * (shorter, emoji-friendly, mobile-optimized)
 */
export function formatForWhatsApp(text: string): string {
  // Remove markdown formatting for WhatsApp
  let formatted = text
    .replace(/\*\*/g, "*") // Convert ** to *
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)") // Convert links to text
    .replace(/###\s/g, "*") // Convert headers to bold
    .replace(/##\s/g, "*")
    .replace(/^- /gm, "• "); // Convert dashes to bullets

  // Limit to WhatsApp message length (4096 chars)
  if (formatted.length > 4000) {
    formatted = formatted.substring(0, 3990) + "...\n\nFor more info, call 079 491 5187";
  }

  return formatted;
}

/**
 * Detect sentiment/intent from message
 */
export function detectIntent(message: string): "booking" | "question" | "complaint" | "feedback" | "unknown" {
  const lowerMessage = message.toLowerCase();

  // Booking intent
  if (
    isBookingRelated(message) ||
    lowerMessage.includes("want") ||
    lowerMessage.includes("need")
  ) {
    return "booking";
  }

  // Question intent
  if (
    lowerMessage.includes("?") ||
    lowerMessage.includes("how") ||
    lowerMessage.includes("what") ||
    lowerMessage.includes("when") ||
    lowerMessage.includes("where")
  ) {
    return "question";
  }

  // Complaint intent
  if (
    lowerMessage.includes("problem") ||
    lowerMessage.includes("issue") ||
    lowerMessage.includes("not working") ||
    lowerMessage.includes("broken")
  ) {
    return "complaint";
  }

  // Feedback intent
  if (
    lowerMessage.includes("great") ||
    lowerMessage.includes("love") ||
    lowerMessage.includes("thanks") ||
    lowerMessage.includes("awesome")
  ) {
    return "feedback";
  }

  return "unknown";
}

/**
 * Generate contextual response based on intent
 */
export function generateContextualResponse(
  message: string,
  intent: "booking" | "question" | "complaint" | "feedback" | "unknown"
): string {
  switch (intent) {
    case "booking":
      return `Great! 🚗 Let me help you book a test drive.\n\nWhich vehicle interests you?`;

    case "question":
      const faq = findFAQAnswer(message);
      if (faq) {
        return formatForWhatsApp(formatFAQForWhatsApp(faq));
      }
      return `Good question! 🤔 Let me connect you with our team.\n\n📞 079 491 5187\n📧 grayarx@gmail.com`;

    case "complaint":
      return `Sorry to hear you're having issues! 😟\n\nOur team will help ASAP.\n\n📞 Call: 079 491 5187\n📧 Email: grayarx@gmail.com\n\nWe're here to help!`;

    case "feedback":
      return `Thank you so much! 🙌 We appreciate your feedback.\n\nLet us know how we can improve further!`;

    default:
      return `Hi! 👋 How can I help you today?\n\n• 🚗 Book a test drive\n• ❓ Ask a question\n• 💰 View pricing\n• 📞 Contact support`;
  }
}
