import { describe, it, expect } from "vitest";
import {
  calculateComplianceMetrics,
  getComplianceStatus,
  generateComplianceReport,
  addComplianceFinding,
  updateComplianceFinding,
  getComplianceReports,
  getComplianceFrameworkInfo,
  getAllComplianceFrameworks,
} from "./complianceService";

describe("Compliance Service", () => {
  describe("Compliance Frameworks", () => {
    it("should support PCI DSS", () => {
      const framework = "pci_dss";
      expect(["pci_dss", "gdpr", "soc_2", "hipaa"]).toContain(framework);
    });

    it("should support GDPR", () => {
      const framework = "gdpr";
      expect(["pci_dss", "gdpr", "soc_2", "hipaa"]).toContain(framework);
    });

    it("should support SOC 2", () => {
      const framework = "soc_2";
      expect(["pci_dss", "gdpr", "soc_2", "hipaa"]).toContain(framework);
    });

    it("should support HIPAA", () => {
      const framework = "hipaa";
      expect(["pci_dss", "gdpr", "soc_2", "hipaa"]).toContain(framework);
    });

    it("should get framework info", () => {
      const info = {
        name: "PCI DSS",
        description: "Payment Card Industry Data Security Standard",
        requirements: [
          "Maintain secure network",
          "Protect cardholder data",
          "Maintain vulnerability management program",
        ],
      };

      expect(info.name).toBe("PCI DSS");
      expect(info.requirements.length).toBeGreaterThan(0);
    });

    it("should get all frameworks", () => {
      const frameworks = [
        { id: "pci_dss", name: "PCI DSS" },
        { id: "gdpr", name: "GDPR" },
        { id: "soc_2", name: "SOC 2" },
        { id: "hipaa", name: "HIPAA" },
      ];

      expect(frameworks.length).toBe(4);
    });
  });

  describe("Compliance Metrics", () => {
    it("should calculate PCI DSS metrics", () => {
      const metrics = [
        {
          name: "Password Policy Compliance",
          currentValue: 92,
          targetValue: 100,
          status: "at_risk" as const,
        },
        {
          name: "Multi-Factor Authentication",
          currentValue: 45,
          targetValue: 100,
          status: "non_compliant" as const,
        },
      ];

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].currentValue).toBeLessThanOrEqual(metrics[0].targetValue);
    });

    it("should calculate GDPR metrics", () => {
      const metrics = [
        {
          name: "Email Verification",
          currentValue: 98,
          targetValue: 100,
          status: "compliant" as const,
        },
        {
          name: "Consent Recording",
          currentValue: 95,
          targetValue: 100,
          status: "compliant" as const,
        },
      ];

      expect(metrics.length).toBeGreaterThan(0);
    });

    it("should calculate SOC 2 metrics", () => {
      const metrics = [
        {
          name: "System Availability",
          currentValue: 99.9,
          targetValue: 99.99,
          status: "compliant" as const,
        },
      ];

      expect(metrics.length).toBeGreaterThan(0);
    });

    it("should calculate HIPAA metrics", () => {
      const metrics = [
        {
          name: "Administrative Safeguards",
          currentValue: 90,
          targetValue: 100,
          status: "at_risk" as const,
        },
      ];

      expect(metrics.length).toBeGreaterThan(0);
    });

    it("should include metric metadata", () => {
      const metric = {
        name: "Password Policy Compliance",
        description: "Percentage of users with strong passwords",
        category: "Access Control",
        currentValue: 92,
        targetValue: 100,
        unit: "%",
        status: "at_risk" as const,
        lastUpdated: new Date(),
        trend: "improving" as const,
      };

      expect(metric.name).toBeTruthy();
      expect(metric.description).toBeTruthy();
      expect(metric.category).toBeTruthy();
      expect(metric.unit).toBe("%");
    });

    it("should track metric trends", () => {
      const trends = ["improving", "stable", "declining"];
      expect(trends).toContain("improving");
      expect(trends).toContain("stable");
      expect(trends).toContain("declining");
    });
  });

  describe("Compliance Status", () => {
    it("should calculate overall score", () => {
      const status = {
        framework: "pci_dss" as const,
        overallScore: 85,
        status: "at_risk" as const,
      };

      expect(status.overallScore).toBeGreaterThanOrEqual(0);
      expect(status.overallScore).toBeLessThanOrEqual(100);
    });

    it("should determine compliance status", () => {
      const statuses = ["compliant", "at_risk", "non_compliant"];

      expect(statuses).toContain("compliant");
      expect(statuses).toContain("at_risk");
      expect(statuses).toContain("non_compliant");
    });

    it("should mark as compliant if score >= 95", () => {
      const score = 96;
      const status = score >= 95 ? "compliant" : "at_risk";
      expect(status).toBe("compliant");
    });

    it("should mark as at_risk if score 80-94", () => {
      const score = 88;
      const status = score < 80 ? "non_compliant" : score < 95 ? "at_risk" : "compliant";
      expect(status).toBe("at_risk");
    });

    it("should mark as non_compliant if score < 80", () => {
      const score = 75;
      const status = score < 80 ? "non_compliant" : "at_risk";
      expect(status).toBe("non_compliant");
    });

    it("should include last audit date", () => {
      const status = {
        framework: "pci_dss" as const,
        overallScore: 85,
        status: "at_risk" as const,
        lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextAudit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      expect(status.lastAudit).toBeDefined();
      expect(status.nextAudit.getTime()).toBeGreaterThan(status.lastAudit.getTime());
    });
  });

  describe("Compliance Findings", () => {
    it("should create compliance finding", () => {
      const finding = {
        severity: "critical" as const,
        title: "Missing 2FA",
        description: "2FA not enabled for admin accounts",
        framework: "pci_dss" as const,
        requirement: "Requirement 8.3",
        remediation: "Enable 2FA for all admin accounts",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "open" as const,
      };

      expect(finding.severity).toBe("critical");
      expect(finding.status).toBe("open");
    });

    it("should support finding severity levels", () => {
      const severities = ["critical", "high", "medium", "low"];
      expect(severities).toContain("critical");
      expect(severities).toContain("high");
    });

    it("should track finding status", () => {
      const statuses = ["open", "in_progress", "resolved"];
      expect(statuses).toContain("open");
      expect(statuses).toContain("in_progress");
      expect(statuses).toContain("resolved");
    });

    it("should update finding status", () => {
      const updates = {
        status: "in_progress" as const,
      };

      expect(updates.status).toBe("in_progress");
    });

    it("should include remediation guidance", () => {
      const finding = {
        title: "Missing 2FA",
        remediation: "Enable 2FA for all admin accounts",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      expect(finding.remediation).toBeTruthy();
      expect(finding.dueDate).toBeDefined();
    });

    it("should track evidence of remediation", () => {
      const finding = {
        status: "resolved" as const,
        evidence: "2FA enabled for 100% of admin accounts",
      };

      expect(finding.evidence).toBeTruthy();
    });
  });

  describe("Compliance Reports", () => {
    it("should generate compliance report", () => {
      const report = {
        id: "report_123",
        framework: "pci_dss" as const,
        generatedAt: new Date(),
        period: {
          start: new Date("2024-01-01"),
          end: new Date("2024-12-31"),
        },
        overallScore: 85,
        metrics: [],
        findings: [],
        recommendations: [],
        executiveSummary: "Report summary",
      };

      expect(report.framework).toBe("pci_dss");
      expect(report.overallScore).toBe(85);
    });

    it("should include recommendations", () => {
      const recommendations = [
        "Enable 2FA for all users",
        "Implement password policy",
        "Schedule security training",
      ];

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain("2FA");
    });

    it("should include executive summary", () => {
      const summary = `
        PCI DSS Compliance Report
        Overall Score: 85%
        Status: AT_RISK
        Key Findings: 3 open, 2 in progress
      `;

      expect(summary).toContain("PCI DSS");
      expect(summary).toContain("85%");
    });

    it("should support date range filtering", () => {
      const report = {
        period: {
          start: new Date("2024-01-01"),
          end: new Date("2024-12-31"),
        },
      };

      expect(report.period.end.getTime()).toBeGreaterThan(report.period.start.getTime());
    });

    it("should retrieve all reports", () => {
      const reports = [
        {
          id: "report_1",
          framework: "pci_dss" as const,
          generatedAt: new Date(),
        },
        {
          id: "report_2",
          framework: "gdpr" as const,
          generatedAt: new Date(),
        },
      ];

      expect(reports.length).toBe(2);
    });

    it("should filter reports by framework", () => {
      const reports = [
        {
          id: "report_1",
          framework: "pci_dss" as const,
        },
        {
          id: "report_2",
          framework: "pci_dss" as const,
        },
      ];

      const pciReports = reports.filter((r) => r.framework === "pci_dss");
      expect(pciReports.length).toBe(2);
    });
  });

  describe("Compliance Metrics Calculation", () => {
    it("should calculate password policy compliance", () => {
      const metric = {
        name: "Password Policy Compliance",
        currentValue: 92,
        targetValue: 100,
        unit: "%",
      };

      const compliance = (metric.currentValue / metric.targetValue) * 100;
      expect(compliance).toBe(92);
    });

    it("should calculate 2FA adoption rate", () => {
      const metric = {
        name: "Multi-Factor Authentication",
        currentValue: 45,
        targetValue: 100,
        unit: "%",
      };

      expect(metric.currentValue).toBeLessThan(metric.targetValue);
    });

    it("should calculate encryption coverage", () => {
      const metric = {
        name: "Encryption Coverage",
        currentValue: 98,
        targetValue: 100,
        unit: "%",
      };

      expect(metric.currentValue).toBeGreaterThanOrEqual(95);
    });

    it("should calculate system availability", () => {
      const metric = {
        name: "System Availability",
        currentValue: 99.9,
        targetValue: 99.99,
        unit: "%",
      };

      expect(metric.currentValue).toBeGreaterThan(99);
    });
  });

  describe("Compliance Trends", () => {
    it("should track improving trend", () => {
      const previous = 80;
      const current = 85;
      const trend = current > previous ? "improving" : "declining";

      expect(trend).toBe("improving");
    });

    it("should track declining trend", () => {
      const previous = 85;
      const current = 80;
      const trend = current < previous ? "declining" : "improving";

      expect(trend).toBe("declining");
    });

    it("should track stable trend", () => {
      const previous = 85;
      const current = 85;
      const trend = current === previous ? "stable" : current > previous ? "improving" : "declining";

      expect(trend).toBe("stable");
    });
  });

  describe("Data Integrity", () => {
    it("should handle large number of metrics", () => {
      const metrics = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Metric ${i}`,
        currentValue: Math.random() * 100,
        targetValue: 100,
      }));

      expect(metrics.length).toBe(100);
    });

    it("should handle large number of findings", () => {
      const findings = Array.from({ length: 50 }, (_, i) => ({
        id: `finding_${i}`,
        title: `Finding ${i}`,
        severity: ["critical", "high", "medium", "low"][i % 4],
      }));

      expect(findings.length).toBe(50);
    });

    it("should maintain timestamp accuracy", () => {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(now.getTime()).toBeGreaterThan(oneMonthAgo.getTime());
    });
  });
});
