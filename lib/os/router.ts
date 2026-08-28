import { ingestLead, bookViewing, type Lead, type Booking } from "@/lib/conversion/leads";
import { holdPart, quotePart, type PartsEnquiry } from "@/lib/os/parts";
import { bookService, type ServiceBooking } from "@/lib/os/service";
import { captureTradeIn, type TradeIn } from "@/lib/os/tradein";
import { startFinancePrequal, type FinanceApplication } from "@/lib/finance/prequal";
import { sendWhatsApp, type WhatsAppMessage } from "@/lib/whatsapp/send";
import { emitCrmEvent, type CrmDelivery } from "@/lib/crm/webhooks";
import { routeBranchByCity } from "@/lib/branches/store";
import { formatVehicleLine, findVehicle } from "@/lib/conversion/stock";
import { polishNalaReply } from "@/lib/billing/polish";
import {
  gateWhatsAppSend,
  recordWhatsAppConversation,
  usageSnapshot,
  type WhatsAppGate,
} from "@/lib/billing/usage";

export type OsIntent =
  | "sales"
  | "parts"
  | "service"
  | "trade_in"
  | "finance"
  | "blocked";

export type OsDelivery = {
  whatsapp: WhatsAppMessage;
  crm: CrmDelivery[];
  polishMode: "llm_polish" | "template";
  polishReason: string;
  usageGate: WhatsAppGate;
};

export type OsTurnResult =
  | {
      intent: "sales";
      reply: string;
      lead: Lead;
      delivery: OsDelivery;
      usage: ReturnType<typeof usageSnapshot>;
    }
  | {
      intent: "parts";
      reply: string;
      enquiry: PartsEnquiry;
      held?: PartsEnquiry;
      delivery: OsDelivery;
      usage: ReturnType<typeof usageSnapshot>;
    }
  | {
      intent: "service";
      reply: string;
      booking: ServiceBooking;
      delivery: OsDelivery;
      usage: ReturnType<typeof usageSnapshot>;
    }
  | {
      intent: "trade_in";
      reply: string;
      tradeIn: TradeIn;
      delivery: OsDelivery;
      usage: ReturnType<typeof usageSnapshot>;
    }
  | {
      intent: "finance";
      reply: string;
      application: FinanceApplication;
      delivery: OsDelivery;
      usage: ReturnType<typeof usageSnapshot>;
    }
  | {
      intent: "blocked";
      reply: string;
      reason: string;
      usage: ReturnType<typeof usageSnapshot>;
    };

export function detectOsIntent(message: string): OsIntent {
  const lower = message.toLowerCase();
  if (
    /\b(finance|pre-?qual|loan|monthly instalment|can i finance|affordability)\b/.test(
      lower,
    )
  ) {
    return "finance";
  }
  if (
    /\b(trade[- ]?in|trade in|swap my|sell my (car|bakkie)|appraisal)\b/.test(
      lower,
    )
  ) {
    return "trade_in";
  }
  if (
    /\b(service|book (a )?service|workshop|oil change|major service|minor service|service booking)\b/.test(
      lower,
    )
  ) {
    return "service";
  }
  if (
    /\b(parts?|spare|oil filter|brake pads?|battery|wiper|fitment|counter)\b/.test(
      lower,
    )
  ) {
    return "parts";
  }
  return "sales";
}

async function deliver(input: {
  to: string;
  body: string;
  dealershipId: string;
  buyerMessage?: string;
  leadId?: string;
  event:
    | "lead.answered"
    | "parts.quoted"
    | "service.booked"
    | "tradein.captured"
    | "viewing.booked";
  payload: Record<string, unknown>;
}): Promise<OsDelivery | { blocked: true; reason: string; usageGate: WhatsAppGate }> {
  const usageGate = gateWhatsAppSend({
    dealershipId: input.dealershipId,
    buyerPhone: input.to,
  });
  if (!usageGate.allowed) {
    return { blocked: true, reason: usageGate.reason, usageGate };
  }

  const polished = await polishNalaReply({
    dealershipId: input.dealershipId,
    templateReply: input.body,
    buyerMessage: input.buyerMessage,
  });

  const whatsapp = await sendWhatsApp({
    to: input.to,
    body: polished.reply,
    dealershipId: input.dealershipId,
    leadId: input.leadId,
  });
  if (whatsapp.status === "sent" && usageGate.isNewConversation) {
    recordWhatsAppConversation({
      dealershipId: input.dealershipId,
      buyerPhone: input.to,
    });
  }
  const crm = await emitCrmEvent({
    event: input.event,
    dealershipId: input.dealershipId,
    payload: {
      ...input.payload,
      whatsappMessageId: whatsapp.id,
      polishMode: polished.mode,
      usageOverage: usageGate.overage,
    },
  });
  return {
    whatsapp,
    crm,
    polishMode: polished.mode,
    polishReason: polished.reason,
    usageGate,
  };
}

/**
 * Single OS entry: Nala routes sales / parts / service / trade-in / finance,
 * then WhatsApps the buyer and pushes CRM.
 */
