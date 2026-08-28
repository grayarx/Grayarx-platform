import { NextResponse } from "next/server";
import {
  listFinanceApplications,
  markFinanceDoc,
  startFinancePrequal,
} from "@/lib/finance/prequal";

export async function GET() {
  return NextResponse.json({ applications: listFinanceApplications() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  if (body.action === "checklist") {
    const applicationId =
      typeof body.applicationId === "string" ? body.applicationId : "";
    const checklistId =
      typeof body.checklistId === "string" ? body.checklistId : "";
    const result = markFinanceDoc(
      applicationId,
      checklistId,
      Boolean(body.done),
    );
    if ("error" in result) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json({ ok: true, application: result });
  }

  const buyerName =
    typeof body.buyerName === "string" ? body.buyerName.trim() : "";
  const buyerPhone =
    typeof body.buyerPhone === "string" ? body.buyerPhone.trim() : "";
  if (!buyerName || !buyerPhone) {
    return NextResponse.json(
      { error: "buyerName and buyerPhone required" },
      { status: 400 },
    );
  }

  const app = startFinancePrequal({
    buyerName,
    buyerPhone,
    vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : undefined,
    vehicleLabel:
      typeof body.vehicleLabel === "string" ? body.vehicleLabel : undefined,
    monthlyBudget:
      typeof body.monthlyBudget === "number" ? body.monthlyBudget : undefined,
    deposit: typeof body.deposit === "number" ? body.deposit : undefined,
    dealershipId:
      typeof body.dealershipId === "string" ? body.dealershipId : undefined,
  });

  return NextResponse.json({ ok: true, application: app });
}
