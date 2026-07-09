import { describe, it, expect } from "vitest";
import {
  AUDIT_RUN_COST_ESTIMATE,
  AUDIT_SECTIONS,
  computeAutonomousRunCost,
  runKagisoFullAudit,
} from "./_core/kagisoFullAudit";
import type { KagisoSnapshot } from "./db";

const emptySnap: KagisoSnapshot = {
  dealerships: 0,
  vehicles: 0,
  vehiclesWithoutPhoto: 0,
  vehiclesWithoutVin: 0,
  leads: 0,
  leadsLast30d: 0,
  preApprovals: 0,
  preApprovalsPending: 0,
  fallbackUnresolved: 0,
  brandKitIncomplete: 0,
};

const busySnap: KagisoSnapshot = {
  dealerships: 3,
  vehicles: 20,
  vehiclesWithoutPhoto: 6,
  vehiclesWithoutVin: 4,
  leads: 50,
  leadsLast30d: 25,
  preApprovals: 8,
  preApprovalsPending: 5,
  fallbackUnresolved: 7,
  brandKitIncomplete: 2,
};

describe("Kagiso full audit", () => {
  it("walks all 10 audit sections in order", () => {
    const result = runKagisoFullAudit(emptySnap);
    expect(result.sectionsWalked).toEqual(AUDIT_SECTIONS);
    expect(result.sectionsWalked).toHaveLength(10);
  });

  it("flags 'no dealerships' as high severity on an empty platform", () => {
    const result = runKagisoFullAudit(emptySnap);
    const noDealerships = result.findings.find(
      (f) => f.auditSection === "data_health",
    );
    expect(noDealerships).toBeDefined();
    expect(noDealerships?.severity).toBe("high");
    expect(noDealerships?.humanRequired).toBe(true);
  });

  it("on a busy platform, surfaces inventory + pre-approval + fallback + brand findings", () => {
    const result = runKagisoFullAudit(busySnap);
    const sections = new Set(result.findings.map((f) => f.auditSection));
    expect(sections.has("inventory")).toBe(true);
    expect(sections.has("pre_approvals")).toBe(true);
    expect(sections.has("fallback")).toBe(true);
    expect(sections.has("brand_kit")).toBe(true);
  });

  it("pre-approval finding is critical+ severity when 5 are pending", () => {
    const result = runKagisoFullAudit(busySnap);
    const preApp = result.findings.find((f) => f.auditSection === "pre_approvals");
    expect(preApp).toBeDefined();
    expect(["high", "critical"]).toContain(preApp!.severity);
    expect(preApp!.humanRequired).toBe(true);
  });

  it("every finding has a unique stable hash", () => {
    const result = runKagisoFullAudit(busySnap);
    const hashes = result.findings.map((f) => f.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("every finding has both autonomous + human flags set explicitly", () => {
    const result = runKagisoFullAudit(busySnap);
    for (const f of result.findings) {
      expect(typeof f.agentAutonomous).toBe("boolean");
      expect(typeof f.humanRequired).toBe("boolean");
    }
  });

  it("re-running with the same snapshot produces the same hashes (idempotent)", () => {
    const a = runKagisoFullAudit(busySnap);
    const b = runKagisoFullAudit(busySnap);
    expect(a.findings.map((f) => f.hash)).toEqual(b.findings.map((f) => f.hash));
  });

  it("autonomous run cost = audit run + sum of autonomous-only findings", () => {
    const result = runKagisoFullAudit(busySnap);
    const autonomousOnly = result.findings.filter(
      (f) => f.agentAutonomous && !f.humanRequired,
    );
    const expected =
      AUDIT_RUN_COST_ESTIMATE +
      autonomousOnly.reduce((sum, f) => sum + f.creditCostEstimate, 0);
    expect(result.cost.total).toBe(expected);
  });

  it("computeAutonomousRunCost separates human-only findings", () => {
    const result = runKagisoFullAudit(busySnap);
    const cost = computeAutonomousRunCost(result.findings);
    expect(cost.auditRun).toBe(AUDIT_RUN_COST_ESTIMATE);
    expect(cost.total).toBe(cost.auditRun + cost.autonomousFindings);
    expect(cost.totalIfHumanDoesEverything).toBe(
      cost.total + cost.humanFindings,
    );
  });

  it("never proposes a finding labelled both autonomous AND not human-required for commercial section", () => {
    const result = runKagisoFullAudit(busySnap);
    const commercial = result.findings.filter(
      (f) => f.auditSection === "commercial",
    );
    for (const f of commercial) {
      // Pricing/billing decisions must always be human-confirmed
      expect(f.humanRequired).toBe(true);
    }
  });

  it("language coverage section records the v23 11/11 milestone as info-level", () => {
    const result = runKagisoFullAudit(emptySnap);
    const lang = result.findings.find(
      (f) => f.auditSection === "language_coverage",
    );
    expect(lang).toBeDefined();
    expect(lang!.severity).toBe("info");
  });

  it("homepage UI health finding is an autonomous quick-fix", () => {
    const result = runKagisoFullAudit(emptySnap);
    const ui = result.findings.find((f) => f.auditSection === "ui_health");
    expect(ui).toBeDefined();
    expect(ui!.agentAutonomous).toBe(true);
    expect(ui!.humanRequired).toBe(false);
  });
});
