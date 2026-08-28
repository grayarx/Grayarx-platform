import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectOsIntent, handleOsMessage } from "@/lib/os/router";
import { listParts } from "@/lib/os/parts";
import { GRAYARX_OS_PACKAGES } from "@/lib/os/pricing";

describe("GrayArx dealership OS", () => {
  it("prices Professional above Raimond Pro anchor", () => {
    const pro = GRAYARX_OS_PACKAGES.find((p) => p.id === "professional");
    assert.ok(pro);
    assert.equal(pro!.priceMonthlyZar, 11990);
    assert.ok(pro!.priceMonthlyZar > 10000);
  });

  it("routes parts, service, trade-in, and sales", () => {
    assert.equal(detectOsIntent("brake pads for Hilux"), "parts");
    assert.equal(detectOsIntent("book a minor service for my Polo"), "service");
    assert.equal(
      detectOsIntent("trade-in my 2019 Polo 78000 km"),
      "trade_in",
    );
    assert.equal(detectOsIntent("is the Hilux still available"), "sales");
  });

  it("quotes and can hold a part", () => {
    const before = listParts().find((p) => /brake/i.test(p.name))!.qty;
    const result = handleOsMessage({
      buyerName: "Test Buyer",
      buyerPhone: "+27820000000",
      message: "Do you have brake pads for a Hilux?",
      holdPart: true,
    });
    assert.equal(result.intent, "parts");
    assert.match(result.reply, /brake pads/i);
    const after = listParts().find((p) => /brake/i.test(p.name))!.qty;
    assert.equal(after, before - 1);
  });

  it("books service and captures trade-in", () => {
    const svc = handleOsMessage({
      buyerName: "Service Buyer",
      buyerPhone: "+27821111111",
      message: "Book a major service for my Polo",
    });
    assert.equal(svc.intent, "service");
    assert.match(svc.reply, /service/i);

    const trd = handleOsMessage({
      buyerName: "Trade Buyer",
      buyerPhone: "+27822222222",
      message: "Trade-in my 2019 Polo with 78000 km, good condition",
    });
    assert.equal(trd.intent, "trade_in");
    if (trd.intent === "trade_in") {
      assert.ok(trd.tradeIn.estimatedBandZar);
    }
  });
});
