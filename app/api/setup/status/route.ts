import { NextResponse } from "next/server";
import { getSetupStatus } from "@/lib/setup-status";

export async function GET(request: Request) {
  const status = await getSetupStatus(request);
  return NextResponse.json(status);
}
