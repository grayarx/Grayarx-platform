import { describe, expect, it } from "vitest";
import {
  listGuideKeysForRefresh,
  pickRepresentativeYears,
} from "../server/_core/marketGuideCache";

describe("marketGuideCache", () => {
  it("lists all guide keys for rotation", () => {
    const keys = listGuideKeysForRefresh();
    expect(keys.length).toBeGreaterThan(20);
    expect(keys).toContain("volkswagen|polo vivo");
  });

  it("picks oldest, mid, and newest years", () => {
    const years = pickRepresentativeYears({
      2016: 100_000,
      2018: 120_000,
      2019: 130_000,
      2020: 140_000,
      2021: 150_000,
    });
    expect(years).toEqual([2016, 2019, 2021]);
  });
});