export async function handleOsMessage(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
  holdPart?: boolean;
  source?: "whatsapp" | "website" | "manual";
  dealershipId?: string;
}): Promise<OsTurnResult> {
  const intent = detectOsIntent(input.message);
  const dealershipId =
    input.dealershipId ?? routeBranchByCity(input.message);

  async function finishDeliver(
    template: string,
    event: Parameters<typeof deliver>[0]["event"],
    payload: Record<string, unknown>,
    leadId?: string,
  ): Promise<OsDelivery | OsTurnResult> {
    const delivery = await deliver({
      to: input.buyerPhone,
      body: template,
      dealershipId,
      buyerMessage: input.message,
      leadId,
      event,
      payload,
    });
    if ("blocked" in delivery && delivery.blocked) {
      return {
        intent: "blocked",
        reply: delivery.reason,
        reason: delivery.reason,
        usage: usageSnapshot(dealershipId),
      };
    }
    return delivery;
  }

  if (intent === "parts") {
    const { enquiry } = quotePart({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
      dealershipId,
    });
    let held: PartsEnquiry | undefined;
    if (
      input.holdPart &&
      enquiry.partId &&
      enquiry.status !== "module_off"
    ) {
      const result = holdPart(enquiry.id);
      if (!("error" in result)) held = result;
    }
    const reply = held?.nalaReply ?? enquiry.nalaReply;
    const delivery = await finishDeliver(reply, "parts.quoted", {
      enquiryId: enquiry.id,
      partId: enquiry.partId,
      status: held?.status ?? enquiry.status,
    });
    if ("intent" in delivery) return delivery;
    return {
      intent: "parts",
      reply: delivery.whatsapp.body,
      enquiry: held ?? enquiry,
      held,
      delivery,
      usage: usageSnapshot(dealershipId),
    };
  }

  if (intent === "service") {
    const booking = bookService({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
    });
    const delivery = await finishDeliver(
      booking.nalaReply,
      "service.booked",
      { bookingId: booking.id, serviceType: booking.serviceType },
    );
    if ("intent" in delivery) return delivery;
    return {
      intent: "service",
      reply: delivery.whatsapp.body,
      booking,
      delivery,
      usage: usageSnapshot(dealershipId),
    };
  }

  if (intent === "trade_in") {
    const tradeIn = captureTradeIn({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
    });
    const delivery = await finishDeliver(
      tradeIn.nalaReply,
      "tradein.captured",
      {
        tradeInId: tradeIn.id,
        make: tradeIn.make,
        model: tradeIn.model,
        band: tradeIn.estimatedBandZar,
      },
    );
    if ("intent" in delivery) return delivery;
    return {
      intent: "trade_in",
      reply: delivery.whatsapp.body,
      tradeIn,
      delivery,
      usage: usageSnapshot(dealershipId),
    };
  }

  if (intent === "finance") {
    const vehicle = findVehicle({
      make: undefined,
      model: undefined,
    });
    const { lead } = ingestLead({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
      source: "whatsapp",
      dealershipId,
    });
    const matched = lead.vehicleId
      ? findVehicle({ id: lead.vehicleId })
      : vehicle;
    const application = startFinancePrequal({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      vehicleId: matched?.id ?? lead.vehicleId,
      vehicleLabel: matched ? formatVehicleLine(matched) : undefined,
      dealershipId,
    });
    const delivery = await finishDeliver(
      application.nalaReply,
      "lead.answered",
      {
        financeApplicationId: application.id,
        partnerUrl: application.partnerUrl,
      },
      lead.id,
    );
    if ("intent" in delivery) return delivery;
    return {
      intent: "finance",
      reply: delivery.whatsapp.body,
      application,
      delivery,
      usage: usageSnapshot(dealershipId),
    };
  }

  const { lead, nalaReply } = ingestLead({
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    message: input.message,
    source: input.source === "website" ? "website" : "whatsapp",
    dealershipId,
  });
  const delivery = await finishDeliver(
    nalaReply,
    "lead.answered",
    { leadId: lead.id, vehicleId: lead.vehicleId },
    lead.id,
  );
  if ("intent" in delivery) return delivery;
  return {
    intent: "sales",
    reply: delivery.whatsapp.body,
    lead,
    delivery,
    usage: usageSnapshot(dealershipId),
  };
}

export async function bookViewingAndNotify(input: {
  leadId: string;
  viewingAt: string;
}): Promise<
  | { lead: Lead; booking: Booking; delivery: OsDelivery }
  | { error: string }
> {
  const result = bookViewing(input);
  if ("error" in result) return result;

  const delivery = await deliver({
    to: result.lead.buyerPhone,
    body: `Confirmed — viewing booked for ${new Date(result.booking.viewingAt).toLocaleString("en-ZA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. See you at the yard. — Nala`,
    dealershipId: result.lead.dealershipId,
    leadId: result.lead.id,
    event: "viewing.booked",
    payload: {
      leadId: result.lead.id,
      bookingId: result.booking.id,
      viewingAt: result.booking.viewingAt,
      vehicleId: result.booking.vehicleId,
    },
  });
  if ("blocked" in delivery && delivery.blocked) {
    return { error: delivery.reason };
  }

  return { ...result, delivery };
}
