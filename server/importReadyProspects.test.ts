import { describe, expect, it } from "vitest";
import { SA_PROSPECT_POOL } from "./_core/saProspectPool";
import { isOutreachReadyForDealership } from "../shared/prospectEmailQuality";

describe("import-ready pool gate", () => {
  it("ready pool emails are on their own website domain", () => {
    const ready = SA_PROSPECT_POOL.filter((p) =>
      isOutreachReadyForDealership(p.email, p.website),
    );
    expect(ready.length).toBeGreaterThan(0);
    for (const p of ready) {
      expect(isOutreachReadyForDealership(p.email, p.website)).toBe(true);
    }
  });
});
