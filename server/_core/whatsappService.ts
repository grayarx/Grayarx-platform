/**
 * WhatsApp Business API Service
 * Handles WhatsApp messaging for dealership enquiries and customer communication
 * Uses Meta WhatsApp Cloud API for real message delivery
 */

import crypto from "crypto";
import {
  createWhatsappMessage,
  getOrCreateWhatsappConversation,
  updateWhatsappMessageStatus,
  enqueueWhatsappMessage,
  logWhatsappWebhook,
} from "../db";
import { isTransientError } from "./agentResilience";

interface WhatsAppMessage {
  phone: string;
  message: string;
  type: "customer_enquiry" | "dealership_response" | "automated_reply";
  vehicleId?: string;
  dealershipId?: string;
  /** Use the phone_number_id from the inbound webhook — overrides DB/env. */
  phoneNumberId?: string;
}

interface WhatsAppTemplate {
  name: string;
  language: string;
  parameters?: Record<string, string>;
}

interface MetaMessageResponse {
  messages: Array<{
    id: string;
    message_status: string;
  }>;
}

/**
 * Format phone number to E.164 format for WhatsApp
 */
function formatPhoneNumber(phone: string): string {
  // Remove common formatting
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // If it starts with +, remove it
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // If it starts with 0 (South Africa), replace with 27
  if (cleaned.startsWith("0")) {
    cleaned = "27" + cleaned.substring(1);
  }

  // If it doesn't start with country code, assume South Africa
  if (!cleaned.startsWith("27") && cleaned.length === 9) {
    cleaned = "27" + cleaned;
  }

  return cleaned;
}

/**
 * Send WhatsApp message via Meta API
 */
