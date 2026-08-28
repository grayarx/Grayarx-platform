import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  battlecardFromMessage,
  findCompetitor,
  listCompetitors,
} from "@/lib/competitors";

describe("competitor battlecards", () => {
  it("indexes MotorX and WhatsApp cousins", () => {
    const names = listCompetitors().map((c) => c.id);
    assert.ok(names.includes("motorx"));
    assert.ok(names.includes("dealershipiq"));
    assert.ok(names.includes("trinstel"));
    assert.ok(names.includes("visio_bdc"));
  });

  it("detects MotorX from dealer language", () => {
    const c = findCompetitor("We're already on MotorX for CRM and WhatsApp");
    assert.equal(c?.id, "motorx");
    const card = battlecardFromMessage("We use Motor X");
    assert.ok(card);
    assert.match(card!.spokenReply, /dealership OS/i);
    assert.ok(card!.beatBullets.length >= 3);
  });

  it("never positions AutoTrader as a rival to replace", () => {
    const card = battlecardFromMessage("We already pay AutoTrader a fortune");
    assert.equal(card?.competitor.id, "autotrader");
    assert.match(card!.spokenReply, /never replace/i);
  });

  it("price-anchors Raimond", () => {
    const card = battlecardFromMessage("We looked at Raimond at ten thousand");
    assert.equal(card?.competitor.id, "raimond");
    assert.match(card!.pricingContrast, /R14,990/);
  });
});
