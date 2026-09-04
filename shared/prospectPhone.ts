/**
 * South African dealership phone extraction from already-fetched HTML.
 * Never invents numbers — only what appears on the page (tel: hrefs preferred).
 */

export type ExtractedSaPhone = {
  /** Display form e.g. 011 811 4008 */
  display: string;
  /** Digits only, national 10-digit starting with 0 */
  nationalDigits: string;
  fromTelHref: boolean;
  landline: boolean;
};

/** True for 01x–05x geographic / switchboard numbers (not 06–08 mobiles). */
export function isSaLandline(phone: string | null | undefined): boolean {
  const d = saPhoneDigits(phone);
  return Boolean(d && /^0[1-5]/.test(d));
}

/** National 10-digit form (0xxxxxxxxx) or empty. */
export function saPhoneDigits(phone: string | null | undefined): string | null {
  const normalized = normalizeSaPhone(phone);
  if (!normalized) return null;
  const d = normalized.replace(/\D/g, "");
  return d.length === 10 && d.startsWith("0") ? d : null;
}

/**
 * Accept +27 / 0xx with 9 digits after country or after the leading 0.
 * Returns grouped national display (011 811 4008) or null.
 */
export function normalizeSaPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("27") && d.length === 11) {
    d = `0${d.slice(2)}`;
  } else if (d.startsWith("0027") && d.length === 13) {
    d = `0${d.slice(4)}`;
  }
  if (d.length === 9 && /^[1-8]/.test(d)) {
    d = `0${d}`;
  }
  if (d.length !== 10 || !d.startsWith("0")) return null;
  // 01–08: geographic + mobile. Reject 00 / 09 filler.
  if (!/^0[1-8]\d{8}$/.test(d)) return null;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function pushPhone(
  found: Map<string, ExtractedSaPhone>,
  raw: string,
  fromTelHref: boolean,
): void {
  const display = normalizeSaPhone(raw);
  if (!display) return;
  const nationalDigits = display.replace(/\D/g, "");
  const existing = found.get(nationalDigits);
  if (existing) {
    if (fromTelHref && !existing.fromTelHref) {
      found.set(nationalDigits, {
        ...existing,
        fromTelHref: true,
      });
    }
    return;
  }
  found.set(nationalDigits, {
    display,
    nationalDigits,
    fromTelHref,
    landline: /^0[1-5]/.test(nationalDigits),
  });
}

/** Pull SA numbers from mailto-style tel: links and visible text. */
export function extractSaPhonesFromHtml(html: string): ExtractedSaPhone[] {
  const found = new Map<string, ExtractedSaPhone>();
  const telRe = /tel:\s*(\+?[\d\s().-]{9,22})/gi;
  let m: RegExpExecArray | null;
  while ((m = telRe.exec(html)) !== null) {
    pushPhone(found, m[1]!, true);
  }

  const plusRe = /\+27[\s().-]*([1-9](?:[\s().-]*\d){8})/g;
  while ((m = plusRe.exec(html)) !== null) {
    pushPhone(found, `+27${m[1]!.replace(/\D/g, "")}`, false);
  }

  const nationalRe = /(?:^|[^\d])(0[1-8](?:[\s().-]*\d){8})(?!\d)/g;
  while ((m = nationalRe.exec(html)) !== null) {
    pushPhone(found, m[1]!, false);
  }

  return [...found.values()];
}

/**
 * Prefer switchboard (landline) tel: links — typical on contact/about pages —
 * over random mobiles in footers.
 */
export function pickPreferredSaPhone(
  html: string,
  opts?: { pageUrl?: string },
): string | null {
  const extracted = extractSaPhonesFromHtml(html);
  if (extracted.length === 0) return null;
  const contactPage = /contact|about|team|people|staff|leadership|directors/i.test(
    opts?.pageUrl ?? "",
  );
  const telLandline = extracted.filter((p) => p.fromTelHref && p.landline);
  const telAny = extracted.filter((p) => p.fromTelHref);
  const landline = extracted.filter((p) => p.landline);
  if (contactPage && telLandline[0]) return telLandline[0].display;
  if (contactPage && telAny[0]) return telAny[0].display;
  if (telLandline[0]) return telLandline[0].display;
  if (landline[0]) return landline[0].display;
  if (telAny[0]) return telAny[0].display;
  return extracted[0]!.display;
}

const INTL_TEL_RE =
  /tel:\s*(\+\s*(?:61|44|1|971|64)[\d\s().-]{8,18})/gi;

/** Explicit +61 / +44 / +1 / +971 / +64 from tel: hrefs — never invent. */
export function extractIntlTelHrefs(html: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  INTL_TEL_RE.lastIndex = 0;
  while ((m = INTL_TEL_RE.exec(html)) !== null) {
    const compact = m[1]!.replace(/[^\d+]/g, "");
    if (compact.length < 10 || compact.length > 16) continue;
    found.add(compact.startsWith("+") ? compact : `+${compact}`);
  }
  return [...found];
}

export function pickPreferredDealerPhone(
  html: string,
  opts?: { pageUrl?: string },
): string | null {
  return pickPreferredSaPhone(html, opts) ?? extractIntlTelHrefs(html)[0] ?? null;
}

/**
 * Keep a good existing number. Never replace it with empty.
 * Same digits → prefer the normalized display. Landline beats mobile.
 */
export function mergeDiscoveredPhone(
  existing: string | null | undefined,
  discovered: string | null | undefined,
): string | null {
  const prevSa = normalizeSaPhone(existing);
  const nextSa = normalizeSaPhone(discovered);
  if (nextSa || prevSa) {
    if (!nextSa) return prevSa;
    if (!prevSa) return nextSa;
    if (saPhoneDigits(prevSa) === saPhoneDigits(nextSa)) return nextSa;
    if (isSaLandline(nextSa) && !isSaLandline(prevSa)) return nextSa;
    return prevSa;
  }
  const prev = (existing ?? "").trim();
  const next = (discovered ?? "").trim();
  if (!next) return prev || null;
  if (!prev) return next;
  return prev;
}
