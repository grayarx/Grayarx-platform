import { NextResponse } from "next/server";
import {
  COMPETITOR_PRICE_MATRIX,
  PRICING_STRATEGY,
} from "@/lib/os/competitor-prices";
import {
  GRAYARX_OS_PACKAGES,
  pricingEconomicsSummary,
} from "@/lib/os/pricing";

/** Lean pricing payload for /admin/pricing — avoids huge OS outbox blobs. */
export async function GET() {
  return NextResponse.json({
    packages: GRAYARX_OS_PACKAGES,
    economics: pricingEconomicsSummary(),
    pricingStrategy: PRICING_STRATEGY,
    competitorPrices: COMPETITOR_PRICE_MATRIX,
  });
}
