/**
 * Bongi — the Fallback Agent.
 *
 * Watches every channel and replies professionally when no human is around.
 * The reply always:
 *   - acknowledges receipt warmly,
 *   - hands the customer a unique reference number,
 *   - promises a callback during the next business window,
 *   - tells them how to reach a human urgently.
 *
 * Used by:
 *   - admin trigger from the Fallback Inbox page,
 *   - inbound webhooks (email/WhatsApp) when no other agent picks up,
 *   - dashboard "manual log" button for the founder.
 *
 * The actual delivery (sending the email/WhatsApp) is the job of the channel
 * agents; Bongi just drafts the reply, generates the reference, and persists
 * the row. That keeps her testable in isolation.
 */
import { invokeLLM } from "./llm";

export type FallbackChannel = "email" | "whatsapp" | "call" | "web_chat";

export interface FallbackInput {
  customerName?: string | null;
  customerContact?: string | null;
  channel: FallbackChannel;
  inboundMessage?: string | null;
  language?: string;
  dealershipName?: string | null;
}

export interface FallbackOutput {
  referenceNumber: string;
  outboundReply: string;
  language: string;
}

/**
 * Per-dealership business-hours override shape. Each weekday key is
 * optional; missing days mean "closed" for that day. `closed: true` on a
 * present day also means closed. Values are 24h strings in SAST.
 *
 * Stored on `dealerships.businessHoursJson`.
 */
export type WeekdayKey =
  | "sun"
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat";
export interface BusinessHoursDay {
  open?: string; // "HH:MM"
  close?: string; // "HH:MM"
  closed?: boolean;
}
export type BusinessHoursOverride = Partial<Record<WeekdayKey, BusinessHoursDay>>;

const WEEKDAY_BY_INDEX: WeekdayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

/** Default GrayArx hours: Mon–Fri 08:00–18:00, Sat 08:00–13:00, closed Sun. */
export const DEFAULT_BUSINESS_HOURS: BusinessHoursOverride = {
  sun: { closed: true },
  mon: { open: "08:00", close: "18:00" },
  tue: { open: "08:00", close: "18:00" },
  wed: { open: "08:00", close: "18:00" },
  thu: { open: "08:00", close: "18:00" },
  fri: { open: "08:00", close: "18:00" },
  sat: { open: "08:00", close: "13:00" },
};

function parseHHMM(value?: string): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || h < 0 || h > 23) return null;
  if (!Number.isFinite(min) || min < 0 || min > 59) return null;
  return h + min / 60;
}

/**
 * Whether the given moment is outside business hours, optionally honouring
 * a per-dealership override. SAST (UTC+2, no DST) is the only timezone the
 * platform supports today.
 *
 *   isAfterHoursSAST() → default GrayArx hours
 *   isAfterHoursSAST(now, dealership.businessHoursJson)
 *      → per-dealership override (typically set on Brand Kit page)
 *
 * Unknown / malformed override values fall back to the default schedule
 * so a typo never silences Bongi entirely.
 */
export function isAfterHoursSAST(
  now: Date = new Date(),
  override?: unknown,
): boolean {
  const sastOffsetMs = 2 * 60 * 60 * 1000;
  const sast = new Date(now.getTime() + sastOffsetMs);
  const day = sast.getUTCDay(); // 0=Sun, 6=Sat
  const hourFloat = sast.getUTCHours() + sast.getUTCMinutes() / 60;
  const key = WEEKDAY_BY_INDEX[day];

  const schedule =
    override && typeof override === "object"
      ? (override as BusinessHoursOverride)
      : DEFAULT_BUSINESS_HOURS;

  const today = schedule[key];
  // Missing day OR explicit closed flag = after-hours all day.
  if (!today || today.closed) {
    return true;
  }
  const open = parseHHMM(today.open);
  const close = parseHHMM(today.close);
  // Malformed entry → fall back to default for that weekday.
  if (open === null || close === null || close <= open) {
    const fallback = DEFAULT_BUSINESS_HOURS[key];
    if (!fallback || fallback.closed) return true;
    const fOpen = parseHHMM(fallback.open) ?? 8;
    const fClose = parseHHMM(fallback.close) ?? 18;
    return hourFloat < fOpen || hourFloat >= fClose;
  }
  return hourFloat < open || hourFloat >= close;
}

/**
 * Generate a short, dealership-shaped reference like
 *   GA-K12-2026-05-23-7F2A
 * Made of: prefix (GA), dealershipId chunk, ISO date, 4-char hash.
 */
export function generateReferenceNumber(dealershipId: number, seed?: string): string {
  const prefix = "GA";
  const dealerChunk = `K${dealershipId}`;
  const today = new Date().toISOString().slice(0, 10);
  const entropy = (seed ?? "") + Date.now().toString();
  let hash = 0;
  for (let i = 0; i < entropy.length; i++) {
    hash = (hash * 31 + entropy.charCodeAt(i)) >>> 0;
  }
  const tail = hash.toString(16).toUpperCase().slice(-4).padStart(4, "0");
  return `${prefix}-${dealerChunk}-${today}-${tail}`;
}

