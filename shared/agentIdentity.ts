/**
 * Per-dealership assistant identity helpers (display name, shortcode, opt-out).
 */

export const DEFAULT_AGENT_DISPLAY_NAME = "Nala";

export function resolveAgentDisplayName(
  raw?: string | null,
): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return DEFAULT_AGENT_DISPLAY_NAME;
  // Keep short — WhatsApp disclosure + greetings.
  return trimmed.slice(0, 40);
}

/** Slug a dealership name into a 4–12 char public shortcode candidate. */
export function slugifyPublicShortcode(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  return (base.length >= 4 ? base : `${base}yard`.slice(0, 8)) || "dealer";
}

/** Append a short random suffix for uniqueness (still ≤12 chars). */
export function withShortcodeSuffix(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 5);
  return `${base.slice(0, 9)}${suffix}`.slice(0, 12);
}

const OPT_OUT_RE =
  /^\s*(stop|unsubscribe|opt[\s-]?out|cancel|end|quit|stopall|stop all)\s*[.!]*\s*$/i;

/** True when the inbound WhatsApp text is a clear STOP / opt-out keyword. */
export function isWhatsAppOptOutMessage(text: string): boolean {
  return OPT_OUT_RE.test((text ?? "").trim());
}

/** True when the buyer wants to resume after opting out. */
export function isWhatsAppOptInMessage(text: string): boolean {
  return /^\s*(start|unstop|subscribe|opt[\s-]?in|resume)\s*[.!]*\s*$/i.test(
    (text ?? "").trim(),
  );
}

export function whatsappOptOutConfirmation(agentName = DEFAULT_AGENT_DISPLAY_NAME): string {
  return (
    `You're opted out — we won't send further automated follow-ups from ${agentName}. ` +
    `You'll still receive a reply if you message us first about a specific car, booking, or finance question. ` +
    `Reply START anytime to turn automated help back on.`
  );
}

export function whatsappOptInConfirmation(agentName = DEFAULT_AGENT_DISPLAY_NAME): string {
  return `Welcome back — ${agentName} is happy to help again. What are you looking for?`;
}

/** Lightweight POPIA note for first web-chat greeting. */
export function webChatPopiaAck(agentName = DEFAULT_AGENT_DISPLAY_NAME): string {
  return (
    `By chatting, you agree we may process your messages and contact details to help with your enquiry (POPIA). ` +
    `${agentName} is an AI assistant.`
  );
}
