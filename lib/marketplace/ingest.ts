import { ingestLead, type Lead, type LeadSource } from "@/lib/conversion/leads";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import { emitCrmEvent } from "@/lib/crm/webhooks";
import { routeBranchByCity, ensureBranches } from "@/lib/branches/store";
import { getStock } from "@/lib/conversion/stock";
import { ensureMultiBranchStock } from "@/lib/branches/store";
import { writeJsonFile } from "@/lib/conversion/store";

export type MarketplaceLeadFixture = {
  source: "autotrader" | "cars_co_za";
  buyerName: string;
  buyerPhone: string;
  message: string;
  listingId?: string;
  city?: string;
};

const FIXTURES: MarketplaceLeadFixture[] = [
  {
    source: "autotrader",
    buyerName: "Sipho Dlamini",
    buyerPhone: "+27 82 111 2001",
    message: "Hi, is the Polo Vivo still available on AutoTrader?",
    listingId: "AT-9001",
    city: "Sandton",
  },
  {
    source: "cars_co_za",
    buyerName: "Aisha Patel",
    buyerPhone: "+27 83 222 3002",
    message: "Interested in the Hilux listed on Cars.co.za — still for sale?",
    listingId: "CARS-4412",
    city: "Sandton",
  },
  {
    source: "autotrader",
    buyerName: "Johan van Wyk",
    buyerPhone: "+27 84 333 4003",
    message: "Looking at a Ranger in Pretoria — is PTA-2001 available?",
    listingId: "AT-9102",
    city: "Pretoria",
  },
];

export function listMarketplaceFixtures(): MarketplaceLeadFixture[] {
  return FIXTURES;
}

/** Ensure Pretoria branch stock exists for multi-branch demos */
export function seedMultiBranchStock(): void {
  ensureBranches();
  const stock = getStock();
  const vehicles = ensureMultiBranchStock(stock.vehicles);
  if (vehicles.length !== stock.vehicles.length) {
    writeJsonFile("stock.json", { vehicles });
  }
}

export type IngestResult = {
  lead: Lead;
  nalaReply: string;
  whatsapp: Awaited<ReturnType<typeof sendWhatsApp>>;
  crm: Awaited<ReturnType<typeof emitCrmEvent>>;
  dealershipId: string;
};

/**
 * Ingest a marketplace (or any) lead, send WhatsApp reply, push CRM event.
 */
export async function ingestMarketplaceLead(input: {
  source: LeadSource;
  buyerName: string;
  buyerPhone: string;
  message: string;
  dealershipId?: string;
  vehicleId?: string;
  createdAt?: string;
}): Promise<IngestResult> {
  seedMultiBranchStock();
  const dealershipId =
    input.dealershipId ?? routeBranchByCity(input.message);

  const { lead, nalaReply } = ingestLead({
    ...input,
    dealershipId,
  });

  const whatsapp = await sendWhatsApp({
    to: lead.buyerPhone,
    body: nalaReply,
    dealershipId,
    leadId: lead.id,
  });

  const crm = await emitCrmEvent({
    event: "lead.answered",
    dealershipId,
    payload: {
      leadId: lead.id,
      source: lead.source,
      buyerName: lead.buyerName,
      buyerPhone: lead.buyerPhone,
      message: lead.message,
      nalaReply,
      vehicleId: lead.vehicleId,
      whatsappMessageId: whatsapp.id,
    },
  });

  return { lead, nalaReply, whatsapp, crm, dealershipId };
}

/** Pull fixture marketplace leads (simulates AutoTrader/Cars webhook/poll). */
export async function pollMarketplaceFixtures(options?: {
  limit?: number;
}): Promise<IngestResult[]> {
  const limit = options?.limit ?? FIXTURES.length;
  const results: IngestResult[] = [];
  for (const fixture of FIXTURES.slice(0, limit)) {
    results.push(
      await ingestMarketplaceLead({
        source: fixture.source,
        buyerName: fixture.buyerName,
        buyerPhone: fixture.buyerPhone,
        message: fixture.message,
        dealershipId: routeBranchByCity(
          `${fixture.message} ${fixture.city ?? ""}`,
        ),
      }),
    );
  }
  return results;
}
