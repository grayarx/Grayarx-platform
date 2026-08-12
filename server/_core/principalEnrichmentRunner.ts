/**
 * Sipho principal-email enrichment tick — picks targets, researches sites,
 * updates/creates prospects with named emails only.
 */

import {
  createProspects,
  listProspects,
  updateProspectContact,
  logAgentActivity,
} from "../db";
import { SA_PROSPECT_POOL } from "./saProspectPool";
import { PILOT_PROSPECTS } from "../../shared/pilotProspectSegments";
import { assessProspectEmail, isOutreachReadyForDealership } from "../../shared/prospectEmailQuality";
import {
  enrichDealershipPrincipal,
  type EnrichmentCandidate,
  type EnrichmentAttemptResult,
} from "./prospectPrincipalEnrichment";
import {
  isOnResearchCooldown,
  markProspectResearchAttempted,
} from "./saProspectPool";

const DEFAULT_LIMIT = 8;
/** Don't re-try the same prospect within this window after a failed enrich. */
export const ENRICH_RETRY_MS = 7 * 24 * 60 * 60 * 1000;

export type PrincipalEnrichTickResult = {
  examined: number;
  enriched: number;
  created: number;
  updated: number;
  failed: number;
  results: EnrichmentAttemptResult[];
};

function needsEnrichmentEmail(
  email: string | null | undefined,
  website?: string | null,
): boolean {
  if (!website?.trim()) return true;
  return !isOutreachReadyForDealership(email, website);
}

function staleEnrichment(enrichedAt: Date | null | undefined, now: number): boolean {
  if (!enrichedAt) return true;
  return now - enrichedAt.getTime() >= ENRICH_RETRY_MS;
}

/**
 * Build the work queue: DB prospects missing named emails, then SA pool /
 * pilot rows that aren't already in the DB with a good email.
 */
export async function collectPrincipalEnrichmentTargets(
  limit = DEFAULT_LIMIT,
): Promise<EnrichmentCandidate[]> {
  const now = Date.now();
  const existing = await listProspects(1000);
  const byName = new Map(
    existing.map((p) => [p.dealershipName.toLowerCase().trim(), p] as const),
  );

  const targets: EnrichmentCandidate[] = [];

  for (const p of existing) {
    if (targets.length >= limit) break;
    if (!needsEnrichmentEmail(p.email, p.website)) continue;
    const enrichedAt =
      "enrichedAt" in p && p.enrichedAt instanceof Date
        ? p.enrichedAt
        : (p as { enrichedAt?: Date | null }).enrichedAt ?? null;
    if (!staleEnrichment(enrichedAt, now)) continue;
    if (!p.website?.trim()) continue;
    targets.push({
      prospectId: p.id,
      dealershipName: p.dealershipName,
      website: p.website,
      city: p.city,
      region: p.region,
      phone: p.phone,
      brandsCarried: p.brandsCarried,
      estimatedMonthlyVolume: p.estimatedMonthlyVolume,
    });
  }

  // Pilot curated list — research sites for rows still on generic/missing email
  for (const p of PILOT_PROSPECTS) {
    if (targets.length >= limit) break;
    if (!needsEnrichmentEmail(p.email) && p.emailVerified) continue;
    if (!p.website?.trim()) continue;
    const existingRow = byName.get(p.dealershipName.toLowerCase().trim());
    if (existingRow && !needsEnrichmentEmail(existingRow.email)) continue;
    if (existingRow && !staleEnrichment(existingRow.enrichedAt ?? null, now)) continue;
    // Avoid duplicate dealership in this batch
    if (targets.some((t) => t.dealershipName.toLowerCase() === p.dealershipName.toLowerCase())) {
      continue;
    }
    targets.push({
      prospectId: existingRow?.id,
      dealershipName: p.dealershipName,
      website: p.website,
      city: p.city,
      region: p.region,
      phone: p.phone,
    });
  }

  for (const p of SA_PROSPECT_POOL) {
    if (targets.length >= limit) break;
    if (!needsEnrichmentEmail(p.email, p.website)) continue;
    if (!p.website?.trim()) continue;
    if (isOnResearchCooldown(p.name)) continue;
    const existingRow = byName.get(p.name.toLowerCase().trim());
    if (existingRow && !needsEnrichmentEmail(existingRow.email)) continue;
    if (existingRow && !staleEnrichment(existingRow.enrichedAt ?? null, now)) continue;
    if (targets.some((t) => t.dealershipName.toLowerCase() === p.name.toLowerCase())) {
      continue;
    }
    targets.push({
      prospectId: existingRow?.id,
      dealershipName: p.name,
      website: p.website,
      city: p.city,
      region: p.province,
      phone: p.phone,
      brandsCarried: p.brands.join(", "),
      estimatedMonthlyVolume: p.estimatedMonthlyVolume,
    });
  }

  return targets;
}

