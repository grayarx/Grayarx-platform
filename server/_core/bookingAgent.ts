/**
 * Lerato — the Booking Agent.
 *
 * Owns the test-drive calendar from the customer side. Lerato:
 *   - acknowledges the request warmly in the customer's language,
 *   - suggests the next in-business-hours slot if the asked-for slot is
 *     after-hours, on a Sunday, or in the past,
 *   - hands the customer a unique reference number (shared `GA-` format with
 *     Bongi/Naledi for consistency),
 *   - never *confirms* the slot autonomously — humans flip status to
 *     `confirmed` from the dealer admin page.
 *
 * Used by:
 *   - public website booking page (`/book/:shortcode`),
 *   - showroom "Book a test drive" CTA on each vehicle,
 *   - inbound WhatsApp messages routed by Nala when the intent is a booking,
 *   - dealer admin "manual log" button.
 *
 * The actual delivery (sending email/WhatsApp confirmations) is the job of
 * the channel agents (Mia/Nala); Lerato only drafts the reply, generates the
 * reference, suggests a slot, and returns a clean object the router persists.
 *
 * The module stays pure (no DB writes) so it's trivially unit-testable.
 */
import { invokeLLM } from "./llm";
import { generateReferenceNumber, isAfterHoursSAST } from "./fallbackAgent";
import {
  ALL_LANGUAGE_CODES,
  isLanguageCode,
  type LanguageCode,
} from "../../shared/languages";

export type BookingChannel = "website" | "whatsapp" | "call" | "web_chat";

export interface BookingInput {
  customerName: string;
  customerContact: string; // email OR phone — caller decides which channel
  channel: BookingChannel;
  inboundMessage?: string | null;
  vehicleTitle?: string | null; // optional — when wired from Showroom CTA
  // ISO8601 string OR Date OR utc-ms number. We normalise to Date below.
  requestedSlotStart?: string | Date | number | null;
  requestedSlotEnd?: string | Date | number | null;
  language?: string;
  dealershipName?: string | null;
  /** Per-dealership business-hours override (see fallbackAgent). */
  businessHoursOverride?: unknown;
  /**
   * Already-pencilled-in / confirmed booking windows the suggester must avoid.
   * The router populates this from the test_drive_bookings table for the
   * same dealership (and same vehicle when one is set).
   */
  existingWindows?: ReadonlyArray<BookingWindow>;
}

export interface BookingOutput {
  referenceNumber: string;
  outboundReply: string;
  language: LanguageCode;
  /** Whatever the customer asked for, normalised. */
  requestedSlotStart: Date | null;
  requestedSlotEnd: Date | null;
  /** What Lerato proposed back. May equal the requested slot. */
  suggestedSlotStart: Date;
  suggestedSlotEnd: Date;
  /**
   * Whether the suggestion differs from the request because the request was
   * after-hours / Sunday / in the past. Lets the UI render a polite "we
   * suggest the next available slot" microcopy.
   */
  slotShifted: boolean;
}

