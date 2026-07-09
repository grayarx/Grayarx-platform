/**
 * Sentiment Analysis & Smart Escalation Service
 * Analyzes user sentiment and determines when to escalate to human support
 */

export type Sentiment = "positive" | "neutral" | "negative" | "frustrated";

export interface SentimentAnalysis {
  sentiment: Sentiment;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  keywords: string[];
  shouldEscalate: boolean;
  escalationReason?: string;
}

/**
 * Sentiment word lists for South African English
 */
const SENTIMENT_WORDS = {
  positive: [
    "great",
    "good",
    "excellent",
    "amazing",
    "wonderful",
    "love",
    "perfect",
    "thanks",
    "thank you",
    "helpful",
    "awesome",
    "fantastic",
    "brilliant",
    "super",
    "nice",
    "happy",
    "pleased",
    "satisfied",
    "impressed",
    "delighted",
  ],
  negative: [
    "bad",
    "poor",
    "terrible",
    "awful",
    "hate",
    "useless",
    "broken",
    "not working",
    "doesn't work",
    "failed",
    "error",
    "problem",
    "issue",
    "trouble",
    "difficult",
    "hard",
    "confusing",
    "unclear",
    "disappointing",
    "frustrated",
  ],
  frustrated: [
    "frustrated",
    "angry",
    "upset",
    "annoyed",
    "fed up",
    "sick of",
    "tired of",
    "why",
    "still",
    "not working",
    "again",
    "still broken",
    "help",
    "please",
    "urgent",
    "asap",
    "immediately",
    "now",
    "enough",
    "seriously",
  ],
};

/**
 * Analyze sentiment of user message
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();

  let positiveScore = 0;
  let negativeScore = 0;
  let frustratedScore = 0;
  const foundKeywords: string[] = [];

  // Count sentiment words
  for (const word of SENTIMENT_WORDS.positive) {
    if (lowerText.includes(word)) {
      positiveScore++;
      foundKeywords.push(word);
    }
  }

  for (const word of SENTIMENT_WORDS.negative) {
    if (lowerText.includes(word)) {
      negativeScore++;
      foundKeywords.push(word);
    }
  }

  for (const word of SENTIMENT_WORDS.frustrated) {
    if (lowerText.includes(word)) {
      frustratedScore++;
      foundKeywords.push(word);
    }
  }

  // Determine sentiment
  let sentiment: Sentiment = "neutral";
  let score = 0;
  let confidence = 0;

  if (frustratedScore > 0) {
    sentiment = "frustrated";
    score = -0.8;
    confidence = Math.min(frustratedScore / 3, 1);
  } else if (negativeScore > positiveScore) {
    sentiment = "negative";
    score = -0.5;
    confidence = Math.min(negativeScore / 3, 1);
  } else if (positiveScore > 0) {
    sentiment = "positive";
    score = 0.7;
    confidence = Math.min(positiveScore / 3, 1);
  } else {
    sentiment = "neutral";
    score = 0;
    confidence = 0.5;
  }

  // Determine if escalation is needed
  const shouldEscalate = sentiment === "frustrated" || (sentiment === "negative" && confidence > 0.7);

  let escalationReason: string | undefined;
  if (shouldEscalate) {
    if (sentiment === "frustrated") {
      escalationReason = "User appears frustrated and may need human support";
    } else if (sentiment === "negative") {
      escalationReason = "User has expressed negative sentiment and may need human assistance";
    }
  }

  return {
    sentiment,
    score,
    confidence,
    keywords: [...new Set(foundKeywords)], // Remove duplicates
    shouldEscalate,
    escalationReason,
  };
}

/**
 * Detect if user is asking for human support
 */
