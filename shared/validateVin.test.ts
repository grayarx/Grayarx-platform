import { describe, expect, it } from "vitest";
import { normalizeVin, validateVin, vinCheckDigit } from "./validateVin";

/** Known-valid BMW-style VIN (WMI WBA, check digit verified via ISO 3779). */
const VALID_BMW = "WBA8E5G54JNU12345";

describe("normalizeVin", () => {
  it("trims, uppercases, and strips spaces/hyphens", () => {
    expect(normalizeVin("  wba8e5g54-jnu 12345  ")).toBe(VALID_BMW);
  });
});

describe("validateVin", () => {
  it("treats empty / whitespace as valid (optional field)", () => {
    expect(validateVin("")).toEqual({ ok: true, normalized: "" });
    expect(validateVin("   ")).toEqual({ ok: true, normalized: "" });
    expect(validateVin(null)).toEqual({ ok: true, normalized: "" });
    expect(validateVin(undefined)).toEqual({ ok: true, normalized: "" });
  });

  it("accepts a valid BMW-style VIN and returns normalized form", () => {
    const result = validateVin("wba8e5g54jnu12345");
    expect(result).toEqual({ ok: true, normalized: VALID_BMW });
    expect(vinCheckDigit(VALID_BMW)).toBe(VALID_BMW[8]);
  });

  it("rejects wrong length", () => {
    const result = validateVin("WBA8E5G54JNU1234");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/17 characters/i);
    }
  });

  it("rejects I, O, and Q", () => {
    const withI = validateVin("WBA8E5G54INU12345");
    expect(withI.ok).toBe(false);
    if (!withI.ok) {
      expect(withI.reason).toMatch(/I/);
    }
    const withO = validateVin("WBA8E5G54ONU12345");
    expect(withO.ok).toBe(false);
    const withQ = validateVin("WBA8E5G54QNU12345");
    expect(withQ.ok).toBe(false);
  });

  it("rejects bad check digit", () => {
    // Same body as VALID_BMW but position 9 flipped from 4 → 5
    const bad = "WBA8E5G55JNU12345";
    const result = validateVin(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/check digit/i);
      expect(result.reason).toMatch(/4/);
    }
  });

  it("accepts a well-known Honda VIN with check digit X", () => {
    expect(validateVin("1HGBH41JXMN109186")).toEqual({
      ok: true,
      normalized: "1HGBH41JXMN109186",
    });
  });
});
