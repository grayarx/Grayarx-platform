/**
 * Research ICP yard cards with the same enrichDealershipPrincipal path
 * Generate / always-on Sipho uses — not paste-only.
 */

import {
  applyResearchedContact,
  hydrateIcpResearchTargets,
  MOCK_PROSPECTS,
} from "@nalaOs/prospector-data";
import { LIVE_MARKET_IDS } from "../../shared/liveMarkets";
import { isOutreachReadyForDealership } from "../../shared/prospectEmailQuality";
import { createProspects, listProspects, updateProspectContact } from "../db";
import { enrichDealershipPrincipal } from "./prospectPrincipalEnrichment";

export const ICP_RESEARCH_BATCH = 6;

let icpResearchRunning = false;
let lastIcpResearch: {
  researched: number;
  emailsFound: number;
  phonesFound: number;
  names: string[];
  finishedAt: number;
  notes: string;
} | null = null;

export function isIcpResearchRunning(): boolean {
  return icpResearchRunning;
}

export function getIcpResearchMeta() {
  return {
    running: icpResearchRunning,
    lastResult: lastIcpResearch,
  };
}

export function persistHitToIcpYard(
  dealershipName: string,
  hit: {
    phone?: string | null;
    email?: string | null;
    contactName?: string | null;
    website?: string | null;
  },
) {
  const yard = MOCK_PROSPECTS.find(
    (p) => p.name.toLowerCase().trim() === dealershipName.toLowerCase().trim(),
  );
  if (!yard) return undefined;
  return applyResearchedContact(yard.id, hit);
}

async function runIcpResearchUnlocked(opts?: {
  limit?: number;
  deep?: boolean;
}): Promise<{
  researched: number;
  emailsFound: number;
  phonesFound: number;
  names: string[];
}> {
  hydrateIcpResearchTargets();
  const limit = Math.min(Math.max(opts?.limit ?? ICP_RESEARCH_BATCH, 1), 12);
  const deep = opts?.deep !== false;

  const needy = MOCK_PROSPECTS.filter((p) => {
    if (!p.website?.trim()) return false;
    const needsEmail = !isOutreachReadyForDealership(p.email, p.website);
    const needsPhone = !p.phone?.trim();
    return needsEmail || needsPhone;
  });
  const queues = LIVE_MARKET_IDS.map((id) => needy.filter((p) => p.regionId === id));
  const targets: typeof needy = [];
  while (targets.length < limit) {
    let added = false;
    for (const q of queues) {
      if (targets.length >= limit) break;
      const next = q.shift();
      if (next) {
        targets.push(next);
        added = true;
      }
    }
    if (!added) break;
  }

  let emailsFound = 0;
  let phonesFound = 0;
  const names: string[] = [];
  const existing = await listProspects(1000).catch(() => []);

  for (const p of targets) {
    const result = await enrichDealershipPrincipal(
      {
        dealershipName: p.name,
        website: p.website,
        city: p.city,
        region: p.location,
        phone: p.phone,
      },
      { deep, fast: !deep },
    );

    applyResearchedContact(p.id, {
      phone: result.phone,
      email: result.hit?.email,
      contactName: result.hit?.contactName,
      website: p.website,
    });

    if (result.phone) phonesFound += 1;
    if (result.hit?.email && isOutreachReadyForDealership(result.hit.email, p.website)) {
      emailsFound += 1;
      names.push(p.name);
      const match = existing.find(
        (row) => row.dealershipName.toLowerCase().trim() === p.name.toLowerCase().trim(),
      );
      if (match) {
        await updateProspectContact(match.id, {
          email: result.hit.email,
          ...(result.phone ? { phone: result.phone } : {}),
          contactName: result.hit.contactName,
          contactRole: result.hit.contactRole,
          emailVerified: 1,
          emailSource: result.hit.source,
          enrichedAt: new Date(),
          enrichmentNotes: result.notes,
        });
      } else {
        await createProspects([
          {
            dealershipName: p.name,
            region: p.regionId === "ZA" ? "South Africa" : p.regionId,
            city: p.city,
            phone: result.phone ?? p.phone ?? null,
            email: result.hit.email,
            website: p.website,
            score: p.score,
            rationale: `ICP deep research from ${result.hit.evidenceUrl}`,
            status: "scouted",
            sourceNotes: `icp_research | ${result.notes}`,
            contactName: result.hit.contactName,
            contactRole: result.hit.contactRole,
            emailVerified: 1,
            emailSource: result.hit.source,
            enrichedAt: new Date(),
            enrichmentNotes: result.notes,
          },
        ]);
      }
    } else if (result.phone) {
      const match = existing.find(
        (row) => row.dealershipName.toLowerCase().trim() === p.name.toLowerCase().trim(),
      );
      if (match) {
        await updateProspectContact(match.id, { phone: result.phone });
      }
    }
  }

  lastIcpResearch = {
    researched: targets.length,
    emailsFound,
    phonesFound,
    names,
    finishedAt: Date.now(),
    notes: `Deep-researched ${targets.length} ICP yard${targets.length === 1 ? "" : "s"} (full contact/about/team crawl).`,
  };

  return { researched: targets.length, emailsFound, phonesFound, names };
}

export async function researchIcpContacts(opts?: {
  limit?: number;
  deep?: boolean;
}): Promise<{
  researched: number;
  emailsFound: number;
  phonesFound: number;
  names: string[];
  skippedRunning?: boolean;
}> {
  if (icpResearchRunning) {
    return { researched: 0, emailsFound: 0, phonesFound: 0, names: [], skippedRunning: true };
  }
  icpResearchRunning = true;
  try {
    return await runIcpResearchUnlocked(opts);
  } finally {
    icpResearchRunning = false;
  }
}

export function startIcpResearchJob(opts?: { limit?: number; deep?: boolean }): {
  started: boolean;
  alreadyRunning: boolean;
  message: string;
} {
  if (icpResearchRunning) {
    return {
      started: true,
      alreadyRunning: true,
      message: "ICP contact research is already running — cards will update shortly.",
    };
  }
  icpResearchRunning = true;
  void runIcpResearchUnlocked(opts)
    .catch((err) => {
      console.warn("[IcpResearch] background job failed", err);
    })
    .finally(() => {
      icpResearchRunning = false;
    });
  return {
    started: true,
    alreadyRunning: false,
    message:
      "Sipho is deep-researching ICP dealer sites for named emails and switchboards. Refresh in ~30–60s.",
  };
}
