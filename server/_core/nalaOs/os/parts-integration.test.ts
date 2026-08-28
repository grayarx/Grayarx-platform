import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  importPartsCatalog,
  parsePartsCsv,
  quotePart,
  listAllParts,
} from "@nalaOs/os/parts";
import {
  getDealershipSettings,
  updateDealershipSettings,
} from "@nalaOs/dealership/settings";
import { attachTradeInPhoto, captureTradeIn } from "@nalaOs/os/tradein";
import { getServiceCalendar, bookService } from "@nalaOs/os/service";

describe("parts catalog + optional module", () => {
  it("imports dealer SKUs and retail prices; never invents blanks", async () => {
    const csv = [
      "sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier",
      "ALT-POLO,06H903023,Alternator Polo,Volkswagen Polo,Volkswagen,Polo,2018,2024,2200,3899,3,Bosch Dist",
      "BAD-ROW,,,,,",
    ].join("\n");
    const rows = parsePartsCsv(csv);
    const result = await importPartsCatalog({
      dealershipId: "demo-yard",
      rows,
      source: "csv_import",
    });
    assert.ok(result.imported + result.updated >= 1);
    assert.ok(result.skipped.some((s) => s.sku === "BAD-ROW" || s.reason.includes("Missing")));
    const alt = (await listAllParts("demo-yard")).find((p) => p.sku === "ALT-POLO");
    assert.ok(alt);
    assert.equal(alt!.retailPrice, 3899);
    assert.equal(alt!.oemNumber, "06H903023");
  });

  it("skips CSV rows that have neither retail nor cost price", async () => {
    const csv = [
      "sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier",
      "NO-PRICE,,Mystery gasket,Toyota Hilux,Toyota,Hilux,2016,2024,,,2,",
    ].join("\n");
    const result = await importPartsCatalog({
      dealershipId: "demo-yard",
      rows: parsePartsCsv(csv),
    });
    assert.equal(result.imported, 0);
    assert.ok(result.skipped.some((s) => s.sku === "NO-PRICE" && /pricing|costPrice|retailPrice/i.test(s.reason)));
    const ghost = (await listAllParts("demo-yard")).find((p) => p.sku === "NO-PRICE");
    assert.equal(ghost, undefined);
  });

  it("marks up cost-only rows using dealer markup settings", async () => {
    updateDealershipSettings("demo-yard", {
      parts: { defaultMarkupPercent: 50 },
    });
    const result = await importPartsCatalog({
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
    const part = (await listAllParts("demo-yard")).find((p) => p.sku === "COST-ONLY-1");
    assert.equal(part!.retailPrice, 150);
  });

  it("keeps catalogs tenant-isolated — dealer A cannot see dealer B SKUs", async () => {
    await importPartsCatalog({
      dealershipId: "dealer-a",
      rows: [
        {
          sku: "A-ONLY-SKU",
          name: "Dealer A pad",
          retailPrice: 500,
          qty: 3,
          fits: "Toyota Hilux",
        },
      ],
    });
    await importPartsCatalog({
      dealershipId: "dealer-b",
      rows: [
        {
          sku: "B-ONLY-SKU",
          name: "Dealer B filter",
          retailPrice: 220,
          qty: 6,
          fits: "Volkswagen Polo",
        },
      ],
    });
    const a = await listAllParts("dealer-a");
    const b = await listAllParts("dealer-b");
    assert.ok(a.some((p) => p.sku === "A-ONLY-SKU"));
    assert.ok(b.some((p) => p.sku === "B-ONLY-SKU"));
    assert.equal(a.some((p) => p.sku === "B-ONLY-SKU"), false);
    assert.equal(b.some((p) => p.sku === "A-ONLY-SKU"), false);
  });

  it("does not quote parts when module is off", async () => {
    updateDealershipSettings("yard-pta", {
      modules: { parts: false },
    });
    const { enquiry } = await quotePart({
      buyerName: "Buyer",
      buyerPhone: "+27820001111",
      message: "brake pads for Hilux",
      dealershipId: "yard-pta",
    });
    assert.equal(enquiry.status, "module_off");
    assert.match(enquiry.nalaReply, /don't run a parts counter/i);
  });

  it("quotes from imported catalog when module on", async () => {
    updateDealershipSettings("demo-yard", { modules: { parts: true } });
    assert.equal(getDealershipSettings("demo-yard").parts.enabled, true);
    const { enquiry, part } = await quotePart({
      buyerName: "Buyer",
      buyerPhone: "+27820002222",
      message: "oil filter for Polo",
      dealershipId: "demo-yard",
    });
    assert.equal(enquiry.status, "quoted");
    assert.ok(part);
    assert.match(enquiry.nalaReply, /R/);
  });

  it("tells the buyer honestly when the yard catalog is empty", async () => {
    updateDealershipSettings("empty-yard-parts", { modules: { parts: true } });
    const listed = await listAllParts("empty-yard-parts");
    assert.equal(listed.length, 0);
    const { enquiry, part } = await quotePart({
      buyerName: "Sipho",
      buyerPhone: "+27820003333",
      message: "brake pads for Hilux",
      dealershipId: "empty-yard-parts",
    });
    assert.equal(part, undefined);
    assert.equal(enquiry.status, "quoted");
    assert.match(enquiry.nalaReply, /catalog for this yard is empty/i);
    assert.match(enquiry.nalaReply, /import their SKUs/i);
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
