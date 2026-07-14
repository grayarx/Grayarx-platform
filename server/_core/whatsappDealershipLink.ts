/**
 * Multi-dealer WhatsApp routing helpers.
 * Links Meta phone_number_id → dealership without founder pasting every time.
 */
import { and, eq, isNull, or } from "drizzle-orm";
import { dealerships, onboardingSubmissions } from "../../drizzle/schema";
import { getDb } from "../db";
import { phonesMatch } from "../../shared/saMarketGuides";
import { mergeMetaPhoneNumberIdIntoNotes } from "../../shared/whatsappPhoneLink";

export {
  parseMetaPhoneNumberIdFromNotes,
  mergeMetaPhoneNumberIdIntoNotes,
  resolveOnboardingWhatsappPhoneNumberId,
} from "../../shared/whatsappPhoneLink";

/**
 * Resolve Meta phone_number_id (+ optional display_phone_number) → dealership id.
 *
 * Order:
 *  1. Exact DB match on dealerships.whatsappPhoneNumberId
 *  2. Auto-bind by display/contact phone when exactly one unbound dealer matches
 *  3. Stash phone_number_id on matching pending onboarding (applied at provision)
 *  4. Env WHATSAPP_DEALERSHIP_ID for routing only — auto-write only when safe
 *     (fallback dealer empty AND no other dealers)
 *  5. Never overwrite an existing whatsappPhoneNumberId on any dealer
 */
