import { describe, expect, it } from "vitest";
import { isR1Price } from "./_core/csvPriceRepair";

describe("csvPriceRepair", () => {
  describe("isR1Price", () => {
    it("treats R1 and below as suspicious", () => {
      expect(isR1Price(1)).toBe(true);
      expect(isR1Price("1")).toBe(true);
      expect(isR1Price("1.00")).toBe(true);
      expect(isR1Price(0)).toBe(true);
      expect(isR1Price(null)).toBe(true);
      expect(isR1Price("")).toBe(true);
    });

    it("accepts real prices", () => {
      expect(isR1Price(329900)).toBe(false);
      expect(isR1Price("249900.00")).toBe(false);
      expect(isR1Price(2)).toBe(false);
    });
  });
});
