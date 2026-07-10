/**
 * Naledi — the Pre-Approval Agent.
 *
 * Walks an applicant through the questions a human F&I manager would ask,
 * captures the answers, and acknowledges receipt with a reference number.
 * Naledi NEVER grants approval — every decision is made by a human via the
 * admin queue. Her acknowledgement makes that explicit.
 *
 * The flow (kept small and predictable):
 *   1. Validate the application payload (shape + required fields).
 *   2. POPIA-mask the SA ID number to last-4-digits before persistence.
 *   3. Compute a reference number (shared format with Bongi for consistency).
 *   4. Draft a multilingual acknowledgement (template fallback if LLM fails).
 *   5. Hand back a clean, plain object the router/webhook can persist.
 *
 * This module stays pure (no DB writes) so it's trivially unit-testable.
 */
import { invokeLLM } from "./llm";
import { generateReferenceNumber } from "./fallbackAgent";

export type EmploymentStatus =
  | "permanent"
  | "contract"
  | "self_employed"
  | "pensioner"
  | "unemployed";

export interface PreApprovalInput {
  // Identity
  fullName: string;
  idNumber?: string | null; // raw — will be masked
  email: string;
  phone: string;
  // Affordability
  employmentStatus?: EmploymentStatus | null;
  employer?: string | null;
  monthsEmployed?: number | null;
  grossMonthlyIncome?: number | null;
  netMonthlyIncome?: number | null;
  totalMonthlyExpenses?: number | null;
  existingDebtMonthly?: number | null;
  // Deal
  vehiclePrice?: number | null;
  desiredDeposit?: number | null;
  desiredTermMonths?: number | null;
  hasTradeIn?: boolean | null;
  tradeInDescription?: string | null;
  // Misc
  notes?: string | null;
  language?: string;
  dealershipName?: string | null;
}

export interface PreApprovalOutput {
  referenceNumber: string;
  agentReply: string;
  idNumberMasked: string | null;
  language: string;
  // A non-binding affordability hint, surfaced to the human reviewer only.
  // We store it but never communicate a number to the applicant.
  affordabilityHint: AffordabilityHint;
}

export interface AffordabilityHint {
  monthlyDisposable: number | null;
  debtToIncomeRatio: number | null; // 0..1
  flag: "ok" | "tight" | "stretched" | "insufficient_data";
}

/**
 * Mask a South African ID number to the last 4 digits with bullets for the
 * leading 9. Returns null if the input is empty/whitespace, and a full bullet
 * string if shorter than expected so we never echo raw digits back.
 */
export function maskSouthAfricanId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/\s+/g, "");
  if (cleaned.length === 0) return null;
  if (cleaned.length <= 4) return "•".repeat(cleaned.length);
  const last4 = cleaned.slice(-4);
  return "•".repeat(Math.max(0, cleaned.length - 4)) + last4;
}

/**
 * Compute a non-binding affordability snapshot for the human reviewer.
 * Insufficient data returns flag="insufficient_data" — never blocks submission.
 */
export function computeAffordabilityHint(
  input: Pick<
    PreApprovalInput,
    | "netMonthlyIncome"
    | "totalMonthlyExpenses"
    | "existingDebtMonthly"
    | "grossMonthlyIncome"
  >,
): AffordabilityHint {
  const net = input.netMonthlyIncome ?? null;
  const exp = input.totalMonthlyExpenses ?? null;
  const debt = input.existingDebtMonthly ?? null;
  const gross = input.grossMonthlyIncome ?? null;

  if (net == null && gross == null) {
    return { monthlyDisposable: null, debtToIncomeRatio: null, flag: "insufficient_data" };
  }
  const incomeForRatio = net ?? gross ?? 0;
  const monthlyDisposable =
    net != null && exp != null ? Number((net - exp - (debt ?? 0)).toFixed(2)) : null;

  let debtRatio: number | null = null;
  if (incomeForRatio > 0 && debt != null) {
    debtRatio = Number(Math.min(1, debt / incomeForRatio).toFixed(2));
  }

  let flag: AffordabilityHint["flag"] = "ok";
  if (monthlyDisposable != null) {
    if (monthlyDisposable < 0) flag = "stretched";
    else if (monthlyDisposable < 2000) flag = "tight";
  } else {
    flag = "insufficient_data";
  }
  if (debtRatio != null && debtRatio >= 0.4) flag = "stretched";

  return { monthlyDisposable, debtToIncomeRatio: debtRatio, flag };
}

/**
 * Validate a payload at a *behavioural* level (the schema layer in the router
 * validates types). Returns a list of human-readable error messages.
 */
