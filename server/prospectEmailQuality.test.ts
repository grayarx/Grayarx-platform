import { describe, expect, it } from "vitest";
import {
  assessProspectEmail,
  isGenericMailbox,
  linkedInPrincipalSearchUrl,
  sanitizeScoutEmail,
} from "../shared/prospectEmailQuality";
import {
  mailableProspects,
  prospectsNeedingPrincipalEnrichment,
  PILOT_PROSPECTS,
} from "../shared/pilotProspectSegments";
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
    expect(assessProspectEmail("thabo.mokoena@example.co.za").outreachReady).toBe(true);
  });

  it("builds LinkedIn dealer-principal search URLs", () => {
    const url = linkedInPrincipalSearchUrl("Jubilee Motors", "Springs");
    expect(url).toContain("linkedin.com/search/results/people");
    expect(url).toContain(encodeURIComponent("Dealer Principal"));
    expect(url).toContain(encodeURIComponent("Jubilee Motors"));
  });

  it("sanitizes scout emails and tags enrichment notes", () => {
    const generic = sanitizeScoutEmail({
      email: "info@fakededaler.co.za",
      dealershipName: "Fake Dealer",
      city: "Sandton",
    });
    expect(generic.sourceNoteExtra).toContain("needs_principal_enrichment");
    expect(generic.sourceNoteExtra).toContain("linkedin=");

    const named = sanitizeScoutEmail({
      email: "lerato@fakededaler.co.za",
      dealershipName: "Fake Dealer",
    });
    expect(named.email).toBe("lerato@fakededaler.co.za");
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
    expect(bounce?.suggestedFix).toContain("LinkedIn");
    expect(bounce?.autoApplicable).toBe(0);
  });
});
