import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pollMarketplaceFixtures } from "@/lib/marketplace/ingest";
import { recoverMissedCall } from "@/lib/recovery/missed-call";
import { sendMondayRoiEmail } from "@/lib/email/send";
import { registerCrmWebhook, listCrmSubscriptions } from "@/lib/crm/webhooks";
import { listBranches, ensureBranches } from "@/lib/branches/store";
import { listWhatsAppOutbox } from "@/lib/whatsapp/send";
import { listEmailOutbox } from "@/lib/email/send";
import { getStock } from "@/lib/conversion/stock";
import { seedMultiBranchStock } from "@/lib/marketplace/ingest";
import { startFinancePrequal, markFinanceDoc } from "@/lib/finance/prequal";

describe("platform integrations (working paths)", () => {
  it("polls AutoTrader/Cars fixtures into leads + WhatsApp + CRM", async () => {
    const results = await pollMarketplaceFixtures({ limit: 2 });
    assert.equal(results.length, 2);
    for (const r of results) {
      assert.ok(["autotrader", "cars_co_za"].includes(r.lead.source));
      assert.equal(r.whatsapp.status, "sent");
      assert.match(r.whatsapp.body, /Nala/i);
      assert.ok(r.crm.length >= 1);
    }
    const outbox = listWhatsAppOutbox();
    assert.ok(outbox.length >= 2);
  });

  it("recovers a missed call with WhatsApp in the outbox", async () => {
    const before = listWhatsAppOutbox().length;
    const result = await recoverMissedCall({
      callerName: "Lebo",
      callerPhone: "+27 82 999 8877",
      vehicleHint: "Polo Vivo",
    });
    assert.equal(result.lead.source, "missed_call");
    assert.equal(result.whatsapp.status, "sent");
    assert.match(result.nalaReply, /missed your call/i);
    assert.ok(listWhatsAppOutbox().length > before);
  });

  it("sends Monday ROI into email outbox", async () => {
    const { email, report } = await sendMondayRoiEmail({
      to: "gm@sandtonmotors.test",
      dealershipName: "Sandton Motors",
    });
    assert.equal(email.status, "sent");
    assert.equal(email.kind, "monday_roi");
    assert.match(email.body, /Nala|enquir/i);
    assert.ok(report.totals.leadsReceived >= 0);
    assert.ok(listEmailOutbox().some((e) => e.id === email.id));
  });

  it("registers CRM webhooks and seeds multi-branch stock", () => {
    ensureBranches();
    seedMultiBranchStock();
    const branches = listBranches();
    assert.ok(branches.some((b) => b.id === "demo-yard"));
    assert.ok(branches.some((b) => b.id === "yard-pta"));
    const stock = getStock();
    assert.ok(stock.vehicles.some((v) => v.dealershipId === "yard-pta"));

    const sub = registerCrmWebhook({
      provider: "carleads",
      url: "mock://carleads/hook",
      dealershipId: "demo-yard",
    });
    assert.equal(sub.provider, "carleads");
    assert.ok(listCrmSubscriptions().some((s) => s.id === sub.id));
  });

  it("runs finance prequal checklist to submitted", () => {
    const app = startFinancePrequal({
      buyerName: "Nomsa",
      buyerPhone: "+27825551234",
      vehicleLabel: "2022 VW Polo Vivo",
    });
    assert.equal(app.status, "docs_pending");
    for (const item of app.checklist) {
      const updated = markFinanceDoc(app.id, item.id, true);
      assert.ok(!("error" in updated));
    }
    const done = markFinanceDoc(app.id, "id", true);
    assert.ok(!("error" in done));
    if (!("error" in done)) {
      assert.equal(done.status, "submitted");
    }
  });
});