export async function sendWhatsAppMessage(
  message: WhatsAppMessage
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Priority: explicit inbound ID > DB lookup by dealership > env fallback
    let whatsappBusinessPhoneId = message.phoneNumberId || undefined;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;
    const resolvedDealershipId = message.dealershipId ? Number(message.dealershipId) : 0;

    if (!whatsappBusinessPhoneId && resolvedDealershipId > 0) {
      try {
        const { getDb } = await import("../db");
        const { dealerships } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          const [row] = await db
            .select({ whatsappPhoneNumberId: dealerships.whatsappPhoneNumberId })
            .from(dealerships)
            .where(eq(dealerships.id, resolvedDealershipId))
            .limit(1);
          if (row?.whatsappPhoneNumberId) {
            whatsappBusinessPhoneId = row.whatsappPhoneNumberId;
          }
        }
      } catch (e) {
        console.warn("[WhatsAppService] DB lookup for phone ID failed, using fallback");
      }
    }

    if (!whatsappBusinessPhoneId) {
      whatsappBusinessPhoneId =
        process.env.WHATSAPP_BUSINESS_PHONE_ID ||
        process.env.WHATSAPP_PHONE_NUMBER_ID ||
        process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    }

    if (!whatsappBusinessPhoneId || !whatsappAccessToken) {
      console.warn("[WhatsAppService] WhatsApp credentials missing");
      return { success: false, error: "WhatsApp credentials not configured" };
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(message.phone);

    if (message.type === "automated_reply") {
      const { gateWhatsAppSend, recordWhatsAppConversation } = await import("./nalaOs/billing/usage");
      const dealerKey = String(message.dealershipId ?? "demo-yard");
      const gate = gateWhatsAppSend({ dealershipId: dealerKey, buyerPhone: formattedPhone });
      if (!gate.allowed) {
        console.warn(`[WhatsApp] Pilot/plan cap blocked send: ${gate.reason}`);
        return { success: false, error: gate.reason };
      }
      recordWhatsAppConversation({ dealershipId: dealerKey, buyerPhone: formattedPhone });
    }

    // Get or create conversation
    if (resolvedDealershipId > 0) {
      try {
        await getOrCreateWhatsappConversation(
          resolvedDealershipId,
          formattedPhone,
          message.vehicleId ? Number(message.vehicleId) : undefined
        );
      } catch (error) {
        console.error("[WhatsAppService] Failed to create conversation:", error);
      }
    }

    // Call Meta WhatsApp Cloud API (facebook graph — not Instagram)
    const metaUrl = `https://graph.facebook.com/v22.0/${whatsappBusinessPhoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message.message,
      },
    };

    console.log(`[WhatsApp] Sending to +${formattedPhone}: ${message.message.substring(0, 50)}...`);

    const response = await fetch(metaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${whatsappAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorStr = `WhatsApp API error: ${response.status} ${JSON.stringify(errorData)}`;
      console.error("[WhatsApp] API Error:", errorData);
      // Auto-enqueue for retry when the failure looks transient (5xx / timeout)
      if (isTransientError(new Error(errorStr))) {
        try {
          await enqueueWhatsappMessage({
            conversationId: resolvedDealershipId || 1,
            phoneNumber: formattedPhone,
            messageContent: message.message,
            messageType: "text",
          });
          console.error("[WhatsApp] Send failed, enqueued for retry:", { phone: formattedPhone, error: errorStr });
        } catch (qErr) {
          console.error("[WhatsApp] Failed to enqueue retry:", qErr);
        }
      }
      return {
        success: false,
        error: errorStr,
      };
    }

    const data = (await response.json()) as MetaMessageResponse;
    const metaMessageId = data.messages?.[0]?.id;

    if (!metaMessageId) {
      return {
        success: false,
        error: "No message ID returned from WhatsApp API",
      };
    }

    // Store message in database
    if (resolvedDealershipId > 0) {
      try {
        await createWhatsappMessage({
          conversationId: resolvedDealershipId, // Will be updated to actual conversation ID
          direction: "outbound",
          messageType: "text",
          content: message.message,
          metaMessageId,
          status: "sent",
        });
      } catch (error) {
        console.error("[WhatsAppService] Failed to store message:", error);
      }
    }

    console.log(`[WhatsApp] Message sent successfully: ${metaMessageId}`);

    return {
      success: true,
      messageId: metaMessageId,
    };
  } catch (error) {
    console.error("[WhatsAppService] Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send WhatsApp template message via Meta API
 */
export async function sendWhatsAppTemplate(
  phone: string,
  template: WhatsAppTemplate
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const whatsappBusinessPhoneId =
      process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;

    if (!whatsappBusinessPhoneId || !whatsappAccessToken) {
      console.warn("[WhatsAppService] WhatsApp credentials missing");
      return { success: false, error: "WhatsApp credentials not configured" };
    }

    const formattedPhone = formatPhoneNumber(phone);

    const metaUrl = `https://graph.facebook.com/v22.0/${whatsappBusinessPhoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: template.name,
        language: {
          code: template.language,
        },
        parameters: template.parameters
          ? {
              body: {
                parameters: Object.values(template.parameters),
              },
            }
          : undefined,
      },
    };

    console.log(`[WhatsApp] Sending template ${template.name} to +${formattedPhone}`);

    const response = await fetch(metaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${whatsappAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[WhatsApp] Template API Error:", errorData);
      return {
        success: false,
        error: `WhatsApp API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as MetaMessageResponse;
    const metaMessageId = data.messages?.[0]?.id;

    if (!metaMessageId) {
      return {
        success: false,
        error: "No message ID returned from WhatsApp API",
      };
    }

    console.log(`[WhatsApp] Template sent successfully: ${metaMessageId}`);

    return {
      success: true,
      messageId: metaMessageId,
    };
  } catch (error) {
    console.error("[WhatsAppService] Error sending WhatsApp template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send up to 3 vehicle photos via WhatsApp image messages.
 * The last photo gets a caption with the vehicle title, price, and next-step CTA.
 * Silently skips non-HTTPS URLs and is a no-op if credentials are missing.
 */
export async function sendVehiclePhotosViaWhatsApp(
  phone: string,
  vehicle: { title: string; price?: number | string | null },
  photoUrls: string[],
  dealershipId: string | number,
  phoneNumberId?: string,
): Promise<void> {
  let whatsappBusinessPhoneId = phoneNumberId || undefined;
  const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;

  if (!whatsappBusinessPhoneId && dealershipId && Number(dealershipId) > 0) {
    try {
      const { getDb } = await import("../db");
      const { dealerships } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const [row] = await db
          .select({ whatsappPhoneNumberId: dealerships.whatsappPhoneNumberId })
          .from(dealerships)
          .where(eq(dealerships.id, Number(dealershipId)))
          .limit(1);
        if (row?.whatsappPhoneNumberId) {
          whatsappBusinessPhoneId = row.whatsappPhoneNumberId;
        }
      }
    } catch (e) {
      console.warn("[WhatsAppService] DB lookup for photo phone ID failed");
    }
  }

  if (!whatsappBusinessPhoneId) {
    whatsappBusinessPhoneId =
      process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  if (!whatsappBusinessPhoneId || !whatsappAccessToken) {
    console.warn("[WhatsApp] Credentials missing — skipping vehicle photo send");
    return;
  }

  const formattedPhone = formatPhoneNumber(phone);
  const metaUrl = `https://graph.facebook.com/v22.0/${whatsappBusinessPhoneId}/messages`;
  const appUrl = (process.env.APP_URL ?? "").replace(/\/+$/, "");
  // Make relative paths absolute — Meta must be able to fetch the URL
  const resolvedUrls = photoUrls.map((u) =>
    u.startsWith("http://") || u.startsWith("https://") ? u : `${appUrl}${u}`,
  );
  const publicUrls = resolvedUrls.filter((u) => u.startsWith("https://")).slice(0, 3);

  if (publicUrls.length === 0) {
    console.warn("[WhatsApp] No public HTTPS photo URLs available (APP_URL may not be set or photos are local):", photoUrls.slice(0, 3));
    return;
  }

  const priceStr = vehicle.price
    ? ` — R${Number(vehicle.price).toLocaleString("en-ZA")}`
    : "";
  const lastCaption =
    `${vehicle.title}${priceStr}\n\nBeautiful, right? 😍 Let me know if you'd like to come in for a test drive, or if you have any questions about this one!`;

  for (let i = 0; i < publicUrls.length; i++) {
    const isLast = i === publicUrls.length - 1;
    const payload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "image",
      image: {
        link: publicUrls[i],
        ...(isLast ? { caption: lastCaption } : {}),
      },
    };

    try {
      const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${whatsappAccessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[WhatsApp] Photo ${i + 1}/${publicUrls.length} send error:`, errorData);
      } else {
        const data = (await response.json()) as MetaMessageResponse;
        console.log(
          `[WhatsApp] Photo ${i + 1}/${publicUrls.length} sent: ${data.messages?.[0]?.id}`,
        );
      }
    } catch (err) {
      console.error(`[WhatsApp] Error sending photo ${i + 1}:`, err);
    }
  }
}

/**
 * Handle incoming WhatsApp message from customer (called by webhook)
 * Uses multilingual Nala pipeline (same as web showroom chat).
 *
 * When `alreadyPersisted` is true (webhook path), skip writing the inbound
 * row again — the webhook already stored it with the Meta message id.
 */
export async function handleIncomingWhatsAppMessage(
  phone: string,
  message: string,
  dealershipId: string,
  options?: { alreadyPersisted?: boolean; phoneNumberId?: string },
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const replyPhoneId = options?.phoneNumberId;
    const dealershipIdNum = Number(dealershipId);

    const {
      listVehicles,
      getVehicle,
      getDealershipById,
      getOrCreateWhatsappConversation,
      setWhatsappConversationOptedOut,
      searchVehiclesForChat,
      createWhatsappMessage,
    } = await import("../db");
    const {
      parseVehicleTitleFromMessage,
      findVehicleFromMessage,
      findVehiclesFromMessage,
      buildMultiVehicleReply,
      buildNoMatchFallbackReply,
      detectMakeFromMessage,
      detectBodyTypesFromMessage,
      detectColorFromMessage,
      buildSearchTerm,
      vehicleRowToContext,
      getConvState,
      stripMarkdownForWhatsApp,
    } = await import("./nalaReplyOrchestrator");
    const { resolveRoutedReply } = await import("./agentIntentRouter");
    const { scoreListingDeal } = await import("../../shared/priceIntelligence");
    const { detectLanguage } = await import("../../shared/languages");
    const { addWhatsAppAIDisclosure } = await import("./agentPrompts");
    const {
      isWhatsAppOptOutMessage,
      isWhatsAppOptInMessage,
      whatsappOptOutConfirmation,
      whatsappOptInConfirmation,
      resolveAgentDisplayName,
    } = await import("../../shared/agentIdentity");

    const dealership = await getDealershipById(dealershipIdNum);
    const dealerName = dealership?.name ?? "GrayArx Dealership";
    const agentName = resolveAgentDisplayName(dealership?.agentDisplayName);
    let conversation = await getOrCreateWhatsappConversation(
      dealershipIdNum,
      formattedPhone,
    );

    // ── STOP / START opt-out (always allowed — before usage soft-block) ─────
    if (isWhatsAppOptOutMessage(message)) {
      await setWhatsappConversationOptedOut(conversation.id, true);
      const reply = addWhatsAppAIDisclosure(
        whatsappOptOutConfirmation(agentName),
        "en",
        agentName,
      );
      if (!options?.alreadyPersisted) {
        await createWhatsappMessage({
          conversationId: conversation.id,
          direction: "inbound",
          messageType: "text",
          content: message,
          status: "delivered",
        });
      }
      await sendWhatsAppMessage({
        phone: formattedPhone,
        message: reply,
        type: "automated_reply",
        dealershipId: String(dealershipId),
        phoneNumberId: replyPhoneId,
      });
      return { success: true, response: reply };
    }

    if (isWhatsAppOptInMessage(message) && conversation.optedOutAt) {
      await setWhatsappConversationOptedOut(conversation.id, false);
      const reply = addWhatsAppAIDisclosure(
        whatsappOptInConfirmation(agentName),
        "en",
        agentName,
      );
      await sendWhatsAppMessage({
        phone: formattedPhone,
        message: reply,
        type: "automated_reply",
        dealershipId: String(dealershipId),
        phoneNumberId: replyPhoneId,
      });
      return { success: true, response: reply };
    }

    // Enforce OS plan caps (Starter 1,000 / Professional 3,500 / Enterprise 12,000 WA)
    const { checkWhatsAppUsageCap } = await import("./usageCaps");
    const usage = await checkWhatsAppUsageCap(dealershipIdNum);
    if (usage.blocked && usage.message) {
      try {
        await sendWhatsAppMessage({
          phone: formattedPhone,
          message: usage.message,
          type: "automated_reply",
          dealershipId: String(dealershipId),
          phoneNumberId: replyPhoneId,
        });
      } catch (sendErr) {
        console.warn(
          "[WhatsApp] usage-cap soft-block send failed:",
          sendErr instanceof Error ? sendErr.message : String(sendErr),
        );
      }
      return { success: true, response: usage.message, error: usage.kind };
    }

    // Opted-out buyers still get help when they message first (transactional),
    // but we skip proactive marketing-style drip. Stock Q&A / booking continue.

    // Prefer DB-filtered search for make/body/budget/colour; keep a small
    // newest-stock window only for "top deals" hints.
    const detectedMakeEarly = detectMakeFromMessage(message);
    const detectedBodyTypesEarly = detectBodyTypesFromMessage(message);
    const detectedColor = detectColorFromMessage(message);
    const budgetMatch = message.match(
      /(?:under|below|less than|max|budget|goedkoper as|onder)\s*r?\s*(\d[\d\s,]*)\s*(k\b)?/i,
    );
    let maxPrice: number | null = null;
    if (budgetMatch) {
      const raw = budgetMatch[1].replace(/[\s,]/g, "");
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num >= 10) {
        maxPrice = (budgetMatch[2] ?? "").toLowerCase() === "k" ? num * 1000 : num;
      }
    }

    const needsFilteredSearch =
      Boolean(detectedMakeEarly) ||
      Boolean(detectedBodyTypesEarly) ||
      Boolean(detectedColor) ||
      maxPrice != null;

    const filteredVehicles = needsFilteredSearch
      ? await searchVehiclesForChat({
          dealershipId: dealershipIdNum,
          make: detectedMakeEarly,
          bodyTypes: detectedBodyTypesEarly,
          color: detectedColor,
          maxPrice,
          limit: 40,
        })
      : [];

    const allVehicles =
      filteredVehicles.length > 0
        ? filteredVehicles
        : await listVehicles(80, {
            dealershipId: dealershipIdNum,
            excludeSold: true,
          });

    // ── Determine & LOCK language for this phone (must happen before any path diverges) ──
    const convState = getConvState(formattedPhone);
    const { updateConvState } = await import("./nalaReplyOrchestrator");
    const detectedLang = detectLanguage(message);
    // Language upgrade logic:
    //   • No existing state → use detected language
    //   • Existing state is "en" (ambiguous first greeting like "Hi") and we now detect
    //     a specific language → upgrade to that language (user switched to their home language)
    //   • Existing state is a specific language → keep it (don't let one ambiguous message reset)
    const earlyLang: typeof detectedLang =
      convState?.lang && convState.lang !== "en"
        ? convState.lang        // already locked to specific language — keep it
        : detectedLang !== "en"
          ? detectedLang        // detected a specific language — use it (upgrades "en" lock)
          : (convState?.lang ?? "en"); // ambiguous — use existing lock or default en
    // Persist language (always write if not set, or if upgrading from "en")
    if (!convState?.lang || (convState.lang === "en" && earlyLang !== "en")) {
      updateConvState(formattedPhone, { stage: convState?.stage ?? "greeting", lang: earlyLang });
    }

    const topDealHints = allVehicles
      .filter((v) => v.status === "available" && v.price && Number(v.price) > 1)
      .map((v) => ({
        v,
        score: scoreListingDeal(Number(v.price), {
          make: v.make,
          model: v.model,
          year: v.year,
          mileageKm: v.km,
          title: v.title,
        }),
      }))
      .filter((x) => x.score?.rating === "great")
      .sort((a, b) => (b.score?.deltaPct ?? 0) - (a.score?.deltaPct ?? 0))
      .slice(0, 3)
      .map(({ v }) => ({ title: v.title ?? "Vehicle", price: v.price }));

    // ── Price / budget intent ────────────────────────────────────────────────
    const PRICE_OBJECTION_RE = /\b(too expensive|can'?t afford|cheaper|something cheaper|more affordable|less than|under r?\s*\d|budget|r\d{3,}k?|within my budget|lower price|goedkoper|te duur|bekostigbaar|shibhile|ntengo|nyauveka|amahle|abiza|hlafo|theko|leseding|chelete|tshenyegelo|madi a mantsi)\b/i;
    const hasPriceObjection = PRICE_OBJECTION_RE.test(message);

    if (hasPriceObjection) {
      const parseBudgetFromMessage = (msg: string): number | null => {
        const m = msg.match(/r?\s*(\d[\d\s,]*)\s*(k\b|000\b)?/i);
        if (!m) return null;
        const raw = m[1].replace(/[\s,]/g, "");
        const num = parseInt(raw, 10);
        if (isNaN(num) || num < 10) return null;
        const multiplier = (m[2] ?? "").toLowerCase() === "k" ? 1000 : 1;
        return num * multiplier;
      };

      const budgetCeiling = parseBudgetFromMessage(message) ?? maxPrice;
      const availableVehicles = allVehicles.filter((v) => v.status === "available" || v.status == null);
      const lang = earlyLang;

      const BUDGET_HEADER: Record<string, string> = {
        en: `No problem — here are some more affordable options${budgetCeiling ? ` under R${Math.round(budgetCeiling).toLocaleString("en-ZA")}` : ""}:`,
        af: `Geen probleem nie — hier is 'n paar meer bekostigbare opsies${budgetCeiling ? ` onder R${Math.round(budgetCeiling).toLocaleString("en-ZA")}` : ""}:`,
        zu: `Akukho nkinga — nanti izinketho ezinamanani aphansi${budgetCeiling ? ` ngaphansi kwe-R${Math.round(budgetCeiling).toLocaleString("en-ZA")}` : ""}:`,
      };
      const BUDGET_FOOTER: Record<string, string> = {
        en: "Which of these interests you? I can share more details or arrange a test drive.",
        af: "Watter een stel jy in belang? Ek kan meer besonderhede deel of 'n toetsrit reël.",
        zu: "Yiyiphi le ethokozisa? Ngingahlangabeza imininingwane engcono noma ngihlele ukuqhuba.",
      };

      let affordableVehicles = budgetCeiling
        ? availableVehicles.filter((v) => Number(v.price ?? 0) > 1 && Number(v.price) <= budgetCeiling * 1.1)
        : [];

      // No budget given or no matches → show 3 cheapest
      if (affordableVehicles.length === 0) {
        // Re-query DB by budget if in-memory window was too small
        if (budgetCeiling) {
          affordableVehicles = await searchVehiclesForChat({
            dealershipId: dealershipIdNum,
            maxPrice: budgetCeiling * 1.1,
            make: detectedMakeEarly,
            bodyTypes: detectedBodyTypesEarly,
            color: detectedColor,
            limit: 8,
          });
        }
        if (affordableVehicles.length === 0) {
          affordableVehicles = availableVehicles
            .filter((v) => Number(v.price ?? 0) > 1)
            .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
            .slice(0, 3);
        }
      } else {
        affordableVehicles = affordableVehicles
          .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
          .slice(0, 6);
      }

      if (affordableVehicles.length > 0) {
        const header = BUDGET_HEADER[lang] ?? BUDGET_HEADER.en;
        const footer = BUDGET_FOOTER[lang] ?? BUDGET_FOOTER.en;
        const lines = affordableVehicles.map((v) => {
          const year = v.year ? `${v.year} ` : "";
          const title = v.title ?? `${v.make ?? ""} ${v.model ?? ""}`.trim();
          const display = title.startsWith(String(v.year ?? "")) ? title : `${year}${title}`.trim();
          const price = Number(v.price ?? 0) > 1 ? ` — R${Math.round(Number(v.price)).toLocaleString("en-ZA")}` : "";
          return `• ${display}${price}`;
        });
        const budgetReply = `${header}\n\n${lines.join("\n")}\n\n${footer}`;

        conversation = await getOrCreateWhatsappConversation(dealershipIdNum, formattedPhone, undefined);
        if (!options?.alreadyPersisted) {
          await createWhatsappMessage({ conversationId: conversation.id, direction: "inbound", messageType: "text", content: message, status: "delivered" });
        }
        const finalReply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(budgetReply), lang, agentName);
        await sendWhatsAppMessage({ phone: formattedPhone, message: finalReply, type: "automated_reply", dealershipId, phoneNumberId: replyPhoneId });
        console.log(`[WhatsApp budget] +${formattedPhone} lang=${lang} ceiling=${budgetCeiling} matches=${affordableVehicles.length}`);
        return { success: true, response: finalReply };
      }
    }

    // ── Multi-vehicle search: check if the buyer is asking about a make/body type ──
    const multiMatches = findVehiclesFromMessage(message, allVehicles);
    const detectedMake = detectedMakeEarly;
    const detectedBodyTypes = detectedBodyTypesEarly;
    const isInventorySearch = detectedMake !== null || detectedBodyTypes !== null;

    if (multiMatches.length >= 2) {
      // 2+ matching vehicles → show a list reply, skip single-vehicle flow
      const lang = convState?.lang ?? detectLanguage(message);
      const searchTerm = buildSearchTerm(detectedMake, detectedBodyTypes);
      const listReply = buildMultiVehicleReply(multiMatches, searchTerm, lang, dealerName);

      conversation = await getOrCreateWhatsappConversation(
        dealershipIdNum,
        formattedPhone,
        undefined,
      );
      if (!options?.alreadyPersisted) {
        await createWhatsappMessage({
          conversationId: conversation.id,
          direction: "inbound",
          messageType: "text",
          content: message,
          status: "delivered",
        });
      }

      const finalReply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(listReply), lang, agentName);
      await sendWhatsAppMessage({
        phone: formattedPhone,
        message: finalReply,
        type: "automated_reply",
        dealershipId: String(dealershipId),
        phoneNumberId: replyPhoneId,
      });
      console.log(`[WhatsApp multi-vehicle] +${formattedPhone} lang=${lang} found=${multiMatches.length} search="${searchTerm}"`);
      return { success: true, response: finalReply };
    }

    if (multiMatches.length === 0 && isInventorySearch) {
      // 0 matches but the user asked about a specific make/bodytype → no-match fallback
      const lang = convState?.lang ?? detectLanguage(message);
      const searchTerm = buildSearchTerm(detectedMake, detectedBodyTypes);

      // Find similar alternatives: same body type different make, or any available
      const availableVehicles = allVehicles.filter((v) => v.status === "available" || v.status == null);
      let alternatives = detectedBodyTypes
        ? availableVehicles.filter((v) => {
            const vbt = (v.bodyType ?? "").toLowerCase();
            const vModel = (v.model ?? "").toLowerCase();
            const vTitle = (v.title ?? "").toLowerCase();
            return detectedBodyTypes.some((bt) => vbt.includes(bt)) ||
              (detectedBodyTypes.includes("bakkie") &&
                ["ranger", "hilux", "amarok", "navara", "d-max"].some((m) => vModel.includes(m) || vTitle.includes(m))) ||
              (detectedBodyTypes.includes("suv") &&
                ["fortuner", "prado", "rav4", "cr-v", "tucson"].some((m) => vModel.includes(m) || vTitle.includes(m)));
          })
        : availableVehicles;

      // Fall back to any available if no body-type matches either
      if (alternatives.length === 0) alternatives = availableVehicles;
      alternatives = alternatives.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)).slice(0, 5);

      const fallbackReply = buildNoMatchFallbackReply(searchTerm, alternatives, lang);
      conversation = await getOrCreateWhatsappConversation(
        dealershipIdNum,
        formattedPhone,
        undefined,
      );
      if (!options?.alreadyPersisted) {
        await createWhatsappMessage({
          conversationId: conversation.id,
          direction: "inbound",
          messageType: "text",
          content: message,
          status: "delivered",
        });
      }

      const finalReply = addWhatsAppAIDisclosure(stripMarkdownForWhatsApp(fallbackReply), lang, agentName);
      await sendWhatsAppMessage({
        phone: formattedPhone,
        message: finalReply,
        type: "automated_reply",
        dealershipId: String(dealershipId),
        phoneNumberId: replyPhoneId,
      });
      console.log(`[WhatsApp no-match] +${formattedPhone} lang=${lang} search="${searchTerm}"`);
      return { success: true, response: finalReply };
    }

    // ── Single-vehicle flow (0 or 1 match) ────────────────────────────────────
    let vehicleId: number | undefined;

    // If exactly 1 multi-vehicle match, use that vehicle
    if (multiMatches.length === 1 && multiMatches[0]?.id) {
      vehicleId = Number(multiMatches[0].id);
    } else {
      const parsedTitle = parseVehicleTitleFromMessage(message);
      if (parsedTitle) {
        const hay = parsedTitle.toLowerCase();
        const match = allVehicles.find(
          (v) =>
            (v.title ?? "").toLowerCase().includes(hay) ||
            hay.includes((v.title ?? "").toLowerCase().slice(0, 20)),
        );
        if (match?.id) vehicleId = Number(match.id);
      }
      if (!vehicleId) {
        const matched = findVehicleFromMessage(message, allVehicles);
        if (matched?.id) vehicleId = Number(matched.id);
      }
      // No vehicle found in this message → use last vehicle from conversation context
      // so follow-up messages like "tell me more" / "already told ya" stay in context
      if (!vehicleId && convState?.lastVehicleId) {
        vehicleId = convState.lastVehicleId;
      }
    }

    // Refresh with vehicleId once resolved (same scope as opt-out conversation above)
    conversation = await getOrCreateWhatsappConversation(
      dealershipIdNum,
      formattedPhone,
      vehicleId,
    );

    if (vehicleId && !conversation.vehicleId) {
      vehicleId = conversation.vehicleId ?? vehicleId;
    } else if (conversation.vehicleId) {
      vehicleId = conversation.vehicleId;
    }

    // Webhook path already persisted the inbound with metaMessageId — avoid duplicates.
    if (!options?.alreadyPersisted) {
      await createWhatsappMessage({
        conversationId: conversation.id,
        direction: "inbound",
        messageType: "text",
        content: message,
        status: "delivered",
      });
    }

    let vehicleCtx = null;
    if (vehicleId) {
      const row = await getVehicle(vehicleId);
      if (row) {
        vehicleCtx = vehicleRowToContext(row);
        // Persist vehicle context so follow-up messages keep the conversation in scope
        updateConvState(formattedPhone, {
          stage: "vehicle_shown",
          lastVehicleId: vehicleId,
          lastVehicleTitle: row.title ?? undefined,
        });

        // Send gallery photos before the text reply (non-fatal if it fails)
        try {
          const { listVehiclePhotos } = await import("../db");
          const gallery = await listVehiclePhotos(vehicleId);
          const photoUrls: string[] = gallery.map((p) => p.url);
          // Fall back to primary / legacy photo fields if gallery is empty
          if (photoUrls.length === 0) {
            if (row.primaryPhotoUrl) photoUrls.push(row.primaryPhotoUrl);
            else if (row.imageUrl) photoUrls.push(row.imageUrl);
          }
          if (photoUrls.length > 0) {
            await sendVehiclePhotosViaWhatsApp(
              formattedPhone,
              { title: row.title ?? "Vehicle", price: row.price },
              photoUrls,
              String(dealershipIdNum),
              replyPhoneId,
            );
          }
        } catch (photoErr) {
          console.warn("[WhatsApp] Vehicle photo send failed (non-fatal):", photoErr);
        }
      }
    }

    const result = await resolveRoutedReply({
      message,
      vehicle: vehicleCtx,
      vehicleId,
      dealershipId: dealershipIdNum,
      dealershipName: dealerName,
      businessHoursOverride: dealership?.businessHoursJson ?? undefined,
      customerPhone: formattedPhone,
      channel: "whatsapp",
      includeDealScore: true,
      inventoryHints: topDealHints,
      agentDisplayName: agentName,
    });

    console.log(
      `[WhatsApp ${result.agent}] +${formattedPhone} lang=${result.language} intent=${result.intent} source=${result.source ?? "unknown"}`,
    );

    const sent = await sendWhatsAppMessage({
      phone: formattedPhone,
      message: result.reply,
      type: "automated_reply",
      dealershipId: String(dealershipId),
      vehicleId: vehicleId ? String(vehicleId) : undefined,
      phoneNumberId: replyPhoneId,
    });

    if (!sent.success) {
      console.error(`[WhatsApp] Reply FAILED for +${formattedPhone}: ${sent.error}`);
      return { success: false, response: result.reply, error: sent.error };
    }

    return { success: true, response: result.reply };
  } catch (error) {
    console.error("[WhatsAppService] Error handling incoming message:", error);
    return replyOnlyFallback(phone, message, dealershipId, error, options?.phoneNumberId);
  }
}

