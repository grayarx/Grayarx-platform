/**
 * Bongi (Fallback Agent) — pure helper tests.
 *
 * We don't hit the LLM here; we exercise the deterministic side: reference
 * numbering, after-hours window, and template fallback.
 */
import { describe, it, expect, vi } from "vitest";

// LLM is stubbed: return nothing useful so the helper falls back to template.
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: "" } }] })),
}));

import {
  generateReferenceNumber,
  isAfterHoursSAST,
  runFallbackAgent,
  draftFallbackReply,
} from "./_core/fallbackAgent";

describe("fallback agent helpers", () => {
  it("generates reference numbers in the GA-K{dealer}-{date}-{tail} format", () => {
    const ref = generateReferenceNumber(42, "buyer@example.com");
    expect(ref).toMatch(/^GA-K42-\d{4}-\d{2}-\d{2}-[0-9A-F]{4}$/);
  });

  it("produces different references for different dealerships and seeds", () => {
    const a = generateReferenceNumber(1, "a");
    const b = generateReferenceNumber(2, "b");
    expect(a).not.toEqual(b);
  });

  it("classifies a Tuesday 03:00 UTC (05:00 SAST) as after-hours", () => {
    // 2026-05-19 is a Tuesday. 03:00 UTC == 05:00 SAST, before 08:00 → after-hours.
    const t = new Date("2026-05-19T03:00:00.000Z");
    expect(isAfterHoursSAST(t)).toBe(true);
  });

  it("classifies a Tuesday 09:00 UTC (11:00 SAST) as in-hours", () => {
    const t = new Date("2026-05-19T09:00:00.000Z");
    expect(isAfterHoursSAST(t)).toBe(false);
  });

  it("classifies Sundays as always after-hours", () => {
    // 2026-05-24 is a Sunday at 10:00 SAST.
    const t = new Date("2026-05-24T08:00:00.000Z");
    expect(isAfterHoursSAST(t)).toBe(true);
  });

  it("classifies Saturday 11:00 SAST as in-hours and 14:00 SAST as after-hours", () => {
    // 2026-05-23 is a Saturday.
    const elevenSast = new Date("2026-05-23T09:00:00.000Z"); // 11:00 SAST
    expect(isAfterHoursSAST(elevenSast)).toBe(false);
    const fourteenSast = new Date("2026-05-23T12:00:00.000Z"); // 14:00 SAST
    expect(isAfterHoursSAST(fourteenSast)).toBe(true);
  });

  it("falls back to a deterministic template when the LLM is empty", async () => {
    const out = await draftFallbackReply(
      {
        customerName: "Sipho",
        channel: "email",
        inboundMessage: "Is the Hilux still available?",
        language: "en",
        dealershipName: "Karoo Motors",
      },
      "GA-K7-2026-05-23-AB12",
    );
    expect(out.language).toBe("en");
    expect(out.reply).toContain("Sipho");
    expect(out.reply).toContain("Karoo Motors");
    expect(out.reply).toContain("GA-K7-2026-05-23-AB12");
  });

  it("draftFallbackReply respects unknown languages by falling back to English", async () => {
    const out = await draftFallbackReply(
      { channel: "email", language: "xx" },
      "GA-K1-2026-05-23-0000",
    );
    // Language is preserved on the output, but the body uses the EN template.
    expect(out.language).toBe("xx");
    expect(out.reply).toContain("GA-K1-2026-05-23-0000");
  });

  it("per-dealership override: closed Tuesday means in-hours moments are flagged after-hours", () => {
    // 2026-05-19 is a Tuesday. Default rules say 11:00 SAST is in-hours.
    const tuesdayMidday = new Date("2026-05-19T09:00:00.000Z");
    expect(isAfterHoursSAST(tuesdayMidday)).toBe(false);
    expect(
      isAfterHoursSAST(tuesdayMidday, { tue: { closed: true } }),
    ).toBe(true);
  });

  it("per-dealership override: extended Sunday hours flip Sunday in-hours", () => {
    // 2026-05-24 is a Sunday at 10:00 SAST. Default = always after-hours.
    const sundayMid = new Date("2026-05-24T08:00:00.000Z");
    expect(isAfterHoursSAST(sundayMid)).toBe(true);
    expect(
      isAfterHoursSAST(sundayMid, {
        sun: { open: "09:00", close: "15:00" },
      }),
    ).toBe(false);
  });

  it("per-dealership override: malformed times fall back to default schedule", () => {
    // Tuesday 11:00 SAST should still be in-hours when the override is junk.
    const tuesdayMidday = new Date("2026-05-19T09:00:00.000Z");
    expect(
      isAfterHoursSAST(tuesdayMidday, {
        tue: { open: "oops", close: "???" },
      }),
    ).toBe(false);
  });

  it("runFallbackAgent returns a stable shape with a reference and a reply", async () => {
    const result = await runFallbackAgent(99, {
      channel: "whatsapp",
      customerName: "Naledi",
      customerContact: "+27821234567",
      language: "en",
      dealershipName: "Highveld Motors",
    });
    expect(result.referenceNumber).toMatch(/^GA-K99-\d{4}-\d{2}-\d{2}-[0-9A-F]{4}$/);
    expect(result.outboundReply.length).toBeGreaterThan(20);
    expect(result.language).toBe("en");
  });
});
