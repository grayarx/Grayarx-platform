/**
 * Webhook Routes
 * Handles incoming webhooks from external services (WhatsApp, Stripe, etc.)
 */

import crypto from "crypto";
import { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { processWhatsAppWebhook, verifyWebhookToken, validateWebhookSignature } from "./whatsappWebhook";
import { getDb } from "../db";
import { alertFounder } from "./founderAlert";
import { checkRateLimit, callerIp } from "./rateLimit";
import { resolveDealershipIdFromPhoneNumberId } from "./whatsappDealershipLink";
import { sendWebhookHealth } from "./livenessHealth";

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
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
      const signature = req.headers["x-hub-signature-256"] as string | undefined;
      const payload = (req as any).rawBody ?? JSON.stringify(req.body);
      const bypass = process.env.ALLOW_WHATSAPP_SIGNATURE_BYPASS === "1";

      // Reject missing/invalid HMAC unless explicitly bypassed (ops escape hatch).
      if (!bypass) {
        if (!signature) {
          console.warn("[WhatsApp Webhook] Missing X-Hub-Signature-256 — rejecting");
          return res.status(401).json({ error: "Missing signature" });
        }
        if (!validateWebhookSignature(signature, payload)) {
          console.warn("[WhatsApp Webhook] Invalid signature — rejecting");
          return res.status(401).json({ error: "Invalid signature" });
        }
      } else {
        console.warn(
          "[WhatsApp Webhook] ALLOW_WHATSAPP_SIGNATURE_BYPASS=1 — signature not enforced",
        );
      }

      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      const phoneNumberId = value?.metadata?.phone_number_id ?? null;
      const displayPhoneNumber = value?.metadata?.display_phone_number ?? null;
      const inboundCount = value?.messages?.length ?? 0;
      const statusCount = value?.statuses?.length ?? 0;
      console.log(
        `[WhatsApp Webhook] POST phone_number_id=${phoneNumberId ? "set" : "none"} display_phone=${displayPhoneNumber ? "set" : "none"} messages=${inboundCount} statuses=${statusCount}`,
      );

      const dealershipId = await resolveDealershipIdFromPhoneNumberId(
        phoneNumberId,
        displayPhoneNumber,
      );

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
      const ip = callerIp(req);
      const rl = checkRateLimit(`webhook.resend:${ip}`, 60, 60_000);
      if (!rl.ok) {
        return res.status(429).json({ error: "Too many requests" });
      }

      const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === "production") {
          console.warn("[Resend Inbound] RESEND_INBOUND_WEBHOOK_SECRET not set — rejecting");
          return res.status(503).json({ error: "Webhook not configured" });
        }
        console.warn("[Resend Inbound] No secret configured — allowing (non-production)");
      } else {
        const provided =
          (req.headers["x-resend-signature"] as string | undefined) ||
          (typeof req.headers.authorization === "string" &&
          req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : undefined);
        if (!provided || !timingSafeStringEqual(provided, secret)) {
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
   * Production: disabled unless ALLOW_WHATSAPP_DIAGNOSTIC=1 and
   * X-GrayArx-Diagnostic-Key matches WHATSAPP_DIAGNOSTIC_KEY (or verify token).
   * Never returns access tokens.
   */
  app.get("/api/webhooks/whatsapp/diagnostic", async (req: Request, res: Response) => {
    const allow =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_WHATSAPP_DIAGNOSTIC === "1";
    if (!allow) {
      return res.status(404).json({ error: "Not found" });
    }

    if (process.env.NODE_ENV === "production") {
      const expected =
        process.env.WHATSAPP_DIAGNOSTIC_KEY ||
        process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
      const provided = req.headers["x-grayarx-diagnostic-key"] as string | undefined;
      if (!expected || !provided || !timingSafeStringEqual(provided, expected)) {
        return res.status(404).json({ error: "Not found" });
      }
    }

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

      // Redact full phone number in logs; response is already auth-gated.
      return res.status(200).json({
        ok: metaResp.ok,
        phoneNumberId: "configured",
        metaStatus: metaResp.status,
        displayPhoneNumber: (metaData as { display_phone_number?: string }).display_phone_number
          ? "configured"
          : null,
        verifiedName: (metaData as { verified_name?: string }).verified_name ?? null,
        qualityRating: (metaData as { quality_rating?: string }).quality_rating ?? null,
        phoneStatus: (metaData as { status?: string }).status ?? null,
        metaError: metaResp.ok ? null : { status: metaResp.status },
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
   * Health check — Railway liveness (no outbound I/O). Use ?full=1 for live MX/OpenAI.
   * Primary registration is registerLivenessHealthRoutes (before warming middleware).
   */
  app.get("/api/webhooks/health", (req: Request, res: Response) => {
    void sendWebhookHealth(req, res);
  });

  /**
   * Stripe Checkout webhook — marks invoices paid when checkout.session.completed.
   * Optional: only active when STRIPE_SECRET_KEY (+ optional STRIPE_WEBHOOK_SECRET) set.
   */
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    try {
      const { getStripe } = await import("./stripeCheckout");
      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({ error: "Stripe not configured" });
      }

      let event: { type: string; data: { object: Record<string, unknown> } };
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
      const sig = req.headers["stripe-signature"] as string | undefined;
      const rawBody = (req as { rawBody?: Buffer | string }).rawBody;

      if (webhookSecret && sig && rawBody) {
        try {
          event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            webhookSecret,
          ) as unknown as typeof event;
        } catch (err) {
          console.warn(
            "[Stripe Webhook] Signature verification failed:",
            err instanceof Error ? err.message : String(err),
          );
          return res.status(400).json({ error: "Invalid signature" });
        }
      } else {
        // Dev / unsigned: accept JSON body (never rely on this in production without secret)
        if (process.env.NODE_ENV === "production" && !webhookSecret) {
          console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET missing in production");
          return res.status(503).json({ error: "Webhook secret not configured" });
        }
        event = req.body as typeof event;
      }

      if (event?.type === "checkout.session.completed") {
        const session = event.data.object as {
          id?: string;
          metadata?: { invoiceId?: string; source?: string };
          amount_total?: number;
        };
        const invoiceId = Number(session.metadata?.invoiceId);
        if (session.metadata?.source === "grayarx_invoice" && Number.isFinite(invoiceId) && invoiceId > 0) {
          const db = await getDb();
          if (db) {
            const { invoices, payments } = await import("../../drizzle/schema");
            await db.insert(payments).values({
              invoiceId,
              amount: ((session.amount_total ?? 0) / 100).toFixed(2) as unknown as string,
              paymentDate: new Date(),
              paymentMethod: "card",
              reference: `stripe:${session.id ?? "checkout"}`,
            });
            await db
              .update(invoices)
              .set({ status: "paid" })
              .where(eq(invoices.id, invoiceId));
            console.log(`[Stripe Webhook] Marked invoice ${invoiceId} paid via Checkout`);
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Stripe Webhook] error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
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
