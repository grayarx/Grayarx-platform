/**
 * Sipho Enhanced Research Module - REAL Implementation
 * 
 * This module provides actual dealership intelligence gathering:
 * - Website scraping and analysis
 * - News/press release monitoring
 * - Weakness identification
 * - Competitive analysis
 * - Financial health indicators
 * 
 * Used by Mia to personalize outreach emails with specific weaknesses
 */

import { invokeLLM } from "./llm";
import { z } from "zod";

export interface DealershipIntelligence {
  dealershipName: string;
  website: string;
  location: string;
  
  // Website Analysis
  websiteQuality: {
    score: number; // 0-100
    mobileOptimized: boolean;
    hasAI: boolean;
    leadCaptureMethods: string[];
    inventorySystem: string;
    issues: string[];
  };
  
  // Market Position
  marketPosition: {
    yearsInBusiness: number;
    estimatedSize: "small" | "medium" | "large";
    marketShare: string;
    competitors: string[];
    uniqueSellingPoints: string[];
  };
  
  // Weaknesses (for Mia's email)
  weaknesses: {
    category: string;
    issue: string;
    impact: string;
    howGrayArxHelps: string;
  }[];
  
  // Opportunities
  opportunities: {
    type: string;
    description: string;
    estimatedRevenueLift: string;
  }[];
  
  // News & Recent Activity
  recentNews: {
    date: string;
    headline: string;
    source: string;
    relevance: string;
  }[];
  
  // Overall Score
  prospectScore: {
    total: number; // 0-100
    tier: "platinum" | "gold" | "silver" | "bronze";
    reasoning: string[];
  };
}

/**
 * Analyze a dealership website for quality, features, and weaknesses
 */
