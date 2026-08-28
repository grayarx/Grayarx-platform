import { NextResponse } from "next/server";
import {
  COMPETITOR_PRICE_MATRIX,
  PRICING_STRATEGY,
} from "@/lib/os/competitor-prices";
import { GRAYARX_OS_PACKAGES, OS_MODULES } from "@/lib/os/pricing";
import { listParts, listPartsEnquiries } from "@/lib/os/parts";
import { handleOsMessage } from "@/lib/os/router";
import { listServiceBookings } from "@/lib/os/service";
import { listTradeIns } from "@/lib/os/tradein";
import { buildMondayRoiReport } from "@/lib/conversion/roi";

export async function GET() {
  return NextResponse.json({
    modules: OS_MODULES,
    packages: GRAYARX_OS_PACKAGES,
    pricingStrategy: PRICING_STRATEGY,
    competitorPrices: COMPETITOR_PRICE_MATRIX,
    parts: listParts(),
    partsEnquiries: listPartsEnquiries().slice(0, 20),
    serviceBookings: listServiceBookings().slice(0, 20),
    tradeIns: listTradeIns().slice(0, 20),
    roi: buildMondayRoiReport(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    buyerName?: string;
    buyerPhone?: string;
    message?: string;
    holdPart?: boolean;
    source?: "whatsapp" | "website" | "manual";
  };

  if (
    !body.buyerName?.trim() ||
    !body.buyerPhone?.trim() ||
    !body.message?.trim()
  ) {
    return NextResponse.json(
      { error: "buyerName, buyerPhone, and message are required." },
      { status: 400 },
    );
  }

  const result = handleOsMessage({
    buyerName: body.buyerName,
    buyerPhone: body.buyerPhone,
    message: body.message,
    holdPart: Boolean(body.holdPart),
    source: body.source,
  });

  return NextResponse.json({ result });
}
