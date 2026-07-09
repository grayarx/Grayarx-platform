import { sendSMS, sendWhatsApp } from "./twilioService";
import { sendTradeInInspectionInviteEmail } from "./resendEmailService";

export type TradeInNotifyInput = {
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  dealershipName: string;
  vehicleLabel: string;
  inviteMessage: string;
  indicativeOfferZar?: number | null;
  quoteId: number;
};

export type TradeInNotifyResult = {
  smsSent: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
};

function smsBody(input: TradeInNotifyInput): string {
  const offer = input.indicativeOfferZar
    ? ` Indicative offer: R${input.indicativeOfferZar.toLocaleString("en-ZA")} (subject to inspection).`
    : "";
  const raw = `GrayArx: ${input.dealershipName} invited you to bring your ${input.vehicleLabel} for inspection.${offer} Reply or call them to book. Ref #${input.quoteId}`;
  return raw.length > 320 ? raw.slice(0, 317) + "…" : raw;
}

/**
 * Notify trade-in seller via SMS, WhatsApp (if configured), and email.
 * Never throws — returns flags for persistence.
 */
export async function notifyTradeInSeller(input: TradeInNotifyInput): Promise<TradeInNotifyResult> {
  const result: TradeInNotifyResult = { smsSent: false, emailSent: false, whatsappSent: false };

  if (input.contactPhone?.trim()) {
    const phone = input.contactPhone.trim();
    const body = smsBody(input);
    try {
      const sms = await sendSMS(phone, body);
      result.smsSent = sms.success;
    } catch (e) {
      console.error("[tradeInNotify] SMS failed", e);
    }
    try {
      const wa = await sendWhatsApp(phone, input.inviteMessage);
      result.whatsappSent = wa.success;
    } catch (e) {
      console.error("[tradeInNotify] WhatsApp failed", e);
    }
  }

  if (input.contactEmail?.trim() && input.contactEmail.includes("@")) {
    try {
      const email = await sendTradeInInspectionInviteEmail({
        to: input.contactEmail.trim(),
        contactName: input.contactName ?? "there",
        dealershipName: input.dealershipName,
        vehicleLabel: input.vehicleLabel,
        inviteMessage: input.inviteMessage,
        indicativeOfferZar: input.indicativeOfferZar ?? undefined,
        quoteId: input.quoteId,
      });
      result.emailSent = email.success;
    } catch (e) {
      console.error("[tradeInNotify] Email failed", e);
    }
  }

  return result;
}

/**
 * Notify seller of confirmed written offer after inspection.
 */
export async function notifyTradeInWrittenOffer(input: TradeInNotifyInput & {
  writtenOfferZar: number;
}): Promise<TradeInNotifyResult> {
  const statusUrl = `https://grayarx.com/trade-in/status?quote=${input.quoteId}`;
  const offerMsg =
    `GrayArx: ${input.dealershipName} confirmed a written offer of R${input.writtenOfferZar.toLocaleString("en-ZA")} for your ${input.vehicleLabel} (after inspection). Track updates: ${statusUrl}`;

  const result = await notifyTradeInSeller({
    ...input,
    inviteMessage: `${input.inviteMessage}\n\nWritten offer: R${input.writtenOfferZar.toLocaleString("en-ZA")}. View: ${statusUrl}`,
    indicativeOfferZar: input.writtenOfferZar,
  });

  if (input.contactPhone?.trim()) {
    try {
      const sms = await sendSMS(input.contactPhone.trim(), offerMsg.slice(0, 320));
      result.smsSent = result.smsSent || sms.success;
    } catch (e) {
      console.error("[tradeInNotify] written offer SMS failed", e);
    }
  }

  return result;
}
