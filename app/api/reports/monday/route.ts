import { NextResponse } from "next/server";
import { sendMondayRoiEmail, listEmailOutbox } from "@/lib/email/send";
import { listWhatsAppOutbox } from "@/lib/whatsapp/send";

export async function GET() {
  return NextResponse.json({
    emails: listEmailOutbox().slice(0, 30),
    whatsapp: listWhatsAppOutbox().slice(0, 30),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    to?: string;
    dealershipName?: string;
  };

  if (!body.to?.trim()) {
    return NextResponse.json({ error: "to email is required." }, { status: 400 });
  }

  const result = await sendMondayRoiEmail({
    to: body.to,
    dealershipName: body.dealershipName,
  });

  return NextResponse.json({ ok: true, ...result });
}
