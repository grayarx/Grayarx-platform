import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  decideReplyMode,
  gateWhatsAppSend,
  planLimits,
  seedLlmPolishForTests,
  seedWhatsAppConversationsForTests,
  setDealershipPlan,
  usageSnapshot,
} from "@nalaOs/billing/usage";
import { applyPolishedLayout, polishNalaReply } from "@nalaOs/billing/polish";

describe("plan metering + template auto-swap", () => {
  it("loads Professional caps when plan is set", () => {
    setDealershipPlan("demo-yard", "professional");
    const limits = planLimits("professional");
    assert.equal(limits.includedWhatsApp, 3500);
    assert.equal(limits.includedLlmPolish, 3500);
    assert.equal(limits.overagePerConversationZar, 0.75);
    assert.equal(limits.hardStopWhatsApp, false);
    const snap = usageSnapshot("demo-yard");
    assert.equal(snap.planId, "professional");
    assert.equal(snap.package.priceMonthlyZar, 14990);
  });

  it("hard-stops pilot when WhatsApp included is exhausted", () => {
    setDealershipPlan("meter-pilot", "pilot");
    seedWhatsAppConversationsForTests(
      "meter-pilot",
      planLimits("pilot").includedWhatsApp,
    );
    const gate = gateWhatsAppSend({
      dealershipId: "meter-pilot",
      buyerPhone: "+27829999999",
    });
    assert.equal(gate.allowed, false);
    if (!gate.allowed) assert.match(gate.reason, /Pilot WhatsApp cap/i);
  });

  it("allows paid overage instead of hard-stop", () => {
    setDealershipPlan("meter-starter", "starter");
    seedWhatsAppConversationsForTests(
      "meter-starter",
      planLimits("starter").includedWhatsApp,
    );
    const gate = gateWhatsAppSend({
      dealershipId: "meter-starter",
      buyerPhone: "+27828889999",
    });
    assert.equal(gate.allowed, true);
    if (gate.allowed) {
      assert.equal(gate.overage, true);
      assert.ok(gate.overageZar > 0);
    }
  });

  it("auto-swaps to templates when polish credits are exhausted", async () => {
    setDealershipPlan("meter-polish", "starter");
    seedLlmPolishForTests(
      "meter-polish",
      planLimits("starter").includedLlmPolish,
    );
    const mode = decideReplyMode("meter-polish");
    assert.equal(mode.mode, "template");
    assert.match(mode.reason, /exhausted|No OPENAI/i);

    const polished = await polishNalaReply({
      dealershipId: "meter-polish",
      templateReply: "Hilux still available — want a viewing Saturday?",
    });
    assert.equal(polished.mode, "template");
    assert.equal(polished.polished, false);
    assert.match(polished.reply, /Hilux still available/);
  });

  it("uses templates when OPENAI key is absent", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    setDealershipPlan("demo-yard", "professional");
    const mode = decideReplyMode("demo-yard");
    assert.equal(mode.mode, "template");
    const result = await polishNalaReply({
      dealershipId: "demo-yard",
      templateReply: "Oil filter R189 — collect at parts counter.",
    });
    assert.equal(result.mode, "template");
    assert.equal(result.polished, false);
    if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  });

  it("keeps locked template when polish flattens WhatsApp blank lines", () => {
    const template = "Yes — the Hilux is on the floor.\n\nReply with a day that works.";
    assert.equal(
      applyPolishedLayout(template, "Yes the Hilux is on the floor. Reply with a day."),
      null,
    );
    const kept = applyPolishedLayout(
      template,
      "Yes — the Hilux is on the floor.\n\nWant Saturday?",
    );
    assert.ok(kept);
    assert.match(kept, /\n\n/);
  });
});
