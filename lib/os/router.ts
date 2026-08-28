import { ingestLead, bookViewing, type Lead, type Booking } from "@/lib/conversion/leads";
import { holdPart, quotePart, type PartsEnquiry } from "@/lib/os/parts";
import { bookService, type ServiceBooking } from "@/lib/os/service";
import { captureTradeIn, type TradeIn } from "@/lib/os/tradein";
import { startFinancePrequal, type FinanceApplication } from "@/lib/finance/prequal";
import { sendWhatsApp, type WhatsAppMessage } from "@/lib/whatsapp/send";
import { emitCrmEvent, type CrmDelivery } from "@/lib/crm/webhooks";
import { routeBranchByCity } from "@/lib/branches/store";
import { formatVehicleLine, findVehicle } from "@/lib/conversion/stock";

export type OsIntent =
  | "sales"
  | "parts"
  | "service"
  | "trade_in"
  | "finance";

export type OsDelivery = {
  whatsapp: WhatsAppMessage;
  crm: CrmDelivery[];
};

export type OsTurnResult =
  | {
      intent: "sales";
      reply: string;
      lead: Lead;
      delivery: OsDelivery;
    }
  | {
      intent: "parts";
      reply: string;
      enquiry: PartsEnquiry;
      held?: PartsEnquiry;
      delivery: OsDelivery;
    }
  | {
      intent: "service";
      reply: string;
      booking: ServiceBooking;
      delivery: OsDelivery;
    }
  | {
      intent: "trade_in";
      reply: string;
      tradeIn: TradeIn;
      delivery: OsDelivery;
    }
  | {
      intent: "finance";
      reply: string;
      application: FinanceApplication;
      delivery: OsDelivery;
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
  leadId?: string;
  event:
    | "lead.answered"
    | "parts.quoted"
    | "service.booked"
    | "tradein.captured"
    | "viewing.booked";
  payload: Record<string, unknown>;
}): Promise<OsDelivery> {
  const whatsapp = await sendWhatsApp({
    to: input.to,
    body: input.body,
    dealershipId: input.dealershipId,
    leadId: input.leadId,
  });
  const crm = await emitCrmEvent({
    event: input.event,
    dealershipId: input.dealershipId,
    payload: { ...input.payload, whatsappMessageId: whatsapp.id },
  });
  return { whatsapp, crm };
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
    const delivery = await deliver({
      to: input.buyerPhone,
      body: reply,
      dealershipId,
      event: "parts.quoted",
      payload: {
        enquiryId: enquiry.id,
        partId: enquiry.partId,
        status: held?.status ?? enquiry.status,
      },
    });
    return {
      intent: "parts",
      reply,
      enquiry: held ?? enquiry,
      held,
      delivery,
    };
  }

  if (intent === "service") {
    const booking = bookService({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
    });
    const delivery = await deliver({
      to: input.buyerPhone,
      body: booking.nalaReply,
      dealershipId,
      event: "service.booked",
      payload: { bookingId: booking.id, serviceType: booking.serviceType },
    });
    return { intent: "service", reply: booking.nalaReply, booking, delivery };
  }

  if (intent === "trade_in") {
    const tradeIn = captureTradeIn({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
    });
    const delivery = await deliver({
      to: input.buyerPhone,
      body: tradeIn.nalaReply,
      dealershipId,
      event: "tradein.captured",
      payload: {
        tradeInId: tradeIn.id,
        make: tradeIn.make,
        model: tradeIn.model,
        band: tradeIn.estimatedBandZar,
      },
    });
    return { intent: "trade_in", reply: tradeIn.nalaReply, tradeIn, delivery };
  }

  if (intent === "finance") {
    const vehicle = findVehicle({
      make: undefined,
      model: undefined,
    });
    // Prefer vehicle mentioned in message via stock hints from sales path
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
    const delivery = await deliver({
      to: input.buyerPhone,
      body: application.nalaReply,
      dealershipId,
      leadId: lead.id,
      event: "lead.answered",
      payload: {
        financeApplicationId: application.id,
        partnerUrl: application.partnerUrl,
      },
    });
    return {
      intent: "finance",
      reply: application.nalaReply,
      application,
      delivery,
    };
  }

  const { lead, nalaReply } = ingestLead({
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    message: input.message,
    source: input.source === "website" ? "website" : "whatsapp",
    dealershipId,
  });
  const delivery = await deliver({
    to: input.buyerPhone,
    body: nalaReply,
    dealershipId,
    leadId: lead.id,
    event: "lead.answered",
    payload: { leadId: lead.id, vehicleId: lead.vehicleId },
  });
  return { intent: "sales", reply: nalaReply, lead, delivery };
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

  return { ...result, delivery };
}
