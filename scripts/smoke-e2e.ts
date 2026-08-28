#!/usr/bin/env node
/**
 * Vigorous live HTTP smoke — every sell-critical path must return OK.
 * Run: npx tsx scripts/smoke-e2e.ts
 * Requires: npm run dev -- --port 43123
 */
import assert from "node:assert/strict";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:43123";

async function json(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function page(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return res.status;
}

async function main() {
  const failures: string[] = [];
  const ok = (name: string) => console.log(`PASS  ${name}`);
  const fail = (name: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.error(`FAIL  ${name}: ${msg}`);
  };

  const pages = [
    "/",
    "/dealer",
    "/dealer/onboard",
    "/admin/os",
    "/admin/conversion",
    "/admin/competitors",
    "/admin/pricing",
    "/admin/prospector",
    "/showroom/demo-yard",
    "/showroom/yard-pta",
  ];
  for (const p of pages) {
    try {
      const code = await page(p);
      assert.equal(code, 200, `expected 200 got ${code}`);
      ok(`page ${p}`);
    } catch (e) {
      fail(`page ${p}`, e);
    }
  }

  try {
    const { status, body } = await json("/api/value");
    assert.equal(status, 200);
    assert.ok(body.value?.monthly?.gpLostZar > body.value?.monthly?.grayArxCostZar);
    assert.ok(body.processes?.length >= 7);
    ok("GET /api/value");
  } catch (e) {
    fail("GET /api/value", e);
  }

  try {
    const { status, body } = await json("/api/os");
    assert.equal(status, 200);
    const pro = body.packages?.find((p: { id: string }) => p.id === "professional");
    assert.ok(pro);
    assert.equal(pro.priceMonthlyZar, 14990);
    assert.ok(pro.grossMarginPercent >= 40);
    assert.ok(body.economics?.packages?.length >= 4);
    assert.ok(
      body.modules?.every(
        (m: { status: string }) =>
          m.status === "live" || m.status === "shipping",
      ),
    );
    ok("GET /api/os packages + economics");
  } catch (e) {
    fail("GET /api/os packages", e);
  }

  try {
    const { status, body } = await json("/api/marketplace/ingest", {
      method: "POST",
      body: JSON.stringify({ action: "poll", limit: 1 }),
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.ok(body.ingested >= 1);
    assert.equal(body.results[0].whatsappStatus, "sent");
    ok("marketplace poll");
  } catch (e) {
    fail("marketplace poll", e);
  }

  try {
    const { status, body } = await json(
      "/api/marketplace/webhook?provider=autotrader",
      {
        method: "POST",
        body: JSON.stringify({
          customerName: "Smoke Buyer",
          customerPhone: "+27829990001",
          message: "Is the Polo Vivo still available?",
          listingId: "SMOKE-1",
        }),
      },
    );
    assert.equal(status, 200);
    assert.equal(body.whatsappStatus, "sent");
    ok("marketplace webhook");
  } catch (e) {
    fail("marketplace webhook", e);
  }

  try {
    const { status, body } = await json("/api/recovery/missed-call", {
      method: "POST",
      body: JSON.stringify({
        callerName: "Smoke Miss",
        callerPhone: "+27829990002",
        vehicleHint: "Hilux",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.whatsapp.status, "sent");
    ok("missed-call recovery");
  } catch (e) {
    fail("missed-call recovery", e);
  }

  try {
    const { status, body } = await json("/api/os", {
      method: "POST",
      body: JSON.stringify({
        buyerName: "Smoke Parts",
        buyerPhone: "+27829990003",
        message: "oil filter for Polo",
        holdPart: true,
        dealershipId: "demo-yard",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.result.intent, "parts");
    assert.equal(body.result.delivery.whatsapp.status, "sent");
    ok("OS parts quote+hold");
  } catch (e) {
    fail("OS parts quote+hold", e);
  }

  try {
    const { status, body } = await json("/api/os", {
      method: "POST",
      body: JSON.stringify({
        buyerName: "Smoke PTA",
        buyerPhone: "+27829990004",
        message: "brake pads",
        dealershipId: "yard-pta",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.result.enquiry.status, "module_off");
    ok("parts module off PTA");
  } catch (e) {
    fail("parts module off PTA", e);
  }

  try {
    const sales = await json("/api/os", {
      method: "POST",
      body: JSON.stringify({
        buyerName: "Smoke View",
        buyerPhone: "+27829990005",
        message: "Is the Polo Vivo still available?",
      }),
    });
    assert.equal(sales.status, 200);
    const leadId = sales.body.result.lead.id;
    const when = new Date(Date.now() + 86400000).toISOString();
    const book = await json("/api/conversion/book", {
      method: "POST",
      body: JSON.stringify({ leadId, viewingAt: when }),
    });
    assert.equal(book.status, 200);
    assert.equal(book.body.lead.status, "viewing_booked");
    assert.equal(book.body.delivery.whatsapp.status, "sent");
    ok("sales → book viewing");
  } catch (e) {
    fail("sales → book viewing", e);
  }

  try {
    const { status, body } = await json("/api/os", {
      method: "POST",
      body: JSON.stringify({
        buyerName: "Smoke Svc",
        buyerPhone: "+27829990006",
        message: "book a minor service for my i20",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.result.intent, "service");
    ok("service booking");
  } catch (e) {
    fail("service booking", e);
  }

  try {
    const { status, body } = await json("/api/os", {
      method: "POST",
      body: JSON.stringify({
        buyerName: "Smoke Trd",
        buyerPhone: "+27829990007",
        message: "trade-in my 2019 Polo 70000 km good condition",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.result.intent, "trade_in");
    const id = body.result.tradeIn.id;
    const photo = await json("/api/tradein", {
      method: "POST",
      body: JSON.stringify({
        action: "photo",
        tradeInId: id,
        label: "front",
        url: "data:image/png;base64,xx",
      }),
    });
    assert.equal(photo.status, 200);
    assert.equal(photo.body.tradeIn.photos.length, 1);
    ok("trade-in + photo");
  } catch (e) {
    fail("trade-in + photo", e);
  }

  try {
    const { status, body } = await json("/api/os", {
      method: "POST",
      body: JSON.stringify({
        buyerName: "Smoke Fin",
        buyerPhone: "+27829990008",
        message: "can I finance the Hilux",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.result.intent, "finance");
    assert.ok(body.result.application.partnerUrl);
    ok("finance prequal");
  } catch (e) {
    fail("finance prequal", e);
  }

  try {
    const { status, body } = await json("/api/reports/monday", {
      method: "POST",
      body: JSON.stringify({ to: "smoke@test.com", dealershipName: "Smoke Yard" }),
    });
    assert.equal(status, 200);
    assert.equal(body.email.status, "sent");
    ok("Monday ROI email");
  } catch (e) {
    fail("Monday ROI email", e);
  }

  try {
    const stock = await json("/api/stock/import", {
      method: "POST",
      body: JSON.stringify({
        action: "import_csv",
        dealershipId: "demo-yard",
        csv: "stockNumber,make,model,year,price,mileage,colour,status\nSMK-1,Kia,Picanto,2020,149900,40000,Red,available",
      }),
    });
    assert.equal(stock.status, 200);
    assert.ok(stock.body.imported + stock.body.updated >= 1);
    const parts = await json("/api/parts", {
      method: "POST",
      body: JSON.stringify({
        action: "import_csv",
        dealershipId: "demo-yard",
        csv: "sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier\nSMK-PAD,X1,Smoke pads,Toyota Hilux,Toyota,Hilux,2016,2024,500,999,4,Test",
      }),
    });
    assert.equal(parts.status, 200);
    ok("stock + parts CSV import");
  } catch (e) {
    fail("stock + parts CSV import", e);
  }

  try {
    const { status, body } = await json("/api/service/calendar");
    assert.equal(status, 200);
    assert.equal(body.calendar.length, 14);
    ok("service calendar");
  } catch (e) {
    fail("service calendar", e);
  }

  try {
    const { status, body } = await json("/api/branches");
    assert.equal(status, 200);
    assert.ok(body.branches.some((b: { id: string }) => b.id === "demo-yard"));
    assert.ok(body.branches.some((b: { id: string }) => b.id === "yard-pta"));
    ok("multi-branch");
  } catch (e) {
    fail("multi-branch", e);
  }

  try {
    const { status, body } = await json("/api/onboarding?dealershipId=demo-yard");
    assert.equal(status, 200);
    assert.ok(body.steps?.length >= 5);
    ok("onboarding guides");
  } catch (e) {
    fail("onboarding guides", e);
  }

  try {
    const { status, body } = await json("/api/competitors?q=We+use+MotorX");
    assert.equal(status, 200);
    assert.equal(body.card.competitor.id, "motorx");
    assert.match(body.card.pricingContrast, /R14,990/);
    ok("MotorX battlecard pricing");
  } catch (e) {
    fail("MotorX battlecard pricing", e);
  }

  console.log("\n---");
  if (failures.length) {
    console.error(`${failures.length} FAILURES`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("ALL SMOKE CHECKS PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