export function validatePreApprovalInput(input: PreApprovalInput): string[] {
  const errors: string[] = [];
  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.push("Please share your full name.");
  }
  if (!input.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) {
    errors.push("A valid email address is required so we can reach you.");
  }
  if (!input.phone || input.phone.replace(/\D/g, "").length < 9) {
    errors.push("A reachable phone number is required.");
  }
  if (input.idNumber && input.idNumber.replace(/\s+/g, "").length < 6) {
    errors.push("That ID number doesn't look complete.");
  }
  if (input.desiredTermMonths != null) {
    if (input.desiredTermMonths < 12 || input.desiredTermMonths > 84) {
      errors.push("Term should be between 12 and 84 months.");
    }
  }
  if (input.vehiclePrice != null && input.vehiclePrice <= 0) {
    errors.push("Vehicle price should be greater than zero.");
  }
  if (input.desiredDeposit != null && input.desiredDeposit < 0) {
    errors.push("Deposit cannot be negative.");
  }
  return errors;
}

const LANGUAGE_TEMPLATES: Record<string, (name: string, ref: string, dealership: string) => string> = {
  en: (name, ref, dealer) =>
    `Hi ${name}, thank you for sending your pre-approval details to ${dealer}. We have received everything safely. Your reference is ${ref}. A member of our finance team will personally review your application and get back to you as soon as possible — no automated approval is given here. If anything is missing, we'll reach out on the contact details you provided.`,
  af: (name, ref, dealer) =>
    `Hallo ${name}, dankie dat jy jou voorafgoedkeurings-besonderhede aan ${dealer} gestuur het. Ons het alles veilig ontvang. Jou verwysingsnommer is ${ref}. ’n Lid van ons finansiespan sal jou aansoek persoonlik nagaan en sal so gou as moontlik by jou terugkom — geen outomatiese goedkeuring word hier gegee nie.`,
  zu: (name, ref, dealer) =>
    `Sawubona ${name}, siyabonga ngokuthumela imininingwane yakho yokuvunyelwa kusengaphambili ku-${dealer}. Sikutholile konke ngokuphephile. Inombolo yakho yereferensi yi-${ref}. Ilungu leqembu lethu lezimali lizoyihlola ngokwakho isicelo sakho futhi liphendule ngokushesha — akukho ukugunyazwa okuzenzakalelayo lapha.`,
  xh: (name, ref, dealer) =>
    `Molo ${name}, enkosi ngokuthumela iinkcukacha zakho zempepha-mvume yangaphambili ku-${dealer}. Sikufumene konke. Inombolo yakho yereferensi yi-${ref}. Ilungu lethu leqela lezemali liza kuyihlola ngokwakhe isicelo sakho liphendule ngokukhawuleza — akukho mvume ezenzekayo ngokuzenzakalelayo apha.`,
  st: (name, ref, dealer) =>
    `Dumela ${name}, re leboha ho romella dintlha tsa hau tsa ho amohelwa esale pele ho ${dealer}. Re fumane tsohle ka polokeho. Nomoro ya hau ya tšupiso ke ${ref}. Setho sa sehlopha sa rona sa lichelete se tla hlahloba kopo ya hau ka boeena 'me se tla araba ka potlako — ha ho tumello e iketsang mona.`,
  tn: (name, ref, dealer) =>
    `Dumela ${name}, re a leboga go romelelwa dintlha tsa gago tsa go amogelwa pele go ${dealer}. Re amogetse tsotlhe ka pabalesego. Nomoro ya gago ya tshupelo ke ${ref}. Leloko la setlhopha sa rona sa madi le tla sekaseka kopo ya gago ka bo lone mme le tla arabela ka bonako — ga go na tumelelo e e itiragalang fano.`,
  ts: (name, ref, dealer) =>
    `Avuxeni ${name}, hi nkhensa ku rhumela vuxokoxoko bya wena bya ku amukeriwa eku sunguleni ka ${dealer}. Hi swi kume hinkwaswo hi xisirhelelo. Nomboro ya wena ya nkomboriso i ${ref}. Xirho xa ntlawa wa hina wa timali xi ta lavisisa xikombelo xa wena hi yexe naswona xi ta hlamula hi xihatla — a ku na ntwanano lowu endleriwaka eka swiyenge.`,
  nso: (name, ref, dealer) =>
    `Dumela ${name}, re a leboga go romelwa dintlha tsa gago tsa go amogelwa e sa le pele go ${dealer}. Re amogetse tsohle ka polokego. Nomoro ya gago ya tshupetso ke ${ref}. Setho sa sehlopha sa rena sa ditshelete se tla sekaseka kgopelo ya gago ka boyena gomme se tla araba ka pela ka mo go kgonegago — ga go tumelelo ye e itiragalago mo.`,
  ss: (name, ref, dealer) =>
    `Sawubona ${name}, ngiyabonga kutsi utfumele imininingwane yakho yekutemulelwa esengakacali ku-${dealer}. Sikutfole konkhe ngekuphepha. Inombolo yakho yereferensi ngu-${ref}. Lilunga lelicembu letfu letimali litawuhlola sicelo sakho ngekwalo bese siphendvula masinya — akukho kutemulelwa lokutiteketelako lapha.`,
  ve: (name, ref, dealer) =>
    `Ndaa ${name}, ndo livhuwa u rumela mafhungo aḾu a u tendelwa u sa athu Ḿu ya kha ${dealer}. Ro ḓzhena zwoṱhe zwavhudḽi. Nomboro yaḾu ya vhusedzi ndi ${ref}. Murado wa tshigwada tshashu tsha tshelede u ḓo sedzulusa khumbelo yaḾu nga eṋe nahone u ḓo fhindula nga u ṱavhanya — a hu na thendelo i ḓoḥoḰaho fhano.`,
  nr: (name, ref, dealer) =>
    `Lotjhani ${name}, ngiyathokoza ngokuthumela imininingwana yakho yokutemulelwa ngaphambi ku-${dealer}. Siyifumene yoke ngokuphepha. Inombolo yakho yereferense ngu-${ref}. Ilunga leqembu letfu lemali lizolihlola lifaniswa lakho ngokwalo bese liphendula ngokushesha — akukho kutemulelwa lokuzenzakalelako lapha.`,
  pt: (name, ref, dealer) =>
    `Olá ${name}, obrigado por enviar os seus dados de pré-aprovação para a ${dealer}. Recebemos tudo em segurança. A sua referência é ${ref}. Um membro da nossa equipa financeira analisará pessoalmente o seu pedido e responder-lhe-á o mais rapidamente possível — não é dada qualquer aprovação automática aqui.`,
};

