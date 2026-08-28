/**
 * Marketplace webhook adapter tests — real payload shapes.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ingestMarketplaceLead } from "@/lib/marketplace/ingest";
import { listWhatsAppOutbox } from "@/lib/whatsapp/send";

describe("marketplace webhook payloads", () => {
  it("ingests AutoTrader-shaped enquiry end-to-end", async () => {
    const before = listWhatsAppOutbox().length;
    const result = await ingestMarketplaceLead({
      source: "autotrader",
      buyerName: "AT Webhook Buyer",
      buyerPhone: "+27826667788",
      message: "Hi, is the Polo Vivo still available on AutoTrader?",
    });
    assert.equal(result.lead.source, "autotrader");
    assert.equal(result.whatsapp.status, "sent");
    assert.ok(listWhatsAppOutbox().length > before);
  });
});
