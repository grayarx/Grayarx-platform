import { describe, expect, it } from "vitest";
import {
  composeShowroomBotReply,
  ensureWhatsAppSpacing,
  normalizeBuyerMessage,
  polishNalaReply,
} from "../shared/nalaGrammarPolish";

describe("normalizeBuyerMessage", () => {
  it("fixes kleer → kleur", () => {
    expect(normalizeBuyerMessage("watse kleer het julle hom in")).toContain("kleur");
  });
});

describe("polishNalaReply", () => {
  it("fixes truncated Afrikaans follow-up and or→of", () => {
    const out = polishNalaReply(
      "lets anders oor hierdie motor, or kies 'n opsie hieronder?",
      "af",
    );
    expect(out).toMatch(/^Iets anders/i);
    expect(out).toContain("of kies");
  });

  it("preserves blank lines between WhatsApp sections", () => {
    const raw = "Sawubona\n\n**Polo** i-R250 000\n\nUfuna ukushayela?";
    const out = polishNalaReply(raw, "zu");
    expect(out).toContain("\n\n");
    expect(out.split("\n\n").length).toBeGreaterThanOrEqual(2);
  });

  it("collapses triple newlines to double", () => {
    const out = polishNalaReply("Hi\n\n\n\nNext", "en");
    expect(out).toBe("Hi\n\nNext");
  });
});

describe("ensureWhatsAppSpacing", () => {
  it("adds blank line before CTA separator", () => {
    const out = ensureWhatsAppSpacing("Body text\n─────────────\nBook now");
    expect(out).toContain("Body text\n\n─────────────\n\nBook now");
  });
});

describe("composeShowroomBotReply", () => {
  it("appends current Afrikaans follow-up once", () => {
    const out = composeShowroomBotReply("Die motor is **R 100 000**.", "af", {
      appendFollowUp: true,
    });
    expect(out).toContain("Die motor is **R 100 000**.");
    expect(out).toContain("Is daar nog iets");
    expect(out).toContain("hierdie motor");
  });

  it("skips follow-up when already asking for name", () => {
    const main = "Wat is jou naam sodat ons kan opvolg?";
    const out = composeShowroomBotReply(main, "af", { appendFollowUp: true });
    expect(out).toBe(main);
  });
});
