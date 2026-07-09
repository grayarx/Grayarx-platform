/**
 * Lerato — confirmation step.
 *
 * When a dealer hits Confirm on a pencilled-in test drive, this helper
 * produces:
 *   1. a localized confirmation message in the customer's original language,
 *   2. an RFC 5545 ICS calendar invite (single VEVENT) the website can attach
 *      to the customer's confirmation page so they can add it to their phone
 *      calendar in one tap.
 *
 * Pure module: no DB, no fetch. Trivially unit-testable.
 *
 * Channel routing (web/email/whatsapp/call) is the responsibility of the
 * caller — this module just produces the text.
 */
import { isLanguageCode, type LanguageCode } from "../../shared/languages";
import { formatSlotSAST } from "./bookingAgent";

export interface ConfirmationInput {
  customerName: string;
  dealershipName: string;
  vehicleTitle?: string | null;
  reference: string;
  slotStart: Date;
  slotEnd: Date;
  language: string;
  /** Optional location text — appears in both the message and ICS LOCATION. */
  locationText?: string | null;
}

type Tmpl = (args: {
  name: string;
  dealer: string;
  ref: string;
  slot: string;
  vehicle: string | null;
  location: string | null;
}) => string;

const CONFIRMATION_TEMPLATES: Record<LanguageCode, Tmpl> = {
  en: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Hi ${name}, your test drive${vehicle ? ` of the ${vehicle}` : ""} at ${dealer} is confirmed for ${slot} (SAST). Reference: ${ref}.${location ? ` Address: ${location}.` : ""} Please bring your driver's licence and a recent proof of address. See you soon!`,
  af: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Hallo ${name}, jou toetsrit${vehicle ? ` van die ${vehicle}` : ""} by ${dealer} is bevestig vir ${slot} (SAST). Verwysing: ${ref}.${location ? ` Adres: ${location}.` : ""} Bring asseblief jou bestuurslisensie en 'n onlangse bewys van adres saam. Tot dan!`,
  zu: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Sawubona ${name}, ukushayela kwakho kokuhlola${vehicle ? ` i-${vehicle}` : ""} e-${dealer} kuqinisekisiwe ngo-${slot} (SAST). Inombolo yereferensi: ${ref}.${location ? ` Ikheli: ${location}.` : ""} Sicela ulethe ilayisense yakho yokushayela kanye nobufakazi besikhathi sakamuva sekheli. Sizokubona!`,
  xh: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Molo ${name}, ukuvavanya kwakho ukuqhuba${vehicle ? ` i-${vehicle}` : ""} kwa-${dealer} kuqinisekisiwe ngo-${slot} (SAST). Inombolo yereferensi: ${ref}.${location ? ` Idilesi: ${location}.` : ""} Nceda uze nelayisensi yakho yokuqhuba kunye nobungqina bedilesi banamhlanje. Siyakubona!`,
  st: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Dumela ${name}, teko ya hau ya ho khanna${vehicle ? ` ${vehicle}` : ""} ho ${dealer} e netefalitsoe bakeng sa ${slot} (SAST). Tšupiso: ${ref}.${location ? ` Aterese: ${location}.` : ""} Hle tlisa laesense ya hau ya ho khanna le bopaki ba aterese ba morao tjena. Re tla u bona!`,
  nso: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Dumela ${name}, teko ya gago ya go otlela${vehicle ? ` ${vehicle}` : ""} go ${dealer} e tiišeditšwe bakeng sa ${slot} (SAST). Tshupetšo: ${ref}.${location ? ` Aterese: ${location}.` : ""} Hle tliša laesense ya gago ya go otlela le bohlatse bja aterese bja morago bjale. Re tla go bona!`,
  tn: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Dumela ${name}, teko ya gago ya go kgweetsa${vehicle ? ` ${vehicle}` : ""} kwa ${dealer} e tlhomamisitswe ka ${slot} (SAST). Tshupelo: ${ref}.${location ? ` Aterese: ${location}.` : ""} Tsweetswee tlisa laesense ya gago ya go kgweetsa le bosupi jwa aterese jwa bosheng. Re tla go bona!`,
  ts: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Avuxeni ${name}, nkambelo wa wena wa ku chayela${vehicle ? ` ${vehicle}` : ""} eka ${dealer} wu tiyisisiwile eka ${slot} (SAST). Nkomboriso: ${ref}.${location ? ` Adirese: ${location}.` : ""} Hi kombela u tisa rhayisense ya wena ya ku chayela na vumbhoni bya adirese bya sweswinyana. Hi ta ku vona!`,
  ss: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Sawubona ${name}, kuhlola kwakho kushayela${vehicle ? ` ${vehicle}` : ""} e-${dealer} kucinisekisiwe nga-${slot} (SAST). Inombolo: ${ref}.${location ? ` Likheli: ${location}.` : ""} Sicela utse ilayisensi yakho yekushayela kanye nebufakazi belikheli besikhatsi sakamuva. Sitokubonana!`,
  ve: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Ndaa ${name}, u linga haṋu u tshimbidza${vehicle ? ` ${vehicle}` : ""} kha ${dealer} ho khwaṱhisedzwa kha ${slot} (SAST). Vhusedzi: ${ref}.${location ? ` Diresi: ${location}.` : ""} Ri humbela uri ni ḓise raisense ya u tshimbidza na vhuṱanzi ha diresi ha hone. Ri ḓo ni vhona!`,
  nr: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Lotjhani ${name}, ukuhlola kwakho ukutjhayela${vehicle ? ` i-${vehicle}` : ""} e-${dealer} kuqinisekisiwe nga-${slot} (SAST). Ireferensi: ${ref}.${location ? ` Ikheli: ${location}.` : ""} Sibawa ulethe ilayisense yakho yokutjhayela nobufakazi bekheli besikhathi esitja. Sizokubonana!`,
  pt: ({ name, dealer, ref, slot, vehicle, location }) =>
    `Olá ${name}, o seu test drive${vehicle ? ` do ${vehicle}` : ""} na ${dealer} está confirmado para ${slot} (SAST). Referência: ${ref}.${location ? ` Endereço: ${location}.` : ""} Por favor traga a sua carta de condução e um comprovativo de morada recente. Até breve!`,
};

function pickConfirmation(language: string): { code: LanguageCode; tmpl: Tmpl } {
  const candidate = (language ?? "en").toLowerCase();
  if (isLanguageCode(candidate)) {
    return { code: candidate, tmpl: CONFIRMATION_TEMPLATES[candidate] };
  }
  return { code: "en", tmpl: CONFIRMATION_TEMPLATES.en };
}

/**
 * Pure helper. Returns the localized confirmation message and the language
 * code we ended up using.
 */
export function buildConfirmationMessage(input: ConfirmationInput): {
  message: string;
  language: LanguageCode;
} {
  const { code, tmpl } = pickConfirmation(input.language);
  const slot = formatSlotSAST(input.slotStart);
  const name = (input.customerName ?? "there").split(" ")[0] || "there";
  return {
    message: tmpl({
      name,
      dealer: input.dealershipName,
      ref: input.reference,
      slot,
      vehicle: input.vehicleTitle ?? null,
      location: input.locationText ?? null,
    }),
    language: code,
  };
}

/** Format a Date as the RFC 5545 UTC datetime: 20260524T090000Z. */
function icsUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** Escape a free-form string into ICS TEXT (RFC 5545 §3.3.11). */
function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Generate a single-VEVENT ICS string. CRLF line endings per spec.
 * No folding (lines are short enough). Suitable for direct download as a
 * `*.ics` attachment.
 */
export function buildBookingIcs(input: ConfirmationInput): string {
  const summary = `Test drive${input.vehicleTitle ? ` — ${input.vehicleTitle}` : ""} @ ${input.dealershipName}`;
  const description =
    `GrayArx test drive booking.\nReference: ${input.reference}\n` +
    (input.vehicleTitle ? `Vehicle: ${input.vehicleTitle}\n` : "") +
    `Dealership: ${input.dealershipName}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GrayArx//Lerato Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:lerato-${input.reference}@grayarx.com`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(input.slotStart)}`,
    `DTEND:${icsUtc(input.slotEnd)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    input.locationText ? `LOCATION:${icsEscape(input.locationText)}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}
