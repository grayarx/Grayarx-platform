/**
 * Language coverage spec: every one of the 11 SA official languages must
 * be reachable through the four customer-facing agents (Mia, Nala, Bongi,
 * Naledi) and through the language-detector. Soft-supported Portuguese is
 * also covered.
 *
 * This spec acts as a contract: if anyone adds a new language to
 * shared/languages.ts, all four agents must grow templates for it or this
 * spec fails. If anyone removes a language from one agent without removing
 * it from the canonical list, this spec fails.
 */

import { describe, it, expect, vi } from "vitest";

/**
 * Mock invokeLLM so we exercise the *template path* of every agent rather
 * than the (slow, non-deterministic) LLM polish path. This means the spec
 * actually verifies the bundled per-language template content, which is
 * what we ship when the network/LLM is down anyway.
 */
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: "" } }],
  })),
}));
import {
  LANGUAGES,
  SA_OFFICIAL_LANGUAGES,
  ALL_LANGUAGE_CODES,
  detectLanguage,
  type LanguageCode,
} from "../shared/languages";
import { LANGUAGE_RULES, addWhatsAppAIDisclosure } from "./_core/agentPrompts";

describe("11-language coverage — canonical table", () => {
  it("contains exactly 11 SA official languages", () => {
    expect(SA_OFFICIAL_LANGUAGES).toHaveLength(11);
  });

  it("each SA official language has a non-empty greeting, closing, honorifics and styleNote", () => {
    for (const code of SA_OFFICIAL_LANGUAGES) {
      const meta = LANGUAGES[code];
      expect(meta.greeting.length, `greeting for ${code}`).toBeGreaterThan(0);
      expect(meta.closing.length, `closing for ${code}`).toBeGreaterThan(0);
      expect(meta.honorifics.length, `honorifics for ${code}`).toBeGreaterThan(0);
      expect(meta.styleNote.length, `styleNote for ${code}`).toBeGreaterThan(20);
      expect(meta.saOfficial, `${code} marked saOfficial`).toBe(true);
    }
  });

  it("the canonical list contains the 11 expected codes (no spelling drift)", () => {
    expect(SA_OFFICIAL_LANGUAGES.sort()).toEqual(
      ["af", "en", "nr", "nso", "ss", "st", "tn", "ts", "ve", "xh", "zu"].sort(),
    );
  });
});

describe("11-language coverage — Mia/Nala agent prompts", () => {
  it("LANGUAGE_RULES has an entry for every code in the canonical list", () => {
    for (const code of ALL_LANGUAGE_CODES) {
      expect(LANGUAGE_RULES[code], `LANGUAGE_RULES missing ${code}`).toBeTruthy();
    }
  });

  it("each rule's greeting matches the canonical greeting", () => {
    for (const code of ALL_LANGUAGE_CODES) {
      expect(LANGUAGE_RULES[code].greeting).toBe(LANGUAGES[code].greeting);
    }
  });
});

describe("11-language coverage — Nala WhatsApp disclosure tag", () => {
  it("addWhatsAppAIDisclosure produces a non-empty prefix in every language", () => {
    for (const code of ALL_LANGUAGE_CODES) {
      const out = addWhatsAppAIDisclosure("Test message body.", code as LanguageCode);
      expect(out, `${code}`).toContain("Nala (GrayArx)");
      expect(out, `${code}`).toMatch(/AI|IA|KI/); // matches at least one AI marker
    }
  });

  it("does not double-prefix when LLM already added one", () => {
    const draft = "AI assistant Nala here. Hi customer.";
    const out = addWhatsAppAIDisclosure(draft, "en");
    // Should be unchanged (heuristic detected existing AI marker)
    expect(out).toBe(draft);
  });
});

describe("11-language coverage — Bongi fallback templates", () => {
  it("has a fallback template per SA official language + pt", async () => {
    const { draftFallbackReply } = await import("./_core/fallbackAgent");
    const englishReply = await draftFallbackReply(
      {
        customerName: "Henrique",
        dealershipName: "GrayArx Sandton",
        inboundMessage: "After hours test",
        channel: "chat",
        language: "en",
      },
      "GA-TEST-1",
    );

    for (const code of ALL_LANGUAGE_CODES) {
      const reply = await draftFallbackReply(
        {
          customerName: "Henrique",
          dealershipName: "GrayArx Sandton",
          inboundMessage: "After hours test",
          channel: "chat",
          language: code as LanguageCode,
        },
        "GA-TEST-1",
      );
      expect(reply.reply, `${code} reply contains reference`).toContain(
        "GA-TEST-1",
      );
      expect(reply.language, `${code} returns its own code`).toBe(code);
      expect(reply.reply.length, `${code} length`).toBeGreaterThan(40);
      if (code !== "en") {
        expect(
          reply.reply,
          `${code} should differ from English template`,
        ).not.toBe(englishReply.reply);
      }
    }
  });
});

describe("11-language coverage — Naledi pre-approval templates", () => {
  it("has a pre-approval ack template per SA official language + pt", async () => {
    const { draftPreApprovalReply } = await import("./_core/preApprovalAgent");
    for (const code of ALL_LANGUAGE_CODES) {
      const result = await draftPreApprovalReply(
        {
          fullName: "Henrique Marx",
          email: "h@example.com",
          phone: "+27 79 123 4567",
          monthlyIncomeZar: 35_000,
          monthlyExpensesZar: 15_000,
          employmentStatus: "permanent",
          desiredVehiclePriceZar: 250_000,
          depositZar: 25_000,
          language: code as LanguageCode,
          dealershipName: "GrayArx Sandton",
          consent: true,
        } as never,
        "GA-PA-TEST",
      );
      expect(result.reply, `${code}`).toContain("GA-PA-TEST");
      // Hard invariant: the bot may NEVER use the word "approved" in any
      // language — it always defers to a human.
      expect(
        /(\bapproved\b|\bgoedgekeur\b)/i.test(result.reply),
        `${code} must not auto-approve`,
      ).toBe(false);
    }
  });
});

describe("11-language coverage — language detector", () => {
  // Each greeting should round-trip back to its language. Some greetings
  // overlap (e.g. "Sawubona" is shared by Zulu/Swati, "Dumela" by Sotho/
  // Tswana/Pedi) so we assert detector returns *one of the acceptable*
  // languages for each greeting, not necessarily the exact one.
  const cases: Array<{ greeting: string; acceptable: LanguageCode[] }> = [
    { greeting: "Hi there, I'm interested in the Corolla.", acceptable: ["en"] },
    { greeting: "Hallo, ek soek 'n motor onder R200 000.", acceptable: ["af"] },
    { greeting: "Sawubona, ngicela imoto.", acceptable: ["zu", "ss"] },
    { greeting: "Molo, ndifuna imoto.", acceptable: ["xh"] },
    { greeting: "Dumela ntate, ke kopa thuso.", acceptable: ["st", "tn", "nso"] },
    { greeting: "Avuxeni, ndzi lava xilo xa kona.", acceptable: ["ts"] },
    { greeting: "Lotjhani, sicela imali.", acceptable: ["nr", "zu"] },
    { greeting: "Ndaa, ndo livhuwa.", acceptable: ["ve"] },
    { greeting: "Olá, quanto custa?", acceptable: ["pt"] },
  ];

  for (const c of cases) {
    it(`detects "${c.greeting.slice(0, 20)}…" as one of ${c.acceptable.join("/")}`, () => {
      const detected = detectLanguage(c.greeting);
      expect(c.acceptable, `got ${detected}`).toContain(detected);
    });
  }
});
