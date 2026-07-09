import { describe, expect, it } from "vitest";
import { composeShowroomBotReply, normalizeBuyerMessage, polishNalaReply } from "../shared/nalaGrammarPolish";

describe("normalizeBuyerMessage", () => {
  it("fixes kleer → kleur", () => {
    expect(normalizeBuyerMessage("watse kleer het julle hom in")).toContain("kleur");
  });
});

describe("polishNalaReply", () => {
  it("fixes truncated Afrikaans follow-up", () => {
    const out = polishNalaReply("lets anders oor hierdie motor, or kies 'n opsie hieronder?", "af");
    expect(out).toMatch(/^Iets anders/i);
    expect(out).toContain("of kies");
  });
});

describe("composeShowroomBotReply", () => {
  it("appends follow-up once", () => {
    const out = composeShowroomBotReply("Die motor is **R 100 000**.", "af", {
      appendFollowUp: true,
    });
    expect(out).toContain("Iets anders");
    expect(out).toContain("opsie hieronder");
  });

  it("skips follow-up when already asking for name", () => {
    const main = "Wat is jou naam sodat ons kan opvolg?";
    const out = composeShowroomBotReply(main, "af", { appendFollowUp: true });
    expect(out).toBe(main);
  });
});
