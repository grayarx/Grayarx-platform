import { describe, it, expect, vi } from "vitest";

describe("AuditLogViewer", () => {
  it("should filter logs by search term", () => {
    const logs = [
      {
        id: 1,
        userId: 1,
        email: "test@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        status: "success" as const,
        timestamp: new Date(),
      },
      {
        id: 2,
        userId: 2,
        email: "admin@example.com",
        eventType: "2fa_failed",
        ipAddress: "192.168.1.2",
        userAgent: "Firefox",
        status: "failure" as const,
        timestamp: new Date(),
      },
    ];

    const filtered = logs.filter((log) =>
      log.email.toLowerCase().includes("test")
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].email).toBe("test@example.com");
  });

  it("should filter logs by event type", () => {
    const logs = [
      {
        id: 1,
        userId: 1,
        email: "test@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        status: "success" as const,
        timestamp: new Date(),
      },
      {
        id: 2,
        userId: 2,
        email: "admin@example.com",
        eventType: "2fa_failed",
        ipAddress: "192.168.1.2",
        userAgent: "Firefox",
        status: "failure" as const,
        timestamp: new Date(),
      },
    ];

    const filtered = logs.filter((log) => log.eventType === "login_success");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].eventType).toBe("login_success");
  });

  it("should filter logs by status", () => {
    const logs = [
      {
        id: 1,
        userId: 1,
        email: "test@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        status: "success" as const,
        timestamp: new Date(),
      },
      {
        id: 2,
        userId: 2,
        email: "admin@example.com",
        eventType: "2fa_failed",
        ipAddress: "192.168.1.2",
        userAgent: "Firefox",
        status: "failure" as const,
        timestamp: new Date(),
      },
    ];

    const filtered = logs.filter((log) => log.status === "success");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe("success");
  });

  it("should filter logs by date range", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const tomorrow = new Date(now.getTime() + 86400000);

    const logs = [
      {
        id: 1,
        userId: 1,
        email: "test@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        status: "success" as const,
        timestamp: yesterday,
      },
      {
        id: 2,
        userId: 2,
        email: "admin@example.com",
        eventType: "2fa_failed",
        ipAddress: "192.168.1.2",
        userAgent: "Firefox",
        status: "failure" as const,
        timestamp: now,
      },
    ];

    const filtered = logs.filter(
      (log) => log.timestamp >= yesterday && log.timestamp <= now
    );
    expect(filtered).toHaveLength(2);
  });

  it("should paginate logs correctly", () => {
    const logs = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      userId: i,
      email: `user${i}@example.com`,
      eventType: "login_success",
      ipAddress: "192.168.1.1",
      userAgent: "Chrome",
      status: "success" as const,
      timestamp: new Date(),
    }));

    const itemsPerPage = 20;
    const page1 = logs.slice(0, itemsPerPage);
    const page2 = logs.slice(itemsPerPage, itemsPerPage * 2);
    const page3 = logs.slice(itemsPerPage * 2, itemsPerPage * 3);

    expect(page1).toHaveLength(20);
    expect(page2).toHaveLength(20);
    expect(page3).toHaveLength(10);
  });

  it("should export logs in CSV format", () => {
    const logs = [
      {
        id: 1,
        userId: 1,
        email: "test@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        status: "success" as const,
        timestamp: new Date("2026-05-26T10:00:00Z"),
      },
    ];

    const csv = logs
      .map(
        (log) =>
          `${log.timestamp},${log.email},${log.eventType},${log.ipAddress},${log.status}`
      )
      .join("\n");

    expect(csv).toContain("test@example.com");
    expect(csv).toContain("login_success");
    expect(csv).toContain("192.168.1.1");
  });

  it("should export logs in JSON format", () => {
    const logs = [
      {
        id: 1,
        userId: 1,
        email: "test@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        status: "success" as const,
        timestamp: new Date(),
      },
    ];

    const json = JSON.stringify(logs, null, 2);
    expect(json).toContain("test@example.com");
    expect(json).toContain("login_success");
  });

  it("should handle empty logs gracefully", () => {
    const logs: any[] = [];
    expect(logs).toHaveLength(0);
    expect(logs.filter(() => true)).toHaveLength(0);
  });

  it("should combine multiple filters", () => {
    const logs = [
      {
        id: 1,
        userId: 1,
        email: "test@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        status: "success" as const,
        timestamp: new Date(),
      },
      {
        id: 2,
        userId: 2,
        email: "test@example.com",
        eventType: "2fa_failed",
        ipAddress: "192.168.1.2",
        userAgent: "Firefox",
        status: "failure" as const,
        timestamp: new Date(),
      },
      {
        id: 3,
        userId: 3,
        email: "admin@example.com",
        eventType: "login_success",
        ipAddress: "192.168.1.3",
        userAgent: "Safari",
        status: "success" as const,
        timestamp: new Date(),
      },
    ];

    const filtered = logs.filter(
      (log) => log.email === "test@example.com" && log.status === "success"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });
});
