import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectOsIntent, handleOsMessage, bookViewingAndNotify } from "@/lib/os/router";
import { listParts } from "@/lib/os/parts";
import { GRAYARX_OS_PACKAGES } from "@/lib/os/pricing";
import { listWhatsAppOutbox } from "@/lib/whatsapp/send";
import { listCrmDeliveries } from "@/lib/crm/webhooks";

describe("GrayArx dealership OS", () => {
  it("prices Professional above Raimond Pro anchor", () => {
    const pro = GRAYARX_OS_PACKAGES.find((p) => p.id === "professional");
    assert.ok(pro);
    assert.equal(pro!.priceMonthlyZar, 11990);
    assert.ok(pro!.priceMonthlyZar > 10000);
  });

  it("routes parts, service, trade-in, finance, and sales", () => {
    assert.equal(detectOsIntent("brake pads for Hilux"), "parts");
    assert.equal(detectOsIntent("book a minor service for my Polo"), "service");
    assert.equal(
      detectOsIntent("trade-in my 2019 Polo 78000 km"),
      "trade_in",
    );
    assert.equal(detectOsIntent("can I finance the Hilux"), "finance");
    assert.equal(detectOsIntent("is the Hilux still available"), "sales");
  });

  it("quotes, holds a part, and delivers WhatsApp + CRM", async () => {
    const before = listParts().find((p) => /brake/i.test(p.name))!.qty;
    const waBefore = listWhatsAppOutbox().length;
    const crmBefore = listCrmDeliveries().length;

    const result = await handleOsMessage({
      buyerName: "Test Buyer",
      buyerPhone: "+27820000099",
      message: "Do you have brake pads for a Hilux?",
      holdPart: true,
    });
    assert.equal(result.intent, "parts");
    assert.match(result.reply, /brake pads/i);
    assert.equal(result.delivery.whatsapp.status, "sent");
    assert.ok(result.delivery.crm.length >= 1);

    const after = listParts().find((p) => /brake/i.test(p.name))!.qty;
    assert.equal(after, before - 1);
    assert.ok(listWhatsAppOutbox().length > waBefore);
    assert.ok(listCrmDeliveries().length > crmBefore);
  });

  it("books service, captures trade-in, starts finance", async () => {
    const svc = await handleOsMessage({
      buyerName: "Service Buyer",
      buyerPhone: "+27821111199",
      message: "Book a major service for my Polo",
    });
    assert.equal(svc.intent, "service");
    assert.match(svc.reply, /service/i);
    assert.equal(svc.delivery.whatsapp.status, "sent");

    const trd = await handleOsMessage({
      buyerName: "Trade Buyer",
      buyerPhone: "+27822222299",
      message: "Trade-in my 2019 Polo with 78000 km, good condition",
    });
    assert.equal(trd.intent, "trade_in");
    if (trd.intent === "trade_in") {
      assert.ok(trd.tradeIn.estimatedBandZar);
    }

    const fin = await handleOsMessage({
      buyerName: "Finance Buyer",
      buyerPhone: "+27823333399",
      message: "Can I finance the Hilux on monthly instalment?",
    });
    assert.equal(fin.intent, "finance");
    if (fin.intent === "finance") {
      assert.match(fin.application.partnerUrl, /prequal/);
      assert.equal(fin.application.checklist.length, 4);
    }
  });

  it("books a viewing and notifies WhatsApp + CRM", async () => {
    const sales = await handleOsMessage({
      buyerName: "Viewer",
      buyerPhone: "+27824444499",
      message: "Is the Polo Vivo still available?",
    });
    assert.equal(sales.intent, "sales");
    if (sales.intent !== "sales") throw new Error("expected sales");
    assert.ok(sales.lead.vehicleId);

    const booked = await bookViewingAndNotify({
      leadId: sales.lead.id,
      viewingAt: new Date(Date.now() + 86400000).toISOString(),
    });
    assert.ok(!("error" in booked));
    if ("error" in booked) return;
    assert.equal(booked.lead.status, "viewing_booked");
    assert.equal(booked.delivery.whatsapp.status, "sent");
    assert.ok(
      booked.delivery.crm.some((d) => d.event === "viewing.booked"),
    );
  });
});
