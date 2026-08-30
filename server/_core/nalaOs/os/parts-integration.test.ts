import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  importPartsCatalog,
  parsePartsCsv,
  quotePart,
  listAllParts,
  bookOutPart,
  findPart,
} from "@nalaOs/os/parts";
import {
  getDealershipSettings,
  updateDealershipSettings,
} from "@nalaOs/dealership/settings";
import { attachTradeInPhoto, captureTradeIn } from "@nalaOs/os/tradein";
import {
  getServiceCalendar,
  bookService,
  createServiceJob,
  listServiceBookings,
  listJobParts,
} from "@nalaOs/os/service";

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

  it("imports messy dealer CSVs — comments, quoted commas, ; delimiter, decimal comma, misspelt headers", async () => {
    const csv = [
      "# yard export",
      "skuu;descripton;fitment;retaill price;quanity",
      `BR-PAD-1;"Front pads, Hilux GD-6";Toyota Hilux / Fortuner;1.450,00;8`,
    ].join("\n");
    const rows = parsePartsCsv(csv);
    assert.equal(rows[0]?.sku, "BR-PAD-1");
    assert.equal(rows[0]?.name, "Front pads, Hilux GD-6");
    assert.equal(rows[0]?.fits, "Toyota Hilux|Fortuner");
    assert.equal(rows[0]?.retailPrice, 1450);
    assert.equal(rows[0]?.qty, 8);
    const result = await importPartsCatalog({
      dealershipId: "messy-parts-yard",
      rows,
      source: "csv_import",
    });
    assert.equal(result.imported + result.updated, 1);
    assert.equal(result.skipped.length, 0);
  });

  it("parses the dealership parts catalog file", () => {
    const csv = readFileSync(
      resolve(process.cwd(), "demo-data/grayarx-dealership-parts-catalog.csv"),
      "utf8",
    );
    const rows = parsePartsCsv(csv);
    assert.ok(rows.length >= 280, `expected a full counter, got ${rows.length}`);
    assert.ok(rows.every((r) => r.sku && r.name));
    assert.ok(rows.every((r) => r.retailPrice || r.costPrice));
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

  it("books out one or more units on the counter and drops qty on that yard only", async () => {
    await importPartsCatalog({
      dealershipId: "workshop-yard",
      rows: [
        {
          sku: "RAD-HILUX",
          name: "Radiator — Hilux GD-6",
          retailPrice: 3149,
          qty: 3,
          fits: "Toyota Hilux",
        },
      ],
    });
    const out = await bookOutPart({
      dealershipId: "workshop-yard",
      sku: "RAD-HILUX",
      units: 2,
      customerName: "Thabo",
      vehicleDesc: "2019 Hilux in for service",
      notes: "Client approved on the phone",
    });
    assert.ok(!("error" in out));
    if ("error" in out) return;
    assert.equal(out.part.qty, 1);
    assert.equal(out.enquiry.status, "collected");
    const stillA = await bookOutPart({
      dealershipId: "dealer-a",
      sku: "RAD-HILUX",
      units: 1,
    });
    assert.ok("error" in stillA);
    const tooMany = await bookOutPart({
      dealershipId: "workshop-yard",
      sku: "RAD-HILUX",
      units: 5,
    });
    assert.ok("error" in tooMany);
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

  it("builds a service calendar with booked slots", async () => {
    await bookService({
      buyerName: "Cal Buyer",
      buyerPhone: "+27820004444",
      message: "book a minor service for my Polo",
      dealershipId: "demo-yard",
    });
    const cal = await getServiceCalendar(7, "demo-yard");
    assert.equal(cal.length, 7);
    assert.ok(cal.some((d) => d.slots.length >= 0));
  });

  it("keeps workshop jobs tenant-isolated", async () => {
    const a = await bookService({
      buyerName: "Dealer A client",
      buyerPhone: "+27820005555",
      message: "book a minor service for my Polo",
      dealershipId: "svc-dealer-a",
    });
    await bookService({
      buyerName: "Dealer B client",
      buyerPhone: "+27820006666",
      message: "book a major service for my Hilux",
      dealershipId: "svc-dealer-b",
    });
    const onlyA = await listServiceBookings("svc-dealer-a");
    const onlyB = await listServiceBookings("svc-dealer-b");
    assert.ok(onlyA.some((j) => j.id === a.id));
    assert.equal(onlyA.some((j) => j.buyerName === "Dealer B client"), false);
    assert.equal(onlyB.some((j) => j.id === a.id), false);
  });

  it("books a part onto a workshop job and refuses another yard's job", async () => {
    await importPartsCatalog({
      dealershipId: "job-yard",
      rows: [
        {
          sku: "RAD-JOB",
          name: "Radiator — Hilux GD-6",
          retailPrice: 3149,
          qty: 2,
          fits: "Toyota Hilux",
          make: "Toyota",
          model: "Hilux",
        },
      ],
    });
    const job = await createServiceJob({
      dealershipId: "job-yard",
      buyerName: "Thabo",
      vehicleDesc: "2019 Hilux — cooling",
      notes: "Waiting on client",
    });
    assert.ok(!("error" in job));
    if ("error" in job) return;
    const otherJob = await createServiceJob({
      dealershipId: "other-job-yard",
      buyerName: "Other",
      vehicleDesc: "Polo",
    });
    assert.ok(!("error" in otherJob));
    if ("error" in otherJob) return;

    const cross = await bookOutPart({
      dealershipId: "job-yard",
      sku: "RAD-JOB",
      units: 1,
      serviceJobId: otherJob.id,
    });
    assert.ok("error" in cross);
    if ("error" in cross) {
      assert.match(cross.error, /not on this dealership/i);
    }

    const withoutJob = await bookOutPart({
      dealershipId: "job-yard",
      sku: "RAD-JOB",
      units: 1,
      customerName: "Thabo",
    });
    assert.ok(!("error" in withoutJob));
    if ("error" in withoutJob) return;
    assert.ok(withoutJob.slip);
    assert.equal(withoutJob.slip.jobRef, undefined);

    const withJob = await bookOutPart({
      dealershipId: "job-yard",
      sku: "RAD-JOB",
      units: 1,
      customerName: "Thabo",
      serviceJobId: job.id,
      vehicleDesc: "2019 Hilux — cooling",
    });
    assert.ok(!("error" in withJob));
    if ("error" in withJob) return;
    assert.equal(withJob.slip.jobRef, job.id);
    const lines = await listJobParts(job.id, "job-yard");
    assert.equal(lines.length, 1);
    assert.equal(lines[0]?.sku, "RAD-JOB");
  });
});

describe("Nala catalog match", () => {
  it("finds radiator for Hilux, not the first Hilux token", async () => {
    await importPartsCatalog({
      dealershipId: "findpart-yard",
      rows: [
        {
          sku: "WIP-HILUX",
          name: "Wiper blade — Hilux",
          retailPrice: 189,
          qty: 10,
          fits: "Toyota Hilux",
          make: "Toyota",
          model: "Hilux",
        },
        {
          sku: "RAD-HILUX-2",
          name: "Radiator — Hilux GD-6",
          retailPrice: 3149,
          qty: 2,
          fits: "Toyota Hilux",
          make: "Toyota",
          model: "Hilux",
        },
        {
          sku: "PAD-HILUX-2",
          name: "Front brake pads — Hilux GD-6",
          retailPrice: 1450,
          qty: 4,
          fits: "Toyota Hilux",
          make: "Toyota",
          model: "Hilux",
        },
      ],
    });
    const hit = await findPart("radiator for Hilux", "findpart-yard");
    assert.ok(hit);
    assert.match(hit!.name, /radiator/i);
    assert.equal(hit!.sku, "RAD-HILUX-2");
  });

  it("quotes top 3 when several catalog rows are close", async () => {
    updateDealershipSettings("findpart-yard", { modules: { parts: true } });
    const { enquiry, part } = await quotePart({
      buyerName: "Buyer",
      buyerPhone: "+27820007777",
      message: "Hilux",
      dealershipId: "findpart-yard",
    });
    assert.equal(part, undefined);
    assert.match(enquiry.nalaReply, /a few matches/i);
    assert.match(enquiry.nalaReply, /RAD-HILUX-2/);
    assert.match(enquiry.nalaReply, /WIP-HILUX/);
  });
});
