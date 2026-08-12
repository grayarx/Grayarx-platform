/**
 * Background Sipho scout job — website research without blocking the HTTP request.
 * Generate prospects used to scrape many sites inline and hit Railway/proxy timeouts
 * (HTML error page → "Unexpected token '<' ... is not valid JSON").
 */

import { createProspects, listProspects, logAgentActivity } from "../db";
import {
  pickNextProspectsForResearch,
  countResearchableProspects,
} from "./saProspectPool";
import { enrichDealershipPrincipal } from "./prospectPrincipalEnrichment";
import { runPrincipalEnrichmentTick } from "./principalEnrichmentRunner";

let scoutJobRunning = false;
let lastScoutJobAt: number | null = null;
let lastScoutJobSummary: {
  created: number;
  researched: number;
  researchRemaining: number;
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
    const existingRows = await listProspects(1000);
    const existingNames = existingRows.map((r) => r.dealershipName);

    // Fast retry on existing incomplete rows (small batch)
    const retry = await runPrincipalEnrichmentTick({ limit: Math.min(3, input.count) });

    const { batch } = pickNextProspectsForResearch(
      existingNames,
      Math.min(input.count, 5),
    );

    let created = retry.created;
    const foundNames: string[] = retry.results
      .filter((r) => r.status === "enriched")
      .map((r) => r.dealershipName);

    // Budget: stop after ~45s so we don't burn the process
    const deadline = Date.now() + 45_000;

    for (const p of batch) {
      if (Date.now() > deadline) break;
      if (created >= input.count) break;

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

    const researchRemaining = countResearchableProspects([
      ...existingNames,
      ...foundNames,
    ]);

    lastScoutJobSummary = {
      created,
      researched: batch.length + retry.examined,
      researchRemaining,
      names: foundNames,
      finishedAt: Date.now(),
    };

    await logAgentActivity({
      agentId: "prospector",
      action: "scouted_batch_research",
      subjectType: "prospect",
      summary: `Sipho finished background research: ${created} named/principal contact${created === 1 ? "" : "s"} from dealer websites. ${researchRemaining} left to research.`,
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
