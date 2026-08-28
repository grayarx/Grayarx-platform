import { NextResponse } from "next/server";
import { verifyTwilioConnection } from "@/lib/setup-status";

export async function POST() {
  const result = await verifyTwilioConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
