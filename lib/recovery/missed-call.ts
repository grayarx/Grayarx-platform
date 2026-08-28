import { ingestLead, type Lead } from "@/lib/conversion/leads";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import { emitCrmEvent } from "@/lib/crm/webhooks";
import { getBranch } from "@/lib/branches/store";

export type MissedCallRecovery = {
  lead: Lead;
  nalaReply: string;
  whatsapp: Awaited<ReturnType<typeof sendWhatsApp>>;
  crm: Awaited<ReturnType<typeof emitCrmEvent>>;
};

/**
 * Buyer called the yard, nobody answered → Nala WhatsApps within seconds.
 */
export async function recoverMissedCall(input: {
  callerName?: string;
  callerPhone: string;
  dealershipId?: string;
  vehicleHint?: string;
}): Promise<MissedCallRecovery> {
  const dealershipId = input.dealershipId ?? "demo-yard";
  const branch = getBranch(dealershipId);
  const buyerName = input.callerName?.trim() || "there";
  const message = input.vehicleHint
    ? `Missed call — enquiring about ${input.vehicleHint}`
    : `Missed call to ${branch?.name ?? "the yard"}`;

  const { lead, nalaReply } = ingestLead({
    buyerName: buyerName === "there" ? "Missed caller" : buyerName,
    buyerPhone: input.callerPhone.trim(),
    message,
    source: "missed_call",
    dealershipId,
  });

  const whatsapp = await sendWhatsApp({
    to: lead.buyerPhone,
    body: nalaReply,
    dealershipId,
    leadId: lead.id,
  });

  const crm = await emitCrmEvent({
    event: "missed_call.recovered",
    dealershipId,
    payload: {
      leadId: lead.id,
      callerPhone: lead.buyerPhone,
      nalaReply,
      whatsappMessageId: whatsapp.id,
      recoveredAt: new Date().toISOString(),
    },
  });

  return { lead, nalaReply, whatsapp, crm };
}
