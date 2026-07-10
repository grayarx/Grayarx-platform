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
import { generateNalaShowroomReply, generateNalaGeneralWhatsAppReply } from "./nalaShowroomLlm";
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
  /^(hi|hello|hey|howzit|howzit\?|molo|dumela|hallo|haai|good (morning|afternoon|evening)|thanks|thank you|start|menu|help|sawubona|sanibonani|avuxeni|ndaa|lotjhani|vhutshilo|xewani|thobela|lotsha)\b/i;

// ── Conversation state (in-memory, keyed by phone number) ──────────────────
type ConvStage = "greeting" | "browsing" | "vehicle_shown" | "booking" | "preapproval" | "tradein";
interface ConvState {
  stage: ConvStage;
  lang: LanguageCode;
  lastVehicleId?: number;
  lastVehicleTitle?: string;
}
const _convState = new Map<string, ConvState>();

export function getConvState(phone: string): ConvState | undefined {
  return _convState.get(phone);
}

export function setConvState(phone: string, state: ConvState): void {
  _convState.set(phone, state);
}

export function updateConvState(phone: string, patch: Partial<ConvState>): ConvState {
  const prev = _convState.get(phone) ?? { stage: "greeting", lang: "en" };
  const next = { ...prev, ...patch };
  _convState.set(phone, next);
  return next;
}

// ── CTA + greeting strings ───────────────────────────────────────────────────
const VEHICLE_CTA: Record<LanguageCode, string> = {
  en: "If you'd like to come in for a test drive, I can arrange that — just say the word. Or if you'd like to explore finance options first, I can point you in the right direction. What would you prefer?",
  af: "As jy vir 'n toetsrit wil inkom, kan ek dit vir jou reël — sê net die woord. Of as jy eers finansieringsopsies wil verken, wys ek jou graag die pad. Wat verkies jy?",
  zu: "Uma ungathanda ukuza ukuqhuba, ngingakulungisela lokho — sho nje. Noma uma ungathanda ukuhlola izindlela zezimali kuqala, ngingakukhomba indlela efanele. Ufuna ini?",
  xh: "Ukuba ungathanda ukuza uqhube, ndinokukwenzela elo — sho nje. Okanye ukuba ungathanda ukuphonononga iindlela zemali kuqala, ndinokukubonisa indlela efanele. Uthanda ntoni?",
  st: "Ha o batla ho tla ho tsamaisa, ke ka o lokisetsa — re joalo fela. Kapa ha o batla ho hlahloba diphetoho tsa lichelete pele, ke ka o bontsha tsela. O batla eng?",
  nso: "Ge o nyaka go tla go gapelela, ke ka go lokisetša — re bjalo fela. Goba ge o nyaka go lekola dikgopolo tša matlotlo pele, ke ka go bontšha tsela. O nyaka eng?",
  tn: "Fa o batla go tla go tsamaya, ke ka o lokisetsa — re jalo fela. Kgotsa fa o batla go lekola mekgwa ya madi pele, ke ka o bontsha tsela. O batla eng?",
  ts: "Loko u lava ku ta ku tshova, ndzi nga ku lulamiserela — ku huma eka xitshamiseki. Kumbe loko u lava ku lavisisa ndlela ta timali ku sungula, ndzi nga ku kombela ndlela efaneleke. U lava yini?",
  ss: "Uma ufuna kuza kuphila, ngingakulungisela lokho — sho nje. Noma uma ufuna kuhlola tindlela temali kuqala, ngingakukhombisa indlela. Ufuna ini?",
  ve: "Arali u tenda u ḓa u famba, ndi nga u lugisela zwenezwo — amba fhedzi. Kana arali u tenda u humbula nzudzanyo dza tshelede u thoma, ndi nga u sumbedza nḓila yone. U tenda u ita mini?",
  nr: "Uma ufuna ukuza ukuqhuba, ngingakulungisela lokho — sho nje. Noma uma ufuna ukuhlola izindlela zemali kuqala, ngingakukhomba indlela. Ufuna ini?",
  pt: "Se quiser vir fazer um test drive, posso tratar disso por si — é só dizer. Ou se preferir explorar as opções de financiamento primeiro, posso indicar o caminho. O que prefere?",
};

// ── Intent keyword detection ─────────────────────────────────────────────────
const TESTDRIVE_RE = /\b(1|test.?drive|toetsrit|tshova|ukuqhuba|uqhuba|rijden)\b/i;
const FINANCE_RE   = /\b(2|financ|pre.?approv|kredit|imali|tumelo|pfumelelo|ifinance|mboleko|ukukhokha|chelete|ngilungise imali|madi a mantsi)\b/i;
const BROWSE_RE    = /\b(3|browse|deals|showroom|lys|izindawo|dithekiso|nthikhelo)\b/i;
const TRADEIN_RE   = /\b(4|trade.?in|ruil|shintsha|rekiša|hoxisa|shandukisa)\b/i;
const MENU_RE      = /\b(menu|kieslys|menyu|lethathamo|emenyu|0)\b/i;

// ── Multi-vehicle search helpers ─────────────────────────────────────────────

