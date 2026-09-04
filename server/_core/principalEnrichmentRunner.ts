/**
 * Sipho principal-email enrichment tick — picks targets, researches sites,
 * updates/creates prospects with named emails only.
 *
 * Always-on model: import any pool/pilot rows that already have outreach-ready
 * emails, then deep-research one unknown dealer at a time.
 */

import {
  createProspects,
  listProspects,
  updateProspectContact,
  logAgentActivity,
} from "../db";
import { LIVE_MARKET_NAME } from "../../shared/liveMarkets";
import {
  SA_PROSPECT_POOL,
  isOnResearchCooldown,
  markProspectResearchAttempted,
  persistResearchAttempt,
  hydrateResearchCooldownsFromDb,
  poolEntryCountry,
  roundRobinByMarket,
} from "./saProspectPool";
import { PILOT_PROSPECTS } from "../../shared/pilotProspectSegments";
import {
  assessProspectEmail,
  isOutreachReadyForDealership,
} from "../../shared/prospectEmailQuality";
import {
  enrichDealershipPrincipal,
  type EnrichmentCandidate,
  type EnrichmentAttemptResult,
} from "./prospectPrincipalEnrichment";

const DEFAULT_LIMIT = 8;
/** Retry failed enrichments after 24h (was 7d — blocked always-on progress). */
export const ENRICH_RETRY_MS = 24 * 60 * 60 * 1000;

