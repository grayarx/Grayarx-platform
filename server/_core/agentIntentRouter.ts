/**
 * Routes inbound buyer messages to the right GrayArx agent before Nala's
 * generic showroom pipeline runs.
 */

import {
  classifyAgentRoute,
  extractCustomerName,
  type RoutedAgentId,
} from "../../shared/agentIntentRouting";
import { detectLanguage, type VehicleChatContext } from "../../shared/nalaShowroomChat";
import { polishedNalaText } from "../../shared/nalaGrammarPolish";
import { REPLY_TRADE_IN } from "../../shared/nalaTranslations";
import type { LanguageCode } from "../../shared/languages";
import {
  runBookingAgent,
  suggestNextSlot,
  draftBookingReply,
  formatSlotSAST,
} from "./bookingAgent";
import { runFallbackAgent, isAfterHoursSAST, generateReferenceNumber } from "./fallbackAgent";
import { resolveNalaReply, stripMarkdownForWhatsApp } from "./nalaReplyOrchestrator";
import { addWhatsAppAIDisclosure } from "./agentPrompts";
import {
  createTestDriveBooking,
  createFallbackMessage,
  listFutureBookingWindows,
  logAgentActivity,
} from "../db";

export type RoutedReplyResult = {
  agent: RoutedAgentId;
  reply: string;
  language: LanguageCode;
  intent: string;
  answered: boolean;
  source: "template" | "llm";
  referenceNumber?: string;
};

export type ResolveRoutedReplyInput = {
  message: string;
  channel: "web" | "whatsapp";
  dealershipId: number;
  dealershipName: string;
  businessHoursOverride?: unknown;
  customerPhone?: string;
  customerName?: string;
  vehicle?: VehicleChatContext | null;
  vehicleId?: number;
  inventoryHints?: Array<{ title: string; price?: number | string | null }>;
  includeDealScore?: boolean;
  language?: LanguageCode;
};

function siteUrl(): string {
  return (process.env.APP_URL || "https://www.grayarx.com").replace(/\/+$/, "");
}

function leratoAskNameReply(lang: LanguageCode, dealer: string, vehicle?: VehicleChatContext | null): string {
  const vehicleBit = vehicle?.title ? ` the ${vehicle.title}` : "";
  const templates: Partial<Record<LanguageCode, string>> = {
    en: `Hi! I'm **Lerato** from ${dealer} — I'll pencil in your test drive${vehicleBit}. What's your full name and best date/time?`,
    af: `Hallo! Ek is **Lerato** by ${dealer}. Wat is jou volle naam en wanneer wil jy${vehicleBit} toets?`,
    zu: `Sawubona! Ngingu-**Lerato** e-${dealer}. Yibani igama lakho eliphelele nesikhathi osifunayo ukuze sibhukhe${vehicleBit}.`,
  };
  return templates[lang] ?? templates.en!;
}

function tumiTradeInReply(
  lang: LanguageCode,
  dealer: string,
  vehicle?: VehicleChatContext | null,
): string {
  const base = polishedNalaText(lang, REPLY_TRADE_IN, {
    title: vehicle?.title ?? "your vehicle",
    year: vehicle?.year ?? undefined,
    price: vehicle?.price ?? undefined,
    color: vehicle?.color ?? undefined,
  });
  const link = `${siteUrl()}/trade-in`;
  const suffix =
    lang === "af"
      ? `\n\nEk is **Tumi** — voltooi jou gratis waardering hier: ${link}`
      : lang === "zu"
        ? `\n\nNgingu-**Tumi** — qedela isilinganiso sakho mahhala: ${link}`
        : `\n\nI'm **Tumi** — get your free valuation here: ${link}`;
  return `${base.replace(/\*\*Nala\*\*/g, "**Tumi**")}${suffix}`;
}

function webBookingHandoff(lang: LanguageCode, dealer: string): string {
  const templates: Partial<Record<LanguageCode, string>> = {
    en: `I'm **Lerato** at ${dealer}. Tap **Book a test drive** on this page, or tell me your name and when you'd like to visit — I'll pencil you in.`,
    af: `Ek is **Lerato** by ${dealer}. Tik **Book a test drive** op hierdie bladsy, of stuur jou naam en wanneer jy wil kom.`,
    zu: `Ngingu-**Lerato** e-${dealer}. Chofoza **Book a test drive** noma ungazise igama nesikhathi.`,
  };
  return templates[lang] ?? templates.en!;
}