const KNOWN_MAKES = [
  "land rover", "mercedes benz", "mercedes-benz",
  "ford", "toyota", "bmw", "mercedes", "nissan", "mazda", "kia", "hyundai",
  "honda", "chevrolet", "opel", "renault", "peugeot", "suzuki", "mitsubishi",
  "isuzu", "audi", "volvo", "jeep", "fiat", "subaru", "lexus", "jaguar",
  "mini", "porsche", "vw", "volkswagen",
];

const BODY_TYPE_GROUPS: Array<{ keywords: string[]; types: string[] }> = [
  {
    keywords: ["bakkie", "bakki", "pickup", "double cab", "single cab", "4x4 bakkie"],
    types: ["bakkie", "pickup", "double cab", "single cab"],
  },
  { keywords: ["suv", "4x4", "crossover", "4wd"], types: ["suv", "crossover"] },
  { keywords: ["sedan", "saloon"], types: ["sedan"] },
  { keywords: ["hatch", "hatchback"], types: ["hatchback"] },
  { keywords: ["mpv", "minivan", "people mover", "seven seater", "7 seater"], types: ["mpv", "minivan"] },
  { keywords: ["coupe", "coupé", "sports car", "sportscar"], types: ["coupe"] },
];

// Models that imply a body type
const BAKKIE_MODELS = ["ranger", "hilux", "amarok", "navara", "d-max", "l200", "kb", "frontier", "triton", "storm"];
const SUV_MODELS = ["fortuner", "prado", "land cruiser", "x3", "x5", "q5", "q7", "rav4", "cr-v", "tucson", "sportage", "tiguan", "discovery", "defender"];

export type VehicleRow = {
  id: number;
  title?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | string | null;
  status?: string | null;
  fuel?: string | null;
  bodyType?: string | null;
  km?: number | null;
};

/** Detect make keyword in a buyer message. Returns normalised make name or null. */
export function detectMakeFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  for (const make of KNOWN_MAKES) {
    if (lower.includes(make)) {
      if (make === "vw") return "volkswagen";
      return make;
    }
  }
  return null;
}

/** Detect body type group from a buyer message. Returns the canonical types array or null. */
export function detectBodyTypesFromMessage(message: string): string[] | null {
  const lower = message.toLowerCase();
  for (const { keywords, types } of BODY_TYPE_GROUPS) {
    if (keywords.some((kw) => lower.includes(kw))) return types;
  }
  if (BAKKIE_MODELS.some((m) => lower.includes(m))) {
    return ["bakkie", "pickup", "double cab", "single cab"];
  }
  if (SUV_MODELS.some((m) => lower.includes(m))) {
    return ["suv", "crossover"];
  }
  return null;
}

/**
 * Build a human-readable search term from what the user asked for.
 * e.g. make="ford" bodyTypes=["bakkie"] → "Ford bakkie"
 */
export function buildSearchTerm(
  make: string | null,
  bodyTypes: string[] | null,
): string {
  const parts: string[] = [];
  if (make) parts.push(make.charAt(0).toUpperCase() + make.slice(1));
  if (bodyTypes) parts.push(bodyTypes[0] ?? "");
  return parts.join(" ") || "vehicle";
}

/**
 * Find ALL available vehicles matching a make, model, year and/or body type mentioned in the message.
 * Tries to narrow by specific model/year first; falls back to broader make/bodytype search.
 * Returns them sorted by price ascending. Returns [] when no make/bodytype is detected.
 */
