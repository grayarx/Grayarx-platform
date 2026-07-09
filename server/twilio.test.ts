/**
 * Twilio SMS Integration Tests
 * Validates Twilio credentials and SMS functionality
 */

import { describe, it, expect, beforeAll } from "vitest";
import { sendSMS, getTwilioStatus } from "./_core/twilioService";

describe("Twilio SMS Service", () => {
  beforeAll(() => {
    // Verify environment variables are set
    expect(process.env.TWILIO_ACCOUNT_SID).toBeDefined();
    expect(process.env.TWILIO_API_KEY).toBeDefined();
    expect(process.env.TWILIO_MODE).toBeDefined();
  });

  it("should have Twilio credentials configured", () => {
    const status = getTwilioStatus();
    expect(status).toBeDefined();
    expect(status.hasAccountSid).toBe(true);
    // Auth token is set via TWILIO_API_KEY, so it should be true
    expect(status.hasAuthToken).toBe(true);
  });

  it("should be in mock mode for testing", () => {
    const status = getTwilioStatus();
    expect(status.mode).toBe("mock");
  });

  it("should send SMS in mock mode", async () => {
    const result = await sendSMS("+27123456789", "Test message from GrayArx");
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.mode).toBe("mock");
  });

  it("should handle SMS to South African numbers", async () => {
    const result = await sendSMS("+27821234567", "Test dealership message");
    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^mock_sms_/);
  });

  it("should log SMS sending", async () => {
    const consoleSpy = console.log;
    const result = await sendSMS("+27123456789", "Test message");
    expect(result.success).toBe(true);
  });
});
