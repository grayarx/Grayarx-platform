/**
 * Kagiso bug intake — when a dealer (or support form) reports a bug/error,
 * Kagiso opens a roadmap investigation + approveable improvement action.
 * Patches still require founder approval before apply (no unbounded prod write).
 */
import { createHash } from "node:crypto";
import {
  createImprovementAction,
  createRoadmapItem,
  findRoadmapByHash,
  logAgentActivity,
} from "../db";
import { getDb } from "../db";
import { supportTickets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type BugIntakeInput = {
  ticketId: number;
  dealershipId: number;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category?: string;
  source?: "dealer_help" | "support_form" | "fallback_inbox";
};

function bugHash(dealershipId: number, title: string): string {
  return createHash("sha256")
    .update(`dealer_bug:${dealershipId}:${title.trim().toLowerCase().slice(0, 120)}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Queue a Kagiso investigation for a reported bug.
 * Returns the roadmap item id (linked onto the support ticket when possible).
 */
export async function enqueueKagisoBugInvestigation(
  input: BugIntakeInput,
): Promise<{ roadmapId: number | null; improvementId: number | null }> {
  const hash = bugHash(input.dealershipId, input.title);
  const existing = await findRoadmapByHash(hash);
  let roadmapId = existing?.id ?? null;

  if (!roadmapId) {
    const priority =
      input.severity === "critical" || input.severity === "high"
        ? input.severity
        : "medium";

    const created = await createRoadmapItem({
      title: `[Bug #${input.ticketId}] ${input.title}`.slice(0, 255),
      description: [
        `Dealer-reported bug (ticket #${input.ticketId}, dealership ${input.dealershipId}).`,
        "",
        input.description.slice(0, 4000),
        "",
        "Kagiso: investigate root cause, draft a safe fix if allow-listed, then wait for founder approval before apply.",
      ].join("\n"),
      category: "agent_improvement",
      priority,
      severity: input.severity === "critical" ? "critical" : input.severity,
      creditCostEstimate: 2,
      source: "dealer_request",
      dealershipScope: String(input.dealershipId),
      hash,
      auditSection: "dealer_bug_report",
      agentAutonomous: false,
      humanRequired: true,
      rationale:
        "Dealer/support bug report — Kagiso investigates and proposes; founder approves before any production write.",
      evidenceJson: {
        ticketId: input.ticketId,
        dealershipId: input.dealershipId,
        category: input.category ?? "bug",
        intakeSource: input.source ?? "dealer_help",
      },
    });
    roadmapId = created.id || null;
  }

  let improvementId: number | null = null;
  if (roadmapId) {
    const action = await createImprovementAction({
      category: "general",
      severity: input.severity,
      title: `Investigate bug #${input.ticketId}: ${input.title}`.slice(0, 255),
      finding: input.description.slice(0, 2000),
      suggestedFix:
        "Investigate the reported error, draft a low-risk patch if one fits the safe allow-list, and leave it pending founder approval in Admin → Kagiso roadmap / proposed patches.",
      impactEstimate: "Restore dealer trust; unblock pilot go-live path",
      autoApplicable: 0,
      status: "pending_approval",
      confidence: "0.40",
      evidence: JSON.stringify({
        ticketId: input.ticketId,
        roadmapId,
        dealershipId: input.dealershipId,
      }),
      payload: JSON.stringify({ source: input.source ?? "dealer_help" }),
    });
    improvementId = action?.id ?? null;
  }

  if (roadmapId && input.source !== "fallback_inbox") {
    try {
      const db = await getDb();
      if (db) {
        await db
          .update(supportTickets)
          .set({ kagisoReferenceId: roadmapId, status: "in_progress" })
          .where(eq(supportTickets.id, input.ticketId));
      }
    } catch (e) {
      console.warn("[Kagiso] failed to link ticket → roadmap", e);
    }
  }

  void logAgentActivity({
    agentId: "improvement",
    action: "bug_intake",
    subjectType: "support_ticket",
    subjectId: input.ticketId,
    summary: `Kagiso queued investigation for ticket #${input.ticketId}: ${input.title.slice(0, 80)}`,
    payload: {
      ticketId: input.ticketId,
      roadmapId,
      improvementId,
      dealershipId: input.dealershipId,
      source: input.source ?? "dealer_help",
    },
  });

  return { roadmapId, improvementId };
}
