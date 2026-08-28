import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, it } from "vitest";

const dataDir = join(process.cwd(), "data");

afterAll(() => {
  for (const file of ["leads.json", "stock.json", "pilot.json"]) {
    rmSync(join(dataDir, file), { force: true });
  }
});

describe("Nala conversion engine", () => {
  it("answers AutoTrader enquiry with matched stock and books a viewing", async () => {
    mkdirSync(dataDir, { recursive: true });
    rmSync(join(dataDir, "leads.json"), { force: true });
    rmSync(join(dataDir, "stock.json"), { force: true });

    const { ingestLead, bookViewing, listBookings } = await import("./leads.ts");

    const result = ingestLead({
      buyerName: "Sipho Dlamini",
      buyerPhone: "+27821234567",
      message: "Is the Polo Vivo still available?",
      source: "autotrader",
      createdAt: new Date("2026-08-28T20:15:00").toISOString(),
    });

    assert.equal(result.lead.status, "answered");
    assert.ok(result.vehicle, "should match Polo");
    assert.match(result.nalaReply, /Polo/i);
    assert.equal(result.lead.recoveredAfterHours, true);

    const booked = bookViewing({
      leadId: result.lead.id,
      viewingAt: "2026-08-29T10:00:00",
    });
    assert.ok(!("error" in booked));
    if (!("error" in booked)) {
      assert.equal(booked.lead.status, "viewing_booked");
      assert.equal(listBookings().length, 1);
    }
  });

  it("missed-call recovery produces a Nala WhatsApp opener", async () => {
    rmSync(join(dataDir, "leads.json"), { force: true });
    const { ingestLead } = await import("./leads.ts");
    const result = ingestLead({
      buyerName: "Thandi",
      buyerPhone: "+27829876543",
      message: "Missed call — interested in Hilux",
      source: "missed_call",
    });
    assert.match(result.nalaReply, /missed your call/i);
    assert.match(result.nalaReply, /Hilux/i);
  });

  it("sold vehicles are removed from available answers", async () => {
    rmSync(join(dataDir, "stock.json"), { force: true });
    const stock = await import("./stock.ts");
    const before = stock.listAvailable().length;
    const first = stock.listAvailable()[0];
    assert.ok(first);
    stock.markSold(first.id);
    assert.equal(stock.listAvailable().length, before - 1);
    assert.equal(stock.findVehicle({ id: first.id })?.status, "sold");
  });

  it("ROI report includes after-hours and booking metrics", async () => {
    rmSync(join(dataDir, "leads.json"), { force: true });
    rmSync(join(dataDir, "stock.json"), { force: true });
    const { ingestLead, bookViewing } = await import("./leads.ts");
    const { buildMondayRoiReport } = await import("./roi.ts");

    const a = ingestLead({
      buyerName: "A",
      buyerPhone: "1",
      message: "Polo please",
      source: "autotrader",
      createdAt: "2026-08-28T21:00:00.000Z",
    });
    bookViewing({
      leadId: a.lead.id,
      viewingAt: "2026-08-29T09:00:00.000Z",
    });

    const report = buildMondayRoiReport();
    assert.ok(report.totals.leadsReceived >= 1);
    assert.ok(report.totals.viewingsBooked >= 1);
    assert.ok(report.proofLines.length >= 3);
  });
});
