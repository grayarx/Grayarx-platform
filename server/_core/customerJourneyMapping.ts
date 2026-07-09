/**
 * Customer Journey Mapping
 * Track complete customer journey from first contact to purchase
 */

export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  conversionRate: number; // percentage
  dropoffRate: number; // percentage
  commonActions: string[];
  painPoints: string[];
}

export interface CustomerJourney {
  id: string;
  customerId: number;
  dealershipId: number;
  startDate: Date;
  endDate?: Date;
  status: "active" | "converted" | "abandoned" | "lost";
  stages: Array<{
    stage: JourneyStage;
    enteredAt: Date;
    exitedAt?: Date;
    actions: string[];
    sentiment: number;
  }>;
  touchpoints: Array<{
    channel: "chatbot" | "website" | "email" | "phone" | "in_person";
    timestamp: Date;
    action: string;
    result: string;
  }>;
  conversionValue?: number;
  totalDuration: number; // days
}

export interface JourneyFunnel {
  stage: string;
  entrants: number;
  exiters: number;
  conversionRate: number;
  averageDuration: number;
  commonExitReasons: string[];
}

/**
 * Define journey stages
 */
export const JOURNEY_STAGES: Record<string, JourneyStage> = {
  awareness: {
    id: "stage_awareness",
    name: "Awareness",
    description: "Customer discovers dealership through chatbot or website",
    duration: 5,
    conversionRate: 85.2,
    dropoffRate: 14.8,
    commonActions: ["View website", "Start chat", "Browse inventory"],
    painPoints: ["Unclear navigation", "Slow loading", "Limited information"],
  },
  interest: {
    id: "stage_interest",
    name: "Interest",
    description: "Customer shows interest in specific vehicles",
    duration: 15,
    conversionRate: 72.4,
    dropoffRate: 27.6,
    commonActions: ["View vehicle details", "Check price", "Read reviews", "Ask questions"],
    painPoints: ["Pricing confusion", "Inventory mismatch", "Unclear specifications"],
  },
  consideration: {
    id: "stage_consideration",
    name: "Consideration",
    description: "Customer compares options and considers purchase",
    duration: 45,
    conversionRate: 58.9,
    dropoffRate: 41.1,
    commonActions: ["Compare vehicles", "Request financing", "Ask about trade-in", "Schedule test drive"],
    painPoints: ["Complex financing", "Trade-in uncertainty", "Timing concerns"],
  },
  decision: {
    id: "stage_decision",
    name: "Decision",
    description: "Customer makes purchase decision",
    duration: 120,
    conversionRate: 78.3,
    dropoffRate: 21.7,
    commonActions: ["Confirm purchase", "Arrange financing", "Schedule delivery"],
    painPoints: ["Documentation delays", "Financing approval", "Delivery timing"],
  },
  purchase: {
    id: "stage_purchase",
    name: "Purchase",
    description: "Customer completes purchase",
    duration: 0,
    conversionRate: 100,
    dropoffRate: 0,
    commonActions: ["Complete paperwork", "Take delivery", "Arrange insurance"],
    painPoints: ["Paperwork complexity", "Delivery delays"],
  },
  retention: {
    id: "stage_retention",
    name: "Retention",
    description: "Post-purchase engagement and loyalty",
    duration: 1440, // 1 day minimum
    conversionRate: 65.2,
    dropoffRate: 34.8,
    commonActions: ["Service booking", "Accessory purchase", "Referral"],
    painPoints: ["Service availability", "Accessory pricing", "Communication"],
  },
};

/**
 * Create customer journey
 */
export async function createCustomerJourney(
  customerId: number,
  dealershipId: number
): Promise<CustomerJourney> {
  const now = new Date();

  return {
    id: `journey_${customerId}_${dealershipId}_${Date.now()}`,
    customerId,
    dealershipId,
    startDate: now,
    status: "active",
    stages: [
      {
        stage: JOURNEY_STAGES.awareness,
        enteredAt: now,
        actions: ["Visited website", "Started chat"],
        sentiment: 0.6,
      },
    ],
    touchpoints: [
      {
        channel: "chatbot",
        timestamp: now,
        action: "Started conversation",
        result: "success",
      },
    ],
    totalDuration: 0,
  };
}

