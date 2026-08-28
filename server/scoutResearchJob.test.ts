import { describe, expect, it } from "vitest";
import {
  GENERATE_DEEP_COUNT,
  isScoutResearchJobRunning,
  getScoutJobMeta,
} from "./_core/scoutResearchJob";

describe("scout research job", () => {
  it("starts idle", () => {
    expect(isScoutResearchJobRunning()).toBe(false);
    const meta = getScoutJobMeta();
    expect(meta.running).toBe(false);
  });

  it("deep-digs more than one dealer on Generate (not fast-only)", () => {
    expect(GENERATE_DEEP_COUNT).toBeGreaterThanOrEqual(2);
  });
});
