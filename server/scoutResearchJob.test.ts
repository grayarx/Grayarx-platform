import { describe, expect, it } from "vitest";
import {
  isScoutResearchJobRunning,
  getScoutJobMeta,
} from "./_core/scoutResearchJob";

describe("scout research job", () => {
  it("starts idle", () => {
    expect(isScoutResearchJobRunning()).toBe(false);
    const meta = getScoutJobMeta();
    expect(meta.running).toBe(false);
  });
});
