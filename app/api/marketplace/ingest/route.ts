import { NextResponse } from "next/server";
import {
  listMarketplaceFixtures,
  pollMarketplaceFixtures,
  ingestMarketplaceLead,
} from "@/lib/marketplace/ingest";
import type { LeadSource } from "@/lib/conversion/leads";

export async function GET() {
  return NextResponse.json({
    fixtures: listMarketplaceFixtures(),
    hint: "POST { action: 'poll' } to ingest AutoTrader/Cars fixtures, or POST a single lead.",
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  if (body.action === "poll") {
    const limit =
      typeof body.limit === "number" ? body.limit : undefined;
    const results = await pollMarketplaceFixtures({ limit });
    return NextResponse.json({
      ok: true,
      ingested: results.length,
      results: results.map((r) => ({
        leadId: r.lead.id,
        source: r.lead.source,
        dealershipId: r.dealershipId,
        nalaReply: r.nalaReply,
        whatsappId: r.whatsapp.id,
        whatsappStatus: r.whatsapp.status,
        crmEvents: r.crm.length,
      })),
    });
  }

  const buyerName =
    typeof body.buyerName === "string" ? body.buyerName.trim() : "";
  const buyerPhone =
    typeof body.buyerPhone === "string" ? body.buyerPhone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const source = (body.source as LeadSource) || "autotrader";

  if (!buyerName || !buyerPhone || !message) {
    return NextResponse.json(
      { error: "buyerName, buyerPhone, message required (or action: poll)" },
      { status: 400 },
    );
  }

  const result = await ingestMarketplaceLead({
    source,
    buyerName,
    buyerPhone,
    message,
    dealershipId:
      typeof body.dealershipId === "string" ? body.dealershipId : undefined,
    vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : undefined,
  });

  return NextResponse.json({ ok: true, ...result });
}
