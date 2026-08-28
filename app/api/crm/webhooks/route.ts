import { NextResponse } from "next/server";
import {
  emitCrmEvent,
  listCrmDeliveries,
  listCrmSubscriptions,
  registerCrmWebhook,
  type CrmEventType,
  type CrmProvider,
} from "@/lib/crm/webhooks";

export async function GET() {
  return NextResponse.json({
    subscriptions: listCrmSubscriptions(),
    deliveries: listCrmDeliveries().slice(0, 40),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  if (body.action === "register") {
    const provider = body.provider as CrmProvider;
    const url = typeof body.url === "string" ? body.url : "mock://motorx/leads";
    if (!["motorx", "carleads", "adas", "custom"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
    const sub = registerCrmWebhook({
      provider,
      url,
      dealershipId:
        typeof body.dealershipId === "string" ? body.dealershipId : undefined,
    });
    return NextResponse.json({ ok: true, subscription: sub });
  }

  if (body.action === "emit") {
    const event = body.event as CrmEventType;
    const deliveries = await emitCrmEvent({
      event,
      dealershipId:
        typeof body.dealershipId === "string" ? body.dealershipId : undefined,
      payload:
        typeof body.payload === "object" && body.payload
          ? (body.payload as Record<string, unknown>)
          : { test: true },
    });
    return NextResponse.json({ ok: true, deliveries });
  }

  return NextResponse.json(
    { error: "action must be register or emit" },
    { status: 400 },
  );
}
