import { describe, expect, it } from "vitest";
import { shouldApplyCsvStatus } from "./_core/csvStatusGuard";

describe("shouldApplyCsvStatus", () => {
  it("preserves sold when CSV says available", () => {
    expect(shouldApplyCsvStatus("sold", "available")).toBe(false);
  });

  it("allows marking available → sold", () => {
    expect(shouldApplyCsvStatus("available", "sold")).toBe(true);
  });

  it("allows sold → reserved", () => {
    expect(shouldApplyCsvStatus("sold", "reserved")).toBe(true);
  });

  it("skips when status unchanged or missing", () => {
    expect(shouldApplyCsvStatus("sold", "sold")).toBe(false);
    expect(shouldApplyCsvStatus("available", null)).toBe(false);
  });
});