export async function resolveDealershipIdFromPhoneNumberId(
  phoneNumberId: string | null,
  displayPhoneNumber?: string | null,
): Promise<number> {
  const configuredDealerId = Number(process.env.WHATSAPP_DEALERSHIP_ID || "1");
  const fallbackDealerId =
    Number.isFinite(configuredDealerId) && configuredDealerId > 0 ? configuredDealerId : 1;

  if (!phoneNumberId?.trim()) {
    return fallbackDealerId;
  }

  const pid = phoneNumberId.trim();

  try {
    const db = await getDb();
    if (!db) return fallbackDealerId;

    // 1) Exact match
    const [exact] = await db
      .select({ id: dealerships.id })
      .from(dealerships)
      .where(eq(dealerships.whatsappPhoneNumberId, pid))
      .limit(1);
    if (exact) {
      console.log(`[WhatsApp Webhook] Resolved phone_number_id ${pid} → dealership ${exact.id}`);
      return exact.id;
    }

    // 2) Match by Meta display_phone_number ↔ dealership contactPhone
    const display = displayPhoneNumber?.trim() || null;
    if (display) {
      const candidates = await db
        .select({
          id: dealerships.id,
          contactPhone: dealerships.contactPhone,
          whatsappPhoneNumberId: dealerships.whatsappPhoneNumberId,
          status: dealerships.status,
        })
        .from(dealerships);

      const phoneMatches = candidates.filter(
        (d) => d.contactPhone?.trim() && phonesMatch(d.contactPhone, display),
      );

      const unboundMatches = phoneMatches.filter((d) => !d.whatsappPhoneNumberId?.trim());

      if (unboundMatches.length === 1) {
        const target = unboundMatches[0]!;
        await db
          .update(dealerships)
          .set({ whatsappPhoneNumberId: pid })
          .where(
            and(
              eq(dealerships.id, target.id),
              or(isNull(dealerships.whatsappPhoneNumberId), eq(dealerships.whatsappPhoneNumberId, "")),
            ),
          );
        console.log(
          `[WhatsApp Webhook] Auto-bound phone_number_id ${pid} → dealership ${target.id} via contactPhone match (${display})`,
        );
        return target.id;
      }

      if (unboundMatches.length > 1) {
        console.warn(
          `[WhatsApp Webhook] phone_number_id ${pid} unmatched; ${unboundMatches.length} unbound dealers share display phone ${display} — not auto-binding`,
        );
      }

      // Already-bound dealer with same contact phone but different Meta id — do not overwrite
      const boundOther = phoneMatches.find(
        (d) => d.whatsappPhoneNumberId?.trim() && d.whatsappPhoneNumberId.trim() !== pid,
      );
      if (boundOther) {
        console.warn(
          `[WhatsApp Webhook] display ${display} matches dealership ${boundOther.id} but it already has phone_number_id ${boundOther.whatsappPhoneNumberId} — not overwriting`,
        );
      }

      // 3) Pending onboarding / approved-but-not-provisioned: stash for provision
      const pendingSubs = await db
        .select({
          id: onboardingSubmissions.id,
          ownerPhone: onboardingSubmissions.ownerPhone,
          notes: onboardingSubmissions.notes,
          status: onboardingSubmissions.status,
          whatsappPhoneNumberId: onboardingSubmissions.whatsappPhoneNumberId,
          provisionedDealershipId: onboardingSubmissions.provisionedDealershipId,
        })
        .from(onboardingSubmissions)
        .where(
          or(
            eq(onboardingSubmissions.status, "new"),
            eq(onboardingSubmissions.status, "reviewing"),
            eq(onboardingSubmissions.status, "approved"),
          ),
        );

      const pendingMatches = pendingSubs.filter(
        (s) =>
          !s.provisionedDealershipId &&
          s.ownerPhone?.trim() &&
          phonesMatch(s.ownerPhone, display),
      );

      if (pendingMatches.length === 1) {
        const sub = pendingMatches[0]!;
        if (!sub.whatsappPhoneNumberId?.trim()) {
          await db
            .update(onboardingSubmissions)
            .set({
              whatsappPhoneNumberId: pid,
              notes: mergeMetaPhoneNumberIdIntoNotes(sub.notes, pid),
            })
            .where(eq(onboardingSubmissions.id, sub.id));
          console.log(
            `[WhatsApp Webhook] Stashed phone_number_id ${pid} on onboarding submission ${sub.id} (phone match) — will bind on provision`,
          );
        }
      } else if (pendingMatches.length > 1) {
        console.warn(
          `[WhatsApp Webhook] ${pendingMatches.length} pending onboarding rows match ${display} — not stashing phone_number_id`,
        );
      }
    }

    // 4) Env fallback — route traffic, but only auto-write when safe
    const allDealers = await db
      .select({
        id: dealerships.id,
        whatsappPhoneNumberId: dealerships.whatsappPhoneNumberId,
      })
      .from(dealerships);

    const dealerCount = allDealers.length;
    const [fallback] = allDealers.filter((d) => d.id === fallbackDealerId);

    const otherDealersExist = dealerCount > 1;
    const fallbackEmpty = !fallback?.whatsappPhoneNumberId?.trim();

    if (fallback && fallbackEmpty && !otherDealersExist) {
      await db
        .update(dealerships)
        .set({ whatsappPhoneNumberId: pid })
        .where(eq(dealerships.id, fallbackDealerId));
      console.log(
        `[WhatsApp Webhook] Auto-synced phone_number_id ${pid} → sole dealership ${fallbackDealerId} (was empty)`,
      );
      return fallbackDealerId;
    }

    if (otherDealersExist) {
      console.warn(
        `[WhatsApp Webhook] phone_number_id ${pid} unmatched` +
          (displayPhoneNumber?.trim() ? ` (display=${displayPhoneNumber.trim()})` : "") +
          `; ${dealerCount} dealers exist — NOT writing onto dealership ${fallbackDealerId}. ` +
          `Routing this event to env fallback ${fallbackDealerId} only. ` +
          `Set phone_number_id via onboarding, Admin → WhatsApp / LLM, or wait for contactPhone auto-bind.`,
      );
    } else if (fallback?.whatsappPhoneNumberId?.trim()) {
      console.warn(
        `[WhatsApp Webhook] phone_number_id ${pid} unmatched; dealership ${fallbackDealerId} already has ${fallback.whatsappPhoneNumberId} — not overwriting; using env fallback for routing`,
      );
    } else {
      console.warn(
        `[WhatsApp Webhook] No DB match for phone_number_id ${pid}; using env fallback → dealership ${fallbackDealerId}`,
      );
    }

    return fallbackDealerId;
  } catch (err) {
    console.warn("[WhatsApp Webhook] DB lookup failed, falling back to env var:", err);
    return fallbackDealerId;
  }
}
