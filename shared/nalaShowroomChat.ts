/**
 * Nala showroom chat — vehicle Q&A in all 11 SA official languages + Portuguese.
 */

import {
  type LanguageCode,
  detectLanguage,
} from "./languages";
import { normalizeBuyerMessage, polishedNalaText } from "./nalaGrammarPolish";
import {
  GREETING,
  PROMPT_ASK_EMAIL,
  PROMPT_ASK_NAME,
  PROMPT_ASK_PHONE,
  PROMPT_FOLLOW_UP,
  PROMPT_THANKS_ENQUIRY,
  REPLY_AVAILABILITY,
  REPLY_COLOR_KNOWN,
  REPLY_COLOR_UNKNOWN,
  REPLY_FINANCE,
  REPLY_FUEL,
  REPLY_GENERAL,
  REPLY_KM,
  REPLY_LOCATION_KNOWN,
  REPLY_LOCATION_UNKNOWN,
  REPLY_PRICE,
  REPLY_TEST_DRIVE,
  REPLY_TRADE_IN,
  REPLY_TRANSMISSION,
  replyNeedsNameCapture,
} from "./nalaTranslations";

export type ShowroomLang = LanguageCode;
export { detectLanguage, detectLanguage as detectShowroomLanguage };

export type VehicleChatContext = {
  title: string;
  year?: number;
  price?: number;
  km?: number;
  fuel?: string;
  transmission?: string;
  location?: string;
  color?: string | null;
  make?: string;
  model?: string;
  description?: string | null;
};

export function formatVehicleDisplayName(year: number | undefined, title: string): string {
  const trimmed = title.trim();
  if (!year || year <= 0) return trimmed;
  const yearStr = String(year);
  if (trimmed.startsWith(yearStr)) return trimmed;
  if (new RegExp(`\\b${yearStr}\\b`).test(trimmed)) return trimmed;
  return `${yearStr} ${trimmed}`;
}

type Intent =
  | "color"
  | "price"
  | "km"
  | "fuel"
  | "transmission"
  | "location"
  | "test_drive"
  | "finance"
  | "trade_in"
  | "availability"
  | "general";

/** Multilingual intent keywords — order matters (first match wins) */
const INTENT_KEYWORDS: Record<Exclude<Intent, "general">, string[]> = {
  color: [
    "colour", "color", "kleur", "kleer", "kleere", "umbala", "mmala", "muvala", "what colour", "watse kleur",
    "wat kleur", "watter kleur", "kleur van", "van kar", "kom hy in", "kom dit in",
    "ngiyiphi umbala", "yintoni umbala", "mmala ke eng", "mmala ke ofe",
    "cor", "qual cor", "het julle hom in", "het julle dit in",
  ],
  price: [
    "price", "prys", "cost", "how much", "hoeveel", "intengo", "theko", "ixabiso", "poa",
    "r ", "rand", "malini", "zongakanani", "quanto custa", "preço", "preco",
  ],
  km: [
    "km", "kilometer", "mileage", "odometer", "kilometers", "hoeveel km", "amakhilomitha",
    "iikhilomitha", "dikilomithara",
  ],
  fuel: [
    "fuel", "petrol", "diesel", "hybrid", "electric", "brandstof", "petrol", "mafuta",
    "mofuta", "combustível", "combustivel",
  ],
  transmission: [
    "transmission", "automatic", "manual", "gearbox", "rat", "outomaties", "handrat",
    "gear", "automatiese", "caixa", "câmbio",
  ],
  location: [
    "where", "location", "waar", "ligging", "kuphi", "apho", "kae", "dealership", "branch",
    "indawo", "lefelo", "fhethu", "onde", "localização",
  ],
  test_drive: [
    "test drive", "testdrive", "toetsrit", "drive", "book", "appointment", "viewing",
    "come see", "ukushayela", "ho leka", "go leka", "prova", "test drive",
  ],
  finance: [
    "finance", "pre-approval", "pre approval", "loan", "instalment", "finansiering",
    "goedgekeur", "imali", "mali", "lichelete", "financiamento", "parcela",
    // Zulu / isiNdebele / Sesotho / Setswana
    "ngifuna ifinance", "ifinance", "mboleko", "ngilungise imali", "tumelo", "ukukhokha",
    "chelete", "madi", "tšhelete",
  ],
  trade_in: [
    "trade in", "trade-in", "tradein", "ruil", "exchange", "swap", "part exchange",
    "shintsha", "ukushintsha", "financiamento troca",
    // Zulu / Afrikaans / isiNdebele / Sesotho
    "thengisa imoto", "ukuthengisa", "inruil",
  ],
  availability: [
    "available", "still for sale", "in stock", "beskikbaar", "iyatholakala", "fumaneha",
    "disponível", "disponivel", "still have", "still there", "is it sold", "sold already",
    "on the floor", "still on the lot",
  ],
};

