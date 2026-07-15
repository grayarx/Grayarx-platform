import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./_core/agentMemory", () => ({
  recordOutcome: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("./_core/chatbotDeploymentService", () => ({
  markTestDriveBooked: vi.fn().mockResolvedValue(undefined),
}));

import { markNalaChatBookingConversion } from "./_core/chatBookingConversion";
import { recordOutcome } from "./_core/agentMemory";
import { markTestDriveBooked } from "./_core/chatbotDeploymentService";

describe("markNalaChatBookingConversion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records outcome_success for Lerato and Nala on WhatsApp bookings", async () => {
    await markNalaChatBookingConversion({
      dealershipId: 7,
      referenceNumber: "GA-7-ABC",
      channel: "whatsapp",
      bookingId: 99,
      customerContact: "+27821234567",
    });

    expect(recordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "booking",
        relatedAction: "chat_to_booking",
        outcome: "success",
      }),
    );
    expect(recordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "whatsapp",
        relatedAction: "chat_to_booking",
        outcome: "success",
      }),
    );
    const detail = vi.mocked(recordOutcome).mock.calls[0][0].detail;
    expect(detail).toContain("ref GA-7-ABC");
    expect(detail).toContain("dealership 7");
    expect(detail).not.toMatch(/27821234567|phone|@/);
  });

  it("records Lerato outcome for website bookings without Nala credit", async () => {
    await markNalaChatBookingConversion({
      dealershipId: 1,
      referenceNumber: "GA-1-XYZ",
      channel: "website",
      bookingId: 5,
    });

    expect(recordOutcome).toHaveBeenCalledOnce();
    expect(recordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: "booking", outcome: "success" }),
    );
    expect(markTestDriveBooked).not.toHaveBeenCalled();
  });

  it("credits Nala for web_chat channel", async () => {
    await markNalaChatBookingConversion({
      dealershipId: 3,
      referenceNumber: "GA-3-WEB",
      channel: "web_chat",
      bookingId: 11,
      customerContact: "buyer@example.com",
    });

    expect(recordOutcome).toHaveBeenCalledTimes(2);
    expect(vi.mocked(recordOutcome).mock.calls.map((c) => c[0].agentId).sort()).toEqual([
      "booking",
      "whatsapp",
    ]);
  });
});
