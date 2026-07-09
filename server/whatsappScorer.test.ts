import { describe, expect, it } from "vitest";
import { scoreWhatsAppDraft } from "./_core/agentPrompts";

describe("scoreWhatsAppDraft", () => {
  it("accepts a short friendly English reply", () => {
    const r = scoreWhatsAppDraft(
      "Hi! Yes the 2022 Corolla is still here. Want to swing by tomorrow? — Nala",
      "en",
    );
    expect(r.score).toBeGreaterThanOrEqual(82);
    expect(r.issues).toHaveLength(0);
  });

  it("rejects long replies that look like an email", () => {
    const longBody = Array(80).fill("word").join(" ") + " Kind regards, Nala";
    const r = scoreWhatsAppDraft(longBody, "en");
    expect(r.score).toBeLessThan(82);
    expect(r.issues.some((i) => /Too long/i.test(i))).toBe(true);
    expect(r.issues.some((i) => /formal email-style closing/i.test(i))).toBe(true);
  });

  it("rejects a reply with too many emoji", () => {
    const r = scoreWhatsAppDraft("Hi 🎉🚗🔥 see you tomorrow! — Nala", "en");
    expect(r.issues.some((i) => /Too many emoji/i.test(i))).toBe(true);
  });

  it("does not require an Afrikaans greeting on very short replies", () => {
    const r = scoreWhatsAppDraft("Ja, kom maar! — Nala", "af");
    // Short reply, no English fallback warning
    expect(r.issues.some((i) => /English fallback/i.test(i))).toBe(false);
  });

  it("flags self-references like 'I am a bot'", () => {
    const r = scoreWhatsAppDraft("Hi, I am a bot at GrayArx, how can I help — Nala", "en");
    expect(r.issues.some((i) => /Self-references as bot/i.test(i))).toBe(true);
  });
});
