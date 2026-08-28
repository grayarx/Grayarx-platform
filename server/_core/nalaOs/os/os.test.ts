import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { detectOsIntent, handleOsMessage, bookViewingAndNotify } from "@nalaOs/os/router";
import { importPartsCatalog, listParts } from "@nalaOs/os/parts";
import { GRAYARX_OS_PACKAGES } from "@nalaOs/os/pricing";
import { listWhatsAppOutbox } from "@nalaOs/whatsapp/send";
import { listCrmDeliveries } from "@nalaOs/crm/webhooks";
import { updateDealershipSettings } from "@nalaOs/dealership/settings";

describe("GrayArx dealership OS", () => {
  it("prices Professional above Raimond Pro anchor", () => {
    const pro = GRAYARX_OS_PACKAGES.find((p) => p.id === "professional");
    assert.ok(pro);
    assert.equal(pro!.priceMonthlyZar, 14990);
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
    updateDealershipSettings("demo-yard", { modules: { parts: true } });
    await importPartsCatalog({
      dealershipId: "demo-yard",
      rows: [
        {
          sku: "BR-PAD-HILUX",
          oemNumber: "04465-0K290",
          name: "Front brake pads — Hilux GD-6",
          fits: "Toyota Hilux",
          make: "Toyota",
          model: "Hilux",
          yearFrom: 2016,
          yearTo: 2024,
          costPrice: 780,
          retailPrice: 1450,
          qty: 8,
        },
      ],
    });

    const before = (await listParts("demo-yard")).find((p) => /brake/i.test(p.name));
    assert.ok(before, "seed brake pads must be in stock for this test");
    const waBefore = listWhatsAppOutbox().length;
    const crmBefore = listCrmDeliveries().length;

    const result = await handleOsMessage({
      buyerName: "Test Buyer",
      buyerPhone: "+27820000099",
      message: "Do you have brake pads for a Hilux?",
      holdPart: true,
      dealershipId: "demo-yard",
    });
    assert.equal(result.intent, "parts");
    assert.match(result.reply, /brake pads/i);
    assert.equal(result.delivery.whatsapp.status, "sent");
    assert.ok(result.delivery.crm.length >= 1);

    const after = (await listParts("demo-yard")).find((p) => /brake/i.test(p.name))!;
    assert.equal(after.qty, before!.qty - 1);
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
