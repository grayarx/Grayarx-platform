import { describe, it, expect, beforeEach } from "vitest";
import { NotificationService, emailTemplates } from "./notificationSystem";
import { AnalyticsService } from "./analyticsService";
import { StripeService, TwilioService, APIIntegrationManager } from "./apiIntegrations";

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("should send email notification", async () => {
    const notifId = await service.sendNotification("welcome", "test@example.com", {
      userName: "John Doe",
      loginUrl: "https://example.com/login",
    });

    expect(notifId).toBeDefined();
    expect(notifId).toMatch(/^notif-/);
  });

  it("should validate required template variables", async () => {
    try {
      await service.sendNotification("welcome", "test@example.com", {
        userName: "John Doe",
        // Missing loginUrl
      });
      expect.fail("Should throw error for missing variables");
    } catch (error) {
      expect(String(error)).toContain("Missing variables");
    }
  });

  it("should get notification status", async () => {
    const notifId = await service.sendNotification("welcome", "test@example.com", {
      userName: "John Doe",
      loginUrl: "https://example.com/login",
    });

    const status = service.getNotificationStatus(notifId);
    expect(status).toBeDefined();
    expect(status?.status).toBe("pending");
  });

  it("should set user preferences", () => {
    service.setUserPreferences("user1", {
      channels: { email: true, sms: false },
      categories: { security: true, marketing: false },
    });

    const prefs = service.getUserPreferences("user1");
    expect(prefs?.channels.email).toBe(true);
    expect(prefs?.channels.sms).toBe(false);
  });

  it("should get queue statistics", async () => {
    await service.sendNotification("welcome", "test@example.com", {
      userName: "John Doe",
      loginUrl: "https://example.com/login",
    });

    const stats = service.getQueueStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.pending).toBeGreaterThan(0);
  });

  it("should have email templates defined", () => {
    expect(emailTemplates.welcome).toBeDefined();
    expect(emailTemplates.emailVerification).toBeDefined();
    expect(emailTemplates.passwordReset).toBeDefined();
    expect(emailTemplates.twoFactorSetup).toBeDefined();
    expect(emailTemplates.suspiciousActivity).toBeDefined();
    expect(emailTemplates.accountLocked).toBeDefined();
  });
});

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  it("should generate security report", async () => {
    const report = await service.generateReport(
      "security",
      "7d",
      "json",
      "admin@example.com"
    );

    expect(report).toBeDefined();
    expect(report.type).toBe("security");
    expect(report.metrics.overallScore).toBe(87);
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("should generate compliance report", async () => {
    const report = await service.generateReport(
      "compliance",
      "30d",
      "json",
      "admin@example.com"
    );

    expect(report.type).toBe("compliance");
    expect(report.metrics.pciDssScore).toBeDefined();
    expect(report.metrics.gdprScore).toBeDefined();
  });

  it("should generate performance report", async () => {
    const report = await service.generateReport(
      "performance",
      "90d",
      "json",
      "admin@example.com"
    );

    expect(report.type).toBe("performance");
    expect(report.metrics.apiResponseTime).toBeDefined();
    expect(report.metrics.uptime).toBeDefined();
  });

  it("should generate usage report", async () => {
    const report = await service.generateReport(
      "usage",
      "1y",
      "json",
      "admin@example.com"
    );

    expect(report.type).toBe("usage");
    expect(report.metrics.activeUsers).toBeDefined();
    expect(report.metrics.userRetention).toBeDefined();
  });

  it("should schedule report", () => {
    const scheduleId = service.scheduleReport(
      "security",
      "weekly",
      ["admin@example.com"],
      "pdf"
    );

    expect(scheduleId).toBeDefined();
    expect(scheduleId).toMatch(/^schedule-/);
  });

  it("should get scheduled reports", () => {
    service.scheduleReport("security", "weekly", ["admin@example.com"], "pdf");
    service.scheduleReport("compliance", "monthly", ["admin@example.com"], "pdf");

    const schedules = service.getScheduledReports();
    expect(schedules.length).toBeGreaterThanOrEqual(2);
  });

  it("should get report history", async () => {
    await service.generateReport("security", "7d", "json", "admin@example.com");
    await service.generateReport("compliance", "7d", "json", "admin@example.com");

    const history = service.getReportHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it("should export report as CSV", async () => {
    const report = await service.generateReport(
      "security",
      "7d",
      "csv",
      "admin@example.com"
    );
    const csv = await service.exportReport(report.id, "csv");

    expect(csv).toBeDefined();
    expect(csv).toContain("security");
  });
});

describe("StripeService", () => {
  let service: StripeService;

  beforeEach(() => {
    service = new StripeService();
  });

  it("should create payment", async () => {
    const payment = await service.createPayment("cus_123", 9999, "USD", "Test payment");

    expect(payment).toBeDefined();
    expect(payment.amount).toBe(9999);
    expect(payment.status).toBe("pending");
  });

  it("should create customer", async () => {
    const customer = await service.createCustomer(
      "test@example.com",
      "John Doe"
    );

    expect(customer).toBeDefined();
    expect(customer.email).toBe("test@example.com");
    expect(customer.name).toBe("John Doe");
  });

  it("should create subscription", async () => {
    const subscription = await service.createSubscription("cus_123", "plan_pro");

    expect(subscription).toBeDefined();
    expect(subscription.status).toBe("active");
    expect(subscription.planId).toBe("plan_pro");
  });

  it("should get payment", async () => {
    const payment = await service.createPayment("cus_123", 9999);
    const retrieved = await service.getPayment(payment.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.amount).toBe(9999);
  });

  it("should list payments for customer", async () => {
    await service.createPayment("cus_123", 9999);
    await service.createPayment("cus_123", 4999);
    await service.createPayment("cus_456", 1999);

    const payments = await service.listPayments("cus_123");
    expect(payments.length).toBe(2);
  });

  it("should refund payment", async () => {
    const payment = await service.createPayment("cus_123", 9999);
    const refunded = await service.refundPayment(payment.id);

    expect(refunded?.status).toBe("refunded");
  });

  it("should cancel subscription", async () => {
    const subscription = await service.createSubscription("cus_123", "plan_pro");
    const canceled = await service.cancelSubscription(subscription.id);

    expect(canceled?.status).toBe("canceled");
    expect(canceled?.canceledAt).toBeDefined();
  });
});

describe("TwilioService", () => {
  let service: TwilioService;

  beforeEach(() => {
    service = new TwilioService();
  });

  it("should send SMS", async () => {
    const message = await service.sendSMS("+1234567890", "Test message");

    expect(message).toBeDefined();
    expect(message.to).toBe("+1234567890");
    expect(message.body).toBe("Test message");
    expect(message.status).toBe("queued");
  });

  it("should send bulk SMS", async () => {
    const messages = await service.sendBulkSMS(
      ["+1234567890", "+0987654321"],
      "Test message"
    );

    expect(messages).toHaveLength(2);
    expect(messages[0].to).toBe("+1234567890");
    expect(messages[1].to).toBe("+0987654321");
  });

  it("should get message", async () => {
    const message = await service.sendSMS("+1234567890", "Test message");
    const retrieved = await service.getMessage(message.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.body).toBe("Test message");
  });

  it("should list messages", async () => {
    await service.sendSMS("+1234567890", "Message 1");
    await service.sendSMS("+1234567890", "Message 2");
    await service.sendSMS("+0987654321", "Message 3");

    const messages = await service.listMessages("+1234567890");
    expect(messages.length).toBe(2);
  });

  it("should get message status", async () => {
    const message = await service.sendSMS("+1234567890", "Test message");
    const status = await service.getMessageStatus(message.id);

    expect(status).toBe("queued");
  });
});

describe("APIIntegrationManager", () => {
  let manager: APIIntegrationManager;

  beforeEach(() => {
    manager = new APIIntegrationManager();
  });

  it("should have all services initialized", () => {
    expect(manager.stripe).toBeDefined();
    expect(manager.twilio).toBeDefined();
  });

  it("should send multi-channel notification", async () => {
    const result = await manager.sendNotificationMultiChannel(
      {
        email: "test@example.com",
        phone: "+1234567890",
      },
      {
        subject: "Test",
        body: "Test message",
      }
    );

    expect(result.email).toBeDefined();
    expect(result.sms).toBeDefined();
  });

  it("should process payment with notification", async () => {
    const result = await manager.processPaymentWithNotification(
      "cus_123",
      9999,
      "test@example.com"
    );

    expect(result.payment).toBeDefined();
    expect(result.notification).toBeDefined();
    expect(result.payment.status).toBe("pending");
  });

  it("should get integration status", () => {
    const status = manager.getStatus();

    expect(status.stripe).toBe(true);
    expect(status.twilio).toBe(true);
  });
});
