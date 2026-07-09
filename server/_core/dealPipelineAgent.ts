/**
 * Deal Pipeline Agent - Tracks B2B dealership sales pipeline
 * 
 * Manages:
 * - Prospect stages (prospect → qualified → negotiating → won/lost)
 * - Auto-follow-up for stalled deals
 * - Win/loss analysis
 * - Deal velocity tracking
 */

import { invokeLLM } from "./llm";
import { z } from "zod";

export type DealStage = "prospect" | "qualified" | "negotiating" | "won" | "lost";

export interface DealPipelineItem {
  id: string;
  dealershipName: string;
  stage: DealStage;
  score: number; // 0-100
  
  // Timeline
  createdAt: Date;
  lastUpdatedAt: Date;
  movedToStageAt: Date;
  
  // Contact Info
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Deal Details
  estimatedMonthlyLeads: number;
  estimatedAnnualValue: number; // Estimated annual contract value
  
  // Stage-specific data
  stageData: {
    prospect?: {
      source: string; // "sipho", "manual", "referral"
      initialScore: number;
    };
    qualified?: {
      qualifiedBy: string; // "themba", "mia"
      qualifiedAt: Date;
      interestLevel: "high" | "medium" | "low";
    };
    negotiating?: {
      negotiatingWith: string;
      negotiationNotes: string;
      expectedCloseDate: Date;
    };
    won?: {
      closedAt: Date;
      finalValue: number;
      contractUrl: string;
    };
    lost?: {
      lostAt: Date;
      lostReason: string;
      lostToCompetitor?: string;
    };
  };
  
  // Follow-up tracking
  followUps: {
    date: Date;
    agent: string; // "themba", "mia", "system"
    action: string;
    result: string;
  }[];
  
  // Days in stage
  daysInStage: number;
  
  // Auto-follow-up flag
  needsFollowUp: boolean;
  lastFollowUpAt: Date | null;
}

/**
 * Create a new deal in the pipeline
 */
export function createDeal(input: {
  dealershipName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  initialScore: number;
  source: string;
}): DealPipelineItem {
  const now = new Date();
  return {
    id: `deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dealershipName: input.dealershipName,
    stage: "prospect",
    score: input.initialScore,
    createdAt: now,
    lastUpdatedAt: now,
    movedToStageAt: now,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    estimatedMonthlyLeads: 50,
    estimatedAnnualValue: 50000,
    stageData: {
      prospect: {
        source: input.source,
        initialScore: input.initialScore,
      },
    },
    followUps: [],
    daysInStage: 0,
    needsFollowUp: true,
    lastFollowUpAt: null,
  };
}

/**
 * Move deal to next stage with validation
 */
export async function moveDealToStage(
  deal: DealPipelineItem,
  newStage: DealStage,
  data: any
): Promise<DealPipelineItem> {
  const now = new Date();
  const daysInPreviousStage = Math.floor(
    (now.getTime() - deal.movedToStageAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const updatedDeal: DealPipelineItem = {
    ...deal,
    stage: newStage,
    movedToStageAt: now,
    lastUpdatedAt: now,
    daysInStage: 0,
  };

  // Add stage-specific data
  switch (newStage) {
    case "qualified":
      updatedDeal.stageData.qualified = {
        qualifiedBy: data.qualifiedBy || "system",
        qualifiedAt: now,
        interestLevel: data.interestLevel || "medium",
      };
      break;
    case "negotiating":
      updatedDeal.stageData.negotiating = {
        negotiatingWith: data.negotiatingWith || "owner",
        negotiationNotes: data.notes || "",
        expectedCloseDate: data.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      break;
    case "won":
      updatedDeal.stageData.won = {
        closedAt: now,
        finalValue: data.finalValue || updatedDeal.estimatedAnnualValue,
        contractUrl: data.contractUrl || "",
      };
      break;
    case "lost":
      updatedDeal.stageData.lost = {
        lostAt: now,
        lostReason: data.reason || "unknown",
        lostToCompetitor: data.competitor,
      };
      break;
  }

  return updatedDeal;
}

/**
 * Log a follow-up action on a deal
 */
export async function logFollowUp(
  deal: DealPipelineItem,
  agent: string,
  action: string,
  result: string
): Promise<DealPipelineItem> {
  const now = new Date();
  return {
    ...deal,
    followUps: [
      ...deal.followUps,
      {
        date: now,
        agent,
        action,
        result,
      },
    ],
    lastFollowUpAt: now,
    needsFollowUp: false,
  };
}

/**
 * Determine if a deal needs follow-up (stalled)
 */
export function shouldFollowUp(deal: DealPipelineItem): boolean {
  const now = new Date();
  const daysInStage = Math.floor(
    (now.getTime() - deal.movedToStageAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Follow-up thresholds by stage
  const thresholds: Record<DealStage, number> = {
    prospect: 7, // Follow up if prospect for >7 days
    qualified: 5, // Follow up if qualified for >5 days
    negotiating: 3, // Follow up if negotiating for >3 days
    won: 0, // Don't follow up
    lost: 0, // Don't follow up
  };

  const threshold = thresholds[deal.stage];
  return daysInStage > threshold && deal.stage !== "won" && deal.stage !== "lost";
}

/**
 * Generate follow-up message based on deal stage
 */
export async function generateFollowUpMessage(deal: DealPipelineItem): Promise<string> {
  try {
    const daysInStage = deal.movedToStageAt
      ? Math.floor((new Date().getTime() - deal.movedToStageAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a B2B sales follow-up specialist. Generate a brief, professional follow-up message for a dealership prospect.
The message should be personalized, reference previous interactions, and move the deal forward.
Keep it under 100 words.`,
        },
        {
          role: "user",
          content: `Generate a follow-up message for:
Dealership: ${deal.dealershipName}
Contact: ${deal.contactName}
Current Stage: ${deal.stage}
Days in Stage: ${daysInStage}
Previous Follow-ups: ${deal.followUps.length}
${deal.stageData.qualified ? `Interest Level: ${deal.stageData.qualified.interestLevel}` : ""}
${deal.stageData.negotiating ? `Expected Close: ${deal.stageData.negotiating.expectedCloseDate}` : ""}

Make it warm, not pushy. Reference specific pain points if known.`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === "string" ? content : "Follow-up message generation failed";
  } catch (error) {
    console.error("[DealPipeline] Follow-up generation failed:", error);
    return "We'd love to check in on your interest in GrayArx. Let's schedule a quick call?";
  }
}

