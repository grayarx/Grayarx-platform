import { describe, expect, it } from "vitest";
import {
  PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT,
  PRINCIPAL_ENRICH_INTERVAL_MS,
} from "./_core/principalEnrichmentScheduler";

describe("Sipho always-on drip", () => {
  it("researches one dealership at a time on a ~15 min cadence", () => {
    expect(PRINCIPAL_ENRICH_ALWAYS_ON_LIMIT).toBe(1);
    expect(PRINCIPAL_ENRICH_INTERVAL_MS).toBe(15 * 60 * 1000);
  });
});
