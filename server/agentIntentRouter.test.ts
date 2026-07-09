import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createTestDriveBooking: vi.fn().mockResolvedValue(undefined),
  createFallbackMessage: vi.fn().mockResolvedValue(undefined),
  listFutureBookingWindows: vi.fn().mockResolvedValue([]),
  logAgentActivity: vi.fn().mockResolvedValue(undefined),
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
}));

vi.mock("./_core/agentPrompts", () => ({
  addWhatsAppAIDisclosure: vi.fn((s: string) => s),
}));

import { resolveRoutedReply } from "./_core/agentIntentRouter";
import { resolveNalaReply } from "./_core/nalaReplyOrchestrator";
import { runFallbackAgent, isAfterHoursSAST } from "./_core/fallbackAgent";

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

  it("routes after-hours general chat to Bongi", async () => {
    vi.mocked(isAfterHoursSAST).mockReturnValue(true);
    vi.mocked(runFallbackAgent).mockResolvedValue({
      referenceNumber: "FALL-1",
      outboundReply: "Thanks — we'll call you back first thing tomorrow.",
      language: "en",
    });

    const res = await resolveRoutedReply({
      ...baseInput,
      message: "Hello, are you there?",
    });

    expect(res.agent).toBe("bongi");
    expect(res.intent).toBe("after_hours");
    expect(res.referenceNumber).toBe("FALL-1");
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
});
