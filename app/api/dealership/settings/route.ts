import { NextResponse } from "next/server";
import {
  getDealershipSettings,
  listDealershipSettings,
  updateDealershipSettings,
} from "@/lib/dealership/settings";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("dealershipId");
  if (id) {
    return NextResponse.json({ settings: getDealershipSettings(id) });
  }
  return NextResponse.json({ settings: listDealershipSettings() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const dealershipId =
    typeof body.dealershipId === "string" ? body.dealershipId : "";
  if (!dealershipId) {
    return NextResponse.json({ error: "dealershipId required" }, { status: 400 });
  }
  const settings = updateDealershipSettings(dealershipId, {
    name: typeof body.name === "string" ? body.name : undefined,
    showroomSlug:
      typeof body.showroomSlug === "string" ? body.showroomSlug : undefined,
    planId:
      typeof body.planId === "string"
        ? (body.planId as Parameters<typeof updateDealershipSettings>[1]["planId"])
        : undefined,
    modules:
      typeof body.modules === "object" && body.modules
        ? (body.modules as Parameters<typeof updateDealershipSettings>[1]["modules"])
        : undefined,
    parts:
      typeof body.parts === "object" && body.parts
        ? (body.parts as Parameters<typeof updateDealershipSettings>[1]["parts"])
        : undefined,
  });
  return NextResponse.json({ ok: true, settings });
}
