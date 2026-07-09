import { describe, expect, it } from "vitest";
import {
  GREETING,
  PROMPT_ASK_EMAIL,
  PROMPT_ASK_NAME,
  PROMPT_ASK_PHONE,
  PROMPT_FOLLOW_UP,
  PROMPT_THANKS_ENQUIRY,
  REPLY_AVAILABILITY,
  REPLY_COLOR_KNOWN,
  REPLY_COLOR_UNKNOWN,
  REPLY_FINANCE,
  REPLY_FUEL,
  REPLY_GENERAL,
  REPLY_KM,
  REPLY_LOCATION_KNOWN,
  REPLY_LOCATION_UNKNOWN,
  REPLY_PRICE,
  REPLY_TEST_DRIVE,
  REPLY_TRADE_IN,
  REPLY_TRANSMISSION,
} from "../shared/nalaTranslations";
import {
  FLOW_ENQUIRY_START,
  FLOW_ERROR_GENERIC,
  FLOW_TEST_DRIVE_START,
  QUICK_ASK,
  QUICK_TEST_DRIVE,
} from "../shared/nalaFlowTranslations";
import { validateLangStrings } from "../shared/nalaGrammarPolish";
import { ALL_LANGUAGE_CODES, type LanguageCode } from "../shared/languages";
import { answerShowroomQuestion } from "../shared/nalaShowroomChat";

const TEMPLATE_SETS: Array<[string, Record<LanguageCode, string>]> = [
  ["PROMPT_ASK_NAME", PROMPT_ASK_NAME],
  ["PROMPT_ASK_EMAIL", PROMPT_ASK_EMAIL],
  ["PROMPT_ASK_PHONE", PROMPT_ASK_PHONE],
  ["PROMPT_FOLLOW_UP", PROMPT_FOLLOW_UP],
  ["PROMPT_THANKS_ENQUIRY", PROMPT_THANKS_ENQUIRY],
  ["GREETING", GREETING],
  ["REPLY_COLOR_KNOWN", REPLY_COLOR_KNOWN],
  ["REPLY_COLOR_UNKNOWN", REPLY_COLOR_UNKNOWN],
  ["REPLY_PRICE", REPLY_PRICE],
  ["REPLY_KM", REPLY_KM],
  ["REPLY_FUEL", REPLY_FUEL],
  ["REPLY_TRANSMISSION", REPLY_TRANSMISSION],
  ["REPLY_LOCATION_KNOWN", REPLY_LOCATION_KNOWN],
  ["REPLY_LOCATION_UNKNOWN", REPLY_LOCATION_UNKNOWN],
  ["REPLY_TEST_DRIVE", REPLY_TEST_DRIVE],
  ["REPLY_FINANCE", REPLY_FINANCE],
  ["REPLY_TRADE_IN", REPLY_TRADE_IN],
  ["REPLY_AVAILABILITY", REPLY_AVAILABILITY],
  ["REPLY_GENERAL", REPLY_GENERAL],
  ["FLOW_TEST_DRIVE_START", FLOW_TEST_DRIVE_START],
  ["FLOW_ENQUIRY_START", FLOW_ENQUIRY_START],
  ["FLOW_ERROR_GENERIC", FLOW_ERROR_GENERIC],
  ["QUICK_TEST_DRIVE", QUICK_TEST_DRIVE],
  ["QUICK_ASK", QUICK_ASK],
];

describe("Nala templates — all 12 languages", () => {
  for (const [label, strings] of TEMPLATE_SETS) {
    it(`${label} passes quality gates`, () => {
      const failures = validateLangStrings(label, strings);
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }

  it("every language has a non-empty greeting", () => {
    for (const lang of ALL_LANGUAGE_CODES) {
      expect(GREETING[lang].length).toBeGreaterThan(20);
      expect(GREETING[lang]).toContain("Nala");
    }
  });

  it("colour intent works with common phrasing in each language", () => {
    const samples: Array<[LanguageCode, string]> = [
      ["af", "watse kleer het julle hom in"],
      ["zu", "ngiyiphi umbala wale moto"],
      ["xh", "yintoni umbala wale moto"],
      ["st", "mmala ke eng oa koloi ena"],
      ["nso", "mmala ke eng wa koloi ye"],
      ["tn", "mmala ke eng wa koloi e"],
      ["ts", "muvala wu ri mini wa movha lowu"],
      ["ss", "ngitsandza umbala wale moto"],
      ["ve", "ndi khou vha na mmala mini"],
      ["nr", "umbala wale moto ngubani"],
      ["pt", "qual é a cor deste carro"],
      ["en", "what colour is this car"],
    ];
    const vehicle = {
      title: "Toyota Corolla",
      year: 2020,
      price: 250_000,
      km: 40_000,
      fuel: "Petrol",
      transmission: "Automatic",
      color: "White",
      location: "Sandton",
    };
    for (const [lang, question] of samples) {
      const { intent, answered } = answerShowroomQuestion(vehicle, question, lang);
      expect(intent, `${lang}: ${question}`).toBe("color");
      expect(answered).toBe(true);
    }
  });
});
