import { describe, expect, it } from "vitest";
import { runAudit, type AuditInput } from "./_core/improvementAgent";

const baseInput = (): AuditInput => ({
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
    totalProspects: 0,
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
  now: Date.now(),
});

describe("Kagiso runAudit", () => {
  it("returns a critical finding when conversion rate is below 5%", () => {
    const input = baseInput();
    input.kpis.totalLeads = 100;
    input.kpis.convertedLeads = 2; // 2%
    const findings = runAudit(input);
    const conv = findings.find((f) => f.category === "lead_conversion" && f.severity === "critical");
    expect(conv).toBeDefined();
    expect(conv?.title).toMatch(/critically low/i);
  });

  it("flags agent quality when average self-check score is below 70", () => {
    const input = baseInput();
    input.recentSelfCheckScores = [
      { language: "en", score: 60, attempts: 2 },
      { language: "en", score: 55, attempts: 2 },
      { language: "af", score: 65, attempts: 2 },
    ];
    const findings = runAudit(input);
    const q = findings.find((f) => f.category === "agent_quality");
    expect(q).toBeDefined();
    expect(q?.autoApplicable).toBe(1);
  });

  it("does NOT flag quality when scores are healthy", () => {
    const input = baseInput();
    input.recentSelfCheckScores = [
      { language: "en", score: 90, attempts: 1 },
      { language: "en", score: 88, attempts: 1 },
      { language: "af", score: 92, attempts: 1 },
    ];
    const findings = runAudit(input);
    const q = findings.find((f) => f.category === "agent_quality");
    expect(q).toBeUndefined();
  });

  it("flags the prospector when no prospects exist", () => {
    const input = baseInput();
    const findings = runAudit(input);
    expect(
      findings.find((f) => f.category === "prospect_cadence" && /Sipho/.test(f.title)),
    ).toBeDefined();
  });

  it("flags a calling-agent low connection rate as high severity", () => {
    const input = baseInput();
    input.recentCalls = Array.from({ length: 10 }, (_, i) => ({
      status: i < 8 ? "failed" : "completed",
      durationSeconds: null,
    }));
    const findings = runAudit(input);
    const c = findings.find((f) => f.category === "calling_followup");
    expect(c).toBeDefined();
    expect(c?.severity).toBe("high");
  });

  it("sorts findings critical-first", () => {
    const input = baseInput();
    input.kpis.totalLeads = 100;
    input.kpis.convertedLeads = 1; // triggers critical
    input.staleVehicleCount = 20; // triggers medium
    const findings = runAudit(input);
    const severities = findings.map((f) => f.severity);
    const criticalIdx = severities.indexOf("critical");
    const mediumIdx = severities.indexOf("medium");
    expect(criticalIdx).toBeGreaterThanOrEqual(0);
    expect(mediumIdx).toBeGreaterThan(criticalIdx);
  });

  it("flags an agent that has been silent for >14 days", () => {
    const input = baseInput();
    input.agents.calling = {
      actionCount: 10,
      lastActionAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    };
    const findings = runAudit(input);
    expect(findings.find((f) => /silent for \d+ days/.test(f.title))).toBeDefined();
  });
});
