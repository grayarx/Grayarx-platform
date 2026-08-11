/**
 * Autonomous Sipho principal-email enrichment — request-bound like Kagiso audit.
 * Runs in the background every ENRICH_INTERVAL_MS when traffic hits the app,
 * so it keeps working even when external cron is misconfigured.
 */

import type { Express, NextFunction, Request, Response } from "express";

/** How long to wait between autonomous enrich ticks (default 4 hours). */
export const PRINCIPAL_ENRICH_INTERVAL_MS = 4 * 60 * 60 * 1000;

let isRunning = false;
let lastRunCache: number | null = null;

export type EnrichTriggerResult =
  | {
      ran: true;
      examined: number;
      enriched: number;
      created: number;
      updated: number;
    }
  | { ran: false; reason: "running" | "fresh"; lastRunAt: Date | null };

export async function triggerPrincipalEnrichmentIfDue(
  force = false,
): Promise<EnrichTriggerResult> {
  if (isRunning) {
    return {
      ran: false,
      reason: "running",
      lastRunAt: lastRunCache ? new Date(lastRunCache) : null,
    };
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
    const result = await runPrincipalEnrichmentTick({ limit: 8 });
    lastRunCache = Date.now();
    console.log("[PrincipalEnrich] autonomous tick", {
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

export function attachPrincipalEnrichmentMiddleware(app: Express): void {
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    void triggerPrincipalEnrichmentIfDue(false).catch(() => {
      /* logged inside */
    });
    next();
  });
}
