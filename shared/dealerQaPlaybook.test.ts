import { describe, it, expect } from "vitest";
import {
  DEALER_QA_ENTRIES,
  DEALER_QA_NEVER_SAY,
  DEALER_QA_PRODUCT_TRUTHS,
  agentGetsDealerQaPlaybook,
  dealerQaCount,
  formatDealerQaForSystemPrompt,
  matchDealerQa,
} from "./dealerQaPlaybook";

describe("dealerQaPlaybook", () => {
  it("exports ~32 Q&A entries (v3 playbook)", () => {
    expect(dealerQaCount()).toBeGreaterThanOrEqual(30);
    expect(DEALER_QA_ENTRIES.length).toBe(dealerQaCount());
  });

  it("sample pricing answer uses Showroom / Growth / Multi-site", () => {
    const cost = DEALER_QA_ENTRIES.find((e) => e.id === "q1_cost");
    expect(cost?.answer).toMatch(/Showroom/);
    expect(cost?.answer).toMatch(/Growth/);
    expect(cost?.answer).toMatch(/Multi-site/);
  });

  it("VIN answer mentions ISO 3779 and masking", () => {
    const vin = DEALER_QA_ENTRIES.find((e) => e.id === "q16_vin");
    expect(vin?.answer).toMatch(/ISO 3779/);
    expect(vin?.answer.toLowerCase()).toMatch(/mask/);
  });

  it("never-say list bans Manus Forge for chat", () => {
    expect(DEALER_QA_NEVER_SAY.some((n) => /Manus Forge/i.test(n))).toBe(true);
  });

  it("product truths mention no Forge for chat", () => {
    const llm = DEALER_QA_PRODUCT_TRUTHS.find((t) => t.truth === "LLM");
    expect(llm?.line).toMatch(/No Forge/i);
  });

  it("matchDealerQa finds WhatsApp Business question", () => {
    const hit = matchDealerQa("Do we need a WhatsApp Business number?");
    expect(hit?.id).toBe("q5_wa_business");
    expect(hit?.answer).toMatch(/Growth features/);
    expect(hit?.answer).toMatch(/Showroom/);
  });

  it("formatDealerQaForSystemPrompt is cached and includes playbook header", () => {
    const a = formatDealerQaForSystemPrompt();
    const b = formatDealerQaForSystemPrompt();
    expect(a).toBe(b);
    expect(a).toContain("Dealer Q&A Playbook");
    expect(a).toContain("Showroom / Growth / Multi-site");
    expect(a).toContain("No Manus Forge for chat");
  });

  it("only Kagiso (improvement) and Sipho (prospector) get the playbook", () => {
    expect(agentGetsDealerQaPlaybook("improvement")).toBe(true);
    expect(agentGetsDealerQaPlaybook("prospector")).toBe(true);
    expect(agentGetsDealerQaPlaybook("whatsapp")).toBe(false);
    expect(agentGetsDealerQaPlaybook("fallback")).toBe(false);
    expect(agentGetsDealerQaPlaybook("email")).toBe(false);
    expect(agentGetsDealerQaPlaybook("tradein")).toBe(false);
  });
});
