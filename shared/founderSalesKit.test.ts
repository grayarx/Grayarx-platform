import { describe, expect, it } from "vitest";
import {
  FOUNDER_SALES_KIT_META,
  SALES_KIT_MONEY_ASK,
  SALES_KIT_SECTIONS,
} from "./founderSalesKit";
import { PILOT_PARTNER } from "./subscriptionTiers";

describe("founderSalesKit", () => {
  it("anchors money ask to Pilot Partner floor", () => {
    expect(FOUNDER_SALES_KIT_META.moneyFloorZar).toBe(PILOT_PARTNER.monthlyPriceZar);
    expect(FOUNDER_SALES_KIT_META.moneyAskLine).toContain("3,999");
    expect(SALES_KIT_MONEY_ASK.body.join(" ")).toMatch(/Growth/i);
  });

  it("includes pre-call, money, objections, and close", () => {
    const ids = SALES_KIT_SECTIONS.map((s) => s.id);
    expect(ids).toContain("precall");
    expect(ids).toContain("money");
    expect(ids).toContain("close");
    expect(ids.some((id) => id.startsWith("obj-"))).toBe(true);
  });
});
