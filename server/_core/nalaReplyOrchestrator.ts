/**
 * Shared Nala reply pipeline — web chat + WhatsApp inbound.
 */

import {
  answerShowroomQuestion,
  buildVehicleFactsBlock,
  detectLanguage,
  type VehicleChatContext,
} from "../../shared/nalaShowroomChat";
import { composeShowroomBotReply, polishNalaReply } from "../../shared/nalaGrammarPolish";
import { replyNeedsNameCapture } from "../../shared/nalaTranslations";
import { scoreListingDeal } from "../../shared/priceIntelligence";
import { generateNalaShowroomReply } from "./nalaShowroomLlm";
import { addWhatsAppAIDisclosure } from "./agentPrompts";
import type { LanguageCode } from "../../shared/languages";
import { detectsBookingIntent } from "../../shared/agentIntentRouting";

export function stripMarkdownForWhatsApp(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

const GREETING_RE =
  /^(hi|hello|hey|howzit|howzit\?|molo|dumela|hallo|haai|good (morning|afternoon|evening)|thanks|thank you)\b/i;

/** Match inventory rows when the buyer names a make/model (e.g. "polo", "bmw x3"). */
export function findVehicleFromMessage(
  message: string,
  vehicles: Array<{
    id: number;
    title?: string | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    price?: number | string | null;
    status?: string | null;
  }>,
): (typeof vehicles)[number] | null {
  const available = vehicles.filter(
    (v) => v.status === "available" || v.status == null,
  );
  if (available.length === 0) return null;

  const lower = message.toLowerCase().replace(/[^\w\s]/g, " ");
  const tokens = lower.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return null;

  const stop = new Set([
    "the", "a", "an", "do", "you", "have", "any", "for", "sale", "car", "cars",
    "vehicle", "vehicles", "auto", "please", "thanks", "hi", "hello", "hey",
    "looking", "want", "need", "about", "price", "how", "much", "is", "there",
  ]);
  const keywords = tokens.filter((t) => !stop.has(t));
  if (keywords.length === 0) return null;

  let best: { v: (typeof vehicles)[number]; score: number } | null = null;
  for (const v of available) {
    const hay = `${v.make ?? ""} ${v.model ?? ""} ${v.title ?? ""}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (hay.includes(kw)) score += kw.length >= 4 ? 3 : 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { v, score };
  }
  return best?.v ?? null;
}

export function buildNoVehicleWhatsAppReply(
  message: string,
  lang: LanguageCode,
  siteUrl: string,
  topMatches: Array<{ title: string; price?: number | string | null }> = [],
  dealershipName = "GrayArx",
): string {
  if (GREETING_RE.test(message.trim())) {
    // Use a no-vehicle intro — the vehicle GREETING template requires {name}/{price}/{specs} vars
    const intro =
      lang === "af"
        ? `Welkom by ${dealershipName}! Ek is *Nala* — jou AI-verkoopsassistent.\n\nVra my enigiets in enige van Suid-Afrika se 11 amptelike tale.`
        : lang === "zu"
          ? `Siyakwamukela ku-${dealershipName}! Ngingu-*Nala* — umsizi wakho we-AI.\n\nNgibuze noma yini ngolimi lwazo zonke izilimi ezisemthethweni eziyi-11 zaseNingizimu Afrika.`
          : `Welcome to *${dealershipName}*! I'm *Nala* — your AI sales assistant.\n\nAsk me anything in any of South Africa's 11 official languages.`;
    let reply = intro;
    if (topMatches.length > 0) {
      const lines = topMatches.slice(0, 3).map((v) => {
        const price =
          v.price != null && Number(v.price) > 1
            ? ` — R${Math.round(Number(v.price)).toLocaleString("en-ZA")}`
            : "";
        return `• ${v.title}${price}`;
      });
      reply += `\n\n🔥 Top deals right now:\n${lines.join("\n")}`;
    }
    reply += `\n\nBrowse all scored stock: ${siteUrl}/showroom?sort=best_deals`;
    reply += `\nTrade-in estimate: ${siteUrl}/trade-in`;
    return reply;
  }

  return lang === "af"
    ? `Dankie vir jou boodskap! Noem die motor (bv. "Polo" of "BMW X3") of blaai ons showroom: ${siteUrl}/showroom?sort=best_deals`
    : lang === "zu"
      ? `Ngiyabonga! Bhala igama lemoto (isb. "Polo") noma uvakashele: ${siteUrl}/showroom?sort=best_deals`
      : `Thanks for your message! Tell me the car you're after (e.g. "Polo" or "BMW X3"), or browse scored deals: ${siteUrl}/showroom?sort=best_deals`;
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
  inventoryHints?: Array<{ title: string; price?: number | string | null }>;
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
    const siteUrl = (process.env.APP_URL || "https://www.grayarx.com").replace(/\/+$/, "");
    const fallback = buildNoVehicleWhatsAppReply(
      input.message,
      lang,
      siteUrl,
      input.inventoryHints ?? [],
      input.dealershipName,
    );
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

  // Web chat: native templates only — LLM rewrites caused cross-language grammar errors
  // when OpenAI quota was limited. WhatsApp still uses LLM polish path below.
  if (input.channel === "web") {
    let reply = composeShowroomBotReply(heuristic.reply, lang, {
      appendFollowUp: heuristic.answered && !replyNeedsNameCapture(heuristic.reply),
    });
    if (input.includeDealScore !== false && (heuristic.intent === "price" || heuristic.intent === "availability")) {
      reply = appendDealScoreToReply(reply, input.vehicle, lang);
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
    reply = polishNalaReply(reply, lang);
    if (
      llm.reply.trim() &&
      heuristic.answered &&
      !replyNeedsNameCapture(reply)
    ) {
      reply = composeShowroomBotReply(reply, lang, { appendFollowUp: true });
    }
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
    let reply = polishNalaReply(heuristic.reply, lang);
    if (heuristic.answered && !replyNeedsNameCapture(reply)) {
      reply = composeShowroomBotReply(reply, lang, { appendFollowUp: true });
    }
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
