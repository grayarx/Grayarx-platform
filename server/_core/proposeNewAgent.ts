/**
 * Kagiso's meta-agent capability: proposeNewAgent
 * 
 * Analyzes dealership gaps and proposes new agents with:
 * - Gap analysis (what's missing, why)
 * - Persona draft (name, role, email, description)
 * - Sample output (what it would produce)
 * - Impact estimate (expected KPI improvement)
 * - Ask-first approval flow (dealer approves before agent is spun up)
 */

import { invokeLLM } from "./llm";

export type ProposedAgent = {
  name: string;
  role: string;
  email: string;
  description: string;
  sampleOutput: string;
  impactEstimate: string;
  confidence: number; // 0-1, how sure Kagiso is about the need
  evidence: {
    gapAnalysis: string;
    dealershipContext: string;
    estimatedROI: string;
  };
};

export type ProposalContext = {
  dealershipId: number;
  dealershipName: string;
  currentAgents: string[];
  recentActivity: string;
  kpis: {
    leadResponseTime: number; // minutes
    conversionRate: number; // 0-1
    invoiceProcessingTime: number; // hours
    invoiceAccuracy: number; // 0-1
    manualApprovalRate: number; // 0-1 (how many drafts need human review)
  };
  languageCoverage: string[]; // e.g. ["en", "af", "zu"]
  painPoints: string[]; // e.g. ["manual invoicing", "slow follow-ups"]
};

/**
 * Kagiso analyzes dealership context and proposes a new agent.
 * Returns a structured proposal that goes into improvement_actions table
 * with status='pending_approval' and category='new_agent_proposal'.
 */
export async function proposeNewAgent(
  context: ProposalContext
): Promise<ProposedAgent> {
  const systemPrompt = `You are Kagiso, GrayArx's Improvement Agent. You analyze dealership operations and propose new AI agents to fill gaps.

Your job is to:
1. Identify what's missing (gap analysis)
2. Design a new agent persona (name, role, email, description)
3. Show a sample output (what it would produce)
4. Estimate the impact (expected KPI improvement)
5. Provide confidence (0-1, how sure you are)

Be specific and grounded. Propose agents that solve real problems, not hypothetical ones.
Always respond in valid JSON.`;

  const userPrompt = `Dealership: ${context.dealershipName}
Current agents: ${context.currentAgents.join(", ")}
Recent activity: ${context.recentActivity}

KPIs:
- Lead response time: ${context.kpis.leadResponseTime} minutes
- Conversion rate: ${(context.kpis.conversionRate * 100).toFixed(1)}%
- Invoice processing time: ${context.kpis.invoiceProcessingTime} hours
- Invoice accuracy: ${(context.kpis.invoiceAccuracy * 100).toFixed(1)}%
- Manual approval rate: ${(context.kpis.manualApprovalRate * 100).toFixed(1)}%

Language coverage: ${context.languageCoverage.join(", ")}
Reported pain points: ${context.painPoints.join("; ")}

Propose ONE new agent that would have the highest impact. Return JSON with:
{
  "name": "Agent name (e.g., Thandi)",
  "role": "Role title (e.g., Accountant Agent)",
  "email": "firstname@grayarx.com",
  "description": "One-line description of what it does",
  "sampleOutput": "Example of what this agent would produce (e.g., an invoice draft)",
  "impactEstimate": "Expected improvement (e.g., 'reduce invoice processing time from 4h to 1h')",
  "confidence": 0.85,
  "evidence": {
    "gapAnalysis": "Why this gap exists",
    "dealershipContext": "Why this dealership specifically needs it",
    "estimatedROI": "Time saved, accuracy gained, etc."
  }
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "proposed_agent",
        strict: true,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            email: { type: "string" },
            description: { type: "string" },
            sampleOutput: { type: "string" },
            impactEstimate: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            evidence: {
              type: "object",
              properties: {
                gapAnalysis: { type: "string" },
                dealershipContext: { type: "string" },
                estimatedROI: { type: "string" },
              },
              required: ["gapAnalysis", "dealershipContext", "estimatedROI"],
            },
          },
          required: [
            "name",
            "role",
            "email",
            "description",
            "sampleOutput",
            "impactEstimate",
            "confidence",
            "evidence",
          ],
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM returned empty response");
  }

  const parsed = JSON.parse(content) as ProposedAgent;
  return parsed;
}
