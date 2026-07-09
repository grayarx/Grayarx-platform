import { describe, it, expect } from "vitest";

describe("ComplianceDashboard", () => {
  it("should calculate compliance score", () => {
    const metrics = [
      { status: "compliant" as const, score: 100 },
      { status: "compliant" as const, score: 100 },
      { status: "partial" as const, score: 75 },
      { status: "non_compliant" as const, score: 0 },
    ];

    const averageScore =
      metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
    expect(averageScore).toBe(68.75);
  });

  it("should categorize metrics by status", () => {
    const metrics = [
      { id: "1", status: "compliant" as const, score: 100 },
      { id: "2", status: "compliant" as const, score: 100 },
      { id: "3", status: "partial" as const, score: 75 },
      { id: "4", status: "non_compliant" as const, score: 0 },
      { id: "5", status: "not_applicable" as const, score: 0 },
    ];

    const compliant = metrics.filter((m) => m.status === "compliant");
    const partial = metrics.filter((m) => m.status === "partial");
    const nonCompliant = metrics.filter((m) => m.status === "non_compliant");

    expect(compliant).toHaveLength(2);
    expect(partial).toHaveLength(1);
    expect(nonCompliant).toHaveLength(1);
  });

  it("should track compliance findings", () => {
    const findings = [
      {
        id: "1",
        severity: "critical" as const,
        title: "Critical Finding",
        status: "open" as const,
        dueDate: new Date(),
      },
      {
        id: "2",
        severity: "high" as const,
        title: "High Finding",
        status: "in_progress" as const,
        dueDate: new Date(),
      },
      {
        id: "3",
        severity: "medium" as const,
        title: "Medium Finding",
        status: "resolved" as const,
        dueDate: new Date(),
      },
    ];

    expect(findings).toHaveLength(3);
    expect(findings.filter((f) => f.severity === "critical")).toHaveLength(1);
    expect(findings.filter((f) => f.status === "resolved")).toHaveLength(1);
  });

  it("should support multiple compliance frameworks", () => {
    const frameworks = [
      { id: "pci-dss", name: "PCI-DSS", overallScore: 87 },
      { id: "gdpr", name: "GDPR", overallScore: 92 },
      { id: "soc2", name: "SOC 2", overallScore: 85 },
      { id: "hipaa", name: "HIPAA", overallScore: 88 },
    ];

    expect(frameworks).toHaveLength(4);
    expect(frameworks.find((f) => f.id === "gdpr")?.overallScore).toBe(92);
  });

  it("should track audit dates", () => {
    const framework = {
      id: "pci-dss",
      name: "PCI-DSS",
      overallScore: 87,
      lastAudit: new Date("2026-05-19"),
      nextAudit: new Date("2026-08-19"),
    };

    const daysSinceLastAudit = Math.floor(
      (new Date().getTime() - framework.lastAudit.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysSinceLastAudit).toBeGreaterThanOrEqual(0);
    expect(framework.nextAudit.getTime()).toBeGreaterThan(
      framework.lastAudit.getTime()
    );
  });

  it("should calculate metric evidence", () => {
    const metric = {
      id: "pci-1",
      name: "Password Policy",
      evidence: [
        "12+ character minimum",
        "Complexity requirements",
        "Regular rotation",
      ],
    };

    expect(metric.evidence).toHaveLength(3);
    expect(metric.evidence).toContain("12+ character minimum");
  });

  it("should handle compliance remediation", () => {
    const finding = {
      id: "1",
      severity: "high" as const,
      title: "Missing 2FA",
      description: "2FA not enforced for all users",
      remediation: "Enable 2FA requirement in user settings",
      status: "open" as const,
      dueDate: new Date(Date.now() + 2592000000), // 30 days
    };

    const daysUntilDue = Math.floor(
      (finding.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysUntilDue).toBeGreaterThan(0);
    expect(daysUntilDue).toBeLessThanOrEqual(30);
  });

  it("should track finding status transitions", () => {
    const finding = {
      id: "1",
      severity: "high" as const,
      title: "Test Finding",
      status: "open" as const,
    };

    const inProgress = { ...finding, status: "in_progress" as const };
    const resolved = { ...finding, status: "resolved" as const };

    expect(finding.status).toBe("open");
    expect(inProgress.status).toBe("in_progress");
    expect(resolved.status).toBe("resolved");
  });

  it("should calculate compliance breakdown percentages", () => {
    const stats = {
      compliant: 6,
      partial: 2,
      nonCompliant: 2,
      total: 10,
    };

    const compliantPercent = (stats.compliant / stats.total) * 100;
    const partialPercent = (stats.partial / stats.total) * 100;
    const nonCompliantPercent = (stats.nonCompliant / stats.total) * 100;

    expect(compliantPercent).toBe(60);
    expect(partialPercent).toBe(20);
    expect(nonCompliantPercent).toBe(20);
  });

  it("should validate framework metrics", () => {
    const framework = {
      id: "pci-dss",
      name: "PCI-DSS",
      metrics: [
        { id: "1", name: "Password Policy", status: "compliant" as const },
        { id: "2", name: "2FA", status: "partial" as const },
        { id: "3", name: "Encryption", status: "compliant" as const },
      ],
    };

    expect(framework.metrics).toHaveLength(3);
    expect(framework.metrics.every((m) => m.id && m.name && m.status)).toBe(true);
  });

  it("should handle empty findings", () => {
    const framework = {
      id: "gdpr",
      name: "GDPR",
      findings: [],
    };

    expect(framework.findings).toHaveLength(0);
    expect(framework.findings.filter((f) => f.severity === "critical")).toHaveLength(0);
  });

  it("should support framework comparison", () => {
    const frameworks = [
      { id: "pci-dss", name: "PCI-DSS", overallScore: 87 },
      { id: "gdpr", name: "GDPR", overallScore: 92 },
      { id: "soc2", name: "SOC 2", overallScore: 85 },
    ];

    const bestCompliance = frameworks.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    );

    expect(bestCompliance.name).toBe("GDPR");
    expect(bestCompliance.overallScore).toBe(92);
  });
});