/**
 * Draft the multilingual acknowledgement. Always template-fallbacks if LLM
 * is unavailable, and guarantees a few invariants:
 *   - reference is always present in the reply,
 *   - the words "approval" / "approved" never appear unconditionally,
 *   - the reply makes clear a human is the next step.
 */
export async function draftPreApprovalReply(
  input: PreApprovalInput,
  reference: string,
): Promise<{ reply: string; language: string }> {
  const language = (input.language ?? "en").toLowerCase();
  const name = input.fullName.split(" ")[0] ?? input.fullName;
  const dealership = input.dealershipName ?? "the dealership";

  const tmpl = LANGUAGE_TEMPLATES[language] ?? LANGUAGE_TEMPLATES.en;
  const baseTemplate = tmpl(name, reference, dealership);

  try {
    const messages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content: [
          "You are Naledi, GrayArx's Pre-Approval Concierge.",
          "Reply in the requested language with 2–4 short, warm, professional sentences.",
          "RULES (non-negotiable):",
          " - Acknowledge receipt of the pre-approval request.",
          " - Always include the reference number exactly as provided.",
          " - Never say the application is approved, declined, or pre-approved.",
          " - Never quote a number, instalment, interest rate or term.",
          " - State clearly that a human team member will review and respond.",
          " - If asked for a decision, defer to the human team.",
          " - Do not invent any specific dealership detail.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Applicant first name: ${name}`,
          `Dealership: ${dealership}`,
          `Language: ${language}`,
          `Reference: ${reference}`,
          `Vehicle of interest (price, may be null): ${input.vehiclePrice ?? "n/a"}`,
          `Has trade-in: ${input.hasTradeIn ? "yes" : "no"}`,
          "Draft the reply.",
        ].join("\n"),
      },
    ];
    const res: any = await invokeLLM({ messages });
    const polished = res?.choices?.[0]?.message?.content?.toString().trim();
    if (
      polished &&
      polished.length > 30 &&
      polished.includes(reference) &&
      !/\bapproved\b|\bpre-?approved\b/i.test(polished)
    ) {
      return { reply: polished, language };
    }
  } catch (err) {
    console.warn("[Naledi] LLM failed, using template fallback:", err instanceof Error ? err.message : String(err));
  }
  return { reply: baseTemplate, language };
}

/**
 * Top-level helper. Pure: no DB writes. Persistence and notification belong
 * to the calling router/webhook so this is trivially testable.
 */
export async function runPreApprovalAgent(
  dealershipId: number,
  input: PreApprovalInput,
): Promise<PreApprovalOutput> {
  const errors = validatePreApprovalInput(input);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
  const referenceNumber = generateReferenceNumber(dealershipId, input.email);
  const { reply, language } = await draftPreApprovalReply(input, referenceNumber);
  const idNumberMasked = maskSouthAfricanId(input.idNumber ?? null);
  const affordabilityHint = computeAffordabilityHint(input);
  return {
    referenceNumber,
    agentReply: reply,
    idNumberMasked,
    language,
    affordabilityHint,
  };
}
