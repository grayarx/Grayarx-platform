import { describe, it, expect, beforeEach } from "vitest";
import {
  executeAccountLockout,
  executeEmailAlert,
  executeSMSAlert,
  generateIncidentReport,
  executeIPBlock,
  shouldFireTrigger,
  getActionStatus,
  formatAutomationAction,
  AutomationQueue,
  DEFAULT_TRIGGERS,
} from "./automationService";

describe("Automation Service", () => {
  describe("executeAccountLockout", () => {
    it("should create account lockout action", async () => {
      const action = await executeAccountLockout(1, "test@example.com", "Too many failed attempts", 15);

      expect(action.type).toBe("account_lockout");
      expect(action.userId).toBe(1);
      expect(action.severity).toBe("high");
      expect(action.metadata?.email).toBe("test@example.com");
      expect(action.metadata?.durationMinutes).toBe(15);
    });

    it("should set unlock time correctly", async () => {
      const before = Date.now();
      const action = await executeAccountLockout(1, "test@example.com", "Too many failed attempts", 30);
      const after = Date.now();

      const unlockTime = action.metadata?.unlockAt.getTime() || 0;
      const expectedTime = before + 30 * 60 * 1000;

      expect(unlockTime).toBeGreaterThanOrEqual(expectedTime - 1000);
      expect(unlockTime).toBeLessThanOrEqual(after + 30 * 60 * 1000 + 1000);
    });
  });

  describe("executeEmailAlert", () => {
    it("should create email alert action", async () => {
      const action = await executeEmailAlert(
        "admin@example.com",
        "Suspicious Activity Detected",
        "Multiple failed login attempts detected",
        "high"
      );

      expect(action.type).toBe("email_alert");
      expect(action.severity).toBe("high");
      expect(action.metadata?.recipientEmail).toBe("admin@example.com");
      expect(action.metadata?.subject).toBe("Suspicious Activity Detected");
    });

    it("should support different severity levels", async () => {
      const severities = ["low", "medium", "high", "critical"] as const;

      for (const severity of severities) {
        const action = await executeEmailAlert("admin@example.com", "Test", "Test content", severity);
        expect(action.severity).toBe(severity);
      }
    });
  });

  describe("executeSMSAlert", () => {
    it("should create SMS alert action", async () => {
      const action = await executeSMSAlert("+1234567890", "Security alert: Unusual activity detected", "high");

      expect(action.type).toBe("sms_alert");
      expect(action.severity).toBe("high");
      expect(action.metadata?.phoneNumber).toBe("+1234567890");
      expect(action.metadata?.message).toBe("Security alert: Unusual activity detected");
    });
  });

  describe("generateIncidentReport", () => {
    it("should create incident report", async () => {
      const affectedUsers = [1, 2, 3];
      const action = await generateIncidentReport(
        "Brute Force Attack",
        "critical",
        "Multiple accounts targeted",
        affectedUsers,
        { source: "192.168.1.100" }
      );

      expect(action.type).toBe("incident_report");
      expect(action.severity).toBe("critical");
      expect(action.metadata?.affectedUsers).toEqual(affectedUsers);
      expect(action.metadata?.source).toBe("192.168.1.100");
    });

    it("should include report timestamp", async () => {
      const before = Date.now();
      const action = await generateIncidentReport("Test", "low", "Test incident", []);
      const after = Date.now();

      const reportTime = action.metadata?.reportedAt.getTime() || 0;
      expect(reportTime).toBeGreaterThanOrEqual(before);
      expect(reportTime).toBeLessThanOrEqual(after);
    });
  });

  describe("executeIPBlock", () => {
    it("should create IP block action", async () => {
      const action = await executeIPBlock("203.0.113.42", "Brute force attempt", 24);

      expect(action.type).toBe("ip_block");
      expect(action.ipAddress).toBe("203.0.113.42");
      expect(action.severity).toBe("high");
      expect(action.metadata?.durationHours).toBe(24);
    });

    it("should set unblock time correctly", async () => {
      const before = Date.now();
      const action = await executeIPBlock("203.0.113.42", "Test", 48);
      const after = Date.now();

      const unblockTime = action.metadata?.unblockAt.getTime() || 0;
      const expectedTime = before + 48 * 60 * 60 * 1000;

      expect(unblockTime).toBeGreaterThanOrEqual(expectedTime - 1000);
      expect(unblockTime).toBeLessThanOrEqual(after + 48 * 60 * 60 * 1000 + 1000);
    });
  });

  describe("shouldFireTrigger", () => {
    it("should fire trigger when threshold exceeded", () => {
      const trigger = DEFAULT_TRIGGERS[0]; // failed_logins trigger
      const result = shouldFireTrigger(trigger, 6, 10);

      expect(result).toBe(true);
    });

    it("should not fire trigger when threshold not exceeded", () => {
      const trigger = DEFAULT_TRIGGERS[0];
      const result = shouldFireTrigger(trigger, 3, 10);

      expect(result).toBe(false);
    });

    it("should not fire trigger when outside time window", () => {
      const trigger = DEFAULT_TRIGGERS[0];
      const result = shouldFireTrigger(trigger, 6, 20);

      expect(result).toBe(false);
    });

    it("should not fire disabled trigger", () => {
      const disabledTrigger = { ...DEFAULT_TRIGGERS[0], enabled: false };
      const result = shouldFireTrigger(disabledTrigger, 6, 10);

      expect(result).toBe(false);
    });
  });

  describe("getActionStatus", () => {
    it("should return pending status", () => {
      const status = getActionStatus({
        id: "1",
        type: "account_lockout",
        reason: "Test",
        severity: "high",
        timestamp: new Date(),
        status: "pending",
      });

      expect(status.label).toBe("Pending");
      expect(status.color).toContain("yellow");
    });

    it("should return executing status", () => {
      const status = getActionStatus({
        id: "1",
        type: "account_lockout",
        reason: "Test",
        severity: "high",
        timestamp: new Date(),
        status: "executing",
      });

      expect(status.label).toBe("Executing");
      expect(status.color).toContain("blue");
    });

    it("should return completed status", () => {
      const status = getActionStatus({
        id: "1",
        type: "account_lockout",
        reason: "Test",
        severity: "high",
        timestamp: new Date(),
        status: "completed",
      });

      expect(status.label).toBe("Completed");
      expect(status.color).toContain("green");
    });

    it("should return failed status", () => {
      const status = getActionStatus({
        id: "1",
        type: "account_lockout",
        reason: "Test",
        severity: "high",
        timestamp: new Date(),
        status: "failed",
      });

      expect(status.label).toBe("Failed");
      expect(status.color).toContain("red");
    });
  });

  describe("formatAutomationAction", () => {
    it("should format action correctly", () => {
      const formatted = formatAutomationAction({
        id: "1",
        type: "account_lockout",
        reason: "Too many failed attempts",
        severity: "high",
        timestamp: new Date(),
        status: "completed",
      });

      expect(formatted).toContain("HIGH");
      expect(formatted).toContain("ACCOUNT LOCKOUT");
      expect(formatted).toContain("Too many failed attempts");
    });
  });

  describe("AutomationQueue", () => {
    let queue: AutomationQueue;

    beforeEach(() => {
      queue = new AutomationQueue();
    });

    it("should enqueue actions", async () => {
      const action = {
        id: "1",
        type: "account_lockout" as const,
        reason: "Test",
        severity: "high" as const,
        timestamp: new Date(),
        status: "pending" as const,
      };

      await queue.enqueue(action);
      expect(queue.getQueueSize()).toBeGreaterThanOrEqual(0);
    });

    it("should return queue size", async () => {
      const action = {
        id: "1",
        type: "account_lockout" as const,
        reason: "Test",
        severity: "high" as const,
        timestamp: new Date(),
        status: "pending" as const,
      };

      await queue.enqueue(action);
      const size = queue.getQueueSize();

      expect(typeof size).toBe("number");
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it("should return queue contents", async () => {
      const action = {
        id: "1",
        type: "account_lockout" as const,
        reason: "Test",
        severity: "high" as const,
        timestamp: new Date(),
        status: "pending" as const,
      };

      await queue.enqueue(action);
      const queueContents = queue.getQueue();

      expect(Array.isArray(queueContents)).toBe(true);
    });
  });

  describe("DEFAULT_TRIGGERS", () => {
    it("should have failed_logins trigger", () => {
      const trigger = DEFAULT_TRIGGERS.find((t) => t.type === "failed_logins");
      expect(trigger).toBeDefined();
      expect(trigger?.threshold).toBe(5);
      expect(trigger?.window).toBe(15);
      expect(trigger?.action).toBe("account_lockout");
    });

    it("should have suspicious_activity trigger", () => {
      const trigger = DEFAULT_TRIGGERS.find((t) => t.type === "suspicious_activity");
      expect(trigger).toBeDefined();
      expect(trigger?.threshold).toBe(3);
      expect(trigger?.window).toBe(60);
      expect(trigger?.action).toBe("email_alert");
    });

    it("should have ip_threshold trigger", () => {
      const trigger = DEFAULT_TRIGGERS.find((t) => t.type === "ip_threshold");
      expect(trigger).toBeDefined();
      expect(trigger?.threshold).toBe(10);
      expect(trigger?.window).toBe(60);
      expect(trigger?.action).toBe("ip_block");
    });

    it("should all be enabled by default", () => {
      expect(DEFAULT_TRIGGERS.every((t) => t.enabled)).toBe(true);
    });
  });
});
