import { NextResponse } from "next/server";
import { ingestLead, listLeads, type LeadSource } from "@/lib/conversion/leads";

const SOURCES: LeadSource[] = [
  "autotrader",
  "cars_co_za",
  "website",
  "whatsapp",
  "missed_call",
  "manual",
];

export async function GET() {
  return NextResponse.json({ leads: listLeads() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const buyerName =
    typeof body.buyerName === "string" ? body.buyerName.trim() : "";
  const buyerPhone =
    typeof body.buyerPhone === "string" ? body.buyerPhone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const source = body.source as LeadSource;

  if (!buyerName || !buyerPhone || !message) {
    return NextResponse.json(
      { error: "buyerName, buyerPhone, and message are required." },
      { status: 400 },
    );
  }
  if (!SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `source must be one of: ${SOURCES.join(", ")}` },
      { status: 400 },
    );
  }

  const result = ingestLead({
    buyerName,
    buyerPhone,
    message,
    source,
    vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : undefined,
    createdAt:
      typeof body.createdAt === "string" ? body.createdAt : undefined,
  });

  return NextResponse.json({
    ok: true,
    lead: result.lead,
    vehicle: result.vehicle ?? null,
    nalaReply: result.nalaReply,
  });
}
