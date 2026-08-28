import { NextResponse } from "next/server";
import { calculateValue, moneyFromPilot, type ValueInputs } from "@/lib/value/money-lost";
import { buildMondayRoiReport } from "@/lib/conversion/roi";
import { PROCESS_PLAYBOOKS } from "@/lib/processes/playbooks";

export async function GET() {
  const report = calculateValue();
  const roi = buildMondayRoiReport();
  const pilotMoney = moneyFromPilot({
    viewingsBooked: roi.totals.viewingsBooked,
    afterHoursRecovered: roi.totals.afterHoursRecovered,
  });
  return NextResponse.json({
    value: report,
    pilotMoney,
    roi,
    processes: PROCESS_PLAYBOOKS,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ValueInputs>;
  const report = calculateValue(body);
  const roi = buildMondayRoiReport();
  const pilotMoney = moneyFromPilot({
    viewingsBooked: roi.totals.viewingsBooked,
    afterHoursRecovered: roi.totals.afterHoursRecovered,
    avgGrossProfitZar: body.avgGrossProfitZar,
    viewingToSaleRate: body.viewingToSaleRate,
    grayArxMonthlyZar: body.grayArxMonthlyZar,
  });
  return NextResponse.json({ value: report, pilotMoney, roi });
}
