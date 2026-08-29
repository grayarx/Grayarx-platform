/**
 * Persist Sipho research cooldowns so Railway restarts do not re-scrape
 * the same info@-only sites.
 *
 * Memory is the hot path (sync filters). DB is write-through + hydrate-on-tick.
 * Tests can use the in-memory adapter without DATABASE_URL.
 */

import { websiteHost } from "../../shared/prospectEmailQuality";

export type ResearchAttemptStatus = "no_named_email" | "fetch_failed" | "hit";

export const RESEARCH_COOLDOWN_MS = 2 * 60 * 60 * 1000;

export type ResearchAttemptRecord = {
  researchKey: string;
  dealershipName: string | null;
  lastAttemptAt: Date;
  lastStatus: ResearchAttemptStatus;
  cooldownUntil: Date;
  notes: string | null;
};

type MemoryRow = {
  until: number;
  status: ResearchAttemptStatus;
  lastAttemptAt: number;
};

const memory = new Map<string, MemoryRow>();

/** Stable tenant/pool key: website host, else prospect id, else dealership name. */
export function researchKeyFrom(input: {
  website?: string | null;
  prospectId?: number | null;
  name?: string | null;
}): string {
  const host = websiteHost(input.website ?? "");
  if (host) return `host:${host}`;
  if (input.prospectId && Number.isFinite(input.prospectId) && input.prospectId > 0) {
    return `prospect:${input.prospectId}`;
  }
  const name = (input.name ?? "").toLowerCase().trim();
  if (name) return `name:${name}`;
  return "unknown";
}

export function _clearResearchCooldownsForTests(): void {
  memory.clear();
}

export function markResearchAttemptedInMemory(
  key: string,
  opts?: { status?: ResearchAttemptStatus; cooldownMs?: number; now?: number },
): { until: number; status: ResearchAttemptStatus } {
  const now = opts?.now ?? Date.now();
  const status = opts?.status ?? "no_named_email";
  const cooldownMs =
    opts?.cooldownMs ?? (status === "hit" ? 0 : RESEARCH_COOLDOWN_MS);
  const until = now + cooldownMs;
  memory.set(key, { until, status, lastAttemptAt: now });
  return { until, status };
}

export function isResearchOnCooldown(key: string, now = Date.now()): boolean {
  const row = memory.get(key);
  if (!row) return false;
  if (row.until <= now) {
    memory.delete(key);
    return false;
  }
  return true;
}

/** Test helper — seed a future cooldown without touching the DB. */
export function seedResearchCooldownForTests(
  key: string,
  cooldownUntilMs: number,
  status: ResearchAttemptStatus = "no_named_email",
): void {
  memory.set(key, {
    until: cooldownUntilMs,
    status,
    lastAttemptAt: Date.now(),
  });
}

export async function hydrateResearchCooldownsFromDb(): Promise<number> {
  try {
    const { listActiveProspectResearchAttempts } = await import("../db");
    const rows = await listActiveProspectResearchAttempts();
    const now = Date.now();
    let n = 0;
    for (const row of rows) {
      const until = row.cooldownUntil?.getTime() ?? 0;
      if (until <= now) continue;
      memory.set(row.researchKey, {
        until,
        status: row.lastStatus,
        lastAttemptAt: row.lastAttemptAt.getTime(),
      });
      n += 1;
    }
    return n;
  } catch (err) {
    console.warn("[ResearchCooldown] hydrate failed", err);
    return 0;
  }
}

export async function persistResearchAttempt(input: {
  website?: string | null;
  prospectId?: number | null;
  name?: string | null;
  status: ResearchAttemptStatus;
  notes?: string | null;
  cooldownMs?: number;
}): Promise<string> {
  const key = researchKeyFrom(input);
  const { until } = markResearchAttemptedInMemory(key, {
    status: input.status,
    cooldownMs: input.cooldownMs,
  });
  try {
    const { upsertProspectResearchAttempt } = await import("../db");
    await upsertProspectResearchAttempt({
      researchKey: key,
      dealershipName: input.name ?? null,
      lastStatus: input.status,
      cooldownUntil: new Date(until),
      notes: input.notes ?? null,
    });
  } catch (err) {
    console.warn("[ResearchCooldown] persist failed", err);
  }
  return key;
}
