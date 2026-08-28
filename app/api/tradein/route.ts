import { NextResponse } from "next/server";
import { attachTradeInPhoto, listTradeIns, captureTradeIn } from "@/lib/os/tradein";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import { emitCrmEvent } from "@/lib/crm/webhooks";

export async function GET() {
  return NextResponse.json({ tradeIns: listTradeIns() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  if (body.action === "photo") {
    const tradeInId = String(body.tradeInId || "");
    const label = String(body.label || "photo");
    const url = String(body.url || "");
    if (!tradeInId || !url) {
      return NextResponse.json(
        { error: "tradeInId and url required" },
        { status: 400 },
      );
    }
    const result = attachTradeInPhoto({ tradeInId, label, url });
    if ("error" in result) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json({ ok: true, tradeIn: result });
  }

  const buyerName = String(body.buyerName || "").trim();
  const buyerPhone = String(body.buyerPhone || "").trim();
  const message = String(body.message || "").trim();
  if (!buyerName || !buyerPhone || !message) {
    return NextResponse.json(
      { error: "buyerName, buyerPhone, message required" },
      { status: 400 },
    );
  }
  const tradeIn = captureTradeIn({ buyerName, buyerPhone, message });
  await sendWhatsApp({
    to: buyerPhone,
    body: tradeIn.nalaReply,
    leadId: tradeIn.id,
  });
  await emitCrmEvent({
    event: "tradein.captured",
    payload: { tradeInId: tradeIn.id },
  });
  return NextResponse.json({ ok: true, tradeIn });
}