/** Coerce a flexible slot input to a Date or null. */
function coerceDate(value: string | Date | number | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Existing pre-confirmed/confirmed bookings expressed as start-end millisecond
 * windows. Lerato's slot suggester will skip any candidate slot that overlaps
 * one of these by more than 0 minutes.
 */
export interface BookingWindow {
  startMs: number;
  endMs: number;
}

/** Two windows overlap when one starts before the other ends, on both sides. */
function overlaps(
  candidateStart: number,
  candidateEnd: number,
  windows: ReadonlyArray<BookingWindow>,
): boolean {
  for (const w of windows) {
    if (candidateStart < w.endMs && candidateEnd > w.startMs) return true;
  }
  return false;
}

/**
 * Find the next in-business-hours 1-hour slot at or after `from`, honouring
 * the per-dealership override. Walks at most 14 days forward (a typo or a
 * fully-closed week never loops). Falls back to "now + 24h" if nothing fits.
 *
 * Granularity: 30 minutes — good enough for test drives.
 *
 * `existingWindows` (optional) is the list of already-confirmed/pencilled-in
 * bookings for the same dealership/vehicle. Lerato will skip any candidate
 * slot that overlaps one of those windows so two customers never get booked
 * for the same car at the same time.
 */
export function suggestNextSlot(
  from: Date,
  override?: unknown,
  existingWindows: ReadonlyArray<BookingWindow> = [],
): { start: Date; end: Date } {
  const HORIZON_MS = 14 * 24 * 60 * 60 * 1000;
  const STEP_MS = 30 * 60 * 1000;
  const SLOT_MS = 60 * 60 * 1000;
  const now = Date.now();

  // Normalise to the next half-hour boundary at or after max(from, now).
  let cursorMs = Math.max(from.getTime(), now);
  cursorMs = Math.ceil(cursorMs / STEP_MS) * STEP_MS;
  const limit = cursorMs + HORIZON_MS;

  while (cursorMs <= limit) {
    const candidate = new Date(cursorMs);
    const inHours = !isAfterHoursSAST(candidate, override);
    const free = !overlaps(cursorMs, cursorMs + SLOT_MS, existingWindows);
    if (inHours && free) {
      return { start: candidate, end: new Date(cursorMs + SLOT_MS) };
    }
    cursorMs += STEP_MS;
  }
  // Hard fallback: 24h from now (ignore conflicts at this point — better to
  // pencil-in than reject the customer).
  const fallbackStart = new Date(now + 24 * 60 * 60 * 1000);
  return {
    start: fallbackStart,
    end: new Date(fallbackStart.getTime() + SLOT_MS),
  };
}

/**
 * Lightweight booking-intent classifier for inbound WhatsApp messages.
 * Pure regex on common SA-language phrasings (English, Afrikaans, Nguni and
 * Sotho families). Used by Nala's WhatsApp inbound to route booking-shaped
 * messages to Lerato. False positives here only mean the customer gets a
 * booking ack instead of a generic reply — still useful and recoverable.
 */
export function detectsBookingIntent(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  const patterns = [
    /\btest[\s-]?drive\b/, // English
    /\btoetsr(it|y)\b/, // Afrikaans
    /\bbook(ing)? a (test|car|vehicle)\b/,
    /\b(can|may|could) i (come|see|view|drive|test)\b/,
    /\bsee the (car|vehicle|vehiku|imoto|umkhumbi)\b/,
    /\bukuza ku|ukuhlola|uku(shayela|qhuba)\b/, // isiZulu / isiXhosa
    /\bteko ya ho khanna|teko ya go otlela|teko ya go kgweetsa\b/, // Sotho/Tswana/Pedi
    /\bnkambelo wa ku chayela\b/, // Xitsonga
    /\bkuhlola kushayela\b/, // siSwati
    /\bu linga u tshimbidza\b/, // Tshivenda
    /\bukuhlola ukutjhayela\b/, // isiNdebele
    /\btest[ -]?drive|reservar (um )?test|agendar visita\b/, // Portuguese
  ];
  return patterns.some((p) => p.test(lower));
}

/**
 * Format a Date in SAST as a short, readable "Sat 24 May at 11:00" string.
 * Pure helper so templates and the LLM see the same human text.
 */
export function formatSlotSAST(d: Date): string {
  const sast = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const wd = weekdays[sast.getUTCDay()];
  const day = sast.getUTCDate();
  const mo = months[sast.getUTCMonth()];
  const hh = String(sast.getUTCHours()).padStart(2, "0");
  const mm = String(sast.getUTCMinutes()).padStart(2, "0");
  return `${wd} ${day} ${mo} at ${hh}:${mm}`;
}

/**
 * Per-language acknowledgement template. All 11 SA official languages plus
 * Portuguese as a soft-supported bonus. Each template MUST contain:
 *   - the customer's first name,
 *   - the dealership name,
 *   - the reference number,
 *   - the suggested slot text.
 */
type TemplateFn = (args: {
  name: string;
  dealer: string;
  ref: string;
  slot: string;
  vehicle: string | null;
}) => string;

const LANGUAGE_TEMPLATES: Record<LanguageCode, TemplateFn> = {
  en: ({ name, dealer, ref, slot, vehicle }) =>
    `Hi ${name}, thanks for asking to test drive${vehicle ? ` the ${vehicle}` : ""} at ${dealer}. We've pencilled you in for ${slot} (SAST). Your reference is ${ref}. A team member will confirm your slot shortly — reply if that time doesn't suit and we'll find another.`,
  af: ({ name, dealer, ref, slot, vehicle }) =>
    `Hallo ${name}, dankie dat jy 'n toetsrit${vehicle ? ` van die ${vehicle}` : ""} by ${dealer} aanvra. Ons het jou voorlopig ingeskryf vir ${slot} (SAST). Jou verwysingsnommer is ${ref}. 'n Spanlid sal jou bespreking binnekort bevestig — antwoord net as die tyd nie pas nie.`,
  zu: ({ name, dealer, ref, slot, vehicle }) =>
    `Sawubona ${name}, siyabonga ngokucela ukushayela ngokuhlola${vehicle ? ` i-${vehicle}` : ""} e-${dealer}. Sikufakile esikhathini esithi ${slot} (SAST). Inombolo yakho yereferensi yi-${ref}. Ilungu lethu lizoqinisekisa isikhathi sakho ngokushesha — phendula uma lesi sikhathi singalungele.`,
  xh: ({ name, dealer, ref, slot, vehicle }) =>
    `Molo ${name}, enkosi ngokucela ukuqhuba isivavanyo${vehicle ? ` se-${vehicle}` : ""} kwa-${dealer}. Sikubhalile kwixesha elithi ${slot} (SAST). Inombolo yakho yereferensi yi-${ref}. Ilungu leqela liza kuqinisekisa ixesha lakho ngokukhawuleza — phendula ukuba ixesha alikulungelanga.`,
  st: ({ name, dealer, ref, slot, vehicle }) =>
    `Dumela ${name}, re leboha ho kopa teko ya ho khanna${vehicle ? ` ${vehicle}` : ""} ho ${dealer}. Re u behile nakong ya ${slot} (SAST). Nomoro ya hau ya tšupiso ke ${ref}. Setho sa sehlopha se tla netefatsa nako ya hau kapele — araba haeba nako ena e sa u lokele.`,
  nso: ({ name, dealer, ref, slot, vehicle }) =>
    `Dumela ${name}, re a leboga ge o kgopela teko ya go otlela${vehicle ? ` ${vehicle}` : ""} go ${dealer}. Re go beile nakong ya ${slot} (SAST). Nomoro ya gago ya tshupetso ke ${ref}. Setho sa sehlopha se tla tiišetsa nako ya gago ka pela — araba ge nako ye e sa go lokela.`,
  tn: ({ name, dealer, ref, slot, vehicle }) =>
    `Dumela ${name}, re a leboga gore o kopa teko ya go kgweetsa${vehicle ? ` ${vehicle}` : ""} kwa ${dealer}. Re go kwadile mo nakong ya ${slot} (SAST). Nomoro ya gago ya tshupelo ke ${ref}. Leloko la setlhopha le tla netefatsa nako ya gago ka bonako — araba fa nako e e sa go lebanela.`,
  ts: ({ name, dealer, ref, slot, vehicle }) =>
    `Avuxeni ${name}, hi nkhensa leswi u kombelaka ku endla nkambelo wa ku chayela${vehicle ? ` ${vehicle}` : ""} eka ${dealer}. Hi ku tsarile eka nkarhi wa ${slot} (SAST). Nomboro ya wena ya nkomboriso i ${ref}. Xirho xa ntlawa xi ta tiyisisa nkarhi wa wena hi xihatla — hlamula loko nkarhi wu nga ku faneli.`,
  ss: ({ name, dealer, ref, slot, vehicle }) =>
    `Sawubona ${name}, ngiyabonga ngekucela kuhlola kushayela${vehicle ? ` ${vehicle}` : ""} e-${dealer}. Sikubhalisile esikhatsini sa ${slot} (SAST). Inombolo yakho yereferensi ngu-${ref}. Lilunga lelicembu litawucinisekisa sikhatsi sakho masinyane — phendvula uma lesi sikhatsi singakukhonelu.`,
  ve: ({ name, dealer, ref, slot, vehicle }) =>
    `Ndaa ${name}, ndo livhuwa nga u humbela u linga u tshimbidza${vehicle ? ` ${vehicle}` : ""} kha ${dealer}. Ro ni vhulunga nga tshifhinga tsha ${slot} (SAST). Nomboro yaḾu ya vhusedzi ndi ${ref}. Murado wa tshigwada u ḓo khwaṱhisedza tshifhinga tshaḾu nga u ṱavhanya — fhindulani arali tshifhinga tshi sa ni tendi.`,
  nr: ({ name, dealer, ref, slot, vehicle }) =>
    `Lotjhani ${name}, ngiyathokoza ngokubawa ukuhlola ukutjhayela${vehicle ? ` i-${vehicle}` : ""} e-${dealer}. Sikutlolisile esikhathini sika-${slot} (SAST). Inombolo yakho yereferense ngu-${ref}. Ilunga leqembu lizokuqinisekisa isikhathi sakho msinyana — phendula nange isikhathi singakulungeli.`,
  pt: ({ name, dealer, ref, slot, vehicle }) =>
    `Olá ${name}, obrigado por pedir um test drive${vehicle ? ` do ${vehicle}` : ""} na ${dealer}. Reservámos provisoriamente para si o horário ${slot} (SAST). A sua referência é ${ref}. Um membro da equipa confirmará o seu horário em breve — responda se o horário não lhe convier e iremos propor outro.`,
};

/** Pick a template, defaulting to English for unknown codes. */
function pickTemplate(language: string): { code: LanguageCode; tmpl: TemplateFn } {
  const candidate = (language ?? "en").toLowerCase();
  if (isLanguageCode(candidate)) {
    return { code: candidate, tmpl: LANGUAGE_TEMPLATES[candidate] };
  }
  return { code: "en", tmpl: LANGUAGE_TEMPLATES.en };
}

/**
 * Draft the multilingual booking acknowledgement. Falls back to a
 * deterministic template if the LLM is unreachable or invents content.
 *
 * Invariants enforced when accepting an LLM polish:
 *   - reference appears verbatim,
 *   - the slot text appears verbatim,
 *   - never claims the slot is "confirmed" / "booked" — only "pencilled in".
 */
export async function draftBookingReply(
  input: BookingInput,
  reference: string,
  suggestion: { start: Date; end: Date },
): Promise<{ reply: string; language: LanguageCode }> {
  const { code, tmpl } = pickTemplate(input.language ?? "en");
  const dealer = input.dealershipName ?? "the dealership";
  const name = (input.customerName ?? "there").split(" ")[0] || "there";
  const slotText = formatSlotSAST(suggestion.start);
  const vehicle = input.vehicleTitle ?? null;
  const baseTemplate = tmpl({ name, dealer, ref: reference, slot: slotText, vehicle });

  try {
    const messages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content: [
          "You are Lerato, GrayArx's Booking Concierge.",
          `Reply in language code "${code}" with 2–4 short, warm sentences.`,
          "RULES (non-negotiable):",
          " - Acknowledge the test-drive request.",
          " - Always include the reference number exactly as provided.",
          " - Always include the slot text exactly as provided.",
          ' - Never use the words "confirmed" or "booked"; the slot is only "pencilled in" until a human approves.',
          " - Never quote a price, finance offer, or vehicle availability you weren't given.",
          " - Stay polite and culturally appropriate to the chosen language.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Customer first name: ${name}`,
          `Dealership: ${dealer}`,
          `Vehicle of interest: ${vehicle ?? "n/a"}`,
          `Channel: ${input.channel}`,
          `Slot text (SAST): ${slotText}`,
          `Reference: ${reference}`,
          input.inboundMessage ? `Inbound message: ${input.inboundMessage}` : "",
          "Draft the reply.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];
    const res: any = await invokeLLM({ messages });
    const polished: string | undefined = res?.choices?.[0]?.message?.content
      ?.toString()
      .trim();
    if (
      polished &&
      polished.length > 30 &&
      polished.includes(reference) &&
      polished.includes(slotText) &&
      !/\b(confirmed|booked)\b/i.test(polished)
    ) {
      return { reply: polished, language: code };
    }
  } catch {
    // Fall through to template
  }
  return { reply: baseTemplate, language: code };
}

/**
 * Top-level helper. Pure: no DB writes. Persistence + notifyOwner belong
 * to the calling router/webhook.
 */
export async function runBookingAgent(
  dealershipId: number,
  input: BookingInput,
): Promise<BookingOutput> {
  if (!input.customerName || input.customerName.trim().length < 2) {
    throw new Error("Please share your full name so we can pencil you in.");
  }
  if (!input.customerContact || input.customerContact.trim().length < 5) {
    throw new Error("A reachable contact (email or phone) is required.");
  }
  const requestedStart = coerceDate(input.requestedSlotStart);
  const requestedEnd = coerceDate(input.requestedSlotEnd);

  // Decide what to actually suggest.
  const baseFrom = requestedStart ?? new Date();
  const isUsable =
    requestedStart != null &&
    requestedStart.getTime() > Date.now() &&
    !isAfterHoursSAST(requestedStart, input.businessHoursOverride);
  const windows = input.existingWindows ?? [];
  const requestedFree =
    isUsable &&
    !overlaps(
      requestedStart.getTime(),
      (requestedEnd ?? new Date(requestedStart.getTime() + 60 * 60 * 1000)).getTime(),
      windows,
    );
  const suggestion = requestedFree
    ? {
        start: requestedStart!,
        end:
          requestedEnd && requestedEnd.getTime() > requestedStart!.getTime()
            ? requestedEnd
            : new Date(requestedStart!.getTime() + 60 * 60 * 1000),
      }
    : suggestNextSlot(baseFrom, input.businessHoursOverride, windows);

  const referenceNumber = generateReferenceNumber(dealershipId, input.customerContact);
  const { reply, language } = await draftBookingReply(input, referenceNumber, suggestion);

  return {
    referenceNumber,
    outboundReply: reply,
    language,
    requestedSlotStart: requestedStart,
    requestedSlotEnd: requestedEnd,
    suggestedSlotStart: suggestion.start,
    suggestedSlotEnd: suggestion.end,
    slotShifted: !requestedFree,
  };
}

/** Re-export the canonical language list so callers don't import from two places. */
export { ALL_LANGUAGE_CODES };