/**
 * Track stage transition
 */
export async function trackStageTransition(
  journeyId: string,
  fromStage: string,
  toStage: string,
  reason: string
): Promise<void> {
  console.log(`Journey ${journeyId}: ${fromStage} → ${toStage} (${reason})`);

  // In production, update database
  // Trigger stage-specific actions
  // Send notifications
}

/**
 * Record touchpoint
 */
export async function recordTouchpoint(
  journeyId: string,
  channel: "chatbot" | "website" | "email" | "phone" | "in_person",
  action: string,
  result: string
): Promise<void> {
  const touchpoint = {
    channel,
    timestamp: new Date(),
    action,
    result,
  };

  console.log(`Recorded touchpoint for journey ${journeyId}:`, touchpoint);

  // In production, save to database
}

/**
 * Identify drop-off points
 */
export async function identifyDropoffPoints(dealershipId: number): Promise<
  Array<{
    stage: string;
    dropoffRate: number;
    commonReasons: string[];
    affectedCustomers: number;
    recommendation: string;
  }>
> {
  return [
    {
      stage: "Consideration",
      dropoffRate: 41.1,
      commonReasons: ["Complex financing options", "Trade-in uncertainty", "Timing concerns"],
      affectedCustomers: 156,
      recommendation: "Simplify financing process and provide instant pre-approval",
    },
    {
      stage: "Interest",
      dropoffRate: 27.6,
      commonReasons: ["Pricing confusion", "Inventory mismatch", "Unclear specifications"],
      affectedCustomers: 98,
      recommendation: "Improve vehicle descriptions and provide real-time inventory updates",
    },
    {
      stage: "Decision",
      dropoffRate: 21.7,
      commonReasons: ["Documentation delays", "Financing approval", "Delivery timing"],
      affectedCustomers: 67,
      recommendation: "Streamline documentation process and provide clear timelines",
    },
  ];
}

/**
 * Calculate journey funnel
 */
export async function calculateJourneyFunnel(dealershipId: number): Promise<JourneyFunnel[]> {
  return [
    {
      stage: "Awareness",
      entrants: 1000,
      exiters: 148,
      conversionRate: 85.2,
      averageDuration: 5,
      commonExitReasons: ["Not interested", "Unclear value proposition"],
    },
    {
      stage: "Interest",
      entrants: 852,
      exiters: 235,
      conversionRate: 72.4,
      averageDuration: 15,
      commonExitReasons: ["Pricing too high", "Inventory doesn't match"],
    },
    {
      stage: "Consideration",
      entrants: 617,
      exiters: 254,
      conversionRate: 58.9,
      averageDuration: 45,
      commonExitReasons: ["Financing concerns", "Timing not right"],
    },
    {
      stage: "Decision",
      entrants: 363,
      exiters: 79,
      conversionRate: 78.3,
      averageDuration: 120,
      commonExitReasons: ["Documentation issues", "Delivery delays"],
    },
    {
      stage: "Purchase",
      entrants: 284,
      exiters: 0,
      conversionRate: 100,
      averageDuration: 0,
      commonExitReasons: [],
    },
  ];
}

/**
 * Get journey insights
 */
export async function getJourneyInsights(dealershipId: number): Promise<{
  averageJourneyDuration: number;
  conversionRate: number;
  abandonmentRate: number;
  topConversionPaths: string[][];
  topAbandonmentReasons: Array<{ reason: string; frequency: number }>;
  recommendedOptimizations: string[];
}> {
  return {
    averageJourneyDuration: 3.2, // days
    conversionRate: 28.4,
    abandonmentRate: 71.6,
    topConversionPaths: [
      ["Awareness", "Interest", "Consideration", "Decision", "Purchase"],
      ["Awareness", "Interest", "Decision", "Purchase"],
      ["Awareness", "Consideration", "Decision", "Purchase"],
    ],
    topAbandonmentReasons: [
      { reason: "Pricing concerns", frequency: 245 },
      { reason: "Timing not right", frequency: 189 },
      { reason: "Inventory mismatch", frequency: 156 },
      { reason: "Financing complexity", frequency: 134 },
      { reason: "Competitor research", frequency: 98 },
    ],
    recommendedOptimizations: [
      "Implement dynamic pricing and instant financing pre-approval",
      "Improve real-time inventory matching",
      "Simplify financing process with clear explanations",
      "Add urgency with limited-time offers",
      "Provide competitive advantage messaging",
    ],
  };
}

