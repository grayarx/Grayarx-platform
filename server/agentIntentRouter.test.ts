import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createTestDriveBooking: vi.fn().mockResolvedValue({ id: 42 }),
  createFallbackMessage: vi.fn().mockResolvedValue(undefined),
  listFutureBookingWindows: vi.fn().mockResolvedValue([]),
  logAgentActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/chatBookingConversion", () => ({
  markNalaChatBookingConversion: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/bookingAgent", () => ({
  runBookingAgent: vi.fn(),
  suggestNextSlot: vi.fn(() => ({
    start: new Date("2026-07-10T10:00:00+02:00"),
    end: new Date("2026-07-10T11:00:00+02:00"),
  })),
  draftBookingReply: vi.fn(),
  formatSlotSAST: vi.fn(),
}));

vi.mock("./_core/fallbackAgent", () => ({
  runFallbackAgent: vi.fn(),
  isAfterHoursSAST: vi.fn(),
  generateReferenceNumber: vi.fn(() => "REF-123"),
}));

vi.mock("./_core/nalaReplyOrchestrator", () => ({
  resolveNalaReply: vi.fn(),
  stripMarkdownForWhatsApp: vi.fn((s: string) => s),
  getConvState: vi.fn(() => undefined),
}));

vi.mock("./_core/agentPrompts", () => ({
  addWhatsAppAIDisclosure: vi.fn((s: string) => s),
}));

import { resolveRoutedReply } from "./_core/agentIntentRouter";
import { resolveNalaReply } from "./_core/nalaReplyOrchestrator";
import { runFallbackAgent, isAfterHoursSAST } from "./_core/fallbackAgent";
import { createTestDriveBooking, logAgentActivity } from "./db";
import { markNalaChatBookingConversion } from "./_core/chatBookingConversion";
import { runBookingAgent } from "./_core/bookingAgent";

describe("agentIntentRouter", () => {
  const baseInput = {
    message: "hello",
    channel: "web" as const,
    dealershipId: 1,
    dealershipName: "Test Dealer",
    vehicle: {
      title: "2022 VW Polo",
      price: 250000,
      year: 2022,
      km: 45000,
      fuel: "petrol",
      transmission: "automatic",
    },
    vehicleId: 99,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAfterHoursSAST).mockReturnValue(false);
  });

  it("routes booking on web to Lerato handoff", async () => {
    const res = await resolveRoutedReply({
      ...baseInput,
      message: "Can I book a test drive?",
    });
    expect(res.agent).toBe("lerato");
    expect(res.intent).toBe("test_drive");
    expect(res.reply).toContain("Lerato");
  });

  it("routes trade-in to Tumi", async () => {
    const res = await resolveRoutedReply({
      ...baseInput,
      message: "What's my trade-in value?",
    });
    expect(res.agent).toBe("tumi");
    expect(res.intent).toBe("trade_in");
    expect(res.reply).toContain("Tumi");
  });

  it("routes after-hours general chat to Nala (24/7 AI)", async () => {
    vi.mocked(isAfterHoursSAST).mockReturnValue(true);
    vi.mocked(resolveNalaReply).mockResolvedValue({
      reply: "Hi! I'm Nala — what car are you looking for?",
      language: "en",
      intent: "general",
      answered: true,
      source: "llm",
      isBookingIntent: false,
    });

    const res = await resolveRoutedReply({
      ...baseInput,
      message: "Hello, are you there?",
    });

    expect(res.agent).toBe("nala");
    expect(res.intent).toBe("general");
    expect(resolveNalaReply).toHaveBeenCalledOnce();
    expect(runFallbackAgent).not.toHaveBeenCalled();
  });

  it("falls through to Nala for in-hours vehicle questions", async () => {
    vi.mocked(resolveNalaReply).mockResolvedValue({
      reply: "It's red.",
      language: "en",
      intent: "color",
      answered: true,
      source: "template",
      isBookingIntent: false,
    });

    const res = await resolveRoutedReply({
      ...baseInput,
      message: "What colour is it?",
    });

    expect(res.agent).toBe("nala");
    expect(res.reply).toBe("It's red.");
    expect(resolveNalaReply).toHaveBeenCalledOnce();
  });

  it("marks WhatsApp Lerato bookings as chat→booking conversions", async () => {
    vi.mocked(runBookingAgent).mockResolvedValue({
      referenceNumber: "GA-1-CONV",
      outboundReply: "Booked — awaiting confirmation.",
      language: "en",
      requestedSlotStart: new Date("2026-07-10T10:00:00+02:00"),
      requestedSlotEnd: new Date("2026-07-10T11:00:00+02:00"),
      suggestedSlotStart: new Date("2026-07-10T10:00:00+02:00"),
      suggestedSlotEnd: new Date("2026-07-10T11:00:00+02:00"),
      slotShifted: false,
    } as any);

    const res = await resolveRoutedReply({
      ...baseInput,
      channel: "whatsapp",
      customerPhone: "+27820001111",
      customerName: "Thabo Test",
      message: "I'd like to book a test drive tomorrow at 10",
    });

    expect(res.agent).toBe("lerato");
    expect(createTestDriveBooking).toHaveBeenCalledOnce();
    expect(logAgentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "booking",
        action: "booking_received",
        subjectId: 42,
      }),
    );
    expect(markNalaChatBookingConversion).toHaveBeenCalledWith(
      expect.objectContaining({
        dealershipId: 1,
        referenceNumber: "GA-1-CONV",
        channel: "whatsapp",
        bookingId: 42,
        customerContact: "+27820001111",
      }),
    );
  });
});
