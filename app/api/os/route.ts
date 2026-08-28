import { NextResponse } from "next/server";
import {
  COMPETITOR_PRICE_MATRIX,
  PRICING_STRATEGY,
} from "@/lib/os/competitor-prices";
import {
  GRAYARX_OS_PACKAGES,
  OS_MODULES,
  pricingEconomicsSummary,
} from "@/lib/os/pricing";
import { listParts, listPartsEnquiries } from "@/lib/os/parts";
import { handleOsMessage } from "@/lib/os/router";
import { listServiceBookings } from "@/lib/os/service";
import { listTradeIns } from "@/lib/os/tradein";
import { buildMondayRoiReport } from "@/lib/conversion/roi";
import { listWhatsAppOutbox } from "@/lib/whatsapp/send";
import { listEmailOutbox } from "@/lib/email/send";
import { listCrmDeliveries, listCrmSubscriptions } from "@/lib/crm/webhooks";
import { listBranches, ensureBranches } from "@/lib/branches/store";
import { listFinanceApplications } from "@/lib/finance/prequal";
import { seedMultiBranchStock } from "@/lib/marketplace/ingest";

export async function GET() {
  ensureBranches();
  seedMultiBranchStock();
  return NextResponse.json({
    modules: OS_MODULES,
    packages: GRAYARX_OS_PACKAGES,
    economics: pricingEconomicsSummary(),
    pricingStrategy: PRICING_STRATEGY,
    competitorPrices: COMPETITOR_PRICE_MATRIX,
    parts: listParts(),
    partsEnquiries: listPartsEnquiries().slice(0, 20),
    serviceBookings: listServiceBookings().slice(0, 20),
    tradeIns: listTradeIns().slice(0, 20),
    finance: listFinanceApplications().slice(0, 20),
    branches: listBranches(),
    whatsappOutbox: listWhatsAppOutbox().slice(0, 20),
    emailOutbox: listEmailOutbox().slice(0, 10),
    crmSubscriptions: listCrmSubscriptions(),
    crmDeliveries: listCrmDeliveries().slice(0, 20),
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
    dealershipId?: string;
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

  const result = await handleOsMessage({
    buyerName: body.buyerName,
    buyerPhone: body.buyerPhone,
    message: body.message,
    holdPart: Boolean(body.holdPart),
    source: body.source,
    dealershipId: body.dealershipId,
  });

  return NextResponse.json({ result });
}