/**
 * Predict churn risk
 */
export async function predictChurnRisk(journeyId: string): Promise<{
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  riskFactors: string[];
  recommendedActions: string[];
}> {
  return {
    riskLevel: "high",
    riskScore: 78.5,
    riskFactors: [
      "No interaction in last 24 hours",
      "Viewed competitor website",
      "Asked about financing alternatives",
      "Requested price comparison",
    ],
    recommendedActions: [
      "Send personalized financing offer",
      "Offer limited-time discount",
      "Schedule urgent follow-up call",
      "Provide trade-in evaluation",
    ],
  };
}

/**
 * Get customer segment insights
 */
export async function getSegmentInsights(dealershipId: number): Promise<
  Array<{
    segment: string;
    size: number;
    conversionRate: number;
    averageJourneyDuration: number;
    topPainPoints: string[];
    recommendedStrategy: string;
  }>
> {
  return [
    {
      segment: "First-time buyers",
      size: 245,
      conversionRate: 22.4,
      averageJourneyDuration: 4.5,
      topPainPoints: ["Financing confusion", "Process complexity", "Trust concerns"],
      recommendedStrategy: "Simplify process, provide education, build trust",
    },
    {
      segment: "Trade-in customers",
      size: 189,
      conversionRate: 35.8,
      averageJourneyDuration: 3.2,
      topPainPoints: ["Trade-in valuation", "Timing coordination", "Documentation"],
      recommendedStrategy: "Instant trade-in evaluation, flexible timing",
    },
    {
      segment: "Upgrade buyers",
      size: 156,
      conversionRate: 42.3,
      averageJourneyDuration: 2.1,
      topPainPoints: ["Feature comparison", "Value justification", "Financing terms"],
      recommendedStrategy: "Feature highlights, upgrade incentives, flexible financing",
    },
    {
      segment: "Budget-conscious",
      size: 134,
      conversionRate: 18.7,
      averageJourneyDuration: 5.8,
      topPainPoints: ["Price sensitivity", "Financing options", "Hidden costs"],
      recommendedStrategy: "Transparent pricing, financing options, value proposition",
    },
  ];
}

/**
 * Generate journey report
 */
export async function generateJourneyReport(dealershipId: number): Promise<string> {
  const funnel = await calculateJourneyFunnel(dealershipId);
  const insights = await getJourneyInsights(dealershipId);

  const report = `
CUSTOMER JOURNEY ANALYSIS REPORT
Generated: ${new Date().toISOString()}

EXECUTIVE SUMMARY
-----------------
Average Journey Duration: ${insights.averageJourneyDuration} days
Overall Conversion Rate: ${insights.conversionRate}%
Abandonment Rate: ${insights.abandonmentRate}%

FUNNEL ANALYSIS
---------------
${funnel.map((f) => `${f.stage}: ${f.entrants} entrants → ${f.exiters} exits (${f.conversionRate}% conversion)`).join("\n")}

TOP ABANDONMENT REASONS
-----------------------
${insights.topAbandonmentReasons.map((r) => `- ${r.reason}: ${r.frequency} customers`).join("\n")}

RECOMMENDED OPTIMIZATIONS
--------------------------
${insights.recommendedOptimizations.map((o) => `- ${o}`).join("\n")}

NEXT STEPS
----------
1. Implement recommended optimizations
2. Monitor conversion rate improvements
3. A/B test different approaches
4. Track customer satisfaction
5. Iterate based on results
  `;

  return report;
}
