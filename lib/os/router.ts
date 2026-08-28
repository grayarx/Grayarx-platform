import { ingestLead, type Lead } from "@/lib/conversion/leads";
import { holdPart, quotePart, type PartsEnquiry } from "@/lib/os/parts";
import { bookService, type ServiceBooking } from "@/lib/os/service";
import { captureTradeIn, type TradeIn } from "@/lib/os/tradein";

export type OsIntent = "sales" | "parts" | "service" | "trade_in";

export type OsTurnResult =
  | {
      intent: "sales";
      reply: string;
      lead: Lead;
    }
  | {
      intent: "parts";
      reply: string;
      enquiry: PartsEnquiry;
      held?: PartsEnquiry;
    }
  | {
      intent: "service";
      reply: string;
      booking: ServiceBooking;
    }
  | {
      intent: "trade_in";
      reply: string;
      tradeIn: TradeIn;
    };

export function detectOsIntent(message: string): OsIntent {
  const lower = message.toLowerCase();
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

/**
 * Single OS entry: Nala routes sales / parts / service / trade-in.
 */
export function handleOsMessage(input: {
  buyerName: string;
  buyerPhone: string;
  message: string;
  holdPart?: boolean;
  source?: "whatsapp" | "website" | "manual";
}): OsTurnResult {
  const intent = detectOsIntent(input.message);

  if (intent === "parts") {
    const { enquiry } = quotePart({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
    });
    let held: PartsEnquiry | undefined;
    if (input.holdPart && enquiry.partId) {
      const result = holdPart(enquiry.id);
      if (!("error" in result)) held = result;
    }
    return {
      intent: "parts",
      reply: held?.nalaReply ?? enquiry.nalaReply,
      enquiry: held ?? enquiry,
      held,
    };
  }

  if (intent === "service") {
    const booking = bookService({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
    });
    return { intent: "service", reply: booking.nalaReply, booking };
  }

  if (intent === "trade_in") {
    const tradeIn = captureTradeIn({
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      message: input.message,
    });
    return { intent: "trade_in", reply: tradeIn.nalaReply, tradeIn };
  }

  const { lead, nalaReply } = ingestLead({
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    message: input.message,
    source: input.source === "website" ? "website" : "whatsapp",
  });
  return { intent: "sales", reply: nalaReply, lead };
}
