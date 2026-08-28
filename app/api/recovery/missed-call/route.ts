import { NextResponse } from "next/server";
import { recoverMissedCall } from "@/lib/recovery/missed-call";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    callerName?: string;
    callerPhone?: string;
    dealershipId?: string;
    vehicleHint?: string;
  };

  if (!body.callerPhone?.trim()) {
    return NextResponse.json(
      { error: "callerPhone is required." },
      { status: 400 },
    );
  }

  const result = await recoverMissedCall({
    callerName: body.callerName,
    callerPhone: body.callerPhone,
    dealershipId: body.dealershipId,
    vehicleHint: body.vehicleHint,
  });

  return NextResponse.json({ ok: true, ...result });
}