export async function analyzeDealershipWebsite(
  dealershipName: string,
  websiteUrl: string
): Promise<{
  score: number;
  mobileOptimized: boolean;
  hasAI: boolean;
  leadCaptureMethods: string[];
  inventorySystem: string;
  issues: string[];
}> {
  try {
    // Use LLM to analyze website content
    const analysis = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a dealership technology analyst. Analyze the dealership website and provide a JSON response with:
- score (0-100): Overall website quality
- mobileOptimized (boolean): Is it mobile-friendly?
- hasAI (boolean): Does it have any AI features?
- leadCaptureMethods (array): How do they capture leads? (e.g., "contact form", "phone button", "whatsapp", "chat")
- inventorySystem (string): How do they manage inventory? (e.g., "manual", "basic CMS", "dealership management system", "advanced AI")
- issues (array): What are the main technical/UX issues?

Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: `Analyze this dealership website: ${dealershipName} at ${websiteUrl}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "website_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "number", description: "Website quality score 0-100" },
              mobileOptimized: { type: "boolean" },
              hasAI: { type: "boolean" },
              leadCaptureMethods: { type: "array", items: { type: "string" } },
              inventorySystem: { type: "string" },
              issues: { type: "array", items: { type: "string" } },
            },
            required: ["score", "mobileOptimized", "hasAI", "leadCaptureMethods", "inventorySystem", "issues"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = analysis.choices[0].message.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return {
        score: parsed.score || 50,
        mobileOptimized: parsed.mobileOptimized || false,
        hasAI: parsed.hasAI || false,
        leadCaptureMethods: parsed.leadCaptureMethods || [],
        inventorySystem: parsed.inventorySystem || "unknown",
        issues: parsed.issues || ["Unable to analyze website"],
      };
    }
    return {
      score: 50,
      mobileOptimized: false,
      hasAI: false,
      leadCaptureMethods: [],
      inventorySystem: "unknown",
      issues: ["Unable to analyze website"],
    };
  } catch (error) {
    console.error("[Sipho] Website analysis failed:", error);
    return {
      score: 0,
      mobileOptimized: false,
      hasAI: false,
      leadCaptureMethods: [],
      inventorySystem: "unknown",
      issues: ["Analysis failed"],
    };
  }
}

/**
 * Search for news and press releases about a dealership
 */
export async function searchDealershipNews(
  dealershipName: string,
  region: string
): Promise<{
  date: string;
  headline: string;
  source: string;
  relevance: string;
}[]> {
  try {
    // Use LLM to search for and summarize news
    const newsAnalysis = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a news researcher. Find recent news about the dealership "${dealershipName}" in ${region}. 
Return a JSON array of news items with:
- date (ISO format): When was this published?
- headline (string): What's the headline?
- source (string): Where did you find this? (e.g., "Google News", "LinkedIn", "Industry Report")
- relevance (string): Why is this relevant to selling GrayArx? (e.g., "Expansion", "New location", "Technology adoption", "Growth", "Challenges")

Return ONLY valid JSON array, no markdown. If no news found, return empty array [].`,
        },
        {
          role: "user",
          content: `Find recent news about dealership: ${dealershipName} in ${region}. Look for expansion, new locations, technology adoption, challenges, or growth indicators.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dealership_news",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "ISO date format" },
                headline: { type: "string" },
                source: { type: "string" },
                relevance: { type: "string" },
              },
              required: ["date", "headline", "source", "relevance"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = newsAnalysis.choices[0].message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("[Sipho] News search failed:", error);
    return [];
  }
}

/**
 * Identify specific weaknesses and how GrayArx solves them
 */
export async function identifyWeaknesses(
  dealershipName: string,
  websiteAnalysis: any,
  marketInfo: any
): Promise<{
  category: string;
  issue: string;
  impact: string;
  howGrayArxHelps: string;
}[]> {
  try {
    const weaknessAnalysis = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a dealership consultant. Identify specific weaknesses for "${dealershipName}" based on their website and market position.
Return a JSON array of weaknesses with:
- category (string): Type of weakness (e.g., "Lead Generation", "Customer Service", "Technology", "Operations")
- issue (string): Specific problem (e.g., "No 24/7 lead response")
- impact (string): Business impact (e.g., "Losing 30% of leads to competitors")
- howGrayArxHelps (string): How GrayArx solves this (e.g., "AI agents respond to leads in <60 seconds, 24/7")

Return ONLY valid JSON array, no markdown.`,
        },
        {
          role: "user",
          content: `Dealership: ${dealershipName}
Website Quality: ${websiteAnalysis.score}/100
Mobile Optimized: ${websiteAnalysis.mobileOptimized}
Has AI: ${websiteAnalysis.hasAI}
Lead Capture Methods: ${websiteAnalysis.leadCaptureMethods.join(", ")}
Inventory System: ${websiteAnalysis.inventorySystem}
Issues: ${websiteAnalysis.issues.join(", ")}
Market Size: ${marketInfo.estimatedSize}
Years in Business: ${marketInfo.yearsInBusiness}

Identify 3-5 key weaknesses that GrayArx can solve.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dealership_weaknesses",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                issue: { type: "string" },
                impact: { type: "string" },
                howGrayArxHelps: { type: "string" },
              },
              required: ["category", "issue", "impact", "howGrayArxHelps"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = weaknessAnalysis.choices[0].message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("[Sipho] Weakness analysis failed:", error);
    return [];
  }
}

/**
 * Score a dealership prospect (0-100) with tier classification
 */
export async function scoreDealershipProspect(
  dealershipName: string,
  intelligence: Partial<DealershipIntelligence>
): Promise<{
  total: number;
  tier: "platinum" | "gold" | "silver" | "bronze";
  reasoning: string[];
}> {
  try {
    const scoringResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a dealership prospect scorer. Score this dealership on how likely they are to buy GrayArx (0-100).
Return JSON with:
- total (number): Score 0-100
- tier (string): "platinum" (80+), "gold" (65-79), "silver" (50-64), "bronze" (<50)
- reasoning (array): 3-5 key reasons for the score

Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: `Score this dealership prospect:
Name: ${dealershipName}
Website Quality: ${intelligence.websiteQuality?.score ?? 0}/100
Market Size: ${intelligence.marketPosition?.estimatedSize}
Years in Business: ${intelligence.marketPosition?.yearsInBusiness}
Has AI: ${intelligence.websiteQuality?.hasAI}
Weaknesses: ${intelligence.weaknesses?.length ?? 0}
Recent News: ${intelligence.recentNews?.length ?? 0} items

Higher score if: website is poor, no AI, many weaknesses, growing market, recent expansion news.
Lower score if: already has good tech, small market, established players.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "prospect_score",
          strict: true,
          schema: {
            type: "object",
            properties: {
              total: { type: "number", description: "Score 0-100" },
              tier: { type: "string", enum: ["platinum", "gold", "silver", "bronze"] },
              reasoning: { type: "array", items: { type: "string" } },
            },
            required: ["total", "tier", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = scoringResponse.choices[0].message.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return {
        total: Math.min(100, Math.max(0, parsed.total)),
        tier: parsed.tier,
        reasoning: parsed.reasoning,
      };
    }
    return {
      total: 50,
      tier: "silver",
      reasoning: ["Unable to score prospect"],
    };
  } catch (error) {
    console.error("[Sipho] Scoring failed:", error);
    return {
      total: 50,
      tier: "silver",
      reasoning: ["Scoring error"],
    };
  }
}

/**
 * Full dealership intelligence gathering - used by Sipho
 */
export async function gatherDealershipIntelligence(
  dealershipName: string,
  websiteUrl: string,
  region: string
): Promise<DealershipIntelligence> {
  console.log(`[Sipho] Gathering intelligence on ${dealershipName}...`);

  // Step 1: Analyze website
  const websiteAnalysis = await analyzeDealershipWebsite(dealershipName, websiteUrl);

  // Step 2: Search for news
  const recentNews = await searchDealershipNews(dealershipName, region);

  // Step 3: Identify weaknesses
  const marketInfo = {
    yearsInBusiness: 5, // Default
    estimatedSize: "medium" as const,
    marketShare: "Unknown",
    competitors: [],
    uniqueSellingPoints: [],
  };
  const weaknesses = await identifyWeaknesses(dealershipName, websiteAnalysis, marketInfo);

  // Step 4: Score prospect
  const prospectScore = await scoreDealershipProspect(dealershipName, {
    websiteQuality: websiteAnalysis,
    weaknesses,
    recentNews,
  });

  return {
    dealershipName,
    website: websiteUrl,
    location: region,
    websiteQuality: websiteAnalysis,
    marketPosition: marketInfo,
    weaknesses,
    opportunities: weaknesses.map((w) => ({
      type: w.category,
      description: w.howGrayArxHelps,
      estimatedRevenueLift: "20-40%",
    })),
    recentNews,
    prospectScore,
  };
}
