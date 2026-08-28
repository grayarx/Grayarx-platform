import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { calculateValue, moneyFromPilot } from "@nalaOs/value/money-lost";
import { importStockCatalog, parseStockCsv } from "@nalaOs/stock/import";
import {
  advanceOnboarding,
  getOnboardingGuides,
} from "@nalaOs/onboarding/wizard";
import { PROCESS_PLAYBOOKS } from "@nalaOs/processes/playbooks";

describe("dealer value + onboarding", () => {
  it("shows monthly GP at risk far above GrayArx fee with defaults", () => {
    const v = calculateValue();
    assert.ok(v.monthly.gpLostZar > v.monthly.grayArxCostZar);
    assert.ok(v.monthly.roiMultiple > 1);
    assert.match(v.oneLiner, /R/);
    assert.ok(v.dealerPitch.length >= 4);
  });

  it("recalculates when dealer enters their volumes", () => {
    const low = calculateValue({ weeklyEnquiries: 5, weeklyMissedCalls: 1 });
    const high = calculateValue({ weeklyEnquiries: 80, weeklyMissedCalls: 30 });
    assert.ok(high.monthly.gpLostZar > low.monthly.gpLostZar);
  });

  it("imports stock CSV for easy dealer load", () => {
    const csv = [
      "stockNumber,make,model,year,price,mileage,colour,status",
      "EZ-1,Ford,EcoSport,2019,189900,90000,Black,available",
      "BAD,,,,,",
    ].join("\n");
    const result = importStockCatalog({
      dealershipId: "demo-yard",
      rows: parseStockCsv(csv),
    });
    assert.ok(result.imported + result.updated >= 1);
    assert.ok(result.skipped.length >= 1);
  });

  it("advances onboarding steps", async () => {
    advanceOnboarding("demo-yard", "yard", { name: "Value Motors" });
    const g = await getOnboardingGuides("demo-yard");
    assert.ok(g.steps.some((s) => s.id === "yard" && s.isDone));
    assert.ok(g.percentComplete > 0);
  });

  it("documents every process playbook", () => {
    assert.ok(PROCESS_PLAYBOOKS.length >= 7);
    for (const p of PROCESS_PLAYBOOKS) {
      assert.ok(p.dealerSteps.length >= 2);
      assert.ok(p.underTheHood.length >= 2);
      assert.ok(p.moneyHook.length > 10);
    }
  });

  it("frames pilot viewings as money", () => {
    const m = moneyFromPilot({
      viewingsBooked: 4,
      afterHoursRecovered: 6,
      avgGrossProfitZar: 18000,
    });
    assert.ok(m.estimatedGpFromViewingsZar > 0);
    assert.match(m.vsSubscription, /R/);
  });
});
