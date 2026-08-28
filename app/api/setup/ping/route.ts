import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    alive: true,
    server: "grayarx-cloud-agent",
    time: new Date().toISOString(),
    message: "If you see this, your browser is talking to the right server.",
  });
}
