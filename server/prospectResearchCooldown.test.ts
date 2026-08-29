import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  researchKeyFrom,
  isResearchOnCooldown,
  markResearchAttemptedInMemory,
  seedResearchCooldownForTests,
  _clearResearchCooldownsForTests,
  RESEARCH_COOLDOWN_MS,
} from "./_core/prospectResearchCooldown";
import {
  isOnResearchCooldown,
  markProspectResearchAttempted,
  countResearchableProspects,
  pickNextProspectsForResearch,
  _clearResearchCooldownsForTests as clearPool,
} from "./_core/saProspectPool";

describe("prospect research cooldown persistence (in-memory adapter)", () => {
  beforeEach(() => {
    _clearResearchCooldownsForTests();
    clearPool();
  });

  it("uses a stable website-host key when a site is known", () => {
    expect(
      researchKeyFrom({ name: "Voncal Auto", website: "https://www.voncalauto.co.za/about" }),
    ).toBe("host:voncalauto.co.za");
    expect(researchKeyFrom({ name: "Voncal Auto", prospectId: 42 })).toBe("prospect:42");
    expect(researchKeyFrom({ name: "Voncal Auto" })).toBe("name:voncal auto");
  });

  it("skips re-research while cooldownUntil is in the future", () => {
    const key = researchKeyFrom({ website: "https://examplemotors.co.za" });
    seedResearchCooldownForTests(key, Date.now() + 60 * 60 * 1000, "no_named_email");
    expect(isResearchOnCooldown(key)).toBe(true);
    expect(isOnResearchCooldown("Example Motors", "https://examplemotors.co.za")).toBe(true);
  });

  it("allows research again after cooldownUntil has passed", () => {
    const key = researchKeyFrom({ website: "https://expired.co.za" });
    seedResearchCooldownForTests(key, Date.now() - 1000, "no_named_email");
    expect(isResearchOnCooldown(key)).toBe(false);
  });

  it("mark + persist-in-memory removes the dealer from the researchable queue", () => {
    const before = countResearchableProspects([]);
    const { batch } = pickNextProspectsForResearch([], 3);
    expect(batch.length).toBe(3);
    for (const p of batch) markProspectResearchAttempted(p.name, p.website);
    const after = countResearchableProspects([]);
    expect(after).toBe(before - 3);
    const next = pickNextProspectsForResearch([], 3);
    expect(next.batch.every((p) => !batch.some((b) => b.name === p.name))).toBe(true);
  });

  it("2h cooldown window is applied for no_named_email", () => {
    const now = 1_700_000_000_000;
    const { until } = markResearchAttemptedInMemory("host:demo.co.za", {
      status: "no_named_email",
      now,
    });
    expect(until - now).toBe(RESEARCH_COOLDOWN_MS);
    expect(isResearchOnCooldown("host:demo.co.za", now + 1000)).toBe(true);
    expect(isResearchOnCooldown("host:demo.co.za", now + RESEARCH_COOLDOWN_MS + 1)).toBe(false);
  });
});

describe("hydrateResearchCooldownsFromDb", () => {
  beforeEach(() => {
    vi.resetModules();
    _clearResearchCooldownsForTests();
  });

  it("returns 0 and keeps memory empty when the table is missing", async () => {
    vi.doMock("./db", () => ({
      listActiveProspectResearchAttempts: async () => {
        throw new Error("Table 'prospect_research_attempts' doesn't exist");
      },
    }));
    const { hydrateResearchCooldownsFromDb, isResearchOnCooldown } = await import(
      "./_core/prospectResearchCooldown"
    );
    expect(await hydrateResearchCooldownsFromDb()).toBe(0);
    expect(isResearchOnCooldown("host:any.co.za")).toBe(false);
  });
});
