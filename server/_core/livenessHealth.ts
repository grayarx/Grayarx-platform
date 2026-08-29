/**
 * Railway liveness — must return 200 without outbound I/O.
 *
 * `/api/webhooks/health` is railway.toml healthcheckPath. Awaiting OpenAI or
 * DNS on that route hung cold deploys (~30s DNS) and failed Network healthcheck.
 * Live MX / OpenAI probes run in the background (or `?full=1` for humans).
 */

import type { Express, Request, Response } from "express";
import { getResilienceStatus } from "./agentResilience";

export const LIVENESS_PATHS = ["/api/health", "/api/webhooks/health"] as const;

export function isLivenessPath(url: string): boolean {
  const path = (url.split("?")[0] ?? url).replace(/\/+$/, "") || "/";
  return (LIVENESS_PATHS as readonly string[]).includes(path);
}

type InboundMxSnapshot = {
  domain: string;
  hasMx: boolean;
  canReceiveMail: boolean;
  mxRecords: string[];
  detail: string;
  probed: boolean;
};

let mxCache: InboundMxSnapshot | null = null;
let mxProbeStarted = false;

function webhookFlags() {
  const phoneIdConfigured = !!(
    process.env.WHATSAPP_BUSINESS_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
  );
  const tokenConfigured = !!process.env.WHATSAPP_ACCESS_TOKEN;
  return { phoneIdConfigured, tokenConfigured };
}

function pendingInboundMx(): InboundMxSnapshot {
  return {
    domain: "grayarx.com",
    hasMx: false,
    canReceiveMail: false,
    mxRecords: [],
    detail: "MX probe pending — liveness does not block on DNS",
    probed: false,
  };
}

export function _resetLivenessHealthForTests(): void {
  mxCache = null;
  mxProbeStarted = false;
}

export function _setCachedInboundMxForTests(snapshot: InboundMxSnapshot | null): void {
  mxCache = snapshot;
}

/** Fire-and-forget MX lookup so later curls can still see inboundEmail.hasMx. */
export function startBackgroundHealthProbes(): void {
  if (mxProbeStarted) return;
  mxProbeStarted = true;
  void import("./complianceMailbox")
    .then(({ checkInboundMxHealth }) => checkInboundMxHealth("grayarx.com"))
    .then((inboundMx) => {
      mxCache = {
        domain: inboundMx.domain,
        hasMx: inboundMx.hasMx,
        canReceiveMail: inboundMx.canReceiveMail,
        mxRecords: inboundMx.records,
        detail: inboundMx.detail,
        probed: true,
      };
    })
    .catch((err) => {
      mxCache = {
        domain: "grayarx.com",
        hasMx: false,
        canReceiveMail: false,
        mxRecords: [],
        detail: `MX probe failed: ${err instanceof Error ? err.message : String(err)}`,
        probed: true,
      };
    });
}

export function buildLivenessHealthBody(): {
  status: "ok";
  liveness: true;
  openai: { ok: boolean; detail: string };
  resilience: ReturnType<typeof getResilienceStatus>;
  inboundEmail: InboundMxSnapshot;
  webhooks: Record<string, unknown>;
} {
  const { phoneIdConfigured, tokenConfigured } = webhookFlags();
  const openaiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  return {
    status: "ok",
    liveness: true,
    openai: {
      ok: openaiKey,
      detail: openaiKey
        ? "OPENAI_API_KEY set (live /v1/models probe skipped for liveness)"
        : "OPENAI_API_KEY not set — Nala uses templates only",
    },
    resilience: getResilienceStatus(),
    inboundEmail: mxCache ?? pendingInboundMx(),
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
        webhookSecret: process.env.RESEND_INBOUND_WEBHOOK_SECRET
          ? "configured"
          : process.env.NODE_ENV === "production"
            ? "missing — set RESEND_INBOUND_WEBHOOK_SECRET"
            : "optional_dev",
        note: "Receives hello@ / privacy@ / legal@ / mia@ / prospector@ / pilot@ when Resend Receiving MX is configured. Fetches email body via Receiving API. Alerts FOUNDER_ALERT_EMAIL.",
      },
    },
  };
}

async function buildFullHealthBody(): Promise<ReturnType<typeof buildLivenessHealthBody> & { liveness: false }> {
  const base = buildLivenessHealthBody();
  try {
    const { getPlatformHealth } = await import("./platformHealth");
    const { checkInboundMxHealth } = await import("./complianceMailbox");
    const platform = await getPlatformHealth();
    const inboundMx = await checkInboundMxHealth("grayarx.com");
    mxCache = {
      domain: inboundMx.domain,
      hasMx: inboundMx.hasMx,
      canReceiveMail: inboundMx.canReceiveMail,
      mxRecords: inboundMx.records,
      detail: inboundMx.detail,
      probed: true,
    };
    return {
      ...base,
      liveness: false,
      openai: platform.openai,
      inboundEmail: mxCache,
    };
  } catch (err) {
    return {
      ...base,
      liveness: false,
      openai: {
        ok: false,
        detail: `live probe failed: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }
}

/** Always 200. Default path is sync/local; `?full=1` runs outbound probes. */
export async function sendWebhookHealth(req: Request, res: Response): Promise<void> {
  try {
    const full =
      req.query.full === "1" ||
      req.query.full === "true" ||
      req.query.deep === "1";
    const body = full ? await buildFullHealthBody() : buildLivenessHealthBody();
    res.status(200).json(body);
  } catch (err) {
    console.error("[liveness] health handler failed", err);
    res.status(200).json({
      status: "ok",
      liveness: true,
      error: err instanceof Error ? err.message : "health_error",
    });
  }
}

export function sendApiHealth(_req: Request, res: Response): void {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
}

/** Register both Railway probes before any warming middleware. */
export function registerLivenessHealthRoutes(app: Express): void {
  app.get("/api/health", sendApiHealth);
  app.get("/api/webhooks/health", (req, res) => {
    void sendWebhookHealth(req, res);
  });
}