export function isAskingForHumanSupport(text: string): boolean {
  const lowerText = text.toLowerCase();

  const humanSupportKeywords = [
    "human",
    "agent",
    "representative",
    "person",
    "staff",
    "team",
    "support",
    "help",
    "speak to",
    "talk to",
    "contact",
    "call",
    "email",
    "customer service",
  ];

  for (const keyword of humanSupportKeywords) {
    if (lowerText.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if user is asking for escalation
 */
export function shouldEscalateBasedOnContent(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Keywords that indicate need for escalation
  const escalationKeywords = [
    "escalate",
    "manager",
    "supervisor",
    "urgent",
    "emergency",
    "critical",
    "serious",
    "complaint",
    "legal",
    "lawyer",
    "court",
  ];

  for (const keyword of escalationKeywords) {
    if (lowerText.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate escalation message based on sentiment
 */
export function generateEscalationMessage(sentiment: Sentiment, language: string = "en"): string {
  const messages: Record<Sentiment, Record<string, string>> = {
    positive: {
      en: "Thank you for your positive feedback! I'm glad I could help. Is there anything else I can assist you with?",
      af: "Dankie vir jou positiewe terugvoering! Ek is bly dat ek kon help. Is daar iets anders waarmee ek jou kan help?",
    },
    neutral: {
      en: "I'm here to help. If you need further assistance, please let me know.",
      af: "Ek is hier om te help. As jy verdere hulp nodig het, laat dit my weet.",
    },
    negative: {
      en: "I understand your concern. Let me connect you with a human agent who can provide more personalized support.",
      af: "Ek verstaan jou bekommernis. Laat my jou met 'n menslike agent verbind wat meer persoonlike ondersteuning kan bied.",
    },
    frustrated: {
      en: "I sincerely apologize for the frustration. Let me immediately connect you with a senior support specialist who can resolve this for you.",
      af: "Ek vra jou opreg om verskoning vir die frustrasie. Laat my jou onmiddellik met 'n senior ondersteuningsspesialis verbind wat dit vir jou kan oplos.",
    },
  };

  return messages[sentiment]?.[language] || messages[sentiment]?.en || "Thank you for contacting GrayArx Support.";
}

/**
 * Calculate escalation priority (0-1, higher = more urgent)
 */
export function calculateEscalationPriority(
  sentiment: Sentiment,
  messageCount: number,
  timeSinceLastResponse: number
): number {
  let priority = 0;

  // Sentiment-based priority
  if (sentiment === "frustrated") priority += 0.8;
  else if (sentiment === "negative") priority += 0.5;
  else if (sentiment === "neutral") priority += 0.2;
  else if (sentiment === "positive") priority += 0;

  // Message count (more messages = higher priority)
  if (messageCount > 20) priority += 0.3;
  else if (messageCount > 10) priority += 0.2;
  else if (messageCount > 5) priority += 0.1;

  // Time since last response (longer wait = higher priority)
  const minutesSinceResponse = timeSinceLastResponse / (1000 * 60);
  if (minutesSinceResponse > 5) priority += 0.2;
  else if (minutesSinceResponse > 2) priority += 0.1;

  return Math.min(priority, 1); // Cap at 1
}

/**
 * Get escalation recommendations
 */
export function getEscalationRecommendations(
  sentiment: Sentiment,
  messageCount: number,
  conversationDuration: number
): {
  shouldEscalate: boolean;
  priority: "low" | "medium" | "high" | "critical";
  recommendations: string[];
} {
  const priority = calculateEscalationPriority(sentiment, messageCount, conversationDuration);

  let priorityLevel: "low" | "medium" | "high" | "critical" = "low";
  if (priority >= 0.8) priorityLevel = "critical";
  else if (priority >= 0.6) priorityLevel = "high";
  else if (priority >= 0.4) priorityLevel = "medium";

  const recommendations: string[] = [];

  if (sentiment === "frustrated") {
    recommendations.push("Immediate escalation recommended");
    recommendations.push("Assign to senior support specialist");
    recommendations.push("Offer priority support");
  } else if (sentiment === "negative") {
    recommendations.push("Escalate to human support");
    recommendations.push("Provide additional resources");
    recommendations.push("Offer compensation if applicable");
  } else if (messageCount > 10) {
    recommendations.push("Long conversation - consider escalation");
    recommendations.push("Check if user needs different type of support");
  }

  return {
    shouldEscalate: priority >= 0.5,
    priority: priorityLevel,
    recommendations,
  };
}

/**
 * Track sentiment history for a conversation
 */
export class SentimentTracker {
  private sentimentHistory: SentimentAnalysis[] = [];

  addAnalysis(analysis: SentimentAnalysis): void {
    this.sentimentHistory.push(analysis);
  }

  getHistory(): SentimentAnalysis[] {
    return this.sentimentHistory;
  }

  getTrend(): "improving" | "declining" | "stable" {
    if (this.sentimentHistory.length < 2) return "stable";

    const recent = this.sentimentHistory.slice(-3);
    const avgScore = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
    const previousAvg = this.sentimentHistory
      .slice(-6, -3)
      .reduce((sum, a) => sum + a.score, 0) / Math.max(this.sentimentHistory.slice(-6, -3).length, 1);

    if (avgScore > previousAvg + 0.2) return "improving";
    if (avgScore < previousAvg - 0.2) return "declining";
    return "stable";
  }

  getOverallSentiment(): Sentiment {
    if (this.sentimentHistory.length === 0) return "neutral";

    const avgScore = this.sentimentHistory.reduce((sum, a) => sum + a.score, 0) / this.sentimentHistory.length;

    if (avgScore > 0.3) return "positive";
    if (avgScore < -0.3) return "negative";
    return "neutral";
  }
}