export function findVehiclesFromMessage(
  message: string,
  vehicles: VehicleRow[],
): VehicleRow[] {
  const available = vehicles.filter((v) => v.status === "available" || v.status == null);
  if (available.length === 0) return [];

  const lower = message.toLowerCase();
  const detectedMake = detectMakeFromMessage(message);
  const detectedBodyTypes = detectBodyTypesFromMessage(message);

  if (!detectedMake && !detectedBodyTypes) return [];

  // ── Year detection ────────────────────────────────────────────────────────
  const yearM = lower.match(/\b(19[6-9]\d|20[0-2]\d)\b/);
  const detectedYear = yearM ? parseInt(yearM[0], 10) : null;

  // ── Model detection — scan models in our actual inventory against the message ──
  let detectedModel: string | null = null;
  if (detectedMake) {
    // Only look at vehicles of this make
    const makeVehicles = available.filter((v) => {
      const vm = (v.make ?? "").toLowerCase();
      if (detectedMake === "volkswagen") return vm.includes("volkswagen") || vm.includes("vw");
      if (detectedMake === "mercedes") return vm.includes("mercedes") || vm.includes("merc");
      return vm.includes(detectedMake);
    });
    // Longest-first so "ranger raptor" beats "ranger"
    const uniqueModels = [...new Set(
      makeVehicles.map((v) => (v.model ?? "").toLowerCase().trim()).filter((m) => m.length >= 3),
    )].sort((a, b) => b.length - a.length);
    for (const m of uniqueModels) {
      if (lower.includes(m)) { detectedModel = m; break; }
    }
  }

  // ── Core vehicle match ────────────────────────────────────────────────────
  function vehicleMakeMatch(v: VehicleRow): boolean {
    if (!detectedMake) return true;
    const vm = (v.make ?? "").toLowerCase();
    const vt = (v.title ?? "").toLowerCase();
    if (detectedMake === "volkswagen") return vm.includes("volkswagen") || vm.includes("vw") || vt.includes("vw ") || vt.includes("volkswagen");
    if (detectedMake === "mercedes") return vm.includes("mercedes") || vm.includes("merc") || vt.includes("mercedes") || vt.includes("merc");
    return vm.includes(detectedMake) || vt.includes(detectedMake);
  }

  function vehicleBodyTypeMatch(v: VehicleRow): boolean {
    if (!detectedBodyTypes) return true;
    const vbt = (v.bodyType ?? "").toLowerCase();
    const vm  = (v.model ?? "").toLowerCase();
    const vt  = (v.title ?? "").toLowerCase();
    if (detectedBodyTypes.some((bt) => vbt.includes(bt))) return true;
    if (detectedBodyTypes.includes("bakkie")) return BAKKIE_MODELS.some((m) => vm.includes(m) || vt.includes(m));
    if (detectedBodyTypes.includes("suv"))    return SUV_MODELS.some((m) => vm.includes(m) || vt.includes(m));
    return false;
  }

  // Step 1: try make + specific model + year (most precise)
  if (detectedModel && detectedYear) {
    const precise = available.filter((v) =>
      vehicleMakeMatch(v) &&
      ((v.model ?? "").toLowerCase().includes(detectedModel!) || (v.title ?? "").toLowerCase().includes(detectedModel!)) &&
      v.year === detectedYear,
    );
    if (precise.length > 0) return precise.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
  }

  // Step 2: make + specific model (ignore year)
  if (detectedModel) {
    const modelResults = available.filter((v) =>
      vehicleMakeMatch(v) &&
      ((v.model ?? "").toLowerCase().includes(detectedModel!) || (v.title ?? "").toLowerCase().includes(detectedModel!)),
    );
    if (modelResults.length > 0) return modelResults.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
  }

  // Step 3: make + body type (original broad search)
  const results = available.filter((v) => vehicleMakeMatch(v) && vehicleBodyTypeMatch(v));

  // Step 4: if year only (no model), filter those results by year
  if (detectedYear && results.length > 0) {
    const yearFiltered = results.filter((v) => v.year === detectedYear);
    if (yearFiltered.length > 0) return yearFiltered.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
  }

  return results.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
}

function fmtVehicleLine(v: VehicleRow): string {
  const year = v.year ? `${v.year} ` : "";
  const title = v.title ?? `${v.make ?? ""} ${v.model ?? ""}`.trim();
  const price = v.price && Number(v.price) > 1
    ? ` — R${Math.round(Number(v.price)).toLocaleString("en-ZA")}`
    : "";
  const km = v.km ? ` (${v.km.toLocaleString("en-ZA")} km)` : "";
  // title usually already includes year prefix — only prepend if missing
  const display = title.startsWith(String(v.year ?? "")) ? title : `${year}${title}`.trim();
  return `• ${display}${price}${km}`;
}

const MULTI_VEHICLE_HEADER: Record<LanguageCode, string> = {
  en: "Here are the {searchTerm}s we currently have in stock:",
  af: "Hier is die {searchTerm}s wat ons tans in voorraad het:",
  zu: "Nansi ama-{searchTerm} esinayo esitokini manje:",
  xh: "Nanga ama-{searchTerm} esinayo kwisitoko ngoku:",
  st: "Hlalefa re na le di-{searchTerm} tse di leng teng:",
  nso: "Re na le di-{searchTerm} tše di lego gona bjale:",
  tn: "Re na le di-{searchTerm} tse di leng teng jaanong:",
  ts: "Hi na na ma-{searchTerm} lama hi nago swona sweswi:",
  ss: "Nala ema-{searchTerm} lasinawo esitokweni manje:",
  ve: "Ri na na {searchTerm} dzo re naho zwino:",
  nr: "Nansi ama-{searchTerm} esinayo esitokini manje:",
  pt: "Aqui estão os {searchTerm}s que temos em stock neste momento:",
};

const MULTI_VEHICLE_FOOTER: Record<LanguageCode, string> = {
  en: "Which one caught your eye? I can share more details, photos, or arrange a test drive for any of these!",
  af: "Watter een trek jou aandag? Ek kan meer besonderhede, foto's deel of 'n toetsrit reël!",
  zu: "Yiyiphi eyibonayo? Ngingakwabelana ngemininingwane, izithombe, noma ngilungise ukuqhuba!",
  xh: "Yeyiphi ekutsalileyo? Ndinokwabela iinkcukacha, iifoto, okanye ndihlele uqhuba!",
  st: "Ke efe e ho tsholelang? Ke ka fa dintlha, lifoto, kapa ke lulise poleiti!",
  nso: "Ke efe ye go go gogela? Ke ka go fa dintlha, diswantšho, goba ke lokiše go gapelela!",
  tn: "Ke efe e go gogetseng? Ke ka go fa dintlha, ditshwantsho, kgotsa ke lokisetse go tsamaya!",
  ts: "Xi ka mani lexi ku tsalaka? Ndzi nga ku nyika ntlhelo, tifoto, kumbe ndzi lulamisa ku tshova!",
  ss: "Yikuphi lokukutsalelako? Ngingakupha imininingwane, tifoto, noma ngilungise kuphila!",
  ve: "I nnyi ine ya u koka? Ndi nga u nea mafhungo, zwifanyiso, kana ndi lugisele u famba!",
  nr: "Yiyiphi eyikubonayo? Ngingakwabelana ngemininingwane, izithombe, noma ngilungise ukuqhuba!",
  pt: "Qual lhe chamou a atenção? Posso partilhar mais detalhes, fotos ou marcar um test drive!",
};

