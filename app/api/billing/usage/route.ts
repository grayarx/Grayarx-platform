import { NextResponse } from "next/server";
import {
  getDealershipPlan,
  setDealershipPlan,
  usageSnapshot,
  type PlanId,
} from "@/lib/billing/usage";
import { GRAYARX_OS_PACKAGES } from "@/lib/os/unit-economics";
import { listDealershipSettings } from "@/lib/dealership/settings";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("dealershipId") ?? "demo-yard";
  return NextResponse.json({
    snapshot: usageSnapshot(id),
    planId: getDealershipPlan(id),
    packages: GRAYARX_OS_PACKAGES.map((p) => ({
      id: p.id,
      name: p.name,
      priceLabel: p.priceLabel,
      includedWhatsAppConversations: p.includedWhatsAppConversations,
      overagePerConversationZar: p.overagePerConversationZar,
    })),
    dealerships: listDealershipSettings().map((s) => ({
      dealershipId: s.dealershipId,
      name: s.name,
      planId: s.planId,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    dealershipId?: string;
    planId?: PlanId;
  };
  const dealershipId = body.dealershipId?.trim() || "demo-yard";

  if (body.action === "set_plan") {
    if (!body.planId) {
      return NextResponse.json({ error: "planId required" }, { status: 400 });
    }
    try {
      const result = setDealershipPlan(dealershipId, body.planId);
      return NextResponse.json({
        ok: true,
        settings: result.settings,
        package: result.package,
        snapshot: usageSnapshot(dealershipId),
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "set_plan failed" },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(
    { error: "action must be set_plan" },
    { status: 400 },
  );
}