export async function runPrincipalEnrichmentTick(
  opts?: { limit?: number; deep?: boolean },
): Promise<PrincipalEnrichTickResult> {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const deep = opts?.deep === true;

  // Drop fake filler contacts that bounced (jane.doe / john.doe)
  const { isFillerEmail } = await import("../../shared/prospectEmailQuality");
  const { deleteProspect } = await import("../db");
  const existingForPurge = await listProspects(1000);
  for (const row of existingForPurge) {
    if (row.email && isFillerEmail(row.email)) {
      await deleteProspect(row.id);
    }
  }

  const targets = await collectPrincipalEnrichmentTargets(limit);
  const results: EnrichmentAttemptResult[] = [];
  let enriched = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const target of targets) {
    const result = await enrichDealershipPrincipal(target, {
      fast: !deep,
    });
    results.push(result);

    if (result.status !== "enriched" || !result.hit) {
      // Cool down pool dealers so always-on rotates; stamp DB rows too
      markProspectResearchAttempted(target.dealershipName);
      if (target.prospectId) {
        try {
          await updateProspectContact(target.prospectId, {
            enrichedAt: new Date(),
            enrichmentNotes: result.notes,
          });
        } catch (err) {
          console.warn("[PrincipalEnrich] failed to stamp enrichedAt", err);
        }
      }
      if (result.status === "fetch_failed") failed += 1;
      continue;
    }

    const hit = result.hit;
    const sourceNotes = [
      "sipho_principal_enrich",
      deep ? "mode=deep" : "mode=fast",
      `email_quality=${hit.quality}`,
      `source=${hit.source}`,
      `evidence=${hit.evidenceUrl}`,
    ].join(" | ");

    if (target.prospectId) {
      await updateProspectContact(target.prospectId, {
        email: hit.email,
        contactName: hit.contactName,
        contactRole: hit.contactRole,
        emailVerified: 1,
        emailSource: hit.source,
        enrichedAt: new Date(),
        enrichmentNotes: sourceNotes,
        sourceNotesAppend: sourceNotes,
      });
      updated += 1;
      enriched += 1;
    } else {
      await createProspects([
        {
          dealershipName: target.dealershipName,
          region: target.region ?? null,
          city: target.city ?? null,
          phone: target.phone ?? null,
          email: hit.email,
          website: target.website ?? null,
          estimatedMonthlyVolume: target.estimatedMonthlyVolume ?? null,
          brandsCarried: target.brandsCarried ?? null,
          score: Math.min(95, 70 + Math.round(hit.score / 5)),
          rationale: `Auto-enriched dealer principal contact (${hit.contactRole ?? hit.quality}) from ${hit.evidenceUrl}`,
          status: "scouted",
          sourceNotes,
          contactName: hit.contactName,
          contactRole: hit.contactRole,
          emailVerified: 1,
          emailSource: hit.source,
          enrichedAt: new Date(),
          enrichmentNotes: sourceNotes,
        },
      ]);
      created += 1;
      enriched += 1;
    }
  }

  if (enriched > 0 || targets.length > 0) {
    await logAgentActivity({
      agentId: "prospector",
      action: "principal_email_enrich_tick",
      subjectType: "prospect",
      summary:
        enriched > 0
          ? `Sipho found ${enriched} principal contact${enriched === 1 ? "" : "s"} (${results
              .filter((r) => r.status === "enriched")
              .map((r) => r.dealershipName)
              .slice(0, 3)
              .join(", ")}) — always-on drip.`
          : `Sipho checked ${targets.length} dealership${targets.length === 1 ? "" : "s"} — no public named inbox yet; will rotate to the next.`,
      payload: {
        examined: targets.length,
        enriched,
        updated,
        created,
        failed,
        deep,
        names: results.filter((r) => r.status === "enriched").map((r) => r.dealershipName),
      },
    });
  }

  return {
    examined: targets.length,
    enriched,
    created,
    updated,
    failed,
    results,
  };
}
