import { NextResponse } from "next/server";
import { buildMondayRoiReport } from "@/lib/conversion/roi";

export async function GET() {
  return NextResponse.json(buildMondayRoiReport());
}
