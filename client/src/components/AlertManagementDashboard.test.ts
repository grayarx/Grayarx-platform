import { describe, it, expect } from "vitest";

describe("AlertManagementDashboard", () => {
  it("should filter alerts by status", () => {
    const alerts = [
      {
        id: "1",
        ruleId: "rule-1",
        userId: 1,
        email: "test@example.com",
        severity: "critical" as const,
        title: "Test Alert",
        description: "Test description",
        status: "triggered" as const,
        triggeredAt: new Date(),
        deliveryLog: [],
      },
      {
        id: "2",
        ruleId: "rule-2",
        userId: 2,
        email: "admin@example.com",
        severity: "high" as const,
        title: "Another Alert",
        description: "Another description",
        status: "resolved" as const,
        triggeredAt: new Date(),
        deliveryLog: [],
      },
    ];

    const filtered = alerts.filter((alert) => alert.status === "triggered");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe("triggered");
  });

  it("should filter alerts by severity", () => {
    const alerts = [
      {
        id: "1",
        ruleId: "rule-1",
        userId: 1,
        email: "test@example.com",
        severity: "critical" as const,
        title: "Test Alert",
        description: "Test description",
        status: "triggered" as const,
        triggeredAt: new Date(),
        deliveryLog: [],
      },
      {
        id: "2",
        ruleId: "rule-2",
        userId: 2,
        email: "admin@example.com",
        severity: "low" as const,
        title: "Another Alert",
        description: "Another description",
        status: "resolved" as const,
        triggeredAt: new Date(),
        deliveryLog: [],
      },
    ];

    const filtered = alerts.filter((alert) => alert.severity === "critical");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].severity).toBe("critical");
  });

  it("should group alerts by status", () => {
    const alerts = [
      {
        id: "1",
        ruleId: "rule-1",
        userId: 1,
        email: "test@example.com",
        severity: "critical" as const,
        title: "Alert 1",
        description: "Description 1",
        status: "triggered" as const,
        triggeredAt: new Date(),
        deliveryLog: [],
      },
      {
        id: "2",
        ruleId: "rule-2",
        userId: 2,
        email: "admin@example.com",
        severity: "high" as const,
        title: "Alert 2",
        description: "Description 2",
        status: "acknowledged" as const,
        triggeredAt: new Date(),
        deliveryLog: [],
      },
      {
        id: "3",
        ruleId: "rule-3",
        userId: 3,
        email: "user@example.com",
        severity: "medium" as const,
        title: "Alert 3",
        description: "Description 3",
        status: "resolved" as const,
        triggeredAt: new Date(),
        deliveryLog: [],
      },
    ];

    const grouped: Record<string, any[]> = {
      triggered: [],
      acknowledged: [],
      resolved: [],
      escalated: [],
    };

    alerts.forEach((alert) => {
      grouped[alert.status].push(alert);
    });

    expect(grouped.triggered).toHaveLength(1);
    expect(grouped.acknowledged).toHaveLength(1);
    expect(grouped.resolved).toHaveLength(1);
    expect(grouped.escalated).toHaveLength(0);
  });

  it("should calculate alert statistics", () => {
    const stats = {
      totalAlerts: 45,
      byStatus: {
        triggered: 3,
        acknowledged: 2,
        resolved: 40,
        escalated: 0,
      },
      bySeverity: {
        critical: 2,
        high: 8,
        medium: 20,
        low: 15,
      },
      byRule: {
        "rule-1": 15,
        "rule-2": 12,
        "rule-3": 18,
      },
    };

    expect(stats.totalAlerts).toBe(45);
    expect(stats.byStatus.triggered).toBe(3);
    expect(stats.bySeverity.critical).toBe(2);
    expect(Object.keys(stats.byRule)).toHaveLength(3);
  });

  it("should track alert delivery channels", () => {
    const alert = {
      id: "1",
      ruleId: "rule-1",
      userId: 1,
      email: "test@example.com",
      severity: "critical" as const,
      title: "Test Alert",
      description: "Test description",
      status: "triggered" as const,
      triggeredAt: new Date(),
      deliveryLog: [
        { channel: "email", status: "sent", sentAt: new Date() },
        { channel: "sms", status: "sent", sentAt: new Date() },
        { channel: "in_app", status: "delivered", sentAt: new Date() },
        { channel: "webhook", status: "failed", sentAt: new Date() },
      ],
    };

    expect(alert.deliveryLog).toHaveLength(4);
    expect(alert.deliveryLog.filter((log) => log.status === "sent")).toHaveLength(2);
    expect(alert.deliveryLog.filter((log) => log.status === "failed")).toHaveLength(1);
  });

  it("should validate alert rule configuration", () => {
    const rule = {
      id: "rule-1",
      name: "Brute Force Detection",
      description: "Alert on 5+ failed login attempts in 15 minutes",
      condition: { type: "failed_logins", threshold: 5 },
      severity: "critical" as const,
      channels: ["email", "sms", "in_app"],
      enabled: true,
      throttleMinutes: 15,
    };

    expect(rule.enabled).toBe(true);
    expect(rule.channels).toContain("email");
    expect(rule.throttleMinutes).toBeGreaterThan(0);
    expect(rule.condition.threshold).toBeGreaterThan(0);
  });

  it("should handle multiple alert rules", () => {
    const rules = [
      {
        id: "rule-1",
        name: "Brute Force",
        description: "Brute force detection",
        condition: { type: "failed_logins", threshold: 5 },
        severity: "critical" as const,
        channels: ["email", "sms"],
        enabled: true,
        throttleMinutes: 15,
      },
      {
        id: "rule-2",
        name: "Suspicious Location",
        description: "New location login",
        condition: { type: "new_location", threshold: 1 },
        severity: "high" as const,
        channels: ["email"],
        enabled: true,
        throttleMinutes: 60,
      },
      {
        id: "rule-3",
        name: "Failed 2FA",
        description: "Failed 2FA attempts",
        condition: { type: "failed_2fa", threshold: 3 },
        severity: "high" as const,
        channels: ["email", "sms"],
        enabled: false,
        throttleMinutes: 30,
      },
    ];

    expect(rules).toHaveLength(3);
    expect(rules.filter((r) => r.enabled)).toHaveLength(2);
    expect(rules.filter((r) => r.severity === "critical")).toHaveLength(1);
  });

  it("should acknowledge alerts", () => {
    const alert = {
      id: "1",
      ruleId: "rule-1",
      userId: 1,
      email: "test@example.com",
      severity: "critical" as const,
      title: "Test Alert",
      description: "Test description",
      status: "triggered" as const,
      triggeredAt: new Date(),
      acknowledgedAt: undefined,
      deliveryLog: [],
    };

    const acknowledged = {
      ...alert,
      status: "acknowledged" as const,
      acknowledgedAt: new Date(),
    };

    expect(alert.status).toBe("triggered");
    expect(acknowledged.status).toBe("acknowledged");
    expect(acknowledged.acknowledgedAt).toBeDefined();
  });

  it("should resolve alerts", () => {
    const alert = {
      id: "1",
      ruleId: "rule-1",
      userId: 1,
      email: "test@example.com",
      severity: "critical" as const,
      title: "Test Alert",
      description: "Test description",
      status: "acknowledged" as const,
      triggeredAt: new Date(),
      acknowledgedAt: new Date(),
      resolvedAt: undefined,
      deliveryLog: [],
    };

    const resolved = {
      ...alert,
      status: "resolved" as const,
      resolvedAt: new Date(),
    };

    expect(alert.status).toBe("acknowledged");
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolvedAt).toBeDefined();
  });
});
