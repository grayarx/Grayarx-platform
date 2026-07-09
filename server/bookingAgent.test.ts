/**
 * Lerato (Booking Agent) — pure helper tests.
 *
 * We don't hit the LLM here; we stub it so the helper always falls back to
 * the deterministic template. That lets us assert template invariants
 * across every supported language without LLM flakiness.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: "" } }] })),
}));

import {
  suggestNextSlot,
  formatSlotSAST,
  draftBookingReply,
  runBookingAgent,
  ALL_LANGUAGE_CODES,
} from "./_core/bookingAgent";
import { isAfterHoursSAST } from "./_core/fallbackAgent";

describe("Lerato — slot suggestion", () => {
  it("returns an in-business-hours slot from a Sunday afternoon ask", () => {
    // 2026-05-24 (Sun) 14:00 SAST = 12:00 UTC
    const sundayAfternoon = new Date(Date.UTC(2026, 4, 24, 12, 0, 0));
    const { start, end } = suggestNextSlot(sundayAfternoon);
    expect(start.getTime()).toBeGreaterThan(sundayAfternoon.getTime());
    expect(isAfterHoursSAST(start)).toBe(false);
    expect(end.getTime() - start.getTime()).toBe(60 * 60 * 1000);
  });

  it("clamps a far-past request forward to a current in-hours slot", () => {
    const longAgo = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));
    const { start } = suggestNextSlot(longAgo);
    // Must be a future, in-hours moment.
    expect(start.getTime()).toBeGreaterThan(Date.now() - 1000);
    expect(isAfterHoursSAST(start)).toBe(false);
  });

  it("honours per-dealership business-hours override (closed all week)", () => {
    const closedOverride = {
      mon: { closed: true },
      tue: { closed: true },
      wed: { closed: true },
      thu: { closed: true },
      fri: { closed: true },
      sat: { closed: true },
      sun: { closed: true },
    };
    // Even with an override that closes every day, suggestNextSlot must
    // return *something* (the hard fallback) rather than throwing or
    // looping forever.
    const { start, end } = suggestNextSlot(new Date(), closedOverride);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});

describe("Lerato — formatSlotSAST", () => {
  it("formats a Saturday 11:00 SAST UTC slot as 'Sat ... at 11:00'", () => {
    // 2026-05-23 (Sat) 11:00 SAST = 09:00 UTC
    const slot = new Date(Date.UTC(2026, 4, 23, 9, 0, 0));
    expect(formatSlotSAST(slot)).toBe("Sat 23 May at 11:00");
  });
});

describe("Lerato — multilingual template invariants", () => {
  // For each supported language, the deterministic template (LLM stubbed)
  // MUST contain (a) the reference number, (b) the slot text, (c) the
  // dealership name, (d) the customer's first name, AND must NOT use the
  // forbidden words "confirmed" / "booked" — Lerato never auto-confirms.
  for (const code of ALL_LANGUAGE_CODES) {
    it(`renders a non-empty ack for ${code}`, async () => {
      const slotStart = new Date(Date.UTC(2026, 4, 25, 7, 0, 0)); // Mon 09:00 SAST
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const { reply, language } = await draftBookingReply(
        {
          customerName: "Thandiwe Dlamini",
          customerContact: "+27821234567",
          channel: "website",
          inboundMessage: "I'd like to test drive on Monday.",
          vehicleTitle: "2022 Toyota Corolla 1.8 XS",
          dealershipName: "Sandton Motors",
          language: code,
        },
        "GA-K7-2026-05-25-ABCD",
        { start: slotStart, end: slotEnd },
      );
      expect(language).toBe(code);
      expect(reply).toContain("GA-K7-2026-05-25-ABCD");
      expect(reply).toContain("Sandton Motors");
      expect(reply).toContain("Thandiwe");
      expect(reply).toContain("Mon 25 May at 09:00");
      expect(reply).not.toMatch(/\b(confirmed|booked)\b/i);
    });
  }
});

describe("Lerato — runBookingAgent end-to-end (template path)", () => {
  it("rejects empty names and contacts", async () => {
    await expect(() =>
      runBookingAgent(1, {
        customerName: "",
        customerContact: "+27821234567",
        channel: "website",
      }),
    ).rejects.toThrow();
    await expect(() =>
      runBookingAgent(1, {
        customerName: "Thandi",
        customerContact: "x",
        channel: "website",
      }),
    ).rejects.toThrow();
  });

  it("flags slot_shifted when the customer asked for a Sunday slot", async () => {
    const sunday = new Date(Date.UTC(2026, 4, 24, 12, 0, 0));
    const out = await runBookingAgent(7, {
      customerName: "Thandiwe",
      customerContact: "+27821234567",
      channel: "website",
      requestedSlotStart: sunday.toISOString(),
      dealershipName: "Sandton Motors",
      language: "en",
    });
    expect(out.slotShifted).toBe(true);
    expect(out.suggestedSlotStart.getTime()).toBeGreaterThan(sunday.getTime());
    expect(isAfterHoursSAST(out.suggestedSlotStart)).toBe(false);
    expect(out.referenceNumber).toMatch(/^GA-K7-\d{4}-\d{2}-\d{2}-[0-9A-F]{4}$/);
  });
});
