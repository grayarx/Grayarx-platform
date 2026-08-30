import type { Express, Request, Response } from "express";
import { createProspects, getProspectsSchedule } from "../db";
import { sendScheduledReportHandler } from "./scheduledReportHandler";
import { alertFounder } from "./founderAlert";
import { isAuthorizedScheduledTask } from "./scheduledAuth";
import { runDatabaseBackup } from "./backupService";

/**
 * Weekly rotation of SA provinces — every night the prospector targets the
 * next region in this list so over a week the dealer sees national coverage.
 */
const SA_REGIONS = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Mpumalanga",
  "Limpopo",
  "North West",
  "Northern Cape",
];

function nextRegion(lastRegion: string | null | undefined): string {
  if (!lastRegion) return SA_REGIONS[0];
  const idx = SA_REGIONS.indexOf(lastRegion);
  if (idx === -1) return SA_REGIONS[0];
  return SA_REGIONS[(idx + 1) % SA_REGIONS.length];
}

async function runProspectorScout(region: string, count = 5): Promise<number> {
  // Nightly path: research real dealer websites — never invent jane.doe / info@.
  const { listProspects } = await import("../db");
  const { isFillerEmail } = await import("../../shared/prospectEmailQuality");
  const { deleteProspect } = await import("../db");
  const {
    pickNextProspectsForResearch,
  } = await import("./saProspectPool");
  const { enrichDealershipPrincipal } = await import("./prospectPrincipalEnrichment");
  const { runPrincipalEnrichmentTick } = await import("./principalEnrichmentRunner");

  const existingRows = await listProspects(1000);
  for (const row of existingRows) {
    if (row.email && isFillerEmail(row.email)) {
      await deleteProspect(row.id);
    }
  }
  const names = (await listProspects(1000)).map((r) => r.dealershipName);

  const retry = await runPrincipalEnrichmentTick({ limit: count });
  let created = retry.created;

  const { batch } = pickNextProspectsForResearch(names, count);
  for (const p of batch) {
    const result = await enrichDealershipPrincipal({
      dealershipName: p.name,
      website: p.website,
      city: p.city,
      region: p.province,
      phone: p.phone,
      brandsCarried: p.brands.join(", "),
      estimatedMonthlyVolume: p.estimatedMonthlyVolume,
    });
    if (result.status !== "enriched" || !result.hit) continue;
    const hit = result.hit;
    await createProspects([
      {
        dealershipName: p.name,
        region: p.province,
        city: p.city,
        phone: p.phone,
        email: hit.email,
        website: p.website ?? "",
        estimatedMonthlyVolume: p.estimatedMonthlyVolume,
        brandsCarried: p.brands.join(", "),
        score: 80,
        rationale: `Nightly website research — principal contact from ${hit.evidenceUrl}`,
        status: "scouted" as const,
        sourceNotes: `Nightly Prospector — ${region} | email_quality=${hit.quality}`,
        contactName: hit.contactName,
        contactRole: hit.contactRole,
        emailVerified: 1,
        emailSource: hit.source,
        enrichedAt: new Date(),
        enrichmentNotes: result.notes,
      },
    ]);
    created += 1;
  }

  console.log(`[Scheduled Prospector] region=${region} created=${created} researched=${batch.length}`);
  return created;
}