const NO_MATCH_HEADER: Record<LanguageCode, string> = {
  en: "Unfortunately we don't have any {searchTerm} in stock right now 😕\n\nBut we do have some great alternatives that might interest you:",
  af: "Ongelukkig het ons tans geen {searchTerm} in voorraad nie 😕\n\nMaar ons het 'n paar goeie alternatiewe wat jou dalk kan interesseer:",
  zu: "Nxamalala! Asinaye {searchTerm} esitokini njengamanje 😕\n\nKepha sinezinye izinketho ezinhle:",
  xh: "Nxamalala! Asina {searchTerm} kwisitoko ngoku 😕\n\nKepha sinezinye iindlela ezilungileyo:",
  st: "Ka maswabi! Ha re na di-{searchTerm} tse leng teng 😕\n\nEmpa re na le tse ding tse molemo:",
  nso: "Ka boikokobetšo! Re se na di-{searchTerm} tše gona bjale 😕\n\nFela re na le ditshwetšo tše dingwe tše ntle:",
  tn: "Ka boikokobetso! Ga re na di-{searchTerm} tse di leng teng jaanong 😕\n\nFela re na le ditshwetso tse dingwe tse di molemo:",
  ts: "Ndzi nyondzela! A hi na {searchTerm} sweswi 😕\n\nKumbe hi na swirho swin'wana leswi a swi nene:",
  ss: "Siyaxolisa! Asinaso {searchTerm} kwesitoko nyalo 😕\n\nKepha sinezinye tindlela letinhle:",
  ve: "Ndi zwi humbula! A ri na {searchTerm} zwino 😕\n\nFhedzi ri na zwikhetho zwinwe zwavhudi:",
  nr: "Nxamalala! Asinaye {searchTerm} esitokini njengamanje 😕\n\nKepha sinezinye izinketho ezinhle:",
  pt: "Infelizmente não temos nenhum {searchTerm} em stock neste momento 😕\n\nMas temos ótimas alternativas que podem interessar:",
};

const NO_MATCH_FOOTER: Record<LanguageCode, string> = {
  en: "Would any of these work for you?",
  af: "Sou enige van hierdie vir jou werk?",
  zu: "Ngabe noma iyiphi yalezi ingakusebenzela?",
  xh: "Ingaba nayiphi enokusebenzela?",
  st: "Kapa efe ho ka sebetsa ho wena?",
  nso: "Naa efe ya dilo tše e ka go šomela?",
  tn: "A efe mo go kgonago go go thusa?",
  ts: "Xana xi ka mani xa swirho leswi xi tiko ku ku pfuna?",
  ss: "Ingabe noma yikuphi kwalapha kungakusita?",
  ve: "Kana i nnyi ya idzwi idzi i ngo u thusa?",
  nr: "Ingabe noma iyiphi yalezi ingakusebenzela?",
  pt: "Alguma destas funcionaria para si?",
};

/**
 * Build a multi-vehicle list reply for when 2+ vehicles match the search.
 */
export function buildMultiVehicleReply(
  vehicles: VehicleRow[],
  searchTerm: string,
  lang: LanguageCode,
  _dealershipName: string,
): string {
  const header = (MULTI_VEHICLE_HEADER[lang] ?? MULTI_VEHICLE_HEADER.en).replace(
    "{searchTerm}", searchTerm,
  );
  const footer = MULTI_VEHICLE_FOOTER[lang] ?? MULTI_VEHICLE_FOOTER.en;
  const lines = vehicles.slice(0, 6).map(fmtVehicleLine);
  return `${header}\n\n${lines.join("\n")}\n\n${footer}`;
}

/**
 * Build a no-match fallback reply with alternative vehicles.
 */
export function buildNoMatchFallbackReply(
  searchTerm: string,
  alternatives: VehicleRow[],
  lang: LanguageCode,
): string {
  const header = (NO_MATCH_HEADER[lang] ?? NO_MATCH_HEADER.en).replace(
    "{searchTerm}", searchTerm,
  );
  const footer = NO_MATCH_FOOTER[lang] ?? NO_MATCH_FOOTER.en;
  const lines = alternatives.slice(0, 5).map(fmtVehicleLine);
  if (lines.length === 0) {
    return header.split("\n\n")[0] ?? header;
  }
  return `${header}\n\n${lines.join("\n")}\n\n${footer}`;
}

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
  // Require a meaningful match — score < 5 means only short/generic words matched
  // (e.g. "car", "have", "much") which are not specific enough to identify a vehicle.
  if (!best || best.score < 5) return null;
  return best.v;
}

