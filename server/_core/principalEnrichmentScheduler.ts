/**
 * Always-on Sipho — researches dealer principals continuously.
 *
 * Model: dig deep on **one** dealership at a time, around the clock.
 * When a real named@dealer-domain contact is found, it appears in Prospector.
 * Generate is only a short burst; the steady drip is this scheduler.
 *
 * Runs on a timer (no traffic required) and also on HTTP requests as a backup.
 */

import type { Express, NextFunction, Request, Response } from "express";

/** Steady drip: one deep research pass every 15 minutes. */
export const PRINCIPAL_ENRICH_INTERVAL_MS = 15 * 60 * 1000;

/** How many dealers per always-on tick (1 = deliver singles as found). */
export const PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT = 1;

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
    }
  | { ran: false; reason: "running" | "fresh" | "scout_busy"; lastRunAt: Date | null };

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
    // Always-on uses full (non-fast) enrich so directories/press get a real dig
    const result = await runPrincipalEnrichmentTick({ limit, deep: true });
    lastRunCache = Date.now();
    console.log("[PrincipalEnrich] always-on tick", {
      examined: result.examined,
      enriched: result.enriched,
      created: result.created,
      updated: result.updated,
    });
    return {
      ran: true,
      examined: result.examined,
      enriched: result.enriched,
      created: result.created,
      updated: result.updated,
    };
  } catch (err) {
    console.error("[PrincipalEnrich] tick failed", err);
    throw err;
  } finally {
    isRunning = false;
  }
}

/** Background timer — works even when nobody is browsing the admin UI. */
export function startAlwaysOnPrincipalEnrichment(): void {
  if (alwaysOnTimer) return;
  // First dig shortly after boot (don’t block listen)
  setTimeout(() => {
    void triggerPrincipalEnrichmentIfDue(true).catch(() => {});
  }, 45_000);
  alwaysOnTimer = setInterval(() => {
    void triggerPrincipalEnrichmentIfDue(false).catch(() => {});
  }, PRINCIPAL_ENRICH_INTERVAL_MS);
  // Don’t keep the process alive solely for this timer in tests
  if (typeof alwaysOnTimer === "object" && alwaysOnTimer && "unref" in alwaysOnTimer) {
    alwaysOnTimer.unref();
  }
  console.log(
    `[PrincipalEnrich] always-on started — 1 dealership every ${PRINCIPAL_ENRICH_INTERVAL_MS / 60_000} min`,
  );
}

export function attachPrincipalEnrichmentMiddleware(app: Express): void {
  startAlwaysOnPrincipalEnrichment();
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    void triggerPrincipalEnrichmentIfDue(false).catch(() => {
      /* logged inside */
    });
    next();
  });
}
