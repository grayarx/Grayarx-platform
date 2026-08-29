/**
 * Always-on Sipho — researches dealer principals continuously.
 *
 * Model: every tick, import any known-good named emails, then dig deep on
 * a small batch of dealers. New principals appear in Prospector when found.
 */

import type { Express, NextFunction, Request, Response } from "express";
import { isLivenessPath } from "./livenessHealth";

/** Steady drip cadence. */
export const PRINCIPAL_ENRICH_INTERVAL_MS = 10 * 60 * 1000;

/** Dealers to deep-research per tick (after importing ready known emails). */
export const PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT = 2;

let isRunning = false;
let lastRunCache: number | null = null;
let alwaysOnTimer: ReturnType<typeof setInterval> | null = null;

export type EnrichTriggerResult =
  | {
      ran: true;
      examined: number;
      enriched: number;
      created: number;
      updated: number;
      importedReady: number;
    }
  | { ran: false; reason: "running" | "fresh" | "scout_busy" | "error"; lastRunAt: Date | null };

export async function triggerPrincipalEnrichmentIfDue(
  force = false,
  opts?: { limit?: number },
): Promise<EnrichTriggerResult> {
  if (isRunning) {
    return {
      ran: false,
      reason: "running",
      lastRunAt: lastRunCache ? new Date(lastRunCache) : null,
    };
  }

  try {
    const { isScoutResearchJobRunning } = await import("./scoutResearchJob");
    if (isScoutResearchJobRunning()) {
      return {
        ran: false,
        reason: "scout_busy",
        lastRunAt: lastRunCache ? new Date(lastRunCache) : null,
      };
    }
  } catch {
    /* scout module optional during early boot */
  }

  if (!force && lastRunCache && Date.now() - lastRunCache < PRINCIPAL_ENRICH_INTERVAL_MS) {
    return {
      ran: false,
      reason: "fresh",
      lastRunAt: new Date(lastRunCache),
    };
  }

  isRunning = true;
  try {
    const { runPrincipalEnrichmentTick } = await import("./principalEnrichmentRunner");
    const limit = opts?.limit ?? PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT;
    const result = await runPrincipalEnrichmentTick({ limit, deep: true });
    lastRunCache = Date.now();
    console.log("[PrincipalEnrich] always-on tick", {
      examined: result.examined,
      enriched: result.enriched,
      created: result.created,
      updated: result.updated,
      importedReady: result.importedReady,
    });
    return {
      ran: true,
      examined: result.examined,
      enriched: result.enriched,
      created: result.created,
      updated: result.updated,
      importedReady: result.importedReady,
    };
  } catch (err) {
    console.error("[PrincipalEnrich] tick failed", err);
    return {
      ran: false,
      reason: "error",
      lastRunAt: lastRunCache ? new Date(lastRunCache) : null,
    };
  } finally {
    isRunning = false;
  }
}

/** Background timer — keep referenced so Railway keeps firing it. */
export function startAlwaysOnPrincipalEnrichment(): void {
  if (alwaysOnTimer) return;
  // First dig shortly after boot (don’t block listen)
  setTimeout(() => {
    void triggerPrincipalEnrichmentIfDue(true).catch(() => {});
  }, 20_000);
  alwaysOnTimer = setInterval(() => {
    void triggerPrincipalEnrichmentIfDue(false).catch(() => {});
  }, PRINCIPAL_ENRICH_INTERVAL_MS);
  // NOTE: do NOT unref — unref allowed idle Railway dynos to skip the drip.
  console.log(
    `[PrincipalEnrich] always-on started — import ready + dig ${PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT} every ${PRINCIPAL_ENRICH_INTERVAL_MS / 60_000} min`,
  );
}

export function attachPrincipalEnrichmentMiddleware(app: Express): void {
  // Timer starts after listen() so the first Railway probe is not competing with Sipho.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (isLivenessPath(req.originalUrl || req.url || "")) {
      next();
      return;
    }
    void triggerPrincipalEnrichmentIfDue(false).catch(() => {
      /* logged inside */
    });
    next();
  });
}
