/**
 * Background Sipho scout job — website research without blocking the HTTP request.
 * Generate prospects used to scrape many sites inline and hit Railway/proxy timeouts
 * (HTML error page → "Unexpected token '<' ... is not valid JSON").
 *
 * Design notes:
 * - First GENERATE_DEEP_COUNT dealers get a full CONTACT_PATHS crawl (deep).
 * - Remaining dealers in the 90s window use the fast 5-page scan for volume.
 * - Always persist named email + phone when found.
 * - ICP yard cards are researched with the same enricher (not paste-only).
 */

import { createProspects, listProspects, logAgentActivity, updateProspectContact } from "../db";
import {
  pickNextProspectsForResearch,
  countResearchableProspects,
  countCooldownProspects,
  markProspectResearchAttempted,
} from "./saProspectPool";
import { enrichDealershipPrincipal } from "./prospectPrincipalEnrichment";
import { persistHitToIcpYard, researchIcpContacts } from "./icpContactResearch";

/** First N Generate dealers use full contact/about/team crawl (not the 5-page fast cap). */
export const GENERATE_DEEP_COUNT = 3;

let scoutJobRunning = false;
let lastScoutJobAt: number | null = null;
let lastScoutJobSummary: {
  created: number;
  researched: number;
  researchRemaining: number;
  coolingDown: number;
  names: string[];
  finishedAt: number;
  deepCount: number;
  fastCount: number;
  phonesFound: number;
  icpResearched: number;
  modeNote: string;
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

    const { runPrincipalEnrichmentTick } = await import("./principalEnrichmentRunner");
    const deepPass = await runPrincipalEnrichmentTick({
      limit: GENERATE_DEEP_COUNT,
      deep: true,
    });
    const retry = await runPrincipalEnrichmentTick({
      limit: Math.min(2, input.count),
      deep: false,
    });

    let created = deepPass.created + retry.created;
    let researched = deepPass.examined + retry.examined;
    let deepCount = deepPass.results.filter((r) => r.deep).length;
    let fastCount = deepPass.results.filter((r) => !r.deep).length + retry.results.length;
    let phonesFound =
      [...deepPass.results, ...retry.results].filter((r) => r.phone).length;
    const foundNames: string[] = [...deepPass.results, ...retry.results]
      .filter((r) => r.status === "enriched")
      .map((r) => r.dealershipName);

    if (deepPass.importedReady > 0 || retry.importedReady > 0) {
      existingRows = await listProspects(1000);
      existingNames = existingRows.map((r) => r.dealershipName);
    }

    const icp = await researchIcpContacts({
      limit: GENERATE_DEEP_COUNT,
      deep: true,
    });
    created += icp.emailsFound;
    researched += icp.researched;
    deepCount += icp.researched;
    phonesFound += icp.phonesFound;
    foundNames.push(...icp.names);

    // ~90s wall clock — deep first, then a fast tail for volume
    const deadline = Date.now() + 90_000;
    const target = Math.min(Math.max(input.count, 1), 8);
    let loopDeepLeft = GENERATE_DEEP_COUNT;

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
        markProspectResearchAttempted(p.name);

        const useDeep = loopDeepLeft > 0;
        if (useDeep) loopDeepLeft -= 1;
        if (useDeep) deepCount += 1;
        else fastCount += 1;

        const result = await enrichDealershipPrincipal(
          {
            dealershipName: p.name,
            website: p.website,
            city: p.city,
            region: p.province,
            phone: p.phone,
            brandsCarried: p.brands.join(", "),
            estimatedMonthlyVolume: p.estimatedMonthlyVolume,
            knownPeople: p.principalName
              ? [{ fullName: p.principalName, role: p.principalRole }]
              : undefined,
          },
          { deep: useDeep, fast: !useDeep },
        );

        persistHitToIcpYard(p.name, {
          phone: result.phone,
          email: result.hit?.email,
          contactName: result.hit?.contactName,
          website: p.website,
        });

        if (result.phone) phonesFound += 1;

        const existingMatch = existingRows.find(
          (row) => row.dealershipName.toLowerCase().trim() === p.name.toLowerCase().trim(),
        );
        if (existingMatch && result.phone) {
          await updateProspectContact(existingMatch.id, { phone: result.phone });
        }

        if (result.status !== "enriched" || !result.hit) continue;
        const hit = result.hit;
        await createProspects([
          {
            dealershipName: p.name,
            region: p.province,
            city: p.city,
            phone: result.phone ?? p.phone,
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
            sourceNotes: `Sipho website research — ${input.region} | email_quality=${hit.quality} | source=${hit.source} | mode=${useDeep ? "deep" : "fast"}`,
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
    const modeNote =
      `First ${GENERATE_DEEP_COUNT} dealers (or all if fewer): full contact/about/team crawl. ` +
      `Remaining Generate tail: fast 5-page scan.`;

    lastScoutJobSummary = {
      created,
      researched,
      researchRemaining,
      coolingDown,
      names: foundNames,
      finishedAt: Date.now(),
      deepCount,
      fastCount,
      phonesFound,
      icpResearched: icp.researched,
      modeNote,
    };

    await logAgentActivity({
      agentId: "prospector",
      action: "scouted_batch_research",
      subjectType: "prospect",
      summary: `Sipho checked ${researched} dealer site${researched === 1 ? "" : "s"} (${deepCount} deep, ${fastCount} fast): ${created} named/principal contact${created === 1 ? "" : "s"}, ${phonesFound} switchboard${phonesFound === 1 ? "" : "s"}. ${researchRemaining} still in active queue (${coolingDown} cooling down).`,
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
