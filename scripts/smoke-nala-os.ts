#!/usr/bin/env node
/**
 * In-process Nala OS smoke — no Vite, no secrets, no .env writes.
 * Run: pnpm smoke:nala-os
 */
import assert from "node:assert/strict";
import express from "express";
import { registerNalaOsRoutes } from "../server/_core/nalaOsRoutes";

async function json(base: string, path: string, init?: RequestInit) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const app = express();
  app.use(express.json());
  registerNalaOsRoutes(app);
  const server = await new Promise<import("http").Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const base = `http://127.0.0.1:${port}`;
  const failures: string[] = [];
  const ok = (name: string) => console.log(`PASS  ${name}`);
  const fail = (name: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.error(`FAIL  ${name}: ${msg}`);
  };

  try {
    const { status, body } = await json(base, "/api/value");
    assert.equal(status, 200);
    assert.ok(body.value?.monthly?.gpLostZar > body.value?.monthly?.grayArxCostZar);
    assert.ok(body.processes?.length >= 7);
    ok("GET /api/value");
  } catch (e) {
    fail("GET /api/value", e);
  }

  try {
    const { status, body } = await json(base, "/api/os");
    assert.equal(status, 200);
    const pro = body.packages?.find((p: { id: string }) => p.id === "professional");
    assert.ok(pro);
    assert.equal(pro.priceMonthlyZar, 14990);
    assert.ok(pro.grossMarginPercent >= 40);
    ok("GET /api/os packages + economics");
  } catch (e) {
    fail("GET /api/os packages", e);
  }

  try {
    const { status, body } = await json(base, "/api/marketplace/ingest", {
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
    const { status, body } = await json(base, "/api/marketplace/webhook?provider=autotrader", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Smoke Buyer",
        customerPhone: "+27829990001",
        message: "Is the Polo Vivo still available?",
        listingId: "SMOKE-1",
      }),
    });
    assert.equal(status, 200);
    assert.equal(body.whatsappStatus, "sent");
    ok("marketplace webhook");
  } catch (e) {
    fail("marketplace webhook", e);
  }

  try {
    const { status, body } = await json(base, "/api/recovery/missed-call", {
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
    const { status, body } = await json(base, "/api/os", {
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
    const { status, body } = await json(base, "/api/os", {
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
    const sales = await json(base, "/api/os", {
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
    const book = await json(base, "/api/conversion/book", {
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
    const { status, body } = await json(base, "/api/os", {
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
    const { status, body } = await json(base, "/api/os", {
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
    const photo = await json(base, "/api/tradein", {
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
    const { status, body } = await json(base, "/api/os", {
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
    const { status, body } = await json(base, "/api/reports/monday", {
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
    const stock = await json(base, "/api/stock/import", {
      method: "POST",
      body: JSON.stringify({
        action: "import_csv",
        dealershipId: "demo-yard",
        csv: "stockNumber,make,model,year,price,mileage,colour,status\nSMK-1,Kia,Picanto,2020,149900,40000,Red,available",
      }),
    });
    assert.equal(stock.status, 200);
    assert.ok(stock.body.imported + stock.body.updated >= 1);
    const parts = await json(base, "/api/parts", {
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
    const { status, body } = await json(base, "/api/service/calendar");
    assert.equal(status, 200);
    assert.equal(body.calendar.length, 14);
    ok("service calendar");
  } catch (e) {
    fail("service calendar", e);
  }

  try {
    const { status, body } = await json(base, "/api/branches");
    assert.equal(status, 200);
    assert.ok(body.branches.some((b: { id: string }) => b.id === "demo-yard"));
    assert.ok(body.branches.some((b: { id: string }) => b.id === "yard-pta"));
    ok("multi-branch");
  } catch (e) {
    fail("multi-branch", e);
  }

  try {
    const { status, body } = await json(base, "/api/onboarding?dealershipId=demo-yard");
    assert.equal(status, 200);
    assert.ok(body.steps?.length >= 5);
    ok("onboarding guides");
  } catch (e) {
    fail("onboarding guides", e);
  }

  try {
    const { status, body } = await json(base, "/api/competitors?q=We+use+MotorX");
    assert.equal(status, 200);
    assert.equal(body.card.competitor.id, "motorx");
    assert.match(body.card.pricingContrast, /R14,990/);
    ok("MotorX battlecard pricing");
  } catch (e) {
    fail("MotorX battlecard pricing", e);
  }

  try {
    const setPlan = await json(base, "/api/billing/usage", {
      method: "POST",
      body: JSON.stringify({
        action: "set_plan",
        dealershipId: "demo-yard",
        planId: "professional",
      }),
    });
    assert.equal(setPlan.status, 200);
    assert.equal(setPlan.body.package.id, "professional");
    assert.equal(setPlan.body.snapshot.whatsapp.included, 3500);
    assert.equal(setPlan.body.snapshot.llmPolish.included, 3500);
    const snap = await json(base, "/api/billing/usage?dealershipId=demo-yard");
    assert.equal(snap.status, 200);
    assert.ok(snap.body.snapshot.howItWorks.length >= 4);
    ok("billing plan + usage caps");
  } catch (e) {
    fail("billing plan + usage caps", e);
  }

  try {
    const { status, body } = await json(base, "/api/pricing");
    assert.equal(status, 200);
    assert.equal(body.packages?.length, 4);
    assert.equal(
      body.packages.find((p: { id: string }) => p.id === "professional")?.priceMonthlyZar,
      14990,
    );
    ok("GET /api/pricing lean");
  } catch (e) {
    fail("GET /api/pricing lean", e);
  }

  try {
    const { status, body } = await json(base, "/api/prospector/prospects?region=ZA&highAbility=1");
    assert.equal(status, 200);
    assert.ok(body.count >= 15);
    assert.ok(body.totalSeeded >= 45);
    ok("prospector ICP pool");
  } catch (e) {
    fail("prospector ICP pool", e);
  }

  try {
    const { status, body } = await json(base, "/api/regions?region=US");
    assert.equal(status, 200);
    assert.equal(body.region.currency, "USD");
    assert.ok(body.region.packages.professional.amount > 0);
    ok("multi-currency regions");
  } catch (e) {
    fail("multi-currency regions", e);
  }

  try {
    const { status, body } = await json(base, "/api/setup/save-credentials", {
      method: "POST",
      body: JSON.stringify({ accountSid: "ACxxx" }),
    });
    assert.equal(status, 409);
    assert.equal(body.saved, false);
    ok("setup refuses to write .env");
  } catch (e) {
    fail("setup refuses to write .env", e);
  }

  server.close();

  console.log("\n---");
  if (failures.length) {
    console.error(`${failures.length} FAILURES`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("ALL NALA OS SMOKE CHECKS PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
