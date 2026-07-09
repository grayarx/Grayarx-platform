import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  detectBruteForce,
  detectSuspiciousLocation,
  lockAccount,
  blockIP,
  isIPBlocked,
  isAccountLocked,
  getSecurityAgentStatus,
  getThreatHistory,
  unlockAccount,
  unblockIP,
  clearSecurityState,
} from "./securityAgent";

describe("Security Agent System", () => {
  beforeEach(() => {
    clearSecurityState();
  });

  describe("Brute Force Detection", () => {
    it("should detect brute force after 5 failed attempts", () => {
      const threat = detectBruteForce(
        "user123",
        "user@example.com",
        "192.168.1.1",
        5
      );

      expect(threat).not.toBeNull();
      expect(threat?.type).toBe("brute_force");
      expect(threat?.severity).toBe("high");
      expect(threat?.attempts).toBe(5);
    });

    it("should mark as critical after 10 failed attempts", () => {
      const threat = detectBruteForce(
        "user123",
        "user@example.com",
        "192.168.1.1",
        10
      );

      expect(threat?.severity).toBe("critical");
    });

    it("should not detect brute force below threshold", () => {
      const threat = detectBruteForce(
        "user123",
        "user@example.com",
        "192.168.1.1",
        3
      );

      expect(threat).toBeNull();
    });

    it("should track multiple threats", () => {
      detectBruteForce("user1", "user1@example.com", "192.168.1.1", 5);
      detectBruteForce("user2", "user2@example.com", "192.168.1.2", 6);
      detectBruteForce("user3", "user3@example.com", "192.168.1.3", 7);

      const history = getThreatHistory();
      expect(history.length).toBe(3);
    });
  });

  describe("Suspicious Location Detection", () => {
    it("should detect suspicious location change within 2 hours", () => {
      const oneHourAgo = 60 * 60 * 1000;
      const threat = detectSuspiciousLocation(
        "user123",
        "user@example.com",
        "10.0.0.1",
        "192.168.1.1",
        oneHourAgo
      );

      expect(threat).not.toBeNull();
      expect(threat?.type).toBe("suspicious_location");
      expect(threat?.severity).toBe("medium");
    });

    it("should not flag location change after 2 hours", () => {
      const threeHoursAgo = 3 * 60 * 60 * 1000;
      const threat = detectSuspiciousLocation(
        "user123",
        "user@example.com",
        "10.0.0.1",
        "192.168.1.1",
        threeHoursAgo
      );

      expect(threat).toBeNull();
    });

    it("should not flag same IP", () => {
      const oneHourAgo = 60 * 60 * 1000;
      const threat = detectSuspiciousLocation(
        "user123",
        "user@example.com",
        "192.168.1.1",
        "192.168.1.1",
        oneHourAgo
      );

      expect(threat).toBeNull();
    });
  });

  describe("Account Locking", () => {
    it("should lock account", async () => {
      await lockAccount("user123", "user@example.com");

      expect(isAccountLocked("user123")).toBe(true);
    });

    it("should track locked accounts", async () => {
      await lockAccount("user1", "user1@example.com");
      await lockAccount("user2", "user2@example.com");

      expect(isAccountLocked("user1")).toBe(true);
      expect(isAccountLocked("user2")).toBe(true);
      expect(isAccountLocked("user3")).toBe(false);
    });

    it("should unlock account", async () => {
      await lockAccount("user123", "user@example.com");
      expect(isAccountLocked("user123")).toBe(true);

      unlockAccount("user123");
      expect(isAccountLocked("user123")).toBe(false);
    });
  });

  describe("IP Blocking", () => {
    it("should block IP address", async () => {
      await blockIP("192.168.1.1", "Brute force attack");

      expect(isIPBlocked("192.168.1.1")).toBe(true);
    });

    it("should track multiple blocked IPs", async () => {
      await blockIP("192.168.1.1", "Brute force");
      await blockIP("10.0.0.1", "DDoS");
      await blockIP("172.16.0.1", "Scanning");

      expect(isIPBlocked("192.168.1.1")).toBe(true);
      expect(isIPBlocked("10.0.0.1")).toBe(true);
      expect(isIPBlocked("172.16.0.1")).toBe(true);
      expect(isIPBlocked("8.8.8.8")).toBe(false);
    });

    it("should unblock IP", async () => {
      await blockIP("192.168.1.1", "Brute force");
      expect(isIPBlocked("192.168.1.1")).toBe(true);

      unblockIP("192.168.1.1");
      expect(isIPBlocked("192.168.1.1")).toBe(false);
    });
  });

  describe("Security Agent Status", () => {
    it("should track agent status", async () => {
      detectBruteForce("user1", "user1@example.com", "192.168.1.1", 5);
      detectBruteForce("user2", "user2@example.com", "192.168.1.2", 6);

      await lockAccount("user1", "user1@example.com");
      await blockIP("192.168.1.1", "Brute force");

      const status = getSecurityAgentStatus();

      expect(status.threatsDetected).toBe(2);
      expect(status.lockedAccounts).toBe(1);
      expect(status.blockedIPs).toBe(1);
      expect(status.recentThreats.length).toBeGreaterThan(0);
    });

    it("should return empty status when no threats", () => {
      const status = getSecurityAgentStatus();

      expect(status.threatsDetected).toBe(0);
      expect(status.actionsExecuted).toBe(0);
      expect(status.lockedAccounts).toBe(0);
      expect(status.blockedIPs).toBe(0);
    });
  });

  describe("Threat History", () => {
    it("should retrieve all threats", () => {
      detectBruteForce("user1", "user1@example.com", "192.168.1.1", 5);
      detectBruteForce("user2", "user2@example.com", "192.168.1.2", 6);
      detectBruteForce("user3", "user3@example.com", "192.168.1.3", 7);

      const history = getThreatHistory();
      expect(history.length).toBe(3);
    });

    it("should retrieve threats for specific user", () => {
      detectBruteForce("user1", "user1@example.com", "192.168.1.1", 5);
      detectBruteForce("user1", "user1@example.com", "192.168.1.2", 6);
      detectBruteForce("user2", "user2@example.com", "192.168.1.3", 7);

      const user1Threats = getThreatHistory("user1");
      const user2Threats = getThreatHistory("user2");

      expect(user1Threats.length).toBe(2);
      expect(user2Threats.length).toBe(1);
    });
  });

  describe("Security State Management", () => {
    it("should clear all security state", async () => {
      detectBruteForce("user1", "user1@example.com", "192.168.1.1", 5);
      await lockAccount("user1", "user1@example.com");
      await blockIP("192.168.1.1", "Brute force");

      clearSecurityState();

      const status = getSecurityAgentStatus();
      expect(status.threatsDetected).toBe(0);
      expect(status.lockedAccounts).toBe(0);
      expect(status.blockedIPs).toBe(0);
      expect(isAccountLocked("user1")).toBe(false);
      expect(isIPBlocked("192.168.1.1")).toBe(false);
    });
  });

  describe("Threat Severity Levels", () => {
    it("should assign correct severity levels", () => {
      const lowThreat = detectBruteForce("user1", "user1@example.com", "192.168.1.1", 5);
      const criticalThreat = detectBruteForce(
        "user2",
        "user2@example.com",
        "192.168.1.2",
        15
      );

      expect(lowThreat?.severity).toBe("high");
      expect(criticalThreat?.severity).toBe("critical");
    });
  });

  describe("Concurrent Threat Handling", () => {
    it("should handle multiple concurrent threats", async () => {
      const threats = [];
      const locks = [];
      const blocks = [];

      for (let i = 0; i < 10; i++) {
        threats.push(
          detectBruteForce(
            `user${i}`,
            `user${i}@example.com`,
            `192.168.1.${i}`,
            5 + i
          )
        );
        locks.push(lockAccount(`user${i}`, `user${i}@example.com`));
        blocks.push(blockIP(`192.168.1.${i}`, "Brute force"));
      }

      await Promise.all(locks);
      await Promise.all(blocks);

      const status = getSecurityAgentStatus();
      expect(status.threatsDetected).toBe(10);
      expect(status.lockedAccounts).toBe(10);
      expect(status.blockedIPs).toBe(10);
    });
  });

  describe("Threat Timestamp Tracking", () => {
    it("should track threat timestamps", () => {
      const before = new Date();
      const threat = detectBruteForce("user1", "user1@example.com", "192.168.1.1", 5);
      const after = new Date();

      expect(threat?.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(threat?.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
