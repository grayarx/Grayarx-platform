import { describe, expect, it } from "vitest";
import {
  PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT,
  PRINCIPAL_ENRICH_INTERVAL_MS,
} from "./_core/principalEnrichmentScheduler";
import { SA_PROSPECT_POOL } from "./_core/saProspectPool";
import { isOutreachReadyForDealership } from "../shared/prospectEmailQuality";

describe("Sipho always-on drip", () => {
  it("researches a small batch every ~8 min", () => {
    expect(PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT).toBe(4);
    expect(PRINCIPAL_ENRICH_INTERVAL_MS).toBe(8 * 60 * 1000);
  });

  it("SA pool still has outreach-ready named emails to import", () => {
    const ready = SA_PROSPECT_POOL.filter((p) =>
      isOutreachReadyForDealership(p.email, p.website),
    );
    expect(ready.length).toBeGreaterThanOrEqual(1);
    expect(ready.some((p) => /jubilee/i.test(p.name))).toBe(true);
  });
});