export function buildNoVehicleWhatsAppReply(
  message: string,
  lang: LanguageCode,
  siteUrl: string,
  topMatches: Array<{ title: string; price?: number | string | null }> = [],
  dealershipName = "GrayArx",
  phone?: string,
): string {
  const state = phone ? getConvState(phone) : undefined;
  const effectiveLang = state?.lang ?? lang;

  // ── Back to menu ────────────────────────────────────────────────────────
  if (MENU_RE.test(message.trim())) {
    if (phone) updateConvState(phone, { stage: "browsing", lang: effectiveLang });
    return buildMenuReply(effectiveLang, dealershipName, topMatches);
  }

  // ── Number/keyword CTA routing ──────────────────────────────────────────
  // Only route if the message is SHORT (numeric shortcut, not a car name)
  const isShort = message.trim().length < 40;

  if (isShort && TESTDRIVE_RE.test(message)) {
    if (phone) updateConvState(phone, { stage: "booking", lang: effectiveLang });
    const vehicleHint = state?.lastVehicleTitle ? ` the *${state.lastVehicleTitle}*` : "";
    return effectiveLang === "af"
      ? `Uitstekend! Watter datum en tyd werk vir jou vir die toetsrit${vehicleHint}?\n\nOf bespreek aanlyn: ${siteUrl}/showroom`
      : effectiveLang === "zu"
        ? `Kuhle! Yisiphi isikhathi esihamba kahle wena ukubhukha ukuqhuba${vehicleHint}?\n\nNoma bhukha: ${siteUrl}/showroom`
        : `Great choice! What date and time works for your test drive${vehicleHint}?\n\nOr book online: ${siteUrl}/showroom`;
  }

  if (isShort && FINANCE_RE.test(message)) {
    if (phone) updateConvState(phone, { stage: "preapproval", lang: effectiveLang });
    return effectiveLang === "af"
      ? `Kom ons kry jou vooraf goedgekeur! 💳\n\nBegin hier: ${siteUrl}/finance\n\nOf stuur my jou maandelikse inkomste en ek sal 'n skatting gee.`
      : effectiveLang === "zu"
        ? `Ake sikutholele imvume yangaphambili! 💳\n\nQala lapha: ${siteUrl}/finance\n\nNoma ngilethele ingeniso yakho yanyanga zonke ngikupha isibalo.`
        : `Let's get you pre-approved! 💳\n\nStart here: ${siteUrl}/finance\n\nOr send me your monthly income and I'll give you an estimate.`;
  }

  if (isShort && TRADEIN_RE.test(message)) {
    if (phone) updateConvState(phone, { stage: "tradein", lang: effectiveLang });
    return effectiveLang === "af"
      ? `Kry jou ruilwaarde! 🔄\n\nKosteloos skatting: ${siteUrl}/trade-in\n\nOf stuur: merk, model, jaar en kilometer.`
      : effectiveLang === "zu"
        ? `Thola intengo yokuguqulela! 🔄\n\nIsibalo samahhala: ${siteUrl}/trade-in\n\nNoma thumela: uhlobo, imodeli, unyaka ne-km.`
        : `Get your trade-in value! 🔄\n\nFree estimate: ${siteUrl}/trade-in\n\nOr send: make, model, year and km.`;
  }

  if (isShort && BROWSE_RE.test(message)) {
    if (phone) updateConvState(phone, { stage: "browsing", lang: effectiveLang });
    const dealsHeader = DEALS_LABEL[effectiveLang] ?? DEALS_LABEL.en;
    let reply = `${dealsHeader}\n`;
    const lines = topMatches.slice(0, 3).map((v) => {
      const price = v.price != null && Number(v.price) > 1
        ? ` — R${Math.round(Number(v.price)).toLocaleString("en-ZA")}` : "";
      return `• ${v.title}${price}`;
    });
    reply += lines.join("\n");
    reply += `\n\n${siteUrl}/showroom?sort=best_deals`;
    const browsePrompt: Record<LanguageCode, string> = {
      en: "\n\nSee something you like? Just tell me which one and I'll share all the details!",
      af: "\n\nSien jy iets wat jy wil hê? Sê net watter een en ek deel al die besonderhede!",
      zu: "\n\nUbona into oyithandayo? Ngitshele ukuthi yiyiphi bese ngikupha yonke imininingwane!",
      xh: "\n\nUbona into oyithandayo? Ndixelele eyiphi baze ndikwabele onke amaxwebhu!",
      st: "\n\nO bona se o se ratang? Mpolele se seng le se seng mme ke tla u fa dintlha tsohle!",
      nso: "\n\nO bona se o se ratago? Mpolele seo mme ke tla go fa dintlha tsohle!",
      tn: "\n\nO bona se o se ratang? Mpolele se le se mme ke tla go fa dintlha tsotlhe!",
      ts: "\n\nU vona xin'wana u xi lavaka? Ndzi hlamusela lexi mme ndzi tiku endlela ntlhelo yinharhu!",
      ss: "\n\nUbona into loyithandako? Ngikhulumele leyo bese ngikupha yonkhe imininingwane!",
      ve: "\n\nU wana zwiṅwe zwine u zwi funa? Mbolele izwi mme ndi do u nea mafhungo othe!",
      nr: "\n\nUbona into oyithandayo? Ngitshele ukuthi yiyiphi bese ngikupha yonke imininingwane!",
      pt: "\n\nViu algo de que gosta? É só me dizer qual e eu partilho todos os detalhes!",
    };
    reply += browsePrompt[effectiveLang] ?? browsePrompt.en;
    return reply;
  }

  // ── First contact / greeting ─────────────────────────────────────────────
  if (!state || GREETING_RE.test(message.trim())) {
    if (phone) updateConvState(phone, { stage: "browsing", lang: effectiveLang });
    return buildMenuReply(effectiveLang, dealershipName, topMatches);
  }

  // ── Income / salary declaration → treat as finance intent ───────────────
  const INCOME_RE = /\b(inkomso|income|salary|verdien|maandel|per month|p\/m\b|menslik|ngenyanga|ka kgwedi|ka nako|r\s*\d{4,}|earn|monthly)\b/i;
  if (INCOME_RE.test(message)) {
    if (phone) updateConvState(phone, { stage: "preapproval", lang: effectiveLang });
    return effectiveLang === "af"
      ? `Klink goed! 💳 Kom ons kry jou vooraf goedgekeur.\n\nBegin hier: ${siteUrl}/finance\n\nOf stuur my jou maandelikse inkomste en ek sal 'n skatting gee.`
      : effectiveLang === "zu"
        ? `Kuhle! 💳 Ake sikutholele imvume yangemali.\n\nQala lapha: ${siteUrl}/finance\n\nNoma ngilethele ingeniso yakho yanyanga zonke ngikupha isibalo.`
        : `Sounds good! 💳 Let's get you pre-approved for finance.\n\nStart here: ${siteUrl}/finance\n\nOr share your monthly income and I'll give you an estimate.`;
  }

  // ── Unknown input — invite them to share more ────────────────────────────
  const FALLBACK_REPLY: Record<LanguageCode, string> = {
    en: "I'm not sure I understood that — could you tell me a bit more about what you're looking for? Whether it's a specific car, financing, a trade-in, or just browsing — I'm happy to help!",
    af: "Ek is nie seker ek het dit verstaan nie — kan jy my 'n bietjie meer vertel oor waarna jy soek? Of dit 'n spesifieke motor is, finansiering, 'n ruiltransaksie, of net blaai — ek help graag!",
    zu: "Angiqiniseki ukuthi ngikuzwile — ungangitshela okwengeziwe ngalokho okufunayo? Noma ingabe imoto ethile, imali, ukuguqulela, noma ukubheka nje — ngijabule ukukusiza!",
    xh: "Andiqinisekanga ukuba ndikuva kakuhle — ungandixelela okungakumbi ngento oyifunayo? Nokuba yimoto ethile, imali, ukutshintsha, okanye nje ukujonga — ndivuya ukukunceda!",
    st: "Ha ke tsebe hantle se o se bolelang — na o ka mpolela haholoanyane ka se o se batlang? Nokha e le koloi e itseng, lichelete, ho rekiša kapa ho sheba feela — ke thabile ho o thusa!",
    nso: "Ga ke kwišiše gabotse — na o ka mpolela go feta ka se o se nyakago? Ge e le koloi ye itšego, matlotlo, go rekiša goba go lebelela feela — ke thabile go go thuša!",
    tn: "Ga ke tlhaloganye sentle — a o ka mpolela go feta ka se o se batlang? Le fa e le koloi e itseng, madi, go rekisa kgotsa go lebelela fela — ke thabile go go thusa!",
    ts: "A ndzi twisisi kahle — xana u nga ndzi hlamusela hamore hi leswi u lavaka swona? Loko e ri xitirho lexinene, timali, ku hoxisa kgotsa ku tlakusa fela — ndzi tsakile ku ku pfuna!",
    ss: "Angiqiniseki ukuthi ngikulalele — ungangitjela ngalokho okufunako? Noma imoto lekhetsekile, imali, ukugucula noma ukubheka nje — ngijabule kukusita!",
    ve: "A ndi zwi pfesese zwavhudi — uri ndi u dovha u mbolela nga zwine u zwi toda? Naho e khathini yone, tshelede, u shandukisa kana u vhona fhedzi — ndi a fhafha u u thusa!",
    nr: "Angiqiniseki ukuthi ngikuzwile — ungangitshela okwengeziwe ngalokho okufunayo? Noma imoto ethile, imali, ukuguqulela noma ukubheka nje — ngijabule ukukusiza!",
    pt: "Não tenho a certeza que percebi — pode dizer-me um pouco mais sobre o que procura? Seja um carro específico, financiamento, troca ou só a explorar — fico feliz em ajudar!",
  };
  return FALLBACK_REPLY[effectiveLang] ?? FALLBACK_REPLY.en;
}