function matchesIntent(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export function classifyShowroomIntent(text: string): Intent {
  const normalized = normalizeBuyerMessage(text);
  const order: Exclude<Intent, "general">[] = [
    "color", "price", "km", "fuel", "transmission", "location",
    "test_drive", "finance", "trade_in", "availability",
  ];
  for (const intent of order) {
    if (matchesIntent(normalized, INTENT_KEYWORDS[intent])) return intent;
  }
  if (/\b(kleur|kleer|colour|color|umbala|mmala|muvala|cor)\b/i.test(normalized)) {
    return "color";
  }
  return "general";
}

function fmtPrice(price: number | undefined): string {
  if (price == null || !Number.isFinite(price) || price <= 1) return "POA";
  return `R ${Math.round(price).toLocaleString("en-ZA")}`;
}

function fmtKm(km: number | undefined): string {
  if (km == null || !Number.isFinite(km)) return "—";
  return `${km.toLocaleString("en-ZA")} km`;
}

function vehicleVars(vehicle: VehicleChatContext): Record<string, string> {
  const name = formatVehicleDisplayName(vehicle.year, vehicle.title);
  return {
    name,
    color: vehicle.color?.trim() ?? "",
    price: fmtPrice(vehicle.price),
    km: fmtKm(vehicle.km),
    fuel: vehicle.fuel ?? "—",
    transmission: vehicle.transmission ?? "—",
    location: vehicle.location ?? "",
  };
}

export function getLocalizedPrompt(
  key: "askName" | "askEmail" | "askPhone" | "followUp",
  lang: LanguageCode,
): string {
  const map = {
    askName: PROMPT_ASK_NAME,
    askEmail: PROMPT_ASK_EMAIL,
    askPhone: PROMPT_ASK_PHONE,
    followUp: PROMPT_FOLLOW_UP,
  };
  return polishedNalaText(lang, map[key]);
}

export function thanksForEnquiry(
  lang: LanguageCode,
  name: string,
  dealership: string,
  vehicle: VehicleChatContext,
): string {
  return polishedNalaText(lang, PROMPT_THANKS_ENQUIRY, {
    name,
    dealership,
    vehicle: formatVehicleDisplayName(vehicle.year, vehicle.title),
  });
}

export function answerShowroomQuestion(
  vehicle: VehicleChatContext,
  question: string,
  lang: LanguageCode = detectLanguage(question),
): { answered: boolean; reply: string; intent: Intent; language: LanguageCode } {
  const normalized = normalizeBuyerMessage(question);
  const intent = classifyShowroomIntent(normalized);
  const v = vehicleVars(vehicle);

  switch (intent) {
    case "color":
      return {
        answered: true,
        intent,
        language: lang,
        reply: vehicle.color?.trim()
          ? polishedNalaText(lang, REPLY_COLOR_KNOWN, v)
          : polishedNalaText(lang, REPLY_COLOR_UNKNOWN, v),
      };
    case "price":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_PRICE, v) };
    case "km":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_KM, v) };
    case "fuel":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_FUEL, v) };
    case "transmission":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_TRANSMISSION, v) };
    case "location":
      return {
        answered: true,
        intent,
        language: lang,
        reply: vehicle.location?.trim()
          ? polishedNalaText(lang, REPLY_LOCATION_KNOWN, v)
          : polishedNalaText(lang, REPLY_LOCATION_UNKNOWN, v),
      };
    case "test_drive":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_TEST_DRIVE, v) };
    case "finance":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_FINANCE, v) };
    case "trade_in":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_TRADE_IN, v) };
    case "availability":
      return { answered: true, intent, language: lang, reply: polishedNalaText(lang, REPLY_AVAILABILITY, v) };
    default:
      return {
        answered: false,
        intent,
        language: lang,
        reply: polishedNalaText(lang, REPLY_GENERAL, v),
      };
  }
}

export function greetingForVehicle(
  vehicle: VehicleChatContext,
  dealershipName: string,
  lang: LanguageCode = "en",
  agentDisplayName = "Nala",
): string {
  const name = formatVehicleDisplayName(vehicle.year, vehicle.title);
  const price = fmtPrice(vehicle.price);
  const km = vehicle.km != null ? `${(vehicle.km / 1000).toFixed(0)}k km` : "—";
  const specs = `${km}, ${vehicle.fuel ?? "—"}, ${vehicle.transmission ?? "—"}`;
  const base = polishedNalaText(lang, GREETING, { dealership: dealershipName, name, price, specs });
  const popia =
    lang === "af"
      ? `\n\n_Deur te gesels stem jy in dat ons jou boodskappe verwerk om hierdie navraag te help (POPIA). ${agentDisplayName} is 'n KI-assistent._`
      : `\n\n_By chatting you agree we may process your messages to help with this enquiry (POPIA). ${agentDisplayName} is an AI assistant._`;
  return `${base}${popia}`;
}

export { replyNeedsNameCapture };
export { getFlowPrompt, isSkipReply, type FlowPromptKey } from "./nalaFlowTranslations";

/** Structured facts for LLM context — never invent beyond this */
export function buildVehicleFactsBlock(vehicle: VehicleChatContext): string {
  const v = vehicleVars(vehicle);
  return [
    `Vehicle: ${v.name}`,
    `Price: ${v.price}`,
    `Mileage: ${v.km}`,
    `Fuel: ${v.fuel}`,
    `Transmission: ${v.transmission}`,
    `Colour: ${v.color || "not on file"}`,
    `Location: ${v.location || "not on file"}`,
    vehicle.description ? `Notes: ${vehicle.description.slice(0, 300)}` : "",
  ].filter(Boolean).join("\n");
}
