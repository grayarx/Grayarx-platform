/**
 * Comprehensive Security Features Test Suite
 * Tests all security components, integrations, and workflows
 */

import { describe, it, expect, beforeEach } from "vitest";
import { realtimeService } from "../_core/realtimeService";
import { slaManagementService } from "../_core/slaManagement";
import { auditLogRetentionService } from "../_core/auditLogRetention";

describe("Realtime Service", () => {
  beforeEach(() => {
    // Clear state before each test
  });

  describe("Connection Management", () => {
    it("should register user connections", () => {
      realtimeService.registerConnection("user_1", "conn_1");
      expect(realtimeService.isUserConnected("user_1")).toBe(true);
    });

    it("should unregister user connections", () => {
      realtimeService.registerConnection("user_1", "conn_1");
      realtimeService.unregisterConnection("user_1", "conn_1");
      expect(realtimeService.isUserConnected("user_1")).toBe(false);
    });

    it("should track active connections", () => {
      realtimeService.registerConnection("user_1", "conn_1");
      realtimeService.registerConnection("user_2", "conn_2");
      expect(realtimeService.getActiveUsers()).toBe(2);
    });
  });

  describe("Threat Updates", () => {
    it("should broadcast threat updates", () => {
      const update = {
        id: "threat_1",
        type: "threat_detected" as const,
        severity: "critical" as const,
        title: "Brute Force Attack",
        description: "Attack detected",
        timestamp: new Date(),
      };

      realtimeService.broadcastThreatUpdate(update);
      const threats = realtimeService.getRecentThreats(1);
      expect(threats).toHaveLength(1);
      expect(threats[0].title).toBe("Brute Force Attack");
    });

    it("should maintain threat history", () => {
      for (let i = 0; i < 5; i++) {
        realtimeService.broadcastThreatUpdate({
          id: `threat_${i}`,
          type: "threat_detected",
          severity: "high",
          title: `Threat ${i}`,
          description: "Test threat",
          timestamp: new Date(),
        });
      }

      const threats = realtimeService.getRecentThreats(10);
      expect(threats.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Service Statistics", () => {
    it("should provide service statistics", () => {
      realtimeService.registerConnection("user_1", "conn_1");
      const stats = realtimeService.getStatistics();

      expect(stats.activeConnections).toBeGreaterThan(0);
      expect(stats.activeUsers).toBeGreaterThan(0);
      expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("SLA Management Service", () => {
  describe("SLA Timer Creation", () => {
    it("should create SLA timer for critical alert", () => {
      const timer = slaManagementService.createSLATimer("alert_1", "critical");

      expect(timer.alertId).toBe("alert_1");
      expect(timer.severity).toBe("critical");
      expect(timer.responseDeadline).toBeInstanceOf(Date);
      expect(timer.resolutionDeadline).toBeInstanceOf(Date);
    });

    it("should set correct response time for severity", () => {
      const criticalTimer = slaManagementService.createSLATimer("alert_1", "critical");
      const highTimer = slaManagementService.createSLATimer("alert_2", "high");

      const criticalResponse = criticalTimer.responseDeadline.getTime() - criticalTimer.createdAt.getTime();
      const highResponse = highTimer.responseDeadline.getTime() - highTimer.createdAt.getTime();

      expect(criticalResponse).toBeLessThan(highResponse);
    });
  });

  describe("Alert Acknowledgment", () => {
    it("should acknowledge alert and track response time", () => {
      const timer = slaManagementService.createSLATimer("alert_1", "critical");
      const result = slaManagementService.acknowledgeAlert("alert_1");

      expect(result.success).toBe(true);
      expect(result.timer?.acknowledgedAt).toBeInstanceOf(Date);
    });

    it("should detect SLA breach on late acknowledgment", () => {
      const timer = slaManagementService.createSLATimer("alert_1", "critical");
      // Simulate late acknowledgment by modifying creation time
      timer.createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago

      const result = slaManagementService.acknowledgeAlert("alert_1");
      expect(result.timer?.breached).toBe(true);
    });
  });

  describe("Alert Resolution", () => {
    it("should resolve alert and track resolution time", () => {
      slaManagementService.createSLATimer("alert_1", "critical");
      const result = slaManagementService.resolveAlert("alert_1");

      expect(result.success).toBe(true);
      expect(result.timer?.resolvedAt).toBeInstanceOf(Date);
    });
  });

  describe("Escalation Management", () => {
    it("should check for escalations", () => {
      slaManagementService.createSLATimer("alert_1", "critical");
      const escalations = slaManagementService.checkEscalations();

      expect(Array.isArray(escalations)).toBe(true);
    });
  });

  describe("Compliance Metrics", () => {
    it("should calculate SLA compliance", () => {
      slaManagementService.createSLATimer("alert_1", "critical");
      slaManagementService.createSLATimer("alert_2", "high");

      const metrics = slaManagementService.getComplianceMetrics();

      expect(metrics.totalAlerts).toBeGreaterThanOrEqual(2);
      expect(metrics.compliancePercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.compliancePercentage).toBeLessThanOrEqual(100);
    });
  });
});

describe("Audit Log Retention Service", () => {
  describe("Retention Policies", () => {
    it("should have default retention policies", () => {
      const policies = auditLogRetentionService.getPolicies();
      expect(policies.length).toBeGreaterThan(0);
    });

    it("should find retention policy for event type", () => {
      const retentionDays = auditLogRetentionService.getRetentionDays("login");
      expect(retentionDays).toBeGreaterThan(0);
    });
  });

  describe("Log Archival", () => {
    it("should archive logs", () => {
      const archived = auditLogRetentionService.archiveLogs("login", 1000, 500000);

      expect(archived).toBeTruthy();
      expect(archived?.logCount).toBe(1000);
      expect(archived?.compressed).toBe(true);
      expect(archived?.encrypted).toBe(true);
    });

    it("should track archived logs", () => {
      auditLogRetentionService.archiveLogs("login", 1000, 500000);
      const stats = auditLogRetentionService.getStatistics();

      expect(stats.totalLogsArchived).toBeGreaterThan(0);
      expect(stats.totalStorageUsed).toBeGreaterThan(0);
    });
  });

  describe("Retention Decisions", () => {
    it("should determine if log should be archived", () => {
      const shouldArchive = auditLogRetentionService.shouldArchiveLog("login", 61); // 61 days old
      expect(typeof shouldArchive).toBe("boolean");
    });

    it("should determine if log should be deleted", () => {
      const shouldDelete = auditLogRetentionService.shouldDeleteLog("login", 366); // 366 days old
      expect(typeof shouldDelete).toBe("boolean");
    });
  });

  describe("Policy Management", () => {
    it("should create custom retention policy", () => {
      const policy = auditLogRetentionService.createPolicy({
        id: "policy_custom",
        name: "Custom Policy",
        eventTypes: ["custom_event"],
        retentionDays: 180,
        archivalDays: 60,
        archivalLocation: "s3_cold",
        enabled: true,
      });

      expect(policy.name).toBe("Custom Policy");
      expect(policy.retentionDays).toBe(180);
    });

    it("should update retention policy", () => {
      const success = auditLogRetentionService.updatePolicy("policy_security", {
        retentionDays: 730,
      });

      expect(success).toBe(true);
    });
  });

  describe("Statistics", () => {
    it("should provide retention statistics", () => {
      const stats = auditLogRetentionService.getStatistics();

      expect(stats.totalLogsArchived).toBeGreaterThanOrEqual(0);
      expect(stats.totalStorageUsed).toBeGreaterThanOrEqual(0);
      expect(stats.policiesCount).toBeGreaterThan(0);
    });

    it("should provide retention schedule", () => {
      const schedule = auditLogRetentionService.getRetentionSchedule();

      expect(schedule.nextArchivalRun).toBeInstanceOf(Date);
      expect(schedule.nextDeletionRun).toBeInstanceOf(Date);
      expect(schedule.archivalFrequency).toBe("daily");
    });
  });
});

describe("Security Integration", () => {
  it("should handle complete alert lifecycle", () => {
    // Create SLA timer
    const timer = slaManagementService.createSLATimer("alert_1", "critical");
    expect(timer).toBeTruthy();

    // Acknowledge alert
    const ackResult = slaManagementService.acknowledgeAlert("alert_1");
    expect(ackResult.success).toBe(true);

    // Resolve alert
    const resolveResult = slaManagementService.resolveAlert("alert_1");
    expect(resolveResult.success).toBe(true);

    // Check SLA status
    const status = slaManagementService.getSLAStatus("alert_1");
    expect(status).toBeTruthy();
  });

  it("should track multiple concurrent alerts", () => {
    for (let i = 0; i < 10; i++) {
      slaManagementService.createSLATimer(`alert_${i}`, "high");
    }

    const metrics = slaManagementService.getComplianceMetrics();
    expect(metrics.totalAlerts).toBeGreaterThanOrEqual(10);
  });

  it("should maintain audit log retention across operations", () => {
    const initialStats = auditLogRetentionService.getStatistics();
    const initialCount = initialStats.totalLogsArchived;

    auditLogRetentionService.archiveLogs("login", 500, 250000);

    const updatedStats = auditLogRetentionService.getStatistics();
    expect(updatedStats.totalLogsArchived).toBeGreaterThan(initialCount);
  });
});

describe("Performance & Load", () => {
  it("should handle high volume of threat updates", () => {
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      realtimeService.broadcastThreatUpdate({
        id: `threat_${i}`,
        type: "threat_detected",
        severity: "high",
        title: `Threat ${i}`,
        description: "Performance test",
        timestamp: new Date(),
      });
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  it("should handle concurrent SLA timer operations", () => {
    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
      slaManagementService.createSLATimer(`alert_${i}`, "high");
      slaManagementService.acknowledgeAlert(`alert_${i}`);
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds
  });

  it("should handle large archival operations", () => {
    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
      auditLogRetentionService.archiveLogs("login", 1000, 500000);
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
  });
});

describe("Error Handling", () => {
  it("should handle missing SLA timer gracefully", () => {
    const result = slaManagementService.acknowledgeAlert("nonexistent_alert");
    expect(result.success).toBe(false);
  });

  it("should handle invalid event type for retention", () => {
    const retentionDays = auditLogRetentionService.getRetentionDays("invalid_event");
    expect(retentionDays).toBe(30); // Should return default
  });
});
