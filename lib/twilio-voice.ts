export function getWebhookBaseUrl(request?: Request): string | null {
  const configured =
    process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (configured) return configured;

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host && !host.includes("localhost") && !host.startsWith("127.0.0.1")) {
      return `${proto}://${host}`;
    }
  }

  return null;
}

export function getTwilioVoiceName(): string {
  return process.env.TWILIO_VOICE ?? "Polly.Amy";
}

export function getTwilioSpeechLanguage(): string {
  return process.env.TWILIO_SPEECH_LANGUAGE ?? "en-GB";
}

export function normalizeZaPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("27")) return `+${digits}`;
  if (digits.startsWith("0")) return `+27${digits.slice(1)}`;
  return `+${digits}`;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