const GREETING_INTRO: Record<LanguageCode, string> = {
  en: "Hi there! 👋 Welcome to {dealership} — I'm Nala, and I'm here to help you find your perfect car.\n\nAre you looking for something specific, or would you like me to show you some of our best deals? I can also help with trade-ins or arranging finance — just let me know what's on your mind!",
  af: "Hallo! 👋 Welkom by {dealership} — ek is Nala, en ek is hier om jou te help om jou perfekte motor te vind.\n\nSoek jy iets spesifieks, of wil jy hê ek wys jou van ons beste aanbiedings? Ek kan ook help met ruiltransaksies of finansiering — laat my net weet wat op jou gedagtes is!",
  zu: "Sawubona! 👋 Siyakwamukela ku-{dealership} — ngingu-Nala, futhi ngilapha ukukusiza ukuthola imoto yakho ephelele.\n\nUfuna into ethile, noma ungathanda ukubona izivumelwano zethu ezihamba phambili? Ngingasiza futhi nge-trade-in noma imali — ngitshele nje ukuthi kukhona ini engqondweni yakho!",
  xh: "Molo! 👋 Siyakwamkela e-{dealership} — ndingu-Nala, kwaye ndilapha ukukunceda ukufumana imoto yakho epheleleyo.\n\nUfuna into ethile, okanye ungathanda ukubona iindawo zethu ezihamba phambili? Ndinakho ukukunceda ngokutshintsha okanye imali — nditshele nje ukuba kukho ntoni engqondweni yakho!",
  st: "Dumela! 👋 Re a o amohela ho {dealership} — ke Nala, mme ke here ho o thusa ho fumana koloi ya hao e kantle.\n\nO batla se seng se ikgethang, kapa o batla nna ke o bontše dithekiso tsa rona tse ntle? Ke ka o thusa le ka ho rekiša koloi ya hao kapa lichelete — mpolele feela se o nahanang ka sona!",
  nso: "Dumela! 👋 Re a go amogela go {dealership} — ke Nala, ke gona go go thuša go hwetša koloi ya gago ye ntle.\n\nO nyaka se sengwe se ikgethago, goba o nyaka ke go bontšhe dithekišo tša rena tše kaone? Ke ka go thuša le ka go rekiša koloi ya gago goba matlotlo — mpolele fela se o naganago ka sona!",
  tn: "Dumela! 👋 Re a go amogela kwa {dealership} — ke Nala, mme ke fa go go thusa go bona koloi ya gago e siameng.\n\nO batla se sengwe se ikgethang, kgotsa o batla ke go bontsha dithekiso tsa rona tse di molemo? Ke ka go thusa le ka go rekisa koloi ya gago kgotsa madi — mpolele fela se o nalanang le sona!",
  ts: "Xewani! 👋 Hi ku amukela eka {dealership} — ndzi Nala, mme ndzi fana ku ku pfuna ku kuma xitirho xa wena lexikatsongo.\n\nU lava xin'wana lexinene, kumbe u lava ndzi ku kombele switirhisiwa swa hina leswi a swi nene? Ndzi nga ku pfuna na ka ku hoxisa xitirho ku sungula kumbe timali — ndzi hlamusela fela leswi u nakanaka ha swona!",
  ss: "Sawubona! 👋 Siyakwamukela ku-{dealership} — ngingu-Nala, futhi ngilapha ukukusita utfole imoto yakho lepheleleko.\n\nUfuna into leyithile, noma ungathanda ukubona tivumelwano letinhle ta lethu? Ngingasita futhi ngekulungisa imoto yakho ngemali — ngikhulumele nje kutsi kukhona ini engqondweni yakho!",
  ve: "Vhutshilo! 👋 Ri a u taka vhukuma kha {dealership} — ndi Nala, mme ndi hone u u thusa u wana khathini ya hawe yone.\n\nU toda zwiṅwe zwi re hone, kana u tenda ndi u sumbedze zwine zwa vha zwi nnzhi? Ndi nga u thusa na nga u shandukisa khathini ya hawe kana tshelede — mbolele fhedzi zwine wa humbula nga zwone!",
  nr: "Sawubona! 👋 Siyakwamukela ku-{dealership} — ngingu-Nala, futhi ngilapha ukukusiza ukuthola imoto yakho ephelele.\n\nUfuna into ethile, noma ungathanda ukubona izivumelwano zethu ezihamba phambili? Ngingasiza futhi nge-trade-in noma imali — ngitshele nje ukuthi kukhona ini engqondweni yakho!",
  pt: "Olá! 👋 Bem-vindo à {dealership} — sou a Nala, e estou aqui para ajudá-lo a encontrar o seu carro perfeito.\n\nEstá à procura de algo específico, ou gostaria que eu mostrasse algumas das nossas melhores ofertas? Também posso ajudar com troca ou financiamento — é só me dizer o que tem em mente!",
};

