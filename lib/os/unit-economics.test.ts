import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GRAYARX_OS_PACKAGES,
  pricingEconomicsSummary,
  sumCogs,
} from "@/lib/os/unit-economics";

describe("unit economics + sell prices", () => {
  it("keeps ~45%+ gross margin on Starter and Professional", () => {
    const starter = GRAYARX_OS_PACKAGES.find((p) => p.id === "starter")!;
    const pro = GRAYARX_OS_PACKAGES.find((p) => p.id === "professional")!;
    assert.equal(starter.priceMonthlyZar, 7990);
    assert.equal(pro.priceMonthlyZar, 14990);
    assert.ok(starter.grossMarginPercent >= 45);
    assert.ok(pro.grossMarginPercent >= 40);
    assert.ok(starter.priceMonthlyZar > sumCogs("starter"));
    assert.ok(pro.priceMonthlyZar > sumCogs("professional"));
  });

  it("caps pilot conversations so free tier cannot bleed", () => {
    const pilot = GRAYARX_OS_PACKAGES.find((p) => p.id === "pilot")!;
    assert.equal(pilot.priceMonthlyZar, 0);
    assert.ok(pilot.includedWhatsAppConversations <= 200);
  });

  it("exposes economics summary for admin", () => {
    const summary = pricingEconomicsSummary();
    assert.ok(summary.cogsLines.length >= 5);
    assert.ok(summary.rules.length >= 3);
    assert.equal(summary.packages.length, 4);
  });
});
