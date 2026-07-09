import { describe, expect, it } from "vitest";
import {
  answerShowroomQuestion,
  detectShowroomLanguage,
  formatVehicleDisplayName,
  greetingForVehicle,
} from "../shared/nalaShowroomChat";
import { getFlowPrompt, isSkipReply } from "../shared/nalaFlowTranslations";

const vehicle = {
  title: "2001 Ford Mustang",
  year: 2001,
  price: 1,
  km: 0,
  fuel: "Petrol",
  transmission: "Manual",
  color: "Red",
  location: "Sandton",
};

describe("formatVehicleDisplayName", () => {
  it("does not duplicate year when title already starts with year", () => {
    expect(formatVehicleDisplayName(2001, "2001 Ford Mustang")).toBe("2001 Ford Mustang");
  });

  it("prepends year when missing from title", () => {
    expect(formatVehicleDisplayName(2022, "Toyota Corolla XS")).toBe("2022 Toyota Corolla XS");
  });
});

describe("detectShowroomLanguage", () => {
  it("detects Afrikaans", () => {
    expect(
      detectShowroomLanguage("ek hou van die kar watse kleur het julle hom in"),
    ).toBe("af");
  });

  it("detects isiZulu", () => {
    expect(detectShowroomLanguage("ngicela umbala wale moto")).toBe("zu");
  });

  it("detects Sepedi", () => {
    expect(detectShowroomLanguage("ke kopa mmala wa koloi ye")).toBe("nso");
  });

  it("detects Xitsonga", () => {
    expect(detectShowroomLanguage("ndzi lava ku vona muvala wa movha")).toBe("ts");
  });

  it("detects Portuguese", () => {
    expect(detectShowroomLanguage("qual é a cor deste carro")).toBe("pt");
  });
});

describe("answerShowroomQuestion — all languages", () => {
  it("answers Afrikaans colour question", () => {
    const { answered, reply } = answerShowroomQuestion(
      vehicle,
      "ek hou van die kar watse kleur het julle hom in",
      "af",
    );
    expect(answered).toBe(true);
    expect(reply.toLowerCase()).toContain("red");
    expect(reply).toContain("2001 Ford Mustang");
    expect(reply).not.toContain("2001 2001");
  });

  it("answers isiZulu price question in Zulu", () => {
    const { answered, reply } = answerShowroomQuestion(
      { ...vehicle, price: 450_000 },
      "malini le moto",
      "zu",
    );
    expect(answered).toBe(true);
    expect(reply).toMatch(/450[\s\u00a0]?000|R/);
    expect(reply.toLowerCase()).not.toContain("the **");
  });

  it("answers Setswana location question", () => {
    const { answered, reply } = answerShowroomQuestion(
      vehicle,
      "koloi e mo kae",
      "tn",
    );
    expect(answered).toBe(true);
    expect(reply).toContain("Sandton");
  });

  it("answers Tshivenḓa fuel question", () => {
    const { answered, reply } = answerShowroomQuestion(
      vehicle,
      "ndi khou vha na mafuta a mini",
      "ve",
    );
    expect(answered).toBe(true);
    expect(reply).toContain("Petrol");
  });

  it("greets in all official languages without English fallback", () => {
    const langs = ["en", "af", "zu", "xh", "st", "nso", "tn", "ts", "ss", "ve", "nr"] as const;
    for (const lang of langs) {
      const g = greetingForVehicle(
        { title: "Toyota Corolla", year: 2022, price: 280_000, km: 50_000, fuel: "Petrol", transmission: "Auto" },
        "Test Motors",
        lang,
      );
      expect(g.length).toBeGreaterThan(40);
      expect(g).toContain("Nala");
    }
  });
});

describe("guided flow prompts", () => {
  it("returns Afrikaans test drive start", () => {
    const msg = getFlowPrompt("testDriveStart", "af");
    expect(msg.toLowerCase()).toContain("naam");
  });

  it("recognizes skip synonyms", () => {
    expect(isSkipReply("skip")).toBe(true);
    expect(isSkipReply("sla oor")).toBe(true);
    expect(isSkipReply("2025-07-15")).toBe(false);
  });
});