/**
 * Calculate deal velocity metrics
 */
export function calculateDealVelocity(deals: DealPipelineItem[]): {
  totalDeals: number;
  byStage: Record<DealStage, number>;
  averageDaysToClose: number;
  conversionRate: number;
  wonDeals: DealPipelineItem[];
  lostDeals: DealPipelineItem[];
} {
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");
  const closedDeals = [...wonDeals, ...lostDeals];

  const averageDaysToClose =
    closedDeals.length > 0
      ? Math.round(
          closedDeals.reduce((sum, d) => {
            const closedAt = d.stageData.won?.closedAt || d.stageData.lost?.lostAt || new Date();
            return sum + (closedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / closedDeals.length
        )
      : 0;

  const conversionRate =
    deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  return {
    totalDeals: deals.length,
    byStage: {
      prospect: deals.filter((d) => d.stage === "prospect").length,
      qualified: deals.filter((d) => d.stage === "qualified").length,
      negotiating: deals.filter((d) => d.stage === "negotiating").length,
      won: wonDeals.length,
      lost: lostDeals.length,
    },
    averageDaysToClose,
    conversionRate,
    wonDeals,
    lostDeals,
  };
}

/**
 * Analyze win/loss patterns
 */
export async function analyzeWinLossPatterns(deals: DealPipelineItem[]): Promise<{
  topWinReasons: { reason: string; count: number }[];
  topLossReasons: { reason: string; count: number }[];
  competitorMentions: { competitor: string; count: number }[];
}> {
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");

  // Extract loss reasons
  const lossReasons = lostDeals
    .map((d) => d.stageData.lost?.lostReason)
    .filter(Boolean) as string[];

  const lossReasonCounts: Record<string, number> = {};
  lossReasons.forEach((reason) => {
    lossReasonCounts[reason] = (lossReasonCounts[reason] || 0) + 1;
  });

  // Extract competitor mentions
  const competitors = lostDeals
    .map((d) => d.stageData.lost?.lostToCompetitor)
    .filter(Boolean) as string[];

  const competitorCounts: Record<string, number> = {};
  competitors.forEach((comp) => {
    competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
  });

  return {
    topWinReasons: [
      { reason: "Good fit for their market", count: wonDeals.length },
    ],
    topLossReasons: Object.entries(lossReasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    competitorMentions: Object.entries(competitorCounts)
      .map(([competitor, count]) => ({ competitor, count }))
      .sort((a, b) => b.count - a.count),
  };
}
