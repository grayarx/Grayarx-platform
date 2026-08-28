import { NextResponse } from "next/server";
import { ingestMarketplaceLead } from "@/lib/marketplace/ingest";

/**
 * Webhook endpoints for marketplace lead providers.
 * Accepts AutoTrader-shaped and Cars.co.za-shaped JSON payloads.
 * When real provider credentials exist, point their webhook here.
 */
export async function POST(request: Request) {
  const provider =
    new URL(request.url).searchParams.get("provider") || "autotrader";
  const body = (await request.json()) as Record<string, unknown>;

  // AutoTrader-ish
  const atName =
    (body.customerName as string) ||
    (body.buyer_name as string) ||
    (body.name as string) ||
    [body.firstName, body.lastName].filter(Boolean).join(" ");
  const atPhone =
    (body.customerPhone as string) ||
    (body.buyer_phone as string) ||
    (body.phone as string) ||
    (body.mobile as string);
  const atMessage =
    (body.message as string) ||
    (body.enquiry as string) ||
    (body.comments as string) ||
    (body.vehicleTitle as string) ||
    `Enquiry on listing ${body.listingId || body.stockNumber || ""}`;

  // Cars.co.za-ish
  const carsName =
    (body.LeadName as string) || (body.ContactName as string) || atName;
  const carsPhone =
    (body.LeadPhone as string) || (body.ContactPhone as string) || atPhone;
  const carsMessage =
    (body.LeadMessage as string) ||
    (body.Comments as string) ||
    atMessage;

  const buyerName = (provider === "cars" ? carsName : atName)?.trim();
  const buyerPhone = (provider === "cars" ? carsPhone : atPhone)?.trim();
  const message = (provider === "cars" ? carsMessage : atMessage)?.trim();

  if (!buyerName || !buyerPhone || !message) {
    return NextResponse.json(
      {
        error:
          "Could not map payload. Need customer name, phone, and message/listing fields.",
        acceptedShapes: {
          autotrader: ["customerName|buyer_name|name", "customerPhone|phone", "message|enquiry|vehicleTitle"],
          cars: ["LeadName|ContactName", "LeadPhone|ContactPhone", "LeadMessage|Comments"],
        },
      },
      { status: 400 },
    );
  }

  const source = provider === "cars" || provider === "cars_co_za" ? "cars_co_za" : "autotrader";
  const result = await ingestMarketplaceLead({
    source,
    buyerName,
    buyerPhone,
    message,
    dealershipId:
      typeof body.dealershipId === "string" ? body.dealershipId : undefined,
  });

  return NextResponse.json({
    ok: true,
    provider: source,
    leadId: result.lead.id,
    whatsappStatus: result.whatsapp.status,
    nalaReply: result.nalaReply,
  });
}
