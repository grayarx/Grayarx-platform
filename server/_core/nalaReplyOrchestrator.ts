/**
 * Shared Nala reply pipeline — web chat + WhatsApp inbound.
 */

import {
  answerShowroomQuestion,
  buildVehicleFactsBlock,
  detectLanguage,
  type VehicleChatContext,
} from "../../shared/nalaShowroomChat";
import { scoreListingDeal } from "../../shared/priceIntelligence";
import { generateNalaShowroomReply } from "./nalaShowroomLlm";
import { addWhatsAppAIDisclosure } from "./agentPrompts";
import type { LanguageCode } from "../../shared/languages";
import { detectsBookingIntent } from "./bookingAgent";

export function stripMarkdownForWhatsApp(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

export function parseVehicleTitleFromMessage(message: string): string | null {
  const patterns = [
    /interested in (?:the )?(.+?)(?:\.|$)/i,
    /enquiring about (?:the )?(.+?)(?:\.|$)/i,
    /looking at (?:the )?(.+?)(?:\.|$)/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

export function vehicleRowToContext(row: {
  title?: string | null;
  year?: number | null;
  price?: number | string | null;
  km?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  location?: string | null;
  color?: string | null;
  make?: string | null;
  model?: string | null;
  description?: string | null;
}): VehicleChatContext {
  return {
    title: row.title ?? `${row.make ?? ""} ${row.model ?? ""}`.trim(),
    year: row.year ?? undefined,
    price: row.price ? Number(row.price) : undefined,
    km: row.km ?? undefined,
    fuel: row.fuel ?? undefined,
    transmission: row.transmission ?? undefined,
    location: row.location ?? undefined,
    color: row.color ?? null,
    make: row.make ?? undefined,
    model: row.model ?? undefined,
    description: row.description ?? null,
  };
}

export function appendDealScoreToReply(
  reply: string,
  vehicle: VehicleChatContext,
  lang: LanguageCode,
): string {
  if (!vehicle.price || !vehicle.year) return reply;
  const score = scoreListingDeal(vehicle.price, {
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    title: vehicle.title,
    mileageKm: vehicle.km,
  });
  if (!score) return reply;

  const labels: Record<LanguageCode, Record<string, string>> = {
    en: { great: "Great deal", fair: "Fair price", above: "Above market", premium: "Premium priced" },
    af: { great: "Goede koop", fair: "Billike prys", above: "Bo mark", premium: "Premium" },
    zu: { great: "Isivumelwano esihle", fair: "Intengo efanele", above: "Ngaphezu kwemakethe", premium: "Premium" },
    xh: { great: "Isivumelwano esihle", fair: "Ixabiso elifanelekileyo", above: "Ngaphezu kwemarike", premium: "Premium" },
    st: { great: "Thekiso e ntle", fair: "Theko e loketseng", above: "Hodimo ho mmaraka", premium: "Premium" },
    nso: { great: "Thekiso e botse", fair: "Theko e lokilego", above: "Hodimo ga mmaraka", premium: "Premium" },
    tn: { great: "Thekiso e botse", fair: "Theko e siameng", above: "Fa godimo ga mmaraka", premium: "Premium" },
    ts: { great: "Nxavo lowu a wu nene", fair: "Nxavo lowu a wu ringana", above: "Henhla ka mmaraka", premium: "Premium" },
    ss: { great: "Sivumelwano lesihle", fair: "Intengo lefanele", above: "Ngaphezu kwemakethe", premium: "Premium" },
    ve: { great: "Thekiso nnzhi", fair: "Theko i re hone", above: "Hodzulu ha mmaraka", premium: "Premium" },
    nr: { great: "Isivumelwano esihle", fair: "Intengo efanele", above: "Ngaphezu kwemakethe", premium: "Premium" },
    pt: { great: "Bom negócio", fair: "Preço justo", above: "Acima do mercado", premium: "Premium" },
  };
  const label = labels[lang]?.[score.rating] ?? score.label;
  const pct =
    score.deltaPct != null
      ? ` (${score.deltaPct > 0 ? "+" : ""}${score.deltaPct.toFixed(1)}% vs guide)`
      : "";
  return `${reply}\n\n📊 GrayArx deal score: ${label}${pct}`;
}

export async function resolveNalaReply(input: {
  message: string;
  vehicle?: VehicleChatContext | null;
  dealershipName: string;
  language?: LanguageCode;
  channel: "web" | "whatsapp";
  includeDealScore?: boolean;
}): Promise<{
  reply: string;
  language: LanguageCode;
  intent: string;
  answered: boolean;
  source: "template" | "llm";
  isBookingIntent: boolean;
}> {
  const lang = input.language ?? detectLanguage(input.message);
  const isBookingIntent = detectsBookingIntent(input.message);

  if (!input.vehicle?.title) {
    const fallback =
      lang === "af"
        ? "Dankie vir jou boodskap! Deel asseblief watter motor jy soek, of stuur die naam van die voertuig vanaf ons webwerf."
        : lang === "zu"
          ? "Ngiyabonga! Sicela uthathe isithombe somoto of ubhale igama lemoto oyithandayo kusuka ku-showroom yethu."
          : "Thanks for your message! Please tell me which vehicle you're interested in — or paste the car name from our showroom.";
    return {
      reply: input.channel === "whatsapp" ? addWhatsAppAIDisclosure(fallback, lang) : fallback,
      language: lang,
      intent: "general",
      answered: false,
      source: "template",
      isBookingIntent,
    };
  }

  const heuristic = answerShowroomQuestion(input.vehicle, input.message, lang);

  try {
    const llm = await generateNalaShowroomReply({
      language: lang,
      customerMessage: input.message,
      vehicle: input.vehicle,
      dealershipName: input.dealershipName,
      templateReply: heuristic.reply,
      intent: heuristic.intent,
    });
    let reply = (llm.reply.trim() || heuristic.reply).trim();
    if (input.includeDealScore !== false && (heuristic.intent === "price" || heuristic.intent === "availability")) {
      reply = appendDealScoreToReply(reply, input.vehicle, lang);
    }
    if (input.channel === "whatsapp") {
      reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
    }
    return {
      reply,
      language: lang,
      intent: heuristic.intent,
      answered: heuristic.answered,
      source: llm.reply.trim() ? "llm" : "template",
      isBookingIntent,
    };
  } catch (e) {
    console.warn("[nalaReplyOrchestrator] LLM failed", e);
    let reply = heuristic.reply;
    if (input.includeDealScore !== false && heuristic.intent === "price") {
      reply = appendDealScoreToReply(reply, input.vehicle, lang);
    }
    if (input.channel === "whatsapp") {
      reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
    }
    return {
      reply,
      language: lang,
      intent: heuristic.intent,
      answered: heuristic.answered,
      source: "template",
      isBookingIntent,
    };
  }
}

export { buildVehicleFactsBlock };
