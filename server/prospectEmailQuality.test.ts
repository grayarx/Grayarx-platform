import { describe, expect, it } from "vitest";
import {
  assessProspectEmail,
  isGenericMailbox,
  isFillerEmail,
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
    expect(assessProspectEmail("principal@omcmotors.co.za").quality).toBe("principal");
    expect(assessProspectEmail("thabo.mokoena@sandtonautos.co.za").outreachReady).toBe(true);
  });

  it("builds LinkedIn dealer-principal search URLs", () => {
    const url = linkedInPrincipalSearchUrl("Jubilee Motors", "Springs");
    expect(url).toContain("linkedin.com/search/results/people");
    expect(url).toContain(encodeURIComponent("Dealer Principal"));
    expect(url).toContain(encodeURIComponent("Jubilee Motors"));
  });

  it("sanitizes scout emails and drops generic mailboxes", () => {
    const generic = sanitizeScoutEmail({
      email: "info@fakededaler.co.za",
      dealershipName: "Fake Dealer",
      city: "Sandton",
    });
    expect(generic.email).toBeNull();
    expect(generic.outreachReady).toBe(false);
    expect(generic.sourceNoteExtra).toContain("skipped_not_outreach_ready");
    expect(generic.sourceNoteExtra).toContain("linkedin=");

    const named = sanitizeScoutEmail({
      email: "lerato@fakededaler.co.za",
      dealershipName: "Fake Dealer",
    });
    expect(named.email).toBe("lerato@fakededaler.co.za");
    expect(named.outreachReady).toBe(true);
    expect(named.sourceNoteExtra).toContain("email_quality=named");
  });

  it("pilot mailable list excludes generic info@ by default", () => {
    const mailable = mailableProspects();
    expect(mailable.length).toBeGreaterThanOrEqual(1);
    expect(mailable.every((p) => p.emailVerified)).toBe(true);
    for (const p of mailable) {
      expect(assessProspectEmail(p.email).outreachReady).toBe(true);
    }
    // Jubilee named contact must remain sendable
    expect(mailable.some((p) => p.id === "jubilee-springs")).toBe(true);
  });

  it("filterOutreachReadyProspectInserts drops info@", () => {
    const kept = filterOutreachReadyProspectInserts([
      { dealershipName: "A", email: "info@a.co.za" },
      { dealershipName: "B", email: "darius@jubileemotors.co.za" },
      { dealershipName: "C", email: "" },
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
    const { batch, researchRemaining } = pickNextProspectsForResearch([], 8);
    expect(batch.length).toBe(8);
    expect(researchRemaining).toBeGreaterThan(20);
    expect(countResearchableProspects([])).toBeGreaterThan(30);
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
