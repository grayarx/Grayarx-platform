/**
 * End-to-end verification: buyer-facing specialist routing + Kagiso's
 * continuous self-improvement loop.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { classifyAgentRoute } from "../shared/agentIntentRouting";
import {
  AUDIT_SECTIONS,
  runKagisoFullAudit,
} from "./_core/kagisoFullAudit";
import { runAudit, type AuditInput } from "./_core/improvementAgent";
import {
  AUDIT_INTERVAL_MS,
  attachAutonomousAuditMiddleware,
} from "./_core/autonomousAudit";
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

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), "utf8");
}

describe("GrayArx agent ecosystem", () => {
  describe("buyer intent routing (Lerato / Tumi / Bongi / Nala)", () => {
    it("classifies all four specialist paths correctly", () => {
      expect(
        classifyAgentRoute({ message: "Can I book a test drive?", afterHours: false }).agent,
      ).toBe("lerato");
      expect(
        classifyAgentRoute({ message: "What's my trade-in value?", afterHours: false }).agent,
      ).toBe("tumi");
      expect(
        classifyAgentRoute({ message: "Hello, are you there?", afterHours: true }).agent,
      ).toBe("nala");
      expect(
        classifyAgentRoute({ message: "What colour is it?", afterHours: false }).agent,
      ).toBe("nala");
    });

    it("keeps booking on Lerato even after hours", () => {
      expect(
        classifyAgentRoute({ message: "Test drive tomorrow please", afterHours: true }).agent,
      ).toBe("lerato");
    });

    it("WhatsApp inbound uses resolveRoutedReply", () => {
      const src = readSource("_core/whatsappService.ts");
      expect(src).toContain("resolveRoutedReply");
      expect(src).toMatch(/const result = await resolveRoutedReply\(/);
    });

    it("showroom.chat API uses resolveRoutedReply and returns agent", () => {
      const src = readSource("routers.ts");
      expect(src).toContain("resolveRoutedReply");
      expect(src).toContain("agent: resolved.agent");
    });

    it("showroom chat UI displays active specialist", () => {
      const src = readSource("../client/src/components/ShowroomChatAgent.tsx");
      expect(src).toContain("activeAgent");
      expect(src).toContain("AGENT_HEADER");
      expect(src).toContain('res.agent ?? "nala"');
    });
  });

  describe("Kagiso continuous upgrade loop", () => {
    it("full platform audit walks all 10 sections in order", () => {
      const result = runKagisoFullAudit(emptySnap);
      expect(result.sectionsWalked).toEqual(AUDIT_SECTIONS);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it("dealer KPI audit surfaces critical conversion gaps", () => {
      const input: AuditInput = {
        kpis: {
          totalLeads: 100,
          newLeads: 20,
          qualifiedLeads: 10,
          convertedLeads: 2,
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          totalVehicles: 5,
          availableVehicles: 5,
          leadsLast7Days: 10,
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
      };
      const findings = runAudit(input);
      expect(findings.some((f) => f.severity === "critical")).toBe(true);
    });

    it("autonomous audit middleware is mounted on server boot (24h cadence)", () => {
      expect(AUDIT_INTERVAL_MS).toBe(24 * 60 * 60 * 1000);
      expect(typeof attachAutonomousAuditMiddleware).toBe("function");
      const serverIndex = readSource("_core/index.ts");
      expect(serverIndex).toContain("attachAutonomousAuditMiddleware(app)");
    });

    it("agent_activity section proposes intent-routing observability upgrades", () => {
      const result = runKagisoFullAudit(emptySnap);
      const activity = result.findings.find((f) => f.auditSection === "agent_activity");
      expect(activity).toBeDefined();
      expect(activity!.evidenceJson).toMatchObject({
        intentRoutingLive: true,
        autonomousAuditLive: true,
      });
      expect(activity!.category).toBe("agent_improvement");
    });

    it("findings are hash-deduped so repeated audits do not spam the roadmap", () => {
      const a = runKagisoFullAudit(emptySnap);
      const b = runKagisoFullAudit(emptySnap);
      expect(a.findings.map((f) => f.hash)).toEqual(b.findings.map((f) => f.hash));
    });
  });
});