const DEALS_LABEL: Record<LanguageCode, string> = {
  en: "🔥 Some of our best deals right now:",
  af: "🔥 Van ons beste aanbiedings tans:",
  zu: "🔥 Ezinye zezivumelwano zethu ezihamba phambili manje:",
  xh: "🔥 Ezinye zeendawo zethu ezihamba phambili ngoku:",
  st: "🔥 Tse ding tsa dithekiso tsa rona tse ntle hona jwale:",
  nso: "🔥 Tše dingwe tša dithekišo tša rena tše kaone hona bjale:",
  tn: "🔥 Dingwe tsa dithekiso tsa rona tse di molemo jaanong:",
  ts: "🔥 Swin'wana swa switirhisiwa swa hina leswi a swi nene sweswi:",
  ss: "🔥 Letinye tivumelwano letinhle ta lethu nyalo:",
  ve: "🔥 Zwiṅwe zwine zwa vha zwi nnzhi zwavho zwino:",
  nr: "🔥 Ezinye zezivumelwano zethu ezihamba phambili manje:",
  pt: "🔥 Algumas das nossas melhores ofertas agora:",
};

function buildMenuReply(
  lang: LanguageCode,
  dealershipName: string,
  topMatches: Array<{ title: string; price?: number | string | null }>,
): string {
  const template = GREETING_INTRO[lang] ?? GREETING_INTRO.en;
  let reply = template.replace("{dealership}", dealershipName);

  if (topMatches.length > 0) {
    const lines = topMatches.slice(0, 3).map((v) => {
      const price = v.price != null && Number(v.price) > 1
        ? ` — R${Math.round(Number(v.price)).toLocaleString("en-ZA")}` : "";
      return `• ${v.title}${price}`;
    });
    reply += `\n\n${DEALS_LABEL[lang] ?? DEALS_LABEL.en}\n${lines.join("\n")}`;
  }

  return reply;
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
  phone?: string;
}): Promise<{
  reply: string;
  language: LanguageCode;
  intent: string;
  answered: boolean;
  source: "template" | "llm";
  isBookingIntent: boolean;
}> {
  const phone = input.phone;
  const state = phone ? getConvState(phone) : undefined;

  // Lock language to first detection — don't re-detect on every message
  let lang: LanguageCode;
  if (state?.lang) {
    lang = state.lang;
  } else {
    lang = input.language ?? detectLanguage(input.message);
    if (phone) updateConvState(phone, { stage: state?.stage ?? "greeting", lang });
  }

  const isBookingIntent = detectsBookingIntent(input.message);
  const siteUrl = (process.env.APP_URL || "https://www.grayarx.com").replace(/\/+$/, "");

  if (!input.vehicle?.title) {
    const templateFallback = buildNoVehicleWhatsAppReply(
      input.message,
      lang,
      siteUrl,
      input.inventoryHints ?? [],
      input.dealershipName,
      phone,
    );

    // WhatsApp: LLM-polished Nala reply 24/7 (falls back to template if OpenAI unavailable)
    if (input.channel === "whatsapp") {
      try {
        const llm = await generateNalaGeneralWhatsAppReply({
          language: lang,
          customerMessage: input.message,
          dealershipName: input.dealershipName,
          templateReply: templateFallback,
          inventoryHints: input.inventoryHints,
        });
        const reply = addWhatsAppAIDisclosure(
          stripMarkdownForWhatsApp((llm.reply.trim() || templateFallback).trim()),
          lang,
        );
        return {
          reply,
          language: lang,
          intent: "general",
          answered: Boolean(llm.reply.trim()),
          source: llm.reply.trim() ? "llm" : "template",
          isBookingIntent,
        };
      } catch (e) {
        console.warn("[nalaReplyOrchestrator] General WhatsApp LLM failed — using template", e);
      }
    }

    return {
      reply: input.channel === "whatsapp" ? addWhatsAppAIDisclosure(templateFallback, lang) : templateFallback,
      language: lang,
      intent: "general",
      answered: false,
      source: "template",
      isBookingIntent,
    };
  }

  // Track vehicle state for this conversation
  if (phone && input.vehicle?.title) {
    updateConvState(phone, { stage: "vehicle_shown", lang, lastVehicleTitle: input.vehicle.title });
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

  const appendVehicleCTA = (text: string): string => {
    if (input.channel !== "whatsapp") return text;
    const cta = VEHICLE_CTA[lang] ?? VEHICLE_CTA.en;
    return `${text}\n\n─────────────\n${cta}`;
  };

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
    if (input.includeDealScore !== false && (heuristic.intent === "price" || heuristic.intent === "availability")) {
      reply = appendDealScoreToReply(reply, input.vehicle, lang);
    }
    if (input.channel === "whatsapp") {
      reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
    }
    reply = appendVehicleCTA(reply);
    return {
      reply,
      language: lang,
      intent: heuristic.intent,
      answered: heuristic.answered,
      source: llm.reply.trim() ? "llm" : "template",
      isBookingIntent,
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.warn(`[nalaReplyOrchestrator] LLM failed (${reason}) — using template`);
    let reply = polishNalaReply(heuristic.reply, lang);
    if (input.includeDealScore !== false && heuristic.intent === "price") {
      reply = appendDealScoreToReply(reply, input.vehicle, lang);
    }
    if (input.channel === "whatsapp") {
      reply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(reply), lang);
    }
    reply = appendVehicleCTA(reply);
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
