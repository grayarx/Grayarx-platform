import { afterEach, describe, expect, it, vi } from "vitest";

describe("triggerPrincipalEnrichmentIfDue", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("./principalEnrichmentRunner");
    vi.doUnmock("./scoutResearchJob");
  });

  it("logs and continues when a tick throws (missing table / DB error)", async () => {
    vi.resetModules();
    vi.doMock("./scoutResearchJob", () => ({
      isScoutResearchJobRunning: () => false,
    }));
    vi.doMock("./principalEnrichmentRunner", () => ({
      runPrincipalEnrichmentTick: async () => {
        throw new Error("Table 'prospect_research_attempts' doesn't exist");
      },
    }));
    const { triggerPrincipalEnrichmentIfDue } = await import("./principalEnrichmentScheduler");
    await expect(triggerPrincipalEnrichmentIfDue(true)).resolves.toMatchObject({
      ran: false,
      reason: "error",
    });
  });
});
