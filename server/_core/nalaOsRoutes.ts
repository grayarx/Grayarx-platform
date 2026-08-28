/**
 * Nala Dealership OS HTTP surface — ported from the Cloud Agent Next.js pack.
 * Mount BEFORE apiRouter (Bearer catch-all) and DO NOT touch WhatsApp webhooks.
 */
import type { Request, Response } from "express";
import express from "express";
import {
  COMPETITOR_PRICE_MATRIX,
  PRICING_STRATEGY,
} from "@nalaOs/os/competitor-prices";
import {
  GRAYARX_OS_PACKAGES,
  OS_MODULES,
  pricingEconomicsSummary,
} from "@nalaOs/os/pricing";
import { listParts, listPartsEnquiries, importPartsCatalog, parsePartsCsv, quotePart, holdPart, listAllParts, PARTS_CSV_TEMPLATE, PARTS_CSV_HEADERS, lastImportAtFromParts } from "@nalaOs/os/parts";
import { handleOsMessage, bookViewingAndNotify } from "@nalaOs/os/router";
import { listServiceBookings, getServiceCalendar, rescheduleService } from "@nalaOs/os/service";
import { listTradeIns, captureTradeIn, attachTradeInPhoto } from "@nalaOs/os/tradein";
import { buildMondayRoiReport } from "@nalaOs/conversion/roi";
import { ingestLead, listLeads, type LeadSource } from "@nalaOs/conversion/leads";
import {
  getStock,
  listAvailable,
  markSold,
  upsertVehicle,
} from "@nalaOs/conversion/stock";
import { getPilot, startPilot, updatePilotChecklist } from "@nalaOs/conversion/pilot";
import { listWhatsAppOutbox, sendWhatsApp } from "@nalaOs/whatsapp/send";
import { listEmailOutbox, sendMondayRoiEmail } from "@nalaOs/email/send";
import { listCrmDeliveries, listCrmSubscriptions, emitCrmEvent, registerCrmWebhook, type CrmEventType, type CrmProvider } from "@nalaOs/crm/webhooks";
import { listBranches, ensureBranches } from "@nalaOs/branches/store";
import { listFinanceApplications, startFinancePrequal, markFinanceDoc } from "@nalaOs/finance/prequal";
import { seedMultiBranchStock, listMarketplaceFixtures, pollMarketplaceFixtures, ingestMarketplaceLead } from "@nalaOs/marketplace/ingest";
import { listRegions, regionById, type RegionId } from "@nalaOs/regions/config";
import {
  getDealershipPlan,
  setDealershipPlan,
  usageSnapshot,
  type PlanId,
} from "@nalaOs/billing/usage";
import { listDealershipSettings, getDealershipSettings, updateDealershipSettings } from "@nalaOs/dealership/settings";
import { parseProspectCsv, PROSPECT_CSV_TEMPLATE } from "@nalaOs/prospector/import";
import {
  addImportedProspects,
  highAbilityProspects,
  MOCK_PROSPECTS,
  patchProspectContact,
  prospectsByRegion,
} from "@nalaOs/prospector-data";
import { calculateValue, moneyFromPilot, type ValueInputs } from "@nalaOs/value/money-lost";
import { PROCESS_PLAYBOOKS } from "@nalaOs/processes/playbooks";
import { recoverMissedCall } from "@nalaOs/recovery/missed-call";
import { importStockCatalog, parseStockCsv, STOCK_CSV_TEMPLATE } from "@nalaOs/stock/import";
import { advanceOnboarding, getOnboardingGuides, type OnboardStepId } from "@nalaOs/onboarding/wizard";
import {
  BEAT_ROADMAP,
  GRAYARX_PACKAGES,
  PRICE_BANDS,
  battlecardFromMessage,
  buildBattlecard,
  getCompetitor,
  listCompetitors,
  type CompetitorId,
} from "@nalaOs/competitors";
import { getSmartReply } from "@nalaOs/call-agent-playbook";
import type { CallContext } from "@nalaOs/call-intents";
import type { CallIntel } from "@nalaOs/call-intel";
import { defaultStage, type CallStage } from "@nalaOs/call-stages";
import { DEFAULT_LEAD, type LeadContext, buildCallOpenerSpeech } from "@nalaOs/sales-templates";
import { findProspect, startThembaCall } from "@nalaOs/place-outbound-call";
import { getTwilioStatus } from "@nalaOs/twilio-status";
import { getWebhookBaseUrl } from "@nalaOs/twilio-voice";
import { getLiveCallSession, getLiveCallSessionByCallSid, updateLiveCallSession, appendTranscript } from "@nalaOs/call-session-store";
import { getSetupStatus, verifyTwilioConnection } from "@nalaOs/setup-status";
import { validateTwilioRequest } from "@nalaOs/twilio-client";
import { agentTurnTwiml, gatherSpeech, hangup, say, twimlDocument } from "@nalaOs/twiml";
import type { CallSessionState } from "@nalaOs/prospector-types";
import { sdk } from "./sdk";

const DEALER_PARTS_ROLES = new Set([
  "dealer_owner",
  "dealer_consultant",
  "founder",
  "admin",
]);

async function authenticateDealer(req: Request): Promise<{
  dealershipId: string;
  role: string;
} | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || !DEALER_PARTS_ROLES.has(user.role)) return null;
    if (user.dealershipId != null) {
      return { dealershipId: String(user.dealershipId), role: user.role };
    }
    if (user.role === "founder" || user.role === "admin") {
      return { dealershipId: "1", role: user.role };
    }
    return null;
  } catch {
    return null;
  }
}

function allowUnauthedOsDemo(): boolean {
  return process.env.NODE_ENV !== "production";
}