/** When DB/conversation persistence fails, still send a Nala reply via Meta API. */
async function replyOnlyFallback(
  phone: string,
  message: string,
  dealershipId: string,
  cause: unknown,
  phoneNumberId?: string,
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const { resolveRoutedReply } = await import("./agentIntentRouter");
    const result = await resolveRoutedReply({
      message,
      vehicle: null,
      dealershipId: Number(dealershipId) || 1,
      dealershipName: "GrayArx",
      customerPhone: formattedPhone,
      channel: "whatsapp",
    });
    const sent = await sendWhatsAppMessage({
      phone: formattedPhone,
      message: result.reply,
      type: "automated_reply",
      dealershipId,
      phoneNumberId,
    });
    if (!sent.success) {
      return { success: false, error: sent.error ?? "Failed to send WhatsApp reply" };
    }
    console.warn(
      `[WhatsAppService] Reply-only fallback used for +${formattedPhone} after: ${
        cause instanceof Error ? cause.message : "unknown error"
      }`,
    );
    return { success: true, response: result.reply };
  } catch (fallbackError) {
    console.error("[WhatsAppService] Reply-only fallback failed:", fallbackError);
    return {
      success: false,
      error: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
    };
  }
}

/**
 * Parse enquiry type from customer message
 */
function parseEnquiryType(
  message: string
): "vehicle_enquiry" | "test_drive" | "price_enquiry" | "finance" | "other" {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("test drive") ||
    lowerMessage.includes("drive") ||
    lowerMessage.includes("book")
  ) {
    return "test_drive";
  }

  if (
    lowerMessage.includes("price") ||
    lowerMessage.includes("cost") ||
    lowerMessage.includes("how much")
  ) {
    return "price_enquiry";
  }

  if (
    lowerMessage.includes("finance") ||
    lowerMessage.includes("loan") ||
    lowerMessage.includes("payment")
  ) {
    return "finance";
  }

  if (
    lowerMessage.includes("interested") ||
    lowerMessage.includes("want") ||
    lowerMessage.includes("looking")
  ) {
    return "vehicle_enquiry";
  }

  return "other";
}

