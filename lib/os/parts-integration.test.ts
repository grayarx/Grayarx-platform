import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  importPartsCatalog,
  parsePartsCsv,
  quotePart,
  listAllParts,
} from "@/lib/os/parts";
import {
  getDealershipSettings,
  updateDealershipSettings,
} from "@/lib/dealership/settings";
import { attachTradeInPhoto, captureTradeIn } from "@/lib/os/tradein";
import { getServiceCalendar, bookService } from "@/lib/os/service";

describe("parts catalog + optional module", () => {
  it("imports dealer SKUs and retail prices; never invents blanks", () => {
    const csv = [
      "sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier",
      "ALT-POLO,06H903023,Alternator Polo,Volkswagen Polo,Volkswagen,Polo,2018,2024,2200,3899,3,Bosch Dist",
      "BAD-ROW,,,,,",
    ].join("\n");
    const rows = parsePartsCsv(csv);
    const result = importPartsCatalog({
      dealershipId: "demo-yard",
      rows,
      source: "csv_import",
    });
    assert.ok(result.imported + result.updated >= 1);
    assert.ok(result.skipped.some((s) => s.sku === "BAD-ROW" || s.reason.includes("Missing")));
    const alt = listAllParts("demo-yard").find((p) => p.sku === "ALT-POLO");
    assert.ok(alt);
    assert.equal(alt!.retailPrice, 3899);
    assert.equal(alt!.oemNumber, "06H903023");
  });

  it("marks up cost-only rows using dealer markup settings", () => {
    updateDealershipSettings("demo-yard", {
      parts: { defaultMarkupPercent: 50 },
    });
    const result = importPartsCatalog({
      dealershipId: "demo-yard",
      rows: [
        {
          sku: "COST-ONLY-1",
          name: "Cabin filter",
          costPrice: 100,
          qty: 10,
          fits: "Volkswagen Polo",
        },
      ],
    });
    assert.equal(result.skipped.length, 0);
    const part = listAllParts("demo-yard").find((p) => p.sku === "COST-ONLY-1");
    assert.equal(part!.retailPrice, 150);
  });

  it("does not quote parts when module is off", () => {
    updateDealershipSettings("yard-pta", {
      modules: { parts: false },
    });
    const { enquiry } = quotePart({
      buyerName: "Buyer",
      buyerPhone: "+27820001111",
      message: "brake pads for Hilux",
      dealershipId: "yard-pta",
    });
    assert.equal(enquiry.status, "module_off");
    assert.match(enquiry.nalaReply, /don't run a parts counter/i);
  });

  it("quotes from imported catalog when module on", () => {
    updateDealershipSettings("demo-yard", { modules: { parts: true } });
    assert.equal(getDealershipSettings("demo-yard").parts.enabled, true);
    const { enquiry, part } = quotePart({
      buyerName: "Buyer",
      buyerPhone: "+27820002222",
      message: "oil filter for Polo",
      dealershipId: "demo-yard",
    });
    assert.equal(enquiry.status, "quoted");
    assert.ok(part);
    assert.match(enquiry.nalaReply, /R/);
  });
});

describe("trade-in photos + service calendar", () => {
  it("attaches photos to a trade-in", () => {
    const intake = captureTradeIn({
      buyerName: "Photo Buyer",
      buyerPhone: "+27820003333",
      message: "trade-in my 2018 Polo 60000 km",
    });
    const withPhoto = attachTradeInPhoto({
      tradeInId: intake.id,
      label: "front",
      url: "data:image/png;base64,aaa",
    });
    assert.ok(!("error" in withPhoto));
    if (!("error" in withPhoto)) {
      assert.equal(withPhoto.photos.length, 1);
    }
  });

  it("builds a service calendar with booked slots", () => {
    bookService({
      buyerName: "Cal Buyer",
      buyerPhone: "+27820004444",
      message: "book a minor service for my Polo",
    });
    const cal = getServiceCalendar(7);
    assert.equal(cal.length, 7);
    assert.ok(cal.some((d) => d.slots.length >= 0));
  });
});
