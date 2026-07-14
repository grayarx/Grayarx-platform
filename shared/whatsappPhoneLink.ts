/**
 * Pure helpers for Meta WhatsApp phone_number_id ↔ onboarding notes.
 * Kept free of DB imports so server/db.ts can use them safely.
 */

/** Meta phone_number_id values are long numeric strings (typically 15–16 digits). */
const META_ID_TAG = /\[metaPhoneNumberId:([0-9]{10,64})\]/i;

/** Extract a Meta phone_number_id previously stashed in onboarding notes. */
export function parseMetaPhoneNumberIdFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(META_ID_TAG);
  return m?.[1] ?? null;
}

/** Append or replace the Meta ID tag in notes (avoids duplicate tags). */
export function mergeMetaPhoneNumberIdIntoNotes(
  notes: string | null | undefined,
  phoneNumberId: string,
): string {
  const id = phoneNumberId.trim();
  const tag = `[metaPhoneNumberId:${id}]`;
  const base = (notes ?? "").replace(META_ID_TAG, "").trim();
  return base ? `${base}\n${tag}` : tag;
}

/** Resolve Meta ID from onboarding row (column first, then notes tag). */
export function resolveOnboardingWhatsappPhoneNumberId(sub: {
  whatsappPhoneNumberId?: string | null;
  notes?: string | null;
}): string | null {
  const fromCol = sub.whatsappPhoneNumberId?.trim() || null;
  if (fromCol) return fromCol;
  return parseMetaPhoneNumberIdFromNotes(sub.notes);
}