async function handleLeratoRoute(input: ResolveRoutedReplyInput, lang: LanguageCode): Promise<RoutedReplyResult> {
  const name =
    input.customerName?.trim() ||
    extractCustomerName(input.message) ||
    (input.channel === "whatsapp" ? "WhatsApp Guest" : null);

  if (input.channel === "web") {
    return {
      agent: "lerato",
      reply: webBookingHandoff(lang, input.dealershipName),
      language: lang,
      intent: "test_drive",
      answered: true,
      source: "template",
    };
  }

  const contact = input.customerPhone?.trim();
  if (!contact || !name || name.length < 2) {
    let reply = leratoAskNameReply(lang, input.dealershipName, input.vehicle ?? undefined);
    if (input.channel === "whatsapp") {
      reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
    }
    return {
      agent: "lerato",
      reply,
      language: lang,
      intent: "test_drive",
      answered: true,
      source: "template",
    };
  }

  try {
    const existingWindows = await listFutureBookingWindows(
      input.dealershipId,
      input.vehicleId ?? null,
    );
    const drafted = await runBookingAgent(input.dealershipId, {
      customerName: name,
      customerContact: contact,
      channel: "whatsapp",
      inboundMessage: input.message,
      vehicleTitle: input.vehicle?.title ?? null,
      language: lang,
      dealershipName: input.dealershipName,
      businessHoursOverride: input.businessHoursOverride,
      existingWindows,
    });

    await createTestDriveBooking({
      dealershipId: input.dealershipId,
      vehicleId: input.vehicleId ?? null,
      referenceNumber: drafted.referenceNumber,
      customerName: name,
      customerContact: contact,
      inboundMessage: input.message,
      outboundReply: drafted.outboundReply,
      requestedSlotStart: drafted.requestedSlotStart,
      requestedSlotEnd: drafted.requestedSlotEnd,
      suggestedSlotStart: drafted.suggestedSlotStart,
      suggestedSlotEnd: drafted.suggestedSlotEnd,
      channel: "whatsapp",
      language: drafted.language,
    });

    await logAgentActivity({
      agentId: "booking",
      action: "booking_received",
      subjectType: "test_drive_booking",
      summary: `Lerato pencilled a WhatsApp test drive (${drafted.referenceNumber})`,
      payload: {
        reference: drafted.referenceNumber,
        dealershipId: input.dealershipId,
        channel: "whatsapp",
      },
    });

    let reply = drafted.outboundReply;
    if (input.channel === "whatsapp") {
      reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
    }

    return {
      agent: "lerato",
      reply,
      language: drafted.language,
      intent: "test_drive",
      answered: true,
      source: "template",
      referenceNumber: drafted.referenceNumber,
    };
  } catch (err) {
    console.warn("[agentIntentRouter] Lerato booking failed", err);
    const slot = suggestNextSlot(new Date(), input.businessHoursOverride);
    const ref = generateReferenceNumber(input.dealershipId, contact);
    const { reply, language } = await draftBookingReply(
      {
        customerName: name,
        customerContact: contact,
        channel: "whatsapp",
        inboundMessage: input.message,
        vehicleTitle: input.vehicle?.title ?? null,
        language: lang,
        dealershipName: input.dealershipName,
        businessHoursOverride: input.businessHoursOverride,
      },
      ref,
      slot,
    );
    return {
      agent: "lerato",
      reply: input.channel === "whatsapp" ? addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang) : reply,
      language,
      intent: "test_drive",
      answered: true,
      source: "template",
      referenceNumber: ref,
    };
  }
}

async function handleTumiRoute(input: ResolveRoutedReplyInput, lang: LanguageCode): Promise<RoutedReplyResult> {
  let reply = tumiTradeInReply(lang, input.dealershipName, input.vehicle ?? undefined);
  if (input.channel === "whatsapp") {
    reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
  }
  return {
    agent: "tumi",
    reply,
    language: lang,
    intent: "trade_in",
    answered: true,
    source: "template",
  };
}

async function handleBongiRoute(input: ResolveRoutedReplyInput, lang: LanguageCode): Promise<RoutedReplyResult> {
  const drafted = await runFallbackAgent(input.dealershipId, {
    customerName: input.customerName ?? extractCustomerName(input.message) ?? null,
    customerContact: input.customerPhone ?? null,
    channel: input.channel === "whatsapp" ? "whatsapp" : "web_chat",
    inboundMessage: input.message,
    language: lang,
    dealershipName: input.dealershipName,
  });

  try {
    await createFallbackMessage({
      referenceNumber: drafted.referenceNumber,
      dealershipId: input.dealershipId,
      customerName: input.customerName ?? extractCustomerName(input.message) ?? null,
      customerContact: input.customerPhone ?? null,
      channel: input.channel === "whatsapp" ? "whatsapp" : "web_chat",
      inboundMessage: input.message,
      outboundReply: drafted.outboundReply,
      language: drafted.language,
    });
    await logAgentActivity({
      agentId: "fallback",
      action: "fallback_replied",
      subjectType: "fallback_message",
      summary: `Bongi handled after-hours ${input.channel} message (${drafted.referenceNumber})`,
      payload: { reference: drafted.referenceNumber, dealershipId: input.dealershipId },
    });
  } catch (e) {
    console.warn("[agentIntentRouter] Bongi persist failed", e);
  }

  let reply = drafted.outboundReply;
  if (input.channel === "whatsapp") {
    reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
  }

  return {
    agent: "bongi",
    reply,
    language: drafted.language as LanguageCode,
    intent: "after_hours",
    answered: true,
    source: "template",
    referenceNumber: drafted.referenceNumber,
  };
}

/** Main entry — classify intent, route to specialist, or fall back to Nala. */
export async function resolveRoutedReply(
  input: ResolveRoutedReplyInput,
): Promise<RoutedReplyResult> {
  const lang = input.language ?? detectLanguage(input.message);
  const afterHours = isAfterHoursSAST(new Date(), input.businessHoursOverride);
  const route = classifyAgentRoute({ message: input.message, afterHours });

  switch (route.agent) {
    case "lerato":
      return handleLeratoRoute(input, lang);
    case "tumi":
      return handleTumiRoute(input, lang);
    case "bongi":
      return handleBongiRoute(input, lang);
    default: {
      const nala = await resolveNalaReply({
        message: input.message,
        vehicle: input.vehicle,
        dealershipName: input.dealershipName,
        language: lang,
        channel: input.channel,
        includeDealScore: input.includeDealScore,
        inventoryHints: input.inventoryHints,
      });
      return {
        agent: "nala",
        reply: nala.reply,
        language: nala.language,
        intent: nala.intent,
        answered: nala.answered,
        source: nala.source,
      };
    }
  }
}

// Used in tests / slot preview only
export { formatSlotSAST };
