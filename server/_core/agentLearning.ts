/**
 * Cross-agent learning — tracks patterns of success/failure and
 * feeds them back to Kagiso as improvement findings.
 */
import { listAgentActivity, createImprovementAction } from "../db";
import { invokeLLM } from "./llm";
import type { AgentId } from "../../shared/agents";

const ALL_AGENT_IDS: string[] = [
  "whatsapp",
  "improvement",
  "booking",
  "tradein",
  "email",
  "prospector",
  "accountant",
  "fallback",
  "preapproval",
  "calling",
];

/**
 * Called when a circuit breaker opens.
 * Creates a critical improvement_action finding for Kagiso to review.
 */
export async function reportCircuitBreakerOpen(
  serviceName: string,
): Promise<void> {
  try {
    await createImprovementAction({
      category: "agent_quality",
      severity: "critical",
      title: `Circuit breaker open: ${serviceName}`,
      finding: `The circuit breaker for service "${serviceName}" has opened due to repeated consecutive failures. All calls to this service are currently blocked until the recovery window elapses.`,
      suggestedFix:
        "Check API credentials and billing. Top up quota or rotate token. Review recent error logs for root cause.",
      autoApplicable: 0,
    });
  } catch (err) {
    console.error("[AgentLearning] reportCircuitBreakerOpen failed:", err);
  }
}

/**
 * Analyse recent agent_activity to find patterns:
 * - Which actions fail most often (outcome_failure entries)
 * - Which agent is most active
 * - Which agents have gone silent (no activity in 24h when they had prior activity)
 */
export async function analyseAgentPatterns(): Promise<{
  silentAgents: string[];
  failurePatterns: Array<{
    agentId: string;
    action: string;
    failureCount: number;
  }>;
  mostActiveAgent: string | null;
}> {
  const rows = await listAgentActivity({ limit: 200 });

  const now = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;

  const agentLastSeen: Record<string, number> = {};
  const agentCounts: Record<string, number> = {};
  const failureCounts: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    const id = row.agentId;
    const ts = new Date(row.createdAt).getTime();

    if (!agentLastSeen[id] || ts > agentLastSeen[id]) {
      agentLastSeen[id] = ts;
    }
    agentCounts[id] = (agentCounts[id] ?? 0) + 1;

    if (row.action.startsWith("outcome_failure")) {
      if (!failureCounts[id]) failureCounts[id] = {};
      failureCounts[id][row.action] =
        (failureCounts[id][row.action] ?? 0) + 1;
    }
  }

  // Silent = had some history but nothing in the last 24 hours
  const silentAgents = ALL_AGENT_IDS.filter((id) => {
    const lastSeen = agentLastSeen[id];
    if (!lastSeen) return false;
    return now - lastSeen > twentyFourHoursMs;
  });

  const failurePatterns: Array<{
    agentId: string;
    action: string;
    failureCount: number;
  }> = [];
  for (const [agentId, actions] of Object.entries(failureCounts)) {
    for (const [action, count] of Object.entries(actions)) {
      failurePatterns.push({ agentId, action, failureCount: count });
    }
  }
  failurePatterns.sort((a, b) => b.failureCount - a.failureCount);

  let mostActiveAgent: string | null = null;
  let maxCount = 0;
  for (const [id, count] of Object.entries(agentCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostActiveAgent = id;
    }
  }

  return { silentAgents, failurePatterns, mostActiveAgent };
}

/**
 * Generate a natural-language learning summary for a given agent.
 * Used by the agent chat interface to answer "what have you learned?"
 */
export async function getAgentLearningSummary(agentId: string): Promise<string> {
  const rows = await listAgentActivity({
    agentId: agentId as AgentId,
    limit: 20,
  });

  if (rows.length === 0) {
    return `${agentId} has no recorded activity yet. As interactions accumulate, a learning profile will build automatically.`;
  }

  const activitySummary = rows
    .map(
      (r) =>
        `- [${new Date(r.createdAt).toISOString().slice(0, 16)}] ${r.action}: ${r.summary}`,
    )
    .join("\n");

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are summarising an AI agent's recent activity log. Write 2-3 sentences describing what the agent has been doing, what patterns you observe, and any notable outcomes. Be concise and factual. Do not use phrases like 'As an AI'.",
        },
        {
          role: "user",
          content: `Agent: ${agentId}\n\nRecent activity:\n${activitySummary}`,
        },
      ],
    });
    return (
      result.choices?.[0]?.message?.content?.toString() ??
      "Unable to generate summary at this time."
    );
  } catch {
    const actions = rows.map((r) => r.action);
    const uniqueActions = [...new Set(actions)];
    return `${agentId} has logged ${rows.length} recent activities across ${uniqueActions.length} action type(s): ${uniqueActions.slice(0, 3).join(", ")}. Most recent: ${rows[0]?.summary ?? "N/A"}.`;
  }
}
