/**
 * Agent intent routing — which specialist handles this buyer message.
 * Used by Nala's orchestrator before the generic showroom reply path.
 */

import { classifyShowroomIntent } from "./nalaShowroomChat";
import type { LanguageCode } from "./languages";

export type RoutedAgentId = "nala" | "lerato" | "tumi" | "bongi";

export type AgentRoute = {
  agent: RoutedAgentId;
  intent: string;
};

/** Booking / test-drive phrasing (11 SA languages + Portuguese). */
export function detectsBookingIntent(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  const patterns = [
    /\btest[\s-]?drive\b/,
    /\btoetsr(it|y)\b/,
    /\bbook(ing)? a (test|car|vehicle)\b/,
    /\b(can|may|could) i (come|see|view|drive|test)\b/,
    /\bsee the (car|vehicle|vehiku|imoto|umkhumbi)\b/,
    /\bukuza ku|ukuhlola|uku(shayela|qhuba)\b/,
    /\bteko ya ho khanna|teko ya go otlela|teko ya go kgweetsa\b/,
    /\bnkambelo wa ku chayela\b/,
    /\bkuhlola kushayela\b/,
    /\bu linga u tshimbidza\b/,
    /\bukuhlola ukutjhayela\b/,
    /\btest[ -]?drive|reservar (um )?test|agendar visita\b/,
    /\bappointment\b/,
    /\bviewing\b/,
    // Zulu / isiNdebele
    /\bukuqhuba\b/,
    /\bngiqhube\b/,
    /\bngizoqhuba\b/,
    /\bngifuna ukuqhuba\b/,
    // Afrikaans
    /\btoetsrit\b/,
  ];
  return patterns.some((p) => p.test(lower));
}

export function detectsTradeInIntent(message: string): boolean {
  if (!message) return false;
  const intent = classifyShowroomIntent(message);
  if (intent === "trade_in") return true;
  const lower = message.toLowerCase();
  return /\b(trade[\s-]?in|ruil|part exchange|swap my|exchange my|ukushintsha|shintsha)\b/i.test(
    lower,
  );
}

/**
 * Pick the specialist agent. Priority: Lerato (booking) → Tumi (trade-in) →
 * Nala (showroom Q&A, 24/7 on WhatsApp and web).
 *
 * Bongi is reserved for manual fallback-inbox triggers — not auto-reply routing.
 */
export function classifyAgentRoute(input: {
  message: string;
  afterHours: boolean;
}): AgentRoute {
  const showroomIntent = classifyShowroomIntent(input.message);

  if (detectsBookingIntent(input.message) || showroomIntent === "test_drive") {
    return { agent: "lerato", intent: "test_drive" };
  }

  if (detectsTradeInIntent(input.message)) {
    return { agent: "tumi", intent: "trade_in" };
  }

  return { agent: "nala", intent: showroomIntent };
}

/** Extract a buyer name from free text when possible. */
export function extractCustomerName(message: string): string | null {
  const patterns = [
    /(?:my name is|i am|i'm|im|naam is|ngubani ngu|dit is|mijn naam is)\s+([A-Za-zÀ-ž]{2,}(?:\s+[A-Za-zÀ-ž]{2,})?)/i,
    /^([A-Za-zÀ-ž]{2,}(?:\s+[A-Za-zÀ-ž]{2,})?)\s*[,—-]\s*(?:book|test|drive|toets)/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** Web showroom chat — Lerato handoff when buyer asks to book / test drive. */
export function webLeratoHandoff(lang: LanguageCode, dealershipName: string): string {
  const templates: Partial<Record<LanguageCode, string>> = {
    en: `I'm **Lerato** at ${dealershipName}. Tap **Toetsrit** below, or tell me your name and when you'd like to visit — I'll pencil you in.`,
    af: `Ek is **Lerato** by ${dealershipName}. Tik **Toetsrit** hieronder, of stuur jou naam en wanneer jy wil kom.`,
    zu: `Ngingu-**Lerato** e-${dealershipName}. Chofoza **Toetsrit** ngezansi, noma ungazise igama nesikhathi.`,
  };
  return templates[lang] ?? templates.en!;
}