/**
 * Send WhatsApp notification to dealership about new lead
 */
export async function notifyDealershipWhatsApp(
  dealershipPhone: string,
  leadData: {
    customerName: string;
    customerPhone: string;
    vehicleInterest?: string;
    message?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const notification = `
🔔 New Lead Alert!
Name: ${leadData.customerName}
Phone: ${leadData.customerPhone}
${leadData.vehicleInterest ? `Vehicle: ${leadData.vehicleInterest}` : ""}
${leadData.message ? `Message: ${leadData.message}` : ""}
    `.trim();

    const dealershipId = process.env.WHATSAPP_DEALERSHIP_ID || "1";
    const result = await sendWhatsAppMessage({
      phone: dealershipPhone,
      message: notification,
      type: "customer_enquiry",
      dealershipId,
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error("[WhatsAppService] Error notifying dealership:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate webhook signature from Meta.
 * Meta sends `X-Hub-Signature-256: sha256=<hex>` — strip the prefix before compare.
 */
export function validateWhatsAppWebhookSignature(
  signature: string,
  payload: string,
  appSecret: string
): boolean {
  if (!signature || !appSecret) return false;

  const expectedHex = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  const providedHex = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const provided = Buffer.from(providedHex, "hex");
    if (expected.length === 0 || expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/**
 * Process message delivery status update from webhook
 */
export async function processMessageStatusUpdate(
  metaMessageId: string,
  status: "sent" | "delivered" | "read" | "failed"
): Promise<void> {
  try {
    // Find message by metaMessageId and update status
    // This would require a database query helper
    console.log(`[WhatsApp] Message ${metaMessageId} status: ${status}`);
  } catch (error) {
    console.error("[WhatsAppService] Error processing status update:", error);
  }
}