export type PrincipalEnrichTickResult = {
  examined: number;
  enriched: number;
  created: number;
  updated: number;
  failed: number;
  importedReady: number;
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

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Immediately create prospects for pool/pilot rows that already have a
 * named@dealer-domain email and are not in the DB yet.
 * (Always-on used to skip these and only scrape hopeless info@ rows.)
 */
export async function importOutreachReadyKnownProspects(): Promise<{
  created: number;
  names: string[];
}> {
  const existing = await listProspects(1000);
  const byName = new Set(existing.map((p) => p.dealershipName.toLowerCase().trim()));
  const toCreate: Parameters<typeof createProspects>[0] = [];
  const names: string[] = [];

  for (const p of SA_PROSPECT_POOL) {
    if (byName.has(p.name.toLowerCase().trim())) continue;
    if (!isOutreachReadyForDealership(p.email, p.website)) continue;
    const assessment = assessProspectEmail(p.email);
    toCreate.push({
      dealershipName: p.name,
      region: `${p.province}, ${LIVE_MARKET_NAME[poolEntryCountry(p)]}`,
      city: p.city,
      phone: p.phone,
      email: p.email,
      website: p.website ?? "",
      estimatedMonthlyVolume: p.estimatedMonthlyVolume,
      brandsCarried: p.brands.join(", "),
      score:
        p.segment === "luxury" || p.segment === "exotic"
          ? 88
          : p.segment === "volume"
            ? 82
            : 72,
      rationale: "Imported named contact already on Sipho research pool",
      status: "scouted",
      sourceNotes: `sipho_ready_import | email_quality=${assessment.quality}`,
      contactName: null,
      contactRole: null,
      emailVerified: 1,
      emailSource: "pool_ready",
      enrichedAt: new Date(),
      enrichmentNotes: "Ready named email from SA prospect pool (no scrape needed)",
    });
    names.push(p.name);
    byName.add(p.name.toLowerCase().trim());
  }

  for (const p of PILOT_PROSPECTS) {
    if (byName.has(p.dealershipName.toLowerCase().trim())) continue;
    if (!p.emailVerified || !isOutreachReadyForDealership(p.email, p.website)) continue;
    const assessment = assessProspectEmail(p.email);
    toCreate.push({
      dealershipName: p.dealershipName,
      region: p.region,
      city: p.city,
      phone: p.phone ?? null,
      email: p.email!,
      website: p.website ?? "",
      score: 80,
      rationale: `Pilot named contact (${p.contactRole ?? "principal"})`,
      status: "scouted",
      sourceNotes: `sipho_ready_import | pilot | email_quality=${assessment.quality}`,
      contactName: p.contactName?.includes("TBD") ? null : p.contactName,
      contactRole: p.contactRole ?? null,
      emailVerified: 1,
      emailSource: "pilot_ready",
      enrichedAt: new Date(),
      enrichmentNotes: "Ready named email from pilot research list",
    });
    names.push(p.dealershipName);
    byName.add(p.dealershipName.toLowerCase().trim());
  }

  if (toCreate.length === 0) return { created: 0, names: [] };
  await createProspects(toCreate);
  return { created: toCreate.length, names };
}

/**
 * Build the work queue: shuffle SA pool + pilot so we don't forever dig the
 * same first pilot after every Railway restart.
 */
export async function collectPrincipalEnrichmentTargets(
  limit = DEFAULT_LIMIT,
): Promise<EnrichmentCandidate[]> {
  await hydrateResearchCooldownsFromDb();
  const now = Date.now();
  const existing = await listProspects(1000);
  const byName = new Map(
    existing.map((p) => [p.dealershipName.toLowerCase().trim(), p] as const),
  );

  const targets: EnrichmentCandidate[] = [];

  // 1) Existing DB rows missing a named inbox (retry after ENRICH_RETRY_MS)
  const dbNeed = shuffleInPlace(
    existing.filter((p) => {
      if (!needsEnrichmentEmail(p.email, p.website)) return false;
      if (!p.website?.trim()) return false;
      const enrichedAt =
        "enrichedAt" in p && p.enrichedAt instanceof Date
          ? p.enrichedAt
          : (p as { enrichedAt?: Date | null }).enrichedAt ?? null;
      if (!staleEnrichment(enrichedAt, now)) return false;
      if (isOnResearchCooldown(p.dealershipName, p.website)) return false;
      return true;
    }),
  );
  for (const p of dbNeed) {
    if (targets.length >= limit) break;
    const knownFromPilot = PILOT_PROSPECTS.find(
      (x) => x.dealershipName.toLowerCase() === p.dealershipName.toLowerCase(),
    );
    const knownFromPool = SA_PROSPECT_POOL.find(
      (x) => x.name.toLowerCase() === p.dealershipName.toLowerCase(),
    );
    const knownPeople: Array<{ fullName: string; role?: string | null }> = [];
    if (p.contactName?.trim()) {
      knownPeople.push({ fullName: p.contactName, role: p.contactRole });
    }
    if (knownFromPilot?.contactName) {
      knownPeople.push({
        fullName: knownFromPilot.contactName,
        role: knownFromPilot.contactRole,
      });
    }
    if (knownFromPool?.principalName) {
      knownPeople.push({
        fullName: knownFromPool.principalName,
        role: knownFromPool.principalRole,
      });
    }
    targets.push({
      prospectId: p.id,
      dealershipName: p.dealershipName,
      website: p.website,
      city: p.city,
      region: p.region,
      phone: p.phone,
      brandsCarried: p.brandsCarried,
      estimatedMonthlyVolume: p.estimatedMonthlyVolume,
      knownPeople,
    });
  }

  // 2) Live-market pool — round-robin ZA / AU / GB / AE / US / NZ
  const poolFiltered = SA_PROSPECT_POOL.filter((p) => {
    if (!p.website?.trim()) return false;
    if (!needsEnrichmentEmail(p.email, p.website)) return false; // ready ones imported separately
    if (isOnResearchCooldown(p.name, p.website)) return false;
    const existingRow = byName.get(p.name.toLowerCase().trim());
    if (existingRow && !needsEnrichmentEmail(existingRow.email, existingRow.website)) {
      return false;
    }
    if (existingRow && !staleEnrichment(existingRow.enrichedAt ?? null, now)) return false;
    return true;
  });
  const poolCandidates = roundRobinByMarket(poolFiltered, poolFiltered.length);
  for (const p of poolCandidates) {
    if (targets.length >= limit) break;
    if (targets.some((t) => t.dealershipName.toLowerCase() === p.name.toLowerCase())) continue;
    const existingRow = byName.get(p.name.toLowerCase().trim());
    targets.push({
      prospectId: existingRow?.id,
      dealershipName: p.name,
      website: p.website,
      city: p.city,
      region: `${p.province}, ${LIVE_MARKET_NAME[poolEntryCountry(p)]}`,
      phone: p.phone,
      brandsCarried: p.brands.join(", "),
      estimatedMonthlyVolume: p.estimatedMonthlyVolume,
      knownPeople: p.principalName
        ? [{ fullName: p.principalName, role: p.principalRole }]
        : undefined,
    });
  }

  // 3) Pilot list (shuffled) last — pass contactName into knownPeople
  const pilotCandidates = shuffleInPlace(
    PILOT_PROSPECTS.filter((p) => {
      if (!p.website?.trim()) return false;
      if (!needsEnrichmentEmail(p.email, p.website) && p.emailVerified) return false;
      if (isOnResearchCooldown(p.dealershipName, p.website)) return false;
      const existingRow = byName.get(p.dealershipName.toLowerCase().trim());
      if (existingRow && !needsEnrichmentEmail(existingRow.email, existingRow.website)) {
        return false;
      }
      if (existingRow && !staleEnrichment(existingRow.enrichedAt ?? null, now)) return false;
      return true;
    }),
  );
  pilotCandidates.sort(
    (a, b) =>
      Number(!/TBD|Dealer Principal|Sales Manager|^Owner$/i.test(b.contactName)) -
      Number(!/TBD|Dealer Principal|Sales Manager|^Owner$/i.test(a.contactName)),
  );
  for (const p of pilotCandidates) {
    if (targets.length >= limit) break;
    if (
      targets.some(
        (t) => t.dealershipName.toLowerCase() === p.dealershipName.toLowerCase(),
      )
    ) {
      continue;
    }
    const existingRow = byName.get(p.dealershipName.toLowerCase().trim());
    targets.push({
      prospectId: existingRow?.id,
      dealershipName: p.dealershipName,
      website: p.website,
      city: p.city,
      region: p.region,
      phone: p.phone,
      knownPeople: p.contactName
        ? [{ fullName: p.contactName, role: p.contactRole }]
        : undefined,
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

  // Guarantee progress: import known-good named emails before scraping
  const imported = await importOutreachReadyKnownProspects();

  const targets = await collectPrincipalEnrichmentTargets(limit);
  const results: EnrichmentAttemptResult[] = [];
  let enriched = imported.created;
  let created = imported.created;
  let updated = 0;
  let failed = 0;

  for (const target of targets) {
    const result = await enrichDealershipPrincipal(target, {
      fast: !deep,
    });
    results.push(result);

    if (result.status !== "enriched" || !result.hit) {
      const persistStatus =
        result.status === "fetch_failed" ? "fetch_failed" : "no_named_email";
      markProspectResearchAttempted(target.dealershipName, target.website);
      await persistResearchAttempt({
        name: target.dealershipName,
        website: target.website,
        prospectId: target.prospectId,
        status: persistStatus,
        notes: result.notes,
      });
      if (target.prospectId) {
        try {
          await updateProspectContact(target.prospectId, {
            ...(result.phone ? { phone: result.phone } : {}),
            enrichedAt: new Date(),
            enrichmentNotes: result.notes,
          });
        } catch (err) {
          console.warn("[PrincipalEnrich] failed to stamp enrichedAt", err);
        }
      }
      try {
        const { persistHitToIcpYard } = await import("./icpContactResearch");
        persistHitToIcpYard(target.dealershipName, {
          phone: result.phone,
          website: target.website,
        });
      } catch (err) {
        console.warn("[PrincipalEnrich] ICP phone persist failed", err);
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
      result.phone ? `phone=${result.phone}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
    await persistResearchAttempt({
      name: target.dealershipName,
      website: target.website,
      prospectId: target.prospectId,
      status: "hit",
      notes: sourceNotes,
      cooldownMs: 0,
    });

    if (target.prospectId) {
      await updateProspectContact(target.prospectId, {
        email: hit.email,
        ...(result.phone ? { phone: result.phone } : {}),
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
          phone: result.phone ?? target.phone ?? null,
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
    try {
      const { persistHitToIcpYard } = await import("./icpContactResearch");
      persistHitToIcpYard(target.dealershipName, {
        phone: result.phone ?? hit.phone,
        email: hit.email,
        contactName: hit.contactName,
        website: target.website,
      });
    } catch (err) {
      console.warn("[PrincipalEnrich] ICP persist failed", err);
    }
  }

  if (enriched > 0 || targets.length > 0 || imported.created > 0) {
    await logAgentActivity({
      agentId: "prospector",
      action: "principal_email_enrich_tick",
      subjectType: "prospect",
      summary:
        imported.created > 0 || enriched > 0
          ? `Sipho added ${created} / updated ${updated} principal contact${created + updated === 1 ? "" : "s"}${imported.names.length ? ` (imported: ${imported.names.slice(0, 3).join(", ")})` : ""}${results.some((r) => r.status === "enriched") ? ` (scraped: ${results.filter((r) => r.status === "enriched").map((r) => r.dealershipName).slice(0, 3).join(", ")})` : ""}.`
          : `Sipho checked ${targets.length} dealership${targets.length === 1 ? "" : "s"} — no public named inbox yet; rotating.`,
      payload: {
        examined: targets.length,
        enriched,
        updated,
        created,
        failed,
        importedReady: imported.created,
        deep,
        names: [
          ...imported.names,
          ...results.filter((r) => r.status === "enriched").map((r) => r.dealershipName),
        ],
      },
    });
  }

  return {
    examined: targets.length,
    enriched,
    created,
    updated,
    failed,
    importedReady: imported.created,
    results,
  };
}
