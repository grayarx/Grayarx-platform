import { describe, expect, it } from "vitest";
import {
  assessProspectEmail,
  isGenericMailbox,
  isFillerEmail,
  isOutreachReadyForDealership,
  emailMatchesWebsiteDomain,
  linkedInPrincipalSearchUrl,
  sanitizeScoutEmail,
  filterOutreachReadyProspectInserts,
} from "../shared/prospectEmailQuality";
import {
  mailableProspects,
  prospectsNeedingPrincipalEnrichment,
  PILOT_PROSPECTS,
} from "../shared/pilotProspectSegments";
import {
  pickNextProspects,
  pickNextProspectsForResearch,
  countResearchableProspects,
  markProspectResearchAttempted,
  _clearResearchCooldownsForTests,
} from "./_core/saProspectPool";
import { runAudit, type AuditInput } from "./_core/improvementAgent";

describe("prospect email quality", () => {
  it("flags info@ / sales@ as generic and not outreach-ready", () => {
    expect(isGenericMailbox("info@metroautohub.co.za")).toBe(true);
    expect(assessProspectEmail("sales@northgate.co.za").outreachReady).toBe(false);
    expect(assessProspectEmail("enquiries@sandton.co.za").quality).toBe("generic");
  });

  it("treats named and principal inboxes as outreach-ready", () => {
    expect(assessProspectEmail("darius@jubileemotors.co.za").outreachReady).toBe(true);
    expect(assessProspectEmail("darius@jubileemotors.co.za").quality).toBe("named");
    expect(assessProspectEmail("dealerprincipal@omcmotors.co.za").quality).toBe("principal");
    expect(assessProspectEmail("thabo.mokoena@sandtonautos.co.za").outreachReady).toBe(true);
    expect(assessProspectEmail("principal@prestigeautos.co.za").outreachReady).toBe(false);
    expect(assessProspectEmail("webadmin@vmgsoftware.co.za").outreachReady).toBe(false);
  });

  it("requires email domain to match dealership website", () => {
    expect(
      emailMatchesWebsiteDomain("darius@jubileemotors.co.za", "https://jubileemotors.co.za"),
    ).toBe(true);
    expect(
      emailMatchesWebsiteDomain("webadmin@vmgsoftware.co.za", "https://voncalauto.co.za"),
    ).toBe(false);
    expect(
      isOutreachReadyForDealership("darius@jubileemotors.co.za", "https://jubileemotors.co.za"),
    ).toBe(true);
    expect(
      isOutreachReadyForDealership("webadmin@vmgsoftware.co.za", "https://voncalauto.co.za"),
    ).toBe(false);
  });

  it("builds LinkedIn dealer-principal search URLs", () => {
    const url = linkedInPrincipalSearchUrl("Jubilee Motors", "Springs");
    expect(url).toContain("linkedin.com/search/results/people");
    expect(url).toContain(encodeURIComponent("Dealer Principal"));
    expect(url).toContain(encodeURIComponent("Jubilee Motors"));
  });

  it("sanitizes scout emails and drops generic / domain-mismatch mailboxes", () => {
    const generic = sanitizeScoutEmail({
      email: "info@fakededaler.co.za",
      dealershipName: "Fake Dealer",
      city: "Sandton",
      website: "https://fakededaler.co.za",
    });
    expect(generic.email).toBeNull();
    expect(generic.outreachReady).toBe(false);
    expect(generic.sourceNoteExtra).toContain("skipped_not_outreach_ready");

    const mismatch = sanitizeScoutEmail({
      email: "webadmin@vmgsoftware.co.za",
      dealershipName: "Voncal Auto",
      website: "https://voncalauto.co.za",
    });
    expect(mismatch.outreachReady).toBe(false);
    expect(mismatch.sourceNoteExtra).toContain("domain_mismatch");

    const named = sanitizeScoutEmail({
      email: "lerato@fakededaler.co.za",
      dealershipName: "Fake Dealer",
      website: "https://fakededaler.co.za",
    });
    expect(named.email).toBe("lerato@fakededaler.co.za");
    expect(named.outreachReady).toBe(true);
  });

  it("pilot mailable list excludes generic info@ by default", () => {
    const mailable = mailableProspects();
    expect(mailable.length).toBeGreaterThanOrEqual(1);
    expect(mailable.every((p) => p.emailVerified)).toBe(true);
    for (const p of mailable) {
      expect(isOutreachReadyForDealership(p.email, p.website)).toBe(true);
    }
    expect(mailable.some((p) => p.id === "jubilee-springs")).toBe(true);
  });

  it("filterOutreachReadyProspectInserts drops info@ and domain mismatches", () => {
    const kept = filterOutreachReadyProspectInserts([
      { dealershipName: "A", email: "info@a.co.za", website: "https://a.co.za" },
      {
        dealershipName: "B",
        email: "darius@jubileemotors.co.za",
        website: "https://jubileemotors.co.za",
      },
      {
        dealershipName: "C",
        email: "webadmin@vmgsoftware.co.za",
        website: "https://voncalauto.co.za",
      },
    ]);
    expect(kept).toHaveLength(1);
    expect(kept[0]!.email).toBe("darius@jubileemotors.co.za");
  });

  it("blocks jane.doe / john.doe filler emails", () => {
    expect(isFillerEmail("jane.doe@fakededaler.co.za")).toBe(true);
    expect(isFillerEmail("john.doe@something.co.za")).toBe(true);
    expect(assessProspectEmail("jane.doe@x.co.za").outreachReady).toBe(false);
    expect(assessProspectEmail("john.doe@x.co.za").quality).toBe("invalid");
    expect(assessProspectEmail("darius@jubileemotors.co.za").outreachReady).toBe(true);
  });

  it("SA research pool has many websites left (not 'expired' after named-only filter)", () => {
    _clearResearchCooldownsForTests();
    const { batch, researchRemaining } = pickNextProspectsForResearch([], 8);
    expect(batch.length).toBe(8);
    expect(researchRemaining).toBeGreaterThan(20);
    expect(countResearchableProspects([])).toBeGreaterThan(30);
  });

  it("research cooldown removes dealers from the active queue after empty checks", () => {
    _clearResearchCooldownsForTests();
    const before = countResearchableProspects([]);
    const { batch } = pickNextProspectsForResearch([], 5);
    expect(batch.length).toBe(5);
    for (const p of batch) markProspectResearchAttempted(p.name);
    const after = countResearchableProspects([]);
    expect(after).toBe(before - 5);
    const next = pickNextProspectsForResearch([], 5);
    expect(next.batch.every((p) => !batch.some((b) => b.name === p.name))).toBe(true);
    _clearResearchCooldownsForTests();
  });

  it("SA pool named-email picker only returns outreach-ready", () => {
    const { batch } = pickNextProspects([], 20);
    expect(batch.every((p) => assessProspectEmail(p.email).outreachReady)).toBe(true);
  });

  it("lists enrichment targets with LinkedIn links for Kagiso", () => {
    const targets = prospectsNeedingPrincipalEnrichment();
    expect(targets.length).toBeGreaterThan(5);
    expect(targets[0]!.linkedInPeopleSearch).toContain("linkedin.com");
    expect(PILOT_PROSPECTS.length).toBeGreaterThan(targets.length - 1);
  });

  it("Kagiso flags high generic mailbox share for principal enrichment", () => {
    const input: AuditInput = {
      kpis: {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        totalVehicles: 0,
        availableVehicles: 0,
        leadsLast7Days: 0,
        bookingsLast7Days: 0,
        totalProspects: 5,
        queuedProspects: 0,
      },
      agents: {
        email: { actionCount: 5, lastActionAt: Date.now() },
        calling: { actionCount: 5, lastActionAt: Date.now() },
        booking: { actionCount: 5, lastActionAt: Date.now() },
        prospector: { actionCount: 5, lastActionAt: Date.now() },
      },
      recentSelfCheckScores: [],
      recentCalls: [],
      recentLeadLanguages: [],
      staleVehicleCount: 0,
      prospectEmailStats: {
        totalWithEmail: 10,
        genericMailboxCount: 8,
        outreachReadyCount: 1,
        enrichmentTargets: [
          {
            dealershipName: "Metro Auto Hub",
            currentEmail: "info@metroautohub.co.za",
            linkedInPeopleSearch:
              "https://www.linkedin.com/search/results/people/?keywords=Dealer%20Principal%20Metro",
          },
        ],
      },
      now: Date.now(),
    };
    const findings = runAudit(input);
    const bounce = findings.find((f) => /dealer principals/i.test(f.title));
    expect(bounce).toBeDefined();
    expect(bounce?.severity).toBe("high");
    expect(bounce?.suggestedFix).toMatch(/Sipho|enrich/i);
    expect(bounce?.autoApplicable).toBe(1);
  });
});
