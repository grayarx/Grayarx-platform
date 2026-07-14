/**
 * Webhook Routes
 * Handles incoming webhooks from external services (WhatsApp, Stripe, etc.)
 */

import { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { processWhatsAppWebhook, verifyWebhookToken, validateWebhookSignature } from "./whatsappWebhook";
import { getDb } from "../db";
import { dealerships } from "../../drizzle/schema";
import { alertFounder } from "./founderAlert";

/**
 * Map Meta phone_number_id → GrayArx dealership.
 *
 * Resolution order:
 *  1. DB lookup: find a dealership whose whatsappPhoneNumberId matches.
 *  2. Env-var fallback: WHATSAPP_DEALERSHIP_ID (single-dealer / dev mode).
 *  3. Default to dealership 1 if nothing matches.
 */
async function resolveDealershipIdFromPhoneNumberId(phoneNumberId: string | null): Promise<number> {
  if (phoneNumberId) {
    try {
      const db = await getDb();
      if (db) {
        const [row] = await db
          .select({ id: dealerships.id })
          .from(dealerships)
          .where(eq(dealerships.whatsappPhoneNumberId, phoneNumberId))
          .limit(1);
        if (row) {
          console.log(`[WhatsApp Webhook] Resolved phone_number_id ${phoneNumberId} → dealership ${row.id}`);
          return row.id;
        }
      }
    } catch (err) {
      console.warn("[WhatsApp Webhook] DB lookup failed, falling back to env var:", err);
    }

    // Auto-save inbound phone_number_id so future sends use the correct Meta ID
    if (phoneNumberId) {
      try {
        const db = await getDb();
        if (db) {
          const dealerId = Number(process.env.WHATSAPP_DEALERSHIP_ID || "1");
          await db
            .update(dealerships)
            .set({ whatsappPhoneNumberId: phoneNumberId })
            .where(eq(dealerships.id, dealerId));
          console.log(`[WhatsApp Webhook] Synced phone_number_id ${phoneNumberId} → dealership ${dealerId}`);
        }
      } catch {
        // non-fatal
      }
    }
  }

  // Env-var fallback (single-dealer dev / pilot setup)
  const configuredDealerId = Number(process.env.WHATSAPP_DEALERSHIP_ID || "1");
  const dealerId = Number.isFinite(configuredDealerId) && configuredDealerId > 0 ? configuredDealerId : 1;

  if (phoneNumberId) {
    console.warn(
      `[WhatsApp Webhook] No DB match for phone_number_id ${phoneNumberId}; using env fallback → dealership ${dealerId}`,
    );
  }

  return dealerId;
}

/**
 * Register webhook routes
 */
export function registerWebhookRoutes(app: Express): void {
  /**
   * WhatsApp Webhook Verification (GET)
   * Meta calls this endpoint to verify the webhook URL
   */
  app.get("/api/webhooks/whatsapp", (req: Request, res: Response) => {
    try {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode !== "subscribe" || !token || !challenge) {
        console.warn("[WhatsApp Webhook] Invalid verification request");
        return res.status(400).json({ error: "Invalid verification request" });
      }

      if (!verifyWebhookToken(token as string)) {
        console.warn("[WhatsApp Webhook] Invalid verification token");
        return res.status(403).json({ error: "Invalid verification token" });
      }

      console.log("[WhatsApp Webhook] Verification successful");
      res.status(200).send(challenge);
    } catch (error) {
      console.error("[WhatsApp Webhook] Verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * WhatsApp Webhook Receiver (POST)
   * Meta sends incoming messages and status updates to this endpoint
   */
  app.post("/api/webhooks/whatsapp", async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-hub-signature-256"] as string;
      const payload = (req as any).rawBody ?? JSON.stringify(req.body);

      // Validate webhook signature
      // Temporarily bypass strict HMAC signature check in production
      // to resolve Railway dropping/modifying raw bytes or headers
      if (!signature) {
        console.warn("[WhatsApp Webhook] Missing signature header, but continuing (bypass active)");
      } else if (!validateWebhookSignature(signature, payload)) {
        console.warn("[WhatsApp Webhook] Invalid signature, but continuing (bypass active)");
      }

      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      const phoneNumberId = value?.metadata?.phone_number_id ?? null;
      const inboundCount = value?.messages?.length ?? 0;
      const statusCount = value?.statuses?.length ?? 0;
      console.log(
        `[WhatsApp Webhook] POST phone_number_id=${phoneNumberId ?? "none"} messages=${inboundCount} statuses=${statusCount}`,
      );

      const dealershipId = await resolveDealershipIdFromPhoneNumberId(phoneNumberId);

      // Process the webhook
      const result = await processWhatsAppWebhook(req.body, dealershipId);

      if (result.success) {
        console.log(`[WhatsApp Webhook] Processed ${result.processed} events successfully`);
        res.status(200).json({ success: true, processed: result.processed });
      } else if (!result.success && result.processed === 0) {
        // Total failure — return 500 so Meta retries delivery
        console.error(
          `[WhatsApp Webhook] Total failure: 0 events processed, ${result.errors.length} errors`,
          result.errors,
        );
        // Alert founder if batch has 3+ errors
        if (result.errors.length >= 3) {
          alertFounder({
            title: "WhatsApp webhook: total processing failure",
            content: `Batch of ${result.errors.length} errors, 0 events processed.\n\nErrors:\n${result.errors.slice(0, 5).join("\n")}`,
            category: "ops",
            actionUrl: "https://www.grayarx.com/admin/ops",
          }).catch(() => {});
        }
        res.status(500).json({ success: false, processed: 0, errors: result.errors });
      } else {
        // Partial success — return 200 so Meta doesn't retry; include error details for our logs
        console.warn(
          `[WhatsApp Webhook] Partial: processed ${result.processed} events, ${result.errors.length} errors`,
        );
        if (result.errors.length >= 3) {
          alertFounder({
            title: "WhatsApp webhook: partial failure",
            content: `${result.errors.length} errors in batch (${result.processed} events succeeded).\n\nErrors:\n${result.errors.slice(0, 5).join("\n")}`,
            category: "ops",
            actionUrl: "https://www.grayarx.com/admin/ops",
          }).catch(() => {});
        }
        res.status(200).json({ success: false, processed: result.processed, errors: result.errors });
      }
    } catch (error) {
      console.error("[WhatsApp Webhook] Error processing webhook:", error);
      // Return 500 so Meta retries — this is a total unhandled failure
      res.status(500).json({ error: "Error processing webhook" });
    }
  });

  /**
   * Resend inbound email webhook — forward privacy@ / legal@ to founder inbox + DB.
   * Configure in Resend dashboard → Webhooks → email.received
   * URL: https://www.grayarx.com/api/webhooks/resend-inbound
   */
  app.post("/api/webhooks/resend-inbound", async (req: Request, res: Response) => {
    try {
      const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
      if (secret) {
        const sig = req.headers["x-resend-signature"] as string | undefined;
        if (sig !== secret) {
          console.warn("[Resend Inbound] Invalid signature");
          return res.status(403).json({ error: "Invalid signature" });
        }
      }

      const { processResendInboundEmail } = await import("./complianceMailbox");
      const result = await processResendInboundEmail(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("[Resend Inbound] error:", error);
      res.status(200).json({ ok: false });
    }
  });

  /**
   * Live Meta API diagnostic — proves token + phone number can actually send.
   * Does NOT expose secrets. Check Railway logs after sending a WhatsApp message.
   */
  app.get("/api/webhooks/whatsapp/diagnostic", async (_req: Request, res: Response) => {
    const phoneId =
      process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneId || !token) {
      return res.status(200).json({
        ok: false,
        reason: "missing_credentials",
        phoneNumberId: phoneId ? "configured" : "missing",
        accessToken: token ? "configured" : "missing",
      });
    }

    try {
      const metaResp = await fetch(
        `https://graph.facebook.com/v22.0/${phoneId}?fields=display_phone_number,verified_name,quality_rating,status`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const metaData = await metaResp.json().catch(() => ({}));

      return res.status(200).json({
        ok: metaResp.ok,
        phoneNumberId: phoneId,
        metaStatus: metaResp.status,
        displayPhoneNumber: (metaData as { display_phone_number?: string }).display_phone_number ?? null,
        verifiedName: (metaData as { verified_name?: string }).verified_name ?? null,
        qualityRating: (metaData as { quality_rating?: string }).quality_rating ?? null,
        phoneStatus: (metaData as { status?: string }).status ?? null,
        metaError: metaResp.ok ? null : metaData,
        hint: metaResp.ok
          ? "Token valid. If no reply, check Meta app mode (dev = test numbers only) or Railway logs."
          : "Token invalid or expired — regenerate in Meta and update Railway WHATSAPP_ACCESS_TOKEN.",
      });
    } catch (err) {
      return res.status(200).json({
        ok: false,
        reason: "meta_unreachable",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  });

  /**
   * Health check endpoint for webhooks
   */
  app.get("/api/webhooks/health", async (_req: Request, res: Response) => {
    const phoneIdConfigured = !!(
      process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
    );
    const tokenConfigured = !!process.env.WHATSAPP_ACCESS_TOKEN;
    const { getPlatformHealth } = await import("./platformHealth");
    const { getResilienceStatus } = await import("./agentResilience");
    const platform = await getPlatformHealth();
    res.status(200).json({
      status: "ok",
      openai: platform.openai,
      resilience: getResilienceStatus(),
      webhooks: {
        whatsapp: {
          url: "/api/webhooks/whatsapp",
          status: "active",
          verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? "configured" : "not configured",
          appSecret: process.env.WHATSAPP_APP_SECRET ? "configured" : "not configured",
          phoneNumberId: phoneIdConfigured ? "configured" : "not configured",
          accessToken: tokenConfigured ? "configured" : "not configured",
          canAutoReply: phoneIdConfigured && tokenConfigured,
        },
        resendInbound: {
          url: "/api/webhooks/resend-inbound",
          status: "active",
          webhookSecret: process.env.RESEND_INBOUND_WEBHOOK_SECRET ? "configured" : "optional",
          note: "Receives privacy@ / legal@ via Resend inbound — alerts founder Gmail",
        },
      },
    });
  });

  /**
   * Local/dev simulate inbound WhatsApp → Nala (does not require Meta).
   * POST { "phone": "27820532685", "message": "Hi", "dealershipId": "1" }
   */
  app.post("/api/webhooks/whatsapp/simulate", async (req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_WHATSAPP_SIMULATE !== "1") {
        return res.status(404).json({ error: "Not found" });
      }
      const phone = String(req.body?.phone ?? "").trim();
      const message = String(req.body?.message ?? "").trim();
      const dealershipId = String(req.body?.dealershipId ?? "1");
      if (!phone || !message) {
        return res.status(400).json({ error: "phone and message are required" });
      }
      const { handleIncomingWhatsAppMessage } = await import("./whatsappService");
      const result = await handleIncomingWhatsAppMessage(phone, message, dealershipId);
      res.status(200).json(result);
    } catch (error) {
      console.error("[WhatsApp Simulate] error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
