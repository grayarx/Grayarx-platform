import { describe, it, expect } from "vitest";
import {
  AGENT_LIST,
  DEALER_AGENT_LIST,
  FOUNDER_AGENT_LIST,
  agentsForAudience,
  isDealerFacingAgent,
} from "./agents";

describe("agent audience scoping", () => {
  it("marks only customer-ops agents as dealer-facing", () => {
    const dealerIds = DEALER_AGENT_LIST.map((a) => a.id).sort();
    expect(dealerIds).toEqual([
      "booking",
      "email",
      "fallback",
      "preapproval",
      "tradein",
      "whatsapp",
    ]);
  });

  it("keeps Sipho, Kagiso, Thandi, Themba off the dealer roster", () => {
    const founderIds = FOUNDER_AGENT_LIST.map((a) => a.id).sort();
    expect(founderIds).toEqual(["accountant", "calling", "improvement", "prospector"]);
    for (const id of founderIds) {
      expect(isDealerFacingAgent(id)).toBe(false);
    }
  });

  it("agentsForAudience returns the correct lists", () => {
    expect(agentsForAudience("dealer")).toEqual(DEALER_AGENT_LIST);
    expect(agentsForAudience("founder").some((a) => a.id === "calling")).toBe(true);
    expect(agentsForAudience("founder").length).toBe(AGENT_LIST.length);
  });

  it("every persona has an audience tag", () => {
    for (const a of AGENT_LIST) {
      expect(["dealer", "founder"]).toContain(a.audience);
    }
  });
});
