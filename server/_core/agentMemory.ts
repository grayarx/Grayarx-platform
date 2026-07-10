/**
 * Agent memory — retrieves relevant past interactions from agent_activity
 * so agents can learn from what worked before.
 */
import { listAgentActivity, logAgentActivity } from "../db";
import type { AgentId } from "../../shared/agents";

export type MemoryEntry = {
  agentId: string;
  action: string;
  summary: string;
  payload: unknown;
  createdAt: Date;
};

function relevanceScore(
  query: string,
  entry: { action: string; summary: string },
): number {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const text = `${entry.action} ${entry.summary}`.toLowerCase();
  let score = 0;
  for (const word of words) {
    if (text.includes(word)) score++;
  }
  return score;
}

function parsePayload(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function rowToEntry(r: {
  agentId: string;
  action: string;
  summary: string;
  payload: unknown;
  createdAt: Date | string;
}): MemoryEntry {
  return {
    agentId: r.agentId,
    action: r.action,
    summary: r.summary,
    payload: parsePayload(r.payload),
    createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as string),
  };
}

/**
 * Retrieve the N most relevant past activities for a given agent + query.
 * Relevance: keyword overlap between query and activity summary/action.
 * Returns at most `limit` entries, newest first within matched set.
 * Falls back to most recent entries when no keyword matches exist.
 */
export async function getRelevantMemory(
  agentId: string,
  query: string,
  limit = 5,
): Promise<MemoryEntry[]> {
  const rows = await listAgentActivity({ agentId: agentId as AgentId, limit: 100 });
  const entries = rows.map(rowToEntry);

  const scored = entries
    .map((e) => ({ entry: e, score: relevanceScore(query, e) }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.entry.createdAt.getTime() - a.entry.createdAt.getTime(),
    );

  if (scored.length === 0) {
    return entries.slice(0, limit);
  }
  return scored.slice(0, limit).map((x) => x.entry);
}

/**
 * Retrieve recent cross-agent activities — what other agents did that might
 * be relevant context. Used by Kagiso and agentChat.
 */
export async function getCrossAgentMemory(
  query: string,
  limit = 8,
): Promise<MemoryEntry[]> {
  const rows = await listAgentActivity({ limit: 200 });
  const entries = rows.map(rowToEntry);

  const scored = entries
    .map((e) => ({ entry: e, score: relevanceScore(query, e) }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.entry.createdAt.getTime() - a.entry.createdAt.getTime(),
    );

  return scored.slice(0, limit).map((x) => x.entry);
}

/**
 * Record an outcome against a previous activity.
 * Appends an "outcome" entry to agent_activity so future retrievals
 * can see what worked.
 */
export async function recordOutcome(opts: {
  agentId: string;
  relatedAction: string;
  outcome: "success" | "failure" | "partial";
  detail: string;
}): Promise<void> {
  await logAgentActivity({
    agentId: opts.agentId as AgentId,
    action: `outcome_${opts.outcome}`,
    summary: `${opts.relatedAction}: ${opts.detail}`,
    payload: {
      relatedAction: opts.relatedAction,
      outcome: opts.outcome,
      detail: opts.detail,
    },
  });
}

/**
 * Build a memory context block for injection into an LLM system prompt.
 * Returns a formatted string of relevant past actions, or empty string if none.
 * Capped at 500 characters to keep prompts lean.
 */
export function formatMemoryContext(entries: MemoryEntry[]): string {
  if (entries.length === 0) return "";

  const lines = entries.map(
    (e) => `- [${e.agentId}] ${e.action}: ${e.summary}`,
  );
  const block = `Past context:\n${lines.join("\n")}`;

  if (block.length <= 500) return block;
  return block.slice(0, 497) + "…";
}
