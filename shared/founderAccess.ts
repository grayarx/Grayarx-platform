/** Emails that always receive founder/admin platform access. */
export const FOUNDER_EMAILS = [
  "grayarx@gmail.com",
  "henrique@grayarx.com",
  "legal@grayarx.com",
] as const;

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (FOUNDER_EMAILS.includes(normalized as (typeof FOUNDER_EMAILS)[number])) return true;
  const extra = (process.env.FOUNDER_ALERT_EMAIL ?? process.env.OWNER_EMAIL ?? "")
    .trim()
    .toLowerCase();
  return extra.length > 0 && normalized === extra;
}
