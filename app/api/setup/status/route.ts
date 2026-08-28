import { NextResponse } from "next/server";
import { getSetupStatus } from "@/lib/setup-status";

export async function GET(request: Request) {
  const status = await getSetupStatus(request);
  let verify = null;

  if (status.twilio.accountSidSet && status.twilio.authTokenSet) {
    verify = await verifyTwilioConnection();
  }

  return NextResponse.json({ ...status, verify });
}