/**
 * Build the professional reply. Falls back to a deterministic template
 * when the LLM is not reachable — that keeps us POPIA-safe (no leaks) and
 * means the agent always responds, even on a flaky model day.
 */
export async function draftFallbackReply(
  input: FallbackInput,
  reference: string,
): Promise<{ reply: string; language: string }> {
  const language = input.language ?? "en";
  const dealership = input.dealershipName ?? "the dealership";
  const name = input.customerName ?? "there";

  // 11 SA official languages + Portuguese. The LLM polishes these when
  // available; when it isn't, the template ships verbatim and is still
  // safe (no invented prices, no PII echoed back).
  const fallbackTemplates: Record<string, string> = {
    en: `Hi ${name}, thanks for reaching out to ${dealership} — a member of the team will get back to you within the next business morning. Your reference is ${reference}. If it's urgent, reply to this message and a human will be paged.`,
    af: `Hallo ${name}, dankie dat jy ${dealership} gekontak het. ’n Spanlid sal jou voor die einde van die volgende werksoggend terugkontak. Jou verwysingsnommer is ${reference}.`,
    zu: `Sawubona ${name}, siyabonga ngokuxhumana ne-${dealership}. Ilungu lethu lizokuphendula ekuseni kosuku lokuqala lwebhizinisi olulandelayo. Inombolo yakho yereferensi yi-${reference}.`,
    xh: `Molo ${name}, enkosi ngokuqhagamshelana ne-${dealership}. Ilungu leqela lizakubuyela kuwe ngentsasa yokusebenza elandelayo. Inombolo yakho yereferensi yi-${reference}.`,
    st: `Dumela ${name}, re a leboha hore o ikopanye le ${dealership}. Setho sa sehlopha se tla u arabela hoseng ha letsatsi le latelang la khoebo. Nomoro ya hau ya tsupiso ke ${reference}.`,
    nso: `Dumela ${name}, re a leboga ge o ikopantshitse le ${dealership}. Setho sa sehlopha se tla go arabela mesong ya letsatsi le le latelago la kgwebo. Nomoro ya gago ya tshupetso ke ${reference}.`,
    tn: `Dumela ${name}, re a leboga go ikgolaganya le ${dealership}. Setho sa setlhopha se tla go araba mo mosong wa letsatsi le le latelang la kgwebo. Nomoro ya gago ya kaedi ke ${reference}.`,
    ts: `Avuxeni ${name}, ndza khensa leswaku u hlanganile na ${dealership}. Xirho xa ntlawa xi ta tlhela eka wena nimixo wa siku ra le ndzhaku ra mintirho. Nomboro ya wena ya rhefurense i ${reference}.`,
    ss: `Sawubona ${name}, ngiyabonga kutsi ucabane ne-${dealership}. Lilunga lelicembu litawukubuyela ekuseni kwelilanga lelilandzelako lemsebenti. Inombolo yakho yereferensi ngu-${reference}.`,
    ve: `Ndaa ${name}, ndo livhuwa u kwama na ${dealership}. Murado wa tshigwada u ḓo ni fhindula nga matsheloni a duvha li tevhelaho la mishumo. Nomboro ya vhusedzi ndi ${reference}.`,
    nr: `Lotjhani ${name}, ngiyathokoza ngekuthi uthintane ne-${dealership}. Ilunga leqembu lizakubuyela kuwe ekuseni kwelanga elilandelako lomsebenzi. Inombolo yakho yereferense ngu-${reference}.`,
    pt: `Olá ${name}, obrigado por entrar em contacto com a ${dealership}. Um membro da equipa retornará o seu contacto na próxima manhã útil. A sua referência é ${reference}.`,
  };

  const baseTemplate = fallbackTemplates[language] ?? fallbackTemplates.en;

  // Try LLM polish; if it fails, return the template as-is.
  try {
    const messages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content:
          "You are Bongi, GrayArx's after-hours concierge. Reply in the requested language in 2 short, warm, professional sentences. Always include the reference number provided. Never invent prices, hours, vehicles or commitments.",
      },
      {
        role: "user",
        content: `Customer: ${name}\nDealership: ${dealership}\nChannel: ${input.channel}\nLanguage: ${language}\nReference: ${reference}\nInbound message: ${input.inboundMessage ?? "(none)"}\n\nDraft the reply.`,
      },
    ];
    const res: any = await invokeLLM({ messages });
    const polished = res?.choices?.[0]?.message?.content?.toString().trim();
    if (polished && polished.length > 20) {
      return { reply: polished, language };
    }
  } catch (err) {
    console.warn("[Bongi] LLM failed, using template fallback:", err instanceof Error ? err.message : String(err));
  }
  return { reply: baseTemplate, language };
}

/**
 * Top-level helper: takes the raw inbound, returns the drafted reply
 * and the reference. Persistence is left to the caller (router or webhook)
 * so this stays a pure function.
 */
export async function runFallbackAgent(
  dealershipId: number,
  input: FallbackInput,
): Promise<FallbackOutput> {
  const referenceNumber = generateReferenceNumber(dealershipId, input.customerContact ?? "");
  const { reply, language } = await draftFallbackReply(input, referenceNumber);
  return {
    referenceNumber,
    outboundReply: reply,
    language,
  };
}
