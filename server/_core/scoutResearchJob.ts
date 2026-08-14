/**
 * Background Sipho scout job — website research without blocking the HTTP request.
 * Generate prospects used to scrape many sites inline and hit Railway/proxy timeouts
 * (HTML error page → "Unexpected token '<' ... is not valid JSON").
 *
 * Design notes:
 * - Fast path only (site pages + light web snippets). Full multi-source crawl is for
 *   scheduled enrich ticks — Generate must finish in ~1–2 minutes, not hang per dealer.
 * - Dealers with no named email get a cooldown so the queue number moves down.
 * - Multiple short waves until deadline or target count.
 */

import { createProspects, listProspects, logAgentActivity } from "../db";
import {
  pickNextProspectsForResearch,
  countResearchableProspects,
  countCooldownProspects,
  markProspectResearchAttempted,
} from "./saProspectPool";
import { enrichDealershipPrincipal } from "./prospectPrincipalEnrichment";
import { runPrincipalEnrichmentTick } from "./principalEnrichmentRunner";

let scoutJobRunning = false;
let lastScoutJobAt: number | null = null;
let lastScoutJobSummary: {
  created: number;
  researched: number;
  researchRemaining: number;
  coolingDown: number;
  names: string[];
  finishedAt: number;
} | null = null;

export function isScoutResearchJobRunning(): boolean {
  return scoutJobRunning;
}

export function getLastScoutJobSummary() {
  return lastScoutJobSummary;
}

export async function runScoutResearchJob(input: {
  region: string;
  count: number;
}): Promise<void> {
  if (scoutJobRunning) {
    console.log("[ScoutJob] already running — skip");
    return;
  }
  scoutJobRunning = true;
  lastScoutJobAt = Date.now();
  try {
    let existingRows = await listProspects(1000);
    let existingNames = existingRows.map((r) => r.dealershipName);

    // Import known-good named emails + small enrich retry (idempotent import inside)
    const { runPrincipalEnrichmentTick } = await import("./principalEnrichmentRunner");
    const retry = await runPrincipalEnrichmentTick({
      limit: Math.min(2, input.count),
      deep: false,
    });

    let created = retry.created;
    let researched = retry.examined;
    const foundNames: string[] = retry.results
      .filter((r) => r.status === "enriched")
      .map((r) => r.dealershipName);
    if (retry.importedReady > 0) {
      existingRows = await listProspects(1000);
      existingNames = existingRows.map((r) => r.dealershipName);
    }

    // ~90s wall clock — enough for several fast site checks, not one slow "everywhere" crawl
    const deadline = Date.now() + 90_000;
    const target = Math.min(Math.max(input.count, 1), 8);

    while (Date.now() < deadline && created < target) {
      existingRows = await listProspects(1000);
      existingNames = existingRows.map((r) => r.dealershipName);
      const remainingSlots = target - created;
      const { batch } = pickNextProspectsForResearch(
        [...existingNames, ...foundNames],
        Math.min(remainingSlots, 4),
      );
      if (batch.length === 0) break;

      for (const p of batch) {
        if (Date.now() > deadline) break;
        if (created >= target) break;

        researched += 1;
        // Always cool down after an attempt so "67 left" moves when sites only have info@
        markProspectResearchAttempted(p.name);

        const result = await enrichDealershipPrincipal(
          {
            dealershipName: p.name,
            website: p.website,
            city: p.city,
            region: p.province,
            phone: p.phone,
            brandsCarried: p.brands.join(", "),
            estimatedMonthlyVolume: p.estimatedMonthlyVolume,
          },
          { fast: true },
        );
        if (result.status !== "enriched" || !result.hit) continue;
        const hit = result.hit;
        await createProspects([
          {
            dealershipName: p.name,
            region: p.province,
            city: p.city,
            phone: p.phone,
            email: hit.email,
            website: p.website ?? "",
            estimatedMonthlyVolume: p.estimatedMonthlyVolume,
            brandsCarried: p.brands.join(", "),
            score:
              p.segment === "luxury" || p.segment === "exotic"
                ? 88
                : p.segment === "volume"
                  ? 82
                  : 72,
            rationale: `Auto-researched principal contact from ${hit.evidenceUrl}`,
            status: "scouted",
            sourceNotes: `Sipho website research — ${input.region} | email_quality=${hit.quality} | source=${hit.source}`,
            contactName: hit.contactName,
            contactRole: hit.contactRole,
            emailVerified: 1,
            emailSource: hit.source,
            enrichedAt: new Date(),
            enrichmentNotes: result.notes,
          },
        ]);
        created += 1;
        foundNames.push(p.name);
      }
    }

    const allKnown = [...existingNames, ...foundNames];
    const researchRemaining = countResearchableProspects(allKnown);
    const coolingDown = countCooldownProspects(allKnown);

    lastScoutJobSummary = {
      created,
      researched,
      researchRemaining,
      coolingDown,
      names: foundNames,
      finishedAt: Date.now(),
    };

    await logAgentActivity({
      agentId: "prospector",
      action: "scouted_batch_research",
      subjectType: "prospect",
      summary: `Sipho checked ${researched} dealer site${researched === 1 ? "" : "s"}: ${created} named/principal contact${created === 1 ? "" : "s"} found. ${researchRemaining} still in active queue (${coolingDown} cooling down).`,
      payload: lastScoutJobSummary,
    });

    console.log("[ScoutJob] done", lastScoutJobSummary);
  } catch (err) {
    console.error("[ScoutJob] failed", err);
  } finally {
    scoutJobRunning = false;
  }
}

export function getScoutJobMeta() {
  return {
    running: scoutJobRunning,
    lastStartedAt: lastScoutJobAt,
    lastResult: lastScoutJobSummary,
  };
}