function asFetchRequest(req: Request): globalThis.Request {
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "127.0.0.1");
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }
  return new globalThis.Request(`${proto}://${host}${req.originalUrl}`, {
    method: req.method,
    headers,
  });
}

async function pipeWebResponse(res: Response, webRes: globalThis.Response) {
  res.status(webRes.status);
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.send(Buffer.from(await webRes.arrayBuffer()));
}

function formParams(req: Request): Record<string, string> {
  const params: Record<string, string> = {};
  const body = req.body as Record<string, unknown> | undefined;
  if (body && typeof body === "object") {
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") params[key] = value;
    }
  }
  return params;
}

export function registerNalaOsRoutes(app: express.Express) {
  const r = express.Router();

  r.get("/os", async (_req, res) => {
    ensureBranches();
    seedMultiBranchStock();
    res.json({
      modules: OS_MODULES,
      packages: GRAYARX_OS_PACKAGES,
      economics: pricingEconomicsSummary(),
      pricingStrategy: PRICING_STRATEGY,
      competitorPrices: COMPETITOR_PRICE_MATRIX,
      parts: await listParts().catch(() => []),
      partsEnquiries: await listPartsEnquiries()
        .then((rows) => rows.slice(0, 20))
        .catch(() => []),
      serviceBookings: listServiceBookings().slice(0, 20),
      tradeIns: listTradeIns().slice(0, 20),
      finance: listFinanceApplications().slice(0, 20),
      branches: listBranches(),
      whatsappOutbox: listWhatsAppOutbox().slice(0, 20),
      emailOutbox: listEmailOutbox().slice(0, 10),
      crmSubscriptions: listCrmSubscriptions(),
      crmDeliveries: listCrmDeliveries().slice(0, 20),
      roi: buildMondayRoiReport(),
    });
  });

  r.post("/os", async (req, res) => {
    const body = req.body as {
      buyerName?: string;
      buyerPhone?: string;
      message?: string;
      holdPart?: boolean;
      source?: "whatsapp" | "website" | "manual";
      dealershipId?: string;
    };
    if (!body.buyerName?.trim() || !body.buyerPhone?.trim() || !body.message?.trim()) {
      return res.status(400).json({ error: "buyerName, buyerPhone, and message are required." });
    }
    const result = await handleOsMessage({
      buyerName: body.buyerName,
      buyerPhone: body.buyerPhone,
      message: body.message,
      holdPart: Boolean(body.holdPart),
      source: body.source,
      dealershipId: body.dealershipId,
    });
    res.json({ result });
  });

  r.get("/pricing", (_req, res) => {
    res.json({
      packages: GRAYARX_OS_PACKAGES,
      economics: pricingEconomicsSummary(),
      pricingStrategy: PRICING_STRATEGY,
      competitorPrices: COMPETITOR_PRICE_MATRIX,
    });
  });

  r.get("/regions", (req, res) => {
    const id = String(req.query.region ?? "ZA");
    res.json({ region: regionById(id), regions: listRegions() });
  });

  r.get("/billing/usage", (req, res) => {
    const id = String(req.query.dealershipId ?? "demo-yard");
    res.json({
      snapshot: usageSnapshot(id),
      planId: getDealershipPlan(id),
      packages: GRAYARX_OS_PACKAGES.map((p) => ({
        id: p.id,
        name: p.name,
        priceLabel: p.priceLabel,
        includedWhatsAppConversations: p.includedWhatsAppConversations,
        overagePerConversationZar: p.overagePerConversationZar,
      })),
      dealerships: listDealershipSettings().map((s) => ({
        dealershipId: s.dealershipId,
        name: s.name,
        planId: s.planId,
      })),
    });
  });

  r.post("/billing/usage", (req, res) => {
    const body = req.body as { action?: string; dealershipId?: string; planId?: PlanId };
    const dealershipId = body.dealershipId?.trim() || "demo-yard";
    if (body.action !== "set_plan") {
      return res.status(400).json({ error: "action must be set_plan" });
    }
    if (!body.planId) {
      return res.status(400).json({ error: "planId required" });
    }
    try {
      const result = setDealershipPlan(dealershipId, body.planId);
      res.json({
        ok: true,
        settings: result.settings,
        package: result.package,
        snapshot: usageSnapshot(dealershipId),
      });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "set_plan failed" });
    }
  });

  r.get("/prospector/prospects", (req, res) => {
    if (String(req.query.template ?? "") === "1") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="prospects-template.csv"');
      return res.send(PROSPECT_CSV_TEMPLATE);
    }
    const region = req.query.region as RegionId | undefined;
    const highOnly = String(req.query.highAbility ?? "") === "1";
    let prospects = MOCK_PROSPECTS;
    if (region) prospects = prospectsByRegion(region);
    if (highOnly) {
      prospects = prospects.filter((p) => p.abilityToPay === "high" || p.abilityToPay === "enterprise");
    }
    prospects = [...prospects].sort((a, b) => b.score - a.score);
    res.json({
      count: prospects.length,
      totalSeeded: MOCK_PROSPECTS.length,
      highAbilityCount: highAbilityProspects().length,
      regions: listRegions().map((r) => ({
        id: r.id,
        name: r.name,
        currency: r.currency,
        professional: r.packages.professional.label,
        privacyLaw: r.privacyLaw,
        count: prospectsByRegion(r.id).length,
      })),
      pricingForRegion: region ? regionById(region).packages : null,
      prospects,
    });
  });

  r.post("/prospector/prospects", (req, res) => {
    const csv = (req.body as { csv?: string }).csv;
    if (!csv?.trim()) return res.status(400).json({ error: "csv required" });
    const result = parseProspectCsv(csv);
    const added = addImportedProspects(result.imported);
    res.json({
      ok: true,
      imported: result.imported.length,
      added,
      skipped: result.skipped,
      prospects: result.imported,
    });
  });

  r.post("/prospector/contact", (req, res) => {
    const body = req.body as {
      prospectId?: unknown;
      phone?: unknown;
      email?: unknown;
      website?: unknown;
      contactName?: unknown;
    };
    if (typeof body.prospectId !== "string" || !body.prospectId.trim()) {
      return res.status(400).json({ error: "prospectId is required." });
    }
    const prospect = patchProspectContact(body.prospectId.trim(), {
      phone: typeof body.phone === "string" ? body.phone : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      website: typeof body.website === "string" ? body.website : undefined,
      contactName: typeof body.contactName === "string" ? body.contactName : undefined,
    });
    if (!prospect) return res.status(404).json({ error: "Prospect not found." });
    res.json({ ok: true, prospect });
  });

  r.get("/prospector/queue-call", (req, res) => {
    const twilio = getTwilioStatus();
    const webhookBaseUrl = getWebhookBaseUrl(asFetchRequest(req)) ?? twilio.webhookBaseUrl;
    res.json({ ...twilio, webhookBaseUrlResolved: webhookBaseUrl ?? null });
  });

  r.post("/prospector/queue-call", async (req, res) => {
    const body = req.body as { prospectId?: unknown; toPhone?: unknown; lead?: Partial<Record<keyof LeadContext, unknown>> };
    if (typeof body.prospectId !== "string" || !body.prospectId.trim()) {
      return res.status(400).json({ error: "prospectId is required." });
    }
    const twilio = getTwilioStatus();
    const webhookBaseUrl = getWebhookBaseUrl(asFetchRequest(req)) ?? twilio.webhookBaseUrl ?? null;
    if (!twilio.configured || !webhookBaseUrl) {
      return res.json({
        queued: true,
        placed: false,
        prospectId: body.prospectId.trim(),
        twilioConfigured: false,
        twilioMessage: twilio.message,
        error: "Twilio not fully configured. Set credentials and TWILIO_WEBHOOK_BASE_URL to your public HTTPS URL.",
      });
    }
    const prospect = findProspect(body.prospectId.trim());
    const toPhone = (typeof body.toPhone === "string" && body.toPhone.trim()) || prospect?.phone;
    if (!toPhone) {
      return res.status(400).json({ error: "A dealership phone number (toPhone) is required." });
    }
    const leadOverride: Partial<LeadContext> = {};
    if (body.lead && typeof body.lead === "object") {
      for (const [key, value] of Object.entries(body.lead)) {
        if (typeof value === "string" && value.trim()) {
          leadOverride[key as keyof LeadContext] = value.trim();
        }
      }
    }
    try {
      const call = await startThembaCall({
        prospectId: body.prospectId.trim(),
        toPhone,
        lead: leadOverride,
        webhookBaseUrl,
      });
      res.json({
        queued: true,
        placed: true,
        prospectId: body.prospectId.trim(),
        sessionId: call.sessionId,
        callSid: call.callSid,
        toPhone: call.toPhone,
        twilioConfigured: true,
        twilioMessage: `Dialling ${call.toPhone} — Themba will run the discovery funnel on connect.`,
      });
    } catch (error) {
      res.status(502).json({
        queued: true,
        placed: false,
        error: error instanceof Error ? error.message : "Failed to place Twilio call.",
        twilioConfigured: twilio.configured,
        twilioMessage: twilio.message,
      });
    }
  });

  r.post("/prospector/save-intel", (req, res) => {
    const body = req.body as { prospectId?: unknown; session?: unknown };
    if (typeof body.prospectId !== "string" || !body.prospectId.trim()) {
      return res.status(400).json({ error: "prospectId is required." });
    }
    if (!body.session || typeof body.session !== "object") {
      return res.status(400).json({ error: "session object is required." });
    }
    const session = body.session as CallSessionState;
    res.json({
      saved: true,
      prospectId: body.prospectId.trim(),
      stage: session.stage,
      intel: session.intel,
      transcriptLength: session.transcript?.length ?? 0,
    });
  });

  r.get("/prospector/call-session", (req, res) => {
    const sessionId = String(req.query.sessionId ?? "");
    if (!sessionId) return res.status(400).json({ error: "sessionId query parameter is required." });
    const session = getLiveCallSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json({
      sessionId: session.id,
      prospectId: session.prospectId,
      callSid: session.callSid,
      status: session.status,
      stage: session.stage,
      intel: session.intel,
      transcript: session.transcript,
      toPhone: session.toPhone,
    });
  });

  r.get("/parts", async (req, res) => {
    const auth = await authenticateDealer(req);
    const requested = String(req.query.dealershipId || "");
    let dealershipId: string;
    if (auth) {
      const isFounder = auth.role === "founder" || auth.role === "admin";
      dealershipId = isFounder && requested ? requested : auth.dealershipId;
    } else if (allowUnauthedOsDemo() && (!requested || requested === "demo-yard")) {
      dealershipId = requested || "demo-yard";
    } else {
      return res.status(401).json({ error: "Sign in as a dealer to view the parts catalog." });
    }
    const settings = getDealershipSettings(dealershipId);
    try {
      const parts = await listAllParts(dealershipId);
      res.json({
        settings: settings.parts,
        modules: settings.modules,
        parts,
        enquiries: (await listPartsEnquiries(dealershipId)).slice(0, 30),
        lastImportAt: settings.parts.lastImportAt ?? lastImportAtFromParts(parts),
        csvTemplate: PARTS_CSV_HEADERS,
        csvTemplateFile: PARTS_CSV_TEMPLATE,
        howPricingWorks: [
          "GrayArx never invents part prices.",
          "Dealer imports their catalog with retailPrice and/or costPrice.",
          "If only costPrice is sent, we apply the dealer's defaultMarkupPercent.",
          "Turn parts module OFF if the yard does not sell parts.",
        ],
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load parts catalog";
      res.status(500).json({ error: message });
    }
  });

  r.post("/parts", async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const action = String(body.action || "");
    const auth = await authenticateDealer(req);
    const requestedId = typeof body.dealershipId === "string" ? body.dealershipId : "";

    const resolveTenant = (): string | Response => {
      if (auth) {
        const isFounder = auth.role === "founder" || auth.role === "admin";
        return isFounder && requestedId ? requestedId : auth.dealershipId;
      }
      if (allowUnauthedOsDemo() && (!requestedId || requestedId === "demo-yard")) {
        return "demo-yard";
      }
      return res.status(401).json({ error: "Sign in as a dealer to import parts." });
    };

    if (action === "import_json" || action === "import_csv" || action === "add_one") {
      const tenant = resolveTenant();
      if (typeof tenant !== "string") return tenant;
      const dealershipId = tenant;
      try {
        if (action === "import_json" || action === "add_one") {
        const rows = Array.isArray(body.rows)
          ? body.rows
          : action === "add_one"
            ? [
                {
                  sku: String(body.sku || ""),
                  oemNumber: typeof body.oemNumber === "string" ? body.oemNumber : undefined,
                  name: String(body.name || ""),
                  fits: typeof body.fits === "string" ? body.fits : undefined,
                  make: typeof body.make === "string" ? body.make : undefined,
                  model: typeof body.model === "string" ? body.model : undefined,
                  yearFrom: typeof body.yearFrom === "number" ? body.yearFrom : Number(body.yearFrom) || undefined,
                  yearTo: typeof body.yearTo === "number" ? body.yearTo : Number(body.yearTo) || undefined,
                  costPrice: typeof body.costPrice === "number" ? body.costPrice : Number(body.costPrice) || undefined,
                  retailPrice: typeof body.retailPrice === "number" ? body.retailPrice : Number(body.retailPrice) || undefined,
                  qty: typeof body.qty === "number" ? body.qty : Number(body.qty) || undefined,
                  supplier: typeof body.supplier === "string" ? body.supplier : undefined,
                },
              ]
            : [];
        return res.json({
          ok: true,
          ...await importPartsCatalog({
            dealershipId,
            rows: rows as Parameters<typeof importPartsCatalog>[0]["rows"],
            source: action === "add_one" ? "manual" : "csv_import",
          }),
        });
      }
      const csv = typeof body.csv === "string" ? body.csv : "";
      return res.json({
        ok: true,
        ...await importPartsCatalog({
          dealershipId,
          rows: parsePartsCsv(csv),
          source: "csv_import",
        }),
      });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Parts import failed";
        return res.status(500).json({ error: message });
      }
    }
    const dealershipId = requestedId || "demo-yard";
    if (action === "quote") {
      return res.json({
        ok: true,
        ...await quotePart({
          buyerName: String(body.buyerName || ""),
          buyerPhone: String(body.buyerPhone || ""),
          message: String(body.message || ""),
          dealershipId,
        }),
      });
    }
    if (action === "hold") {
      const result = await holdPart(String(body.enquiryId || ""));
      if ("error" in result) return res.status(400).json(result);
      return res.json({ ok: true, enquiry: result });
    }
    res.status(400).json({ error: "action must be import_json | import_csv | add_one | quote | hold" });
  });

  r.post("/conversion/book", async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const leadId = typeof body.leadId === "string" ? body.leadId : "";
    const viewingAt = typeof body.viewingAt === "string" ? body.viewingAt : "";
    if (!leadId || !viewingAt) {
      return res.status(400).json({ error: "leadId and viewingAt are required." });
    }
    const result = await bookViewingAndNotify({ leadId, viewingAt });
    if ("error" in result) return res.status(400).json({ error: result.error });
    res.json({ ok: true, ...result });
  });

  r.get("/conversion/leads", (_req, res) => res.json({ leads: listLeads() }));
  r.post("/conversion/leads", (req, res) => {
    const SOURCES: LeadSource[] = ["autotrader", "cars_co_za", "website", "whatsapp", "missed_call", "manual"];
    const body = req.body as Record<string, unknown>;
    const buyerName = typeof body.buyerName === "string" ? body.buyerName.trim() : "";
    const buyerPhone = typeof body.buyerPhone === "string" ? body.buyerPhone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const source = body.source as LeadSource;
    if (!buyerName || !buyerPhone || !message) {
      return res.status(400).json({ error: "buyerName, buyerPhone, and message are required." });
    }
    if (!SOURCES.includes(source)) {
      return res.status(400).json({ error: `source must be one of: ${SOURCES.join(", ")}` });
    }
    const result = ingestLead({
      buyerName,
      buyerPhone,
      message,
      source,
      vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : undefined,
      createdAt: typeof body.createdAt === "string" ? body.createdAt : undefined,
    });
    res.json({ ok: true, lead: result.lead, vehicle: result.vehicle ?? null, nalaReply: result.nalaReply });
  });

  r.get("/conversion/roi", (_req, res) => res.json(buildMondayRoiReport()));
  r.get("/conversion/stock", (_req, res) => res.json({ vehicles: getStock().vehicles, available: listAvailable() }));
  r.post("/conversion/stock", (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (body.action === "mark_sold") {
      const sold = markSold(typeof body.vehicleId === "string" ? body.vehicleId : "");
      if (!sold) return res.status(404).json({ error: "Vehicle not found." });
      return res.json({ ok: true, vehicle: sold });
    }
    const required = ["stockNumber", "make", "model", "year", "price", "mileage", "colour"] as const;
    for (const key of required) {
      if (body[key] === undefined || body[key] === "") {
        return res.status(400).json({ error: `${key} is required to upsert stock.` });
      }
    }
    const vehicle = upsertVehicle({
      stockNumber: String(body.stockNumber),
      make: String(body.make),
      model: String(body.model),
      year: Number(body.year),
      price: Number(body.price),
      mileage: Number(body.mileage),
      colour: String(body.colour),
      status: body.status === "sold" || body.status === "reserved" ? body.status : "available",
      dealershipId: typeof body.dealershipId === "string" ? body.dealershipId : "demo-yard",
      id: typeof body.id === "string" ? body.id : undefined,
    });
    res.json({ ok: true, vehicle });
  });

  r.get("/conversion/pilot", (_req, res) => res.json({ pilot: getPilot() }));
  r.post("/conversion/pilot", (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (body.action === "start") {
      const name = typeof body.dealershipName === "string" ? body.dealershipName : "Demo Yard";
      return res.json({ ok: true, pilot: startPilot(name) });
    }
    if (body.action === "checklist") {
      const pilot = updatePilotChecklist(typeof body.itemId === "string" ? body.itemId : "", Boolean(body.done));
      if (!pilot) return res.status(400).json({ error: "Pilot not started or checklist item missing." });
      return res.json({ ok: true, pilot });
    }
    res.status(400).json({ error: "Unknown action." });
  });

  r.get("/marketplace/ingest", (_req, res) => {
    res.json({ fixtures: listMarketplaceFixtures(), hint: "POST { action: 'poll' } to ingest AutoTrader/Cars fixtures." });
  });
  r.post("/marketplace/ingest", async (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (body.action === "poll") {
      const results = await pollMarketplaceFixtures({ limit: typeof body.limit === "number" ? body.limit : undefined });
      return res.json({
        ok: true,
        ingested: results.length,
        results: results.map((item) => ({
          leadId: item.lead.id,
          source: item.lead.source,
          dealershipId: item.dealershipId,
          nalaReply: item.nalaReply,
          whatsappId: item.whatsapp.id,
          whatsappStatus: item.whatsapp.status,
          crmEvents: item.crm.length,
        })),
      });
    }
    const buyerName = typeof body.buyerName === "string" ? body.buyerName.trim() : "";
    const buyerPhone = typeof body.buyerPhone === "string" ? body.buyerPhone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!buyerName || !buyerPhone || !message) {
      return res.status(400).json({ error: "buyerName, buyerPhone, message required (or action: poll)" });
    }
    const result = await ingestMarketplaceLead({
      source: (body.source as LeadSource) || "autotrader",
      buyerName,
      buyerPhone,
      message,
      dealershipId: typeof body.dealershipId === "string" ? body.dealershipId : undefined,
      vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : undefined,
    });
    res.json({ ok: true, ...result });
  });

  r.post("/marketplace/webhook", async (req, res) => {
    const provider = String(req.query.provider || "autotrader");
    const body = req.body as Record<string, unknown>;
    const atName = (body.customerName as string) || (body.buyer_name as string) || (body.name as string) || [body.firstName, body.lastName].filter(Boolean).join(" ");
    const atPhone = (body.customerPhone as string) || (body.buyer_phone as string) || (body.phone as string) || (body.mobile as string);
    const atMessage = (body.message as string) || (body.enquiry as string) || (body.comments as string) || (body.vehicleTitle as string) || `Enquiry on listing ${body.listingId || body.stockNumber || ""}`;
    const buyerName = ((provider === "cars" ? (body.LeadName as string) || (body.ContactName as string) : atName) || "").trim();
    const buyerPhone = ((provider === "cars" ? (body.LeadPhone as string) || (body.ContactPhone as string) : atPhone) || "").trim();
    const message = ((provider === "cars" ? (body.LeadMessage as string) || (body.Comments as string) : atMessage) || "").trim();
    if (!buyerName || !buyerPhone || !message) {
      return res.status(400).json({ error: "Could not map payload. Need customer name, phone, and message/listing fields." });
    }
    const source = provider === "cars" || provider === "cars_co_za" ? "cars_co_za" : "autotrader";
    const result = await ingestMarketplaceLead({
      source,
      buyerName,
      buyerPhone,
      message,
      dealershipId: typeof body.dealershipId === "string" ? body.dealershipId : undefined,
    });
    res.json({ ok: true, provider: source, leadId: result.lead.id, whatsappStatus: result.whatsapp.status, nalaReply: result.nalaReply });
  });

  r.post("/recovery/missed-call", async (req, res) => {
    const body = req.body as { callerName?: string; callerPhone?: string; dealershipId?: string; vehicleHint?: string };
    if (!body.callerPhone?.trim()) return res.status(400).json({ error: "callerPhone is required." });
    const result = await recoverMissedCall(body);
    res.json({ ok: true, ...result });
  });

  r.get("/tradein", (_req, res) => res.json({ tradeIns: listTradeIns() }));
  r.post("/tradein", async (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (body.action === "photo") {
      const tradeInId = String(body.tradeInId || "");
      const url = String(body.url || "");
      if (!tradeInId || !url) return res.status(400).json({ error: "tradeInId and url required" });
      const result = attachTradeInPhoto({ tradeInId, label: String(body.label || "photo"), url });
      if ("error" in result) return res.status(404).json(result);
      return res.json({ ok: true, tradeIn: result });
    }
    const buyerName = String(body.buyerName || "").trim();
    const buyerPhone = String(body.buyerPhone || "").trim();
    const message = String(body.message || "").trim();
    if (!buyerName || !buyerPhone || !message) {
      return res.status(400).json({ error: "buyerName, buyerPhone, message required" });
    }
    const tradeIn = captureTradeIn({ buyerName, buyerPhone, message });
    await sendWhatsApp({ to: buyerPhone, body: tradeIn.nalaReply, leadId: tradeIn.id });
    await emitCrmEvent({ event: "tradein.captured", payload: { tradeInId: tradeIn.id } });
    res.json({ ok: true, tradeIn });
  });

  r.get("/reports/monday", (_req, res) => {
    res.json({ emails: listEmailOutbox().slice(0, 30), whatsapp: listWhatsAppOutbox().slice(0, 30) });
  });
  r.post("/reports/monday", async (req, res) => {
    const body = req.body as { to?: string; dealershipName?: string };
    if (!body.to?.trim()) return res.status(400).json({ error: "to email is required." });
    const result = await sendMondayRoiEmail({ to: body.to, dealershipName: body.dealershipName });
    res.json({ ok: true, ...result });
  });

  r.get("/stock/import", (req, res) => {
    const dealershipId = String(req.query.dealershipId || "demo-yard");
    res.json({
      csvTemplate: STOCK_CSV_TEMPLATE,
      vehicles: getStock().vehicles.filter((v) => v.dealershipId === dealershipId),
      available: listAvailable(dealershipId),
    });
  });
  r.post("/stock/import", (req, res) => {
    const body = req.body as Record<string, unknown>;
    const dealershipId = typeof body.dealershipId === "string" ? body.dealershipId : "demo-yard";
    if (body.action === "import_csv") {
      return res.json({ ok: true, ...importStockCatalog({ dealershipId, rows: parseStockCsv(typeof body.csv === "string" ? body.csv : "") }) });
    }
    if (body.action === "import_json") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      return res.json({ ok: true, ...importStockCatalog({ dealershipId, rows: rows as Parameters<typeof importStockCatalog>[0]["rows"] }) });
    }
    res.status(400).json({ error: "action must be import_csv or import_json" });
  });

  r.get("/service/calendar", (_req, res) => {
    res.json({ calendar: getServiceCalendar(14), bookings: listServiceBookings().slice(0, 50) });
  });
  r.post("/service/calendar", (req, res) => {
    const body = req.body as { bookingId?: string; scheduledAt?: string };
    if (!body.bookingId || !body.scheduledAt) {
      return res.status(400).json({ error: "bookingId and scheduledAt required" });
    }
    const result = rescheduleService(body.bookingId, body.scheduledAt);
    if ("error" in result) return res.status(400).json(result);
    res.json({ ok: true, booking: result, calendar: getServiceCalendar(14) });
  });

  r.get("/branches", (_req, res) => {
    ensureBranches();
    seedMultiBranchStock();
    const stock = getStock();
    res.json({
      branches: listBranches().map((b) => ({
        ...b,
        stockCount: stock.vehicles.filter((v) => v.dealershipId === b.id && v.status === "available").length,
      })),
    });
  });

  r.get("/onboarding", async (req, res) => {
    res.json(await getOnboardingGuides(String(req.query.dealershipId || "demo-yard")));
  });
  r.post("/onboarding", async (req, res) => {
    const body = req.body as { dealershipId?: string; step?: OnboardStepId; name?: string; modules?: Record<string, boolean> };
    const dealershipId = body.dealershipId || "demo-yard";
    if (!body.step) return res.status(400).json({ error: "step required" });
    const state = advanceOnboarding(dealershipId, body.step, {
      name: body.name,
      modules: body.modules as Parameters<typeof advanceOnboarding>[2]["modules"],
    });
    res.json({ ok: true, state, ...(await getOnboardingGuides(dealershipId)) });
  });

  r.get("/competitors", (req, res) => {
    const id = req.query.id as CompetitorId | undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    if (q) {
      const card = battlecardFromMessage(q);
      if (!card) return res.status(404).json({ error: "No competitor matched", q });
      return res.json({ card });
    }
    if (id) {
      const competitor = getCompetitor(id);
      if (!competitor) return res.status(404).json({ error: "Unknown competitor" });
      return res.json({ card: buildBattlecard(competitor) });
    }
    res.json({
      competitors: listCompetitors().map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        categoryLabel: c.categoryLabel,
        pricing: c.pricing.public,
        sameAsGrayArx: c.sameAsGrayArx,
        oneLiner: c.oneLiner,
      })),
      packages: GRAYARX_PACKAGES,
      priceBands: PRICE_BANDS,
      beatRoadmap: BEAT_ROADMAP,
    });
  });

  r.get("/value", (_req, res) => {
    const report = calculateValue();
    const roi = buildMondayRoiReport();
    res.json({
      value: report,
      pilotMoney: moneyFromPilot({ viewingsBooked: roi.totals.viewingsBooked, afterHoursRecovered: roi.totals.afterHoursRecovered }),
      roi,
      processes: PROCESS_PLAYBOOKS,
    });
  });
  r.post("/value", (req, res) => {
    const body = req.body as Partial<ValueInputs>;
    const report = calculateValue(body);
    const roi = buildMondayRoiReport();
    res.json({
      value: report,
      pilotMoney: moneyFromPilot({
        viewingsBooked: roi.totals.viewingsBooked,
        afterHoursRecovered: roi.totals.afterHoursRecovered,
        avgGrossProfitZar: body.avgGrossProfitZar,
        viewingToSaleRate: body.viewingToSaleRate,
        grayArxMonthlyZar: body.grayArxMonthlyZar,
      }),
      roi,
    });
  });

  r.get("/finance/prequal", (_req, res) => res.json({ applications: listFinanceApplications() }));
  r.post("/finance/prequal", (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (body.action === "checklist") {
      const result = markFinanceDoc(String(body.applicationId || ""), String(body.checklistId || ""), Boolean(body.done));
      if ("error" in result) return res.status(404).json(result);
      return res.json({ ok: true, application: result });
    }
    const buyerName = typeof body.buyerName === "string" ? body.buyerName.trim() : "";
    const buyerPhone = typeof body.buyerPhone === "string" ? body.buyerPhone.trim() : "";
    if (!buyerName || !buyerPhone) return res.status(400).json({ error: "buyerName and buyerPhone required" });
    const application = startFinancePrequal({
      buyerName,
      buyerPhone,
      vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : undefined,
      vehicleLabel: typeof body.vehicleLabel === "string" ? body.vehicleLabel : undefined,
      monthlyBudget: typeof body.monthlyBudget === "number" ? body.monthlyBudget : undefined,
      deposit: typeof body.deposit === "number" ? body.deposit : undefined,
      dealershipId: typeof body.dealershipId === "string" ? body.dealershipId : undefined,
    });
    res.json({ ok: true, application });
  });

  r.get("/crm/webhooks", (_req, res) => {
    res.json({ subscriptions: listCrmSubscriptions(), deliveries: listCrmDeliveries().slice(0, 40) });
  });
  r.post("/crm/webhooks", async (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (body.action === "register") {
      const provider = body.provider as CrmProvider;
      if (!["motorx", "carleads", "adas", "custom"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }
      const sub = registerCrmWebhook({
        provider,
        url: typeof body.url === "string" ? body.url : "mock://motorx/leads",
        dealershipId: typeof body.dealershipId === "string" ? body.dealershipId : undefined,
      });
      return res.json({ ok: true, subscription: sub });
    }
    if (body.action === "emit") {
      const deliveries = await emitCrmEvent({
        event: body.event as CrmEventType,
        dealershipId: typeof body.dealershipId === "string" ? body.dealershipId : undefined,
        payload: typeof body.payload === "object" && body.payload ? (body.payload as Record<string, unknown>) : { test: true },
      });
      return res.json({ ok: true, deliveries });
    }
    res.status(400).json({ error: "action must be register or emit" });
  });

  r.get("/dealership/settings", (req, res) => {
    const id = typeof req.query.dealershipId === "string" ? req.query.dealershipId : "";
    if (id) return res.json({ settings: getDealershipSettings(id) });
    res.json({ settings: listDealershipSettings() });
  });
  r.post("/dealership/settings", (req, res) => {
    const body = req.body as Record<string, unknown>;
    const dealershipId = typeof body.dealershipId === "string" ? body.dealershipId : "";
    if (!dealershipId) return res.status(400).json({ error: "dealershipId required" });
    const settings = updateDealershipSettings(dealershipId, {
      name: typeof body.name === "string" ? body.name : undefined,
      showroomSlug: typeof body.showroomSlug === "string" ? body.showroomSlug : undefined,
      planId: typeof body.planId === "string" ? (body.planId as Parameters<typeof updateDealershipSettings>[1]["planId"]) : undefined,
      modules: typeof body.modules === "object" && body.modules ? (body.modules as Parameters<typeof updateDealershipSettings>[1]["modules"]) : undefined,
      parts: typeof body.parts === "object" && body.parts ? (body.parts as Parameters<typeof updateDealershipSettings>[1]["parts"]) : undefined,
    });
    res.json({ ok: true, settings });
  });

  r.post("/call-agent/reply", (req, res) => {
    const VALID_STAGES = new Set<CallStage>(["opening", "qualifying", "discovering", "presenting", "closing", "ended"]);
    const body = req.body as {
      message?: unknown;
      lead?: Partial<Record<keyof LeadContext, unknown>>;
      context?: { stage?: unknown; intel?: unknown };
    };
    if (typeof body.message !== "string" || !body.message.trim()) {
      return res.status(400).json({ error: "A non-empty dealership message is required." });
    }
    const lead = { ...DEFAULT_LEAD };
    if (body.lead && typeof body.lead === "object") {
      for (const key of Object.keys(lead) as Array<keyof LeadContext>) {
        const value = body.lead[key];
        if (typeof value === "string" && value.trim()) lead[key] = value.trim();
      }
    }
    const context: CallContext = {
      stage:
        typeof body.context?.stage === "string" && VALID_STAGES.has(body.context.stage as CallStage)
          ? (body.context.stage as CallStage)
          : defaultStage(),
      intel: body.context?.intel && typeof body.context.intel === "object" ? (body.context.intel as Partial<CallIntel>) : {},
    };
    const result = getSmartReply(body.message, lead, context);
    const requiresHuman = result.intent === "unknown" || result.intent === "privacy" || result.intent === "already-customer";
    res.json({
      intent: result.intent,
      response: result.reply,
      action: result.endCall ? "speak_farewell_then_end" : requiresHuman ? "speak_then_escalate" : "speak_then_listen",
      nextStep: result.nextStep,
      nextStage: result.nextStage,
      intel: result.intel,
      intelNote: result.intelNote ?? null,
      suppressContact: result.intent === "do-not-call" || result.intent === "hostile",
    });
  });

  r.get("/setup/status", async (req, res) => {
    const status = await getSetupStatus(asFetchRequest(req));
    let verify = null;
    if (status.twilio.accountSidSet && status.twilio.authTokenSet) {
      verify = await verifyTwilioConnection();
    }
    res.json({ ...status, verify });
  });
  r.post("/setup/verify", async (_req, res) => {
    const result = await verifyTwilioConnection();
    res.status(result.ok ? 200 : 400).json(result);
  });
  r.post("/setup/save-credentials", (_req, res) => {
    res.status(409).json({
      saved: false,
      error:
        "Grayarx-Final keeps Twilio / OpenAI / Meta / Resend in the existing .env and Railway. Credentials were not written.",
    });
  });

  const voiceOutbound = async (req: Request, res: Response) => {
    const sessionId = String(req.query.sessionId ?? "");
    if (!sessionId) return pipeWebResponse(res, twimlDocument(`${say("Sorry, this call session expired.")}<Hangup/>`));
    const session = getLiveCallSession(sessionId);
    if (!session) return pipeWebResponse(res, twimlDocument(`${say("Sorry, this call session expired.")}<Hangup/>`));
    const params = formParams(req);
    const webReq = asFetchRequest(req);
    if (!validateTwilioRequest(webReq, params)) {
      return res.status(403).send("Invalid Twilio signature.");
    }
    if (params.CallSid) updateLiveCallSession(sessionId, { callSid: params.CallSid, status: "in-progress" });
    const opener = buildCallOpenerSpeech(session.lead);
    appendTranscript(sessionId, { role: "agent", text: opener });
    const turnUrl = webReq.url.replace("/outbound", "/turn");
    return pipeWebResponse(res, twimlDocument(`${say(opener)}${gatherSpeech(turnUrl)}`));
  };
  r.post("/twilio/voice/outbound", voiceOutbound);
  r.get("/twilio/voice/outbound", voiceOutbound);

  const voiceTurn = async (req: Request, res: Response) => {
    const sessionId = String(req.query.sessionId ?? "");
    if (!sessionId) return pipeWebResponse(res, twimlDocument(`${say("Sorry, this call session expired.")}${hangup()}`));
    const session = getLiveCallSession(sessionId);
    if (!session) return pipeWebResponse(res, twimlDocument(`${say("Sorry, this call session expired.")}${hangup()}`));
    const params = formParams(req);
    const webReq = asFetchRequest(req);
    if (!validateTwilioRequest(webReq, params)) return res.status(403).send("Invalid Twilio signature.");
    const turnUrl = webReq.url;
    const speechResult = params.SpeechResult?.trim() ?? "";
    if (!speechResult) {
      const emptyTurns = session.emptyTurns + 1;
      updateLiveCallSession(sessionId, { emptyTurns });
      if (emptyTurns >= 2) {
        const goodbye = "Sorry, I couldn't hear you clearly. I'll follow up another time. Goodbye.";
        appendTranscript(sessionId, { role: "agent", text: goodbye });
        updateLiveCallSession(sessionId, { status: "completed" });
        return pipeWebResponse(res, twimlDocument(`${say(goodbye)}${hangup()}`));
      }
      const retry = "Sorry, I didn't catch that. Could you say that again?";
      appendTranscript(sessionId, { role: "agent", text: retry });
      return pipeWebResponse(res, twimlDocument(`${say(retry)}${gatherSpeech(turnUrl)}`));
    }
    appendTranscript(sessionId, { role: "dealership", text: speechResult });
    const result = getSmartReply(speechResult, session.lead, { stage: session.stage, intel: session.intel });
    updateLiveCallSession(sessionId, {
      stage: result.nextStage,
      intel: result.intel,
      emptyTurns: 0,
      status: result.endCall ? "completed" : "in-progress",
    });
    appendTranscript(sessionId, { role: "agent", text: result.reply, intent: result.intent });
    return pipeWebResponse(res, agentTurnTwiml(result.reply, turnUrl, result.endCall));
  };
  r.post("/twilio/voice/turn", voiceTurn);
  r.get("/twilio/voice/turn", voiceTurn);

  r.post("/twilio/voice/status", async (req, res) => {
    const params = formParams(req);
    if (!validateTwilioRequest(asFetchRequest(req), params)) return res.status(403).send("Invalid Twilio signature.");
    const sessionId = String(req.query.sessionId ?? "");
    const callSid = params.CallSid;
    const callStatus = params.CallStatus;
    const session = (sessionId ? getLiveCallSession(sessionId) : undefined) ?? (callSid ? getLiveCallSessionByCallSid(callSid) : undefined);
    if (!session) return res.send("OK");
    if (callStatus === "completed") updateLiveCallSession(session.id, { status: "completed" });
    else if (["failed", "busy", "no-answer", "canceled"].includes(callStatus)) updateLiveCallSession(session.id, { status: "failed" });
    else if (callStatus === "ringing" || callStatus === "in-progress") {
      updateLiveCallSession(session.id, { status: callStatus === "ringing" ? "ringing" : "in-progress", callSid });
    }
    res.send("OK");
  });

  r.post("/twilio/voice/missed", async (req, res) => {
    const contentType = String(req.headers["content-type"] || "");
    if (contentType.includes("application/json")) {
      const body = req.body as { callerPhone?: string; callerName?: string; dealershipId?: string };
      if (!body.callerPhone) return res.status(400).json({ error: "callerPhone required" });
      const result = await recoverMissedCall(body);
      return res.json({ ok: true, ...result });
    }
    const params = formParams(req);
    const twilioReady = Boolean(process.env.TWILIO_AUTH_TOKEN?.trim() && process.env.TWILIO_ACCOUNT_SID?.trim());
    if (twilioReady && !validateTwilioRequest(asFetchRequest(req), params)) {
      return res.status(403).send("Invalid Twilio signature.");
    }
    const callerPhone = params.From || params.Caller;
    if (!callerPhone) return res.status(400).send("Missing From");
    const callStatus = (params.CallStatus || params.DialCallStatus || "").toLowerCase();
    const shouldRecover = !callStatus || ["no-answer", "busy", "failed", "canceled", "completed"].includes(callStatus);
    if (!shouldRecover) return res.send("OK");
    await recoverMissedCall({
      callerPhone,
      dealershipId: typeof req.query.dealershipId === "string" ? req.query.dealershipId : undefined,
    });
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  });

  app.use("/api", r);
}