export function registerScheduledRoutes(app: Express) {
  /**
   * Kagiso autonomous nightly audit.
   * Runs `runKagisoFullAudit` against a live DB snapshot, dedupes against
   * existing roadmap items (skips hashes already present), and writes new
   * findings. Returns a summary so the platform Investigate flow can surface
   * it verbatim on failure.
   */
  app.post("/api/scheduled/kagiso-audit", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req))) {
        return res.status(403).json({ error: "cron-only" });
      }

      const { runKagisoFullAudit } = await import("./kagisoFullAudit");
      const {
        getKagisoSnapshot,
        findRoadmapByHash,
        createRoadmapItem,
      } = await import("../db");

      const snap = await getKagisoSnapshot();
      const result = runKagisoFullAudit(snap);

      let inserted = 0;
      let skipped = 0;
      for (const f of result.findings) {
        const existing = await findRoadmapByHash(f.hash);
        if (existing) {
          skipped += 1;
          continue;
        }
        await createRoadmapItem({
          title: f.title,
          description: f.description,
          rationale: f.rationale,
          category: f.category,
          priority: f.priority,
          severity: f.severity,
          creditCostEstimate: f.creditCostEstimate,
          roiEstimateZar: f.roiEstimateZar ?? null,
          llmTokensEstimate: f.llmTokensEstimate ?? 0,
          agentAutonomous: f.agentAutonomous,
          humanRequired: f.humanRequired,
          auditSection: f.auditSection,
          evidenceJson: f.evidenceJson,
          hash: f.hash,
          source: "kagiso_full_audit",
          dealershipScope: "platform",
        });
        inserted += 1;
      }

      const summary = {
        ok: true,
        inserted,
        skipped,
        totalFindings: result.findings.length,
        autonomousCost: result.cost.autonomousFindings,
        sections: result.sectionsWalked,
        ranAt: new Date().toISOString(),
      };
      console.log("[Scheduled] kagiso-audit", summary);
      return res.json(summary);
    } catch (err) {
      console.error("[Scheduled] kagiso-audit failed", err);
      alertFounder({
        title: "Scheduled job failed: kagiso-audit",
        content: `Error: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack?.slice(0, 500) : ""}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/admin/ops",
      }).catch(() => {});
      return res.status(500).json({
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined,
        context: { url: req.url },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Hourly lead drip tick — processes Day 1/3/7 follow-ups whose dueAt has
  // passed. Idempotent and safe to invoke from a Heartbeat cron or manually.
  app.post("/api/scheduled/lead-followup-tick", async (req: Request, res: Response) => {
    try {
      const isOwner = (req as unknown as { ctx?: { user?: { role?: string } } }).ctx?.user?.role === "admin";
      const authorized = isOwner || (await isAuthorizedScheduledTask(req));
      if (!authorized && process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "cron-only" });
      }
      const { tickFollowups } = await import("./leadDrip");
      const summary = await tickFollowups();
      return res.json({ ok: true, ...summary });
    } catch (err) {
      console.error("[Scheduled] lead-followup-tick failed", err);
      alertFounder({
        title: "Scheduled job failed: lead-followup-tick",
        content: `Error: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack?.slice(0, 500) : ""}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/admin/ops",
      }).catch(() => {});
      return res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // Nightly Prospector: rotates through SA provinces, then Sipho enriches
  // dealer-principal emails from real websites (named contacts only).
  app.post("/api/scheduled/prospect-nightly", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req)) && process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "cron-only" });
      }
      const schedule = await getProspectsSchedule();
      const region = nextRegion(schedule?.lastRegion);
      const count = typeof req.body?.count === "number" ? Math.max(1, Math.min(10, req.body.count)) : 5;
      const created = await runProspectorScout(region, count);
      const { runPrincipalEnrichmentTick } = await import("./principalEnrichmentRunner");
      const enrich = await runPrincipalEnrichmentTick({ limit: 5, deep: true });
      res.json({
        ok: true,
        region,
        created,
        enrich: {
          examined: enrich.examined,
          enriched: enrich.enriched,
          created: enrich.created,
          updated: enrich.updated,
        },
      });
    } catch (err) {
      console.error("[Scheduled] prospect-nightly failed", err);
      alertFounder({
        title: "Scheduled job failed: prospect-nightly",
        content: `Error: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack?.slice(0, 500) : ""}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/admin/ops",
      }).catch(() => {});
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  /**
   * Sipho principal-email enrich tick — fetches dealer websites, extracts
   * named/principal emails, updates or creates prospects. Safe to call often.
   */
  app.post("/api/scheduled/prospect-enrich-tick", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req))) {
        return res.status(403).json({ error: "cron-only" });
      }
      const limit =
        typeof req.body?.limit === "number" ? Math.max(1, Math.min(20, req.body.limit)) : 3;
      const { runPrincipalEnrichmentTick } = await import("./principalEnrichmentRunner");
      const result = await runPrincipalEnrichmentTick({ limit, deep: true });
      console.log("[Scheduled] prospect-enrich-tick", {
        examined: result.examined,
        enriched: result.enriched,
        created: result.created,
        updated: result.updated,
      });
      res.json({ ok: true, ...result, results: result.results.slice(0, 20) });
    } catch (err) {
      console.error("[Scheduled] prospect-enrich-tick failed", err);
      alertFounder({
        title: "Scheduled job failed: prospect-enrich-tick",
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/admin/ops",
      }).catch(() => {});
      res.status(500).json({ ok: false, error: String(err) });
    }
  });
  // Scheduled report delivery — sends customized reports to dealership managers
  app.post("/api/scheduled/sendReport", sendScheduledReportHandler);

  /**
   * WhatsApp message queue processor
   * Runs every 5 minutes to process pending messages with retry logic
   */
  app.post("/api/scheduled/whatsapp-queue", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req))) {
        return res.status(403).json({ error: "cron-only" });
      }

      const { processWhatsAppQueue, getQueueStats } = await import("./whatsappQueue");
      const result = await processWhatsAppQueue();
      const stats = await getQueueStats();

      console.log("[Scheduled] WhatsApp queue processed:", result);
      res.json({ ok: true, result, stats });
    } catch (err) {
      console.error("[Scheduled] whatsapp-queue failed", err);
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  /** Weekly market guide refresh — rotates through model guides */
  app.post("/api/scheduled/market-guide-weekly", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req)) && process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "cron-only" });
      }
      const { triggerMarketGuideRefreshIfDue } = await import("./marketGuideRefresh");
      const result = await triggerMarketGuideRefreshIfDue(req.body?.force === true);
      console.log("[Scheduled] market-guide-weekly", result);
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error("[Scheduled] market-guide-weekly failed", err);
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  /**
   * Daily DB backup — exports core tables to gzip'd JSON and uploads to
   * S3/R2 (or local ephemeral disk + founder alert if not configured).
   * See server/_core/backupService.ts and docs/BACKUP_RESTORE.md.
   */
  app.post("/api/scheduled/db-backup", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req))) {
        return res.status(403).json({ error: "cron-only" });
      }
      const result = await runDatabaseBackup("full");
      console.log("[Scheduled] db-backup", { id: result.id, status: result.status, durable: result.durable });
      if (result.status !== "completed") {
        return res.status(500).json({ ok: false, ...result });
      }
      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error("[Scheduled] db-backup failed", err);
      alertFounder({
        title: "Scheduled job failed: db-backup",
        content: `Error: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack?.slice(0, 500) : ""}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/admin/ops",
      }).catch(() => {});
      return res.status(500).json({ ok: false, error: String(err) });
    }
  });

  /**
   * Weekly pilot proof digest — emails founder with leads / bookings /
   * after-hours / pre-approval numbers for demos and "still in a contract" follow-ups.
   */
  app.post("/api/scheduled/weekly-pilot-digest", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req))) {
        return res.status(403).json({ error: "cron-only" });
      }
      const { sendPilotProofDigestEmail } = await import("./pilotProofDigest");
      const result = await sendPilotProofDigestEmail();
      console.log("[Scheduled] weekly-pilot-digest", {
        emailSent: result.emailSent,
        leadsLast7d: result.digest.leadsLast7d,
        afterHours: result.digest.afterHoursRepliesLast7d,
      });
      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error("[Scheduled] weekly-pilot-digest failed", err);
      alertFounder({
        title: "Scheduled job failed: weekly-pilot-digest",
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/admin/ops",
      }).catch(() => {});
      return res.status(500).json({ ok: false, error: String(err) });
    }
  });

  /**
   * This week's numbers — emails each active dealership their yard desk numbers
   * (after-hours, leads, bookings, Mia). Honours modulesEnabled.weekly_brief.
   */
  app.post("/api/scheduled/weekly-dealer-brief", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req))) {
        return res.status(403).json({ error: "cron-only" });
      }
      const { sendAllDealerWeeklyBriefs } = await import("./dealerWeeklyBrief");
      const result = await sendAllDealerWeeklyBriefs();
      console.log("[Scheduled] weekly-dealer-brief", result);
      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error("[Scheduled] weekly-dealer-brief failed", err);
      alertFounder({
        title: "Scheduled job failed: weekly-dealer-brief",
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/admin/ops",
      }).catch(() => {});
      return res.status(500).json({ ok: false, error: String(err) });
    }
  });

  /**
   * Nightly stock sync — fetches each dealership's CSV feed URL and
   * create/update/sold-marks inventory. See inventorySyncService.ts.
   */
  app.post("/api/scheduled/inventory-sync", async (req: Request, res: Response) => {
    try {
      if (!(await isAuthorizedScheduledTask(req))) {
        return res.status(403).json({ error: "cron-only" });
      }
      const { syncAllEnabledStockFeeds } = await import("./inventorySyncService");
      const result = await syncAllEnabledStockFeeds();
      console.log("[Scheduled] inventory-sync", {
        ran: result.ran,
        ok: result.ok,
        failures: result.results.filter((r) => !r.success).length,
      });
      return res.json(result);
    } catch (err) {
      console.error("[Scheduled] inventory-sync failed", err);
      alertFounder({
        title: "Scheduled job failed: inventory-sync",
        content: `Error: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack?.slice(0, 500) : ""}`,
        category: "ops",
        actionUrl: "https://www.grayarx.com/dealer/inventory/import",
      }).catch(() => {});
      return res.status(500).json({ ok: false, error: String(err) });
    }
  });
}
