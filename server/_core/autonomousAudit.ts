/**
 * Autonomous Kagiso audit — runs without depending on the external Heartbeat
 * scheduler. The trigger is request-bound (not timer-bound) so it survives
 * Cloud Run cold starts:
 *
 *   - On the first qualifying HTTP request after the server boots, we check
 *     `getLastKagisoAuditRunAt()`.
 *   - If no audit row exists, OR the most recent one is older than
 *     `AUDIT_INTERVAL_MS` (default 24h), we kick off the audit *in the
 *     background* (`void runAuditOnce()`), so the request that triggered it
 *     never blocks.
 *   - An in-process lock (`isRunning`) prevents two concurrent audits when
 *     multiple requests arrive in the same instant.
 *   - The audit writes new findings to `upgrade_roadmap` (deduped by hash),
 *     so it's safe to run repeatedly: nothing duplicates.
 *
 * This module exposes:
 *   - `attachAutonomousAuditMiddleware(app)` — mounts a no-op middleware that
 *     fires the autonomous trigger on every request (debounced via the
 *     in-process lock + the DB freshness check).
 *   - `triggerKagisoAuditIfDue(force?)` — exported for the manual "Run audit"
 *     button on `/admin/kagiso-roadmap` and for tests.
 */

import type { Express, NextFunction, Request, Response } from "express";

import {
  createRoadmapItem,
  findRoadmapByHash,
  getKagisoSnapshot,
  getLastKagisoAuditRunAt,
  listOpenAuditFindings,
  autoResolveStaleAuditFindings,
  createProposedPatch,
  findProposedPatchByFingerprint,
} from "../db";
import { runKagisoFullAudit } from "./kagisoFullAudit";
import { proposePatchesForFindings } from "./kagisoPatchGenerator";
import { notifyOwner } from "./notification";

/** How long to wait between autonomous audit runs. */
export const AUDIT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** In-process lock — prevents two concurrent audits inside the same instance. */
let isRunning = false;
/** Local cache of the last run timestamp, populated lazily from the DB. */
let lastRunCache: number | null = null;

export type AuditTriggerResult =
  | {
      ran: true;
      inserted: number;
      skipped: number;
      autoResolved: number;
      alerted: number;
      patchesProposed: number;
      totalFindings: number;
    }
  | { ran: false; reason: "running" | "fresh"; lastRunAt: Date | null };

/**
 * Decide whether to run the audit, and if so, run it. Idempotent and safe to
 * call from anywhere (HTTP middleware, manual button, server startup).
 *
 * Pass `force=true` to bypass the freshness check (e.g. the admin "Run audit
 * now" button).
 */
export async function triggerKagisoAuditIfDue(
  force = false,
): Promise<AuditTriggerResult> {
  if (isRunning) {
    return { ran: false, reason: "running", lastRunAt: lastRunCache ? new Date(lastRunCache) : null };
  }

  if (!force) {
    const lastRun = await getLastKagisoAuditRunAt();
    lastRunCache = lastRun ? lastRun.getTime() : null;
    if (lastRun && Date.now() - lastRun.getTime() < AUDIT_INTERVAL_MS) {
      return { ran: false, reason: "fresh", lastRunAt: lastRun };
    }
  }

  isRunning = true;
  try {
    const snap = await getKagisoSnapshot();
    const result = runKagisoFullAudit(snap);

    const currentHashes = new Set(result.findings.map((f) => f.hash));

    let inserted = 0;
    let skipped = 0;
    const newAlertableFindings: Array<{
      title: string;
      severity: string;
      rationale: string;
      auditSection: string;
    }> = [];

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

      // Severity-gated alert: only the *new* critical/high findings.
      if (f.severity === "critical" || f.severity === "high") {
        newAlertableFindings.push({
          title: f.title,
          severity: f.severity,
          rationale: f.rationale,
          auditSection: f.auditSection,
        });
      }
    }

    // ------------------------------------------------------------------
    // v29: Self-improvement loop — for any inserted finding whose hash has
    // a safe-patch recipe, draft a proposed patch and persist it for the
    // founder to one-click-apply. Generator is allow-list-gated, applier is
    // separately gated, and patches are NEVER auto-applied.
    // ------------------------------------------------------------------
    let patchesProposed = 0;
    try {
      // Map each inserted finding to its row id (we need it for the FK).
      const insertedFindings = result.findings; // generator filters by hash
      const drafts = await proposePatchesForFindings(insertedFindings);
      for (const { finding, draft } of drafts) {
        const roadmapRow = await findRoadmapByHash(finding.hash);
        if (!roadmapRow) continue;
        const existingPatch = await findProposedPatchByFingerprint(
          roadmapRow.id,
          draft.filePath,
          draft.findText,
        );
        if (existingPatch) continue;
        await createProposedPatch({
          findingId: roadmapRow.id,
          category: draft.category,
          title: draft.title,
          rationale: draft.rationale,
          filePath: draft.filePath,
          findText: draft.findText,
          replaceText: draft.replaceText,
          diffPreview: draft.diffPreview,
        });
        patchesProposed += 1;
      }
    } catch (err) {
      console.error("[AutonomousAudit] patch generation failed", err);
    }

    // Auto-resolve stale findings: any open kagiso_full_audit roadmap row whose
    // hash is NOT in this run is no longer being detected, so we mark it
    // auto_resolved with an audit-trail note.
    const openHashes = await listOpenAuditFindings();
    const stale = openHashes.filter((h) => h.hash && !currentHashes.has(h.hash));
    let autoResolved = 0;
    if (stale.length) {
      const staleIds = stale.map((s) => s.id);
      autoResolved = await autoResolveStaleAuditFindings(staleIds);
    }

    // Send a single batched notifyOwner alert covering all new high/critical
    // findings from this run (only when there's at least one).
    let alerted = 0;
    if (newAlertableFindings.length > 0) {
      const lines = newAlertableFindings
        .map(
          (f, i) =>
            `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n   ${f.rationale} (section: ${f.auditSection})`,
        )
        .join("\n\n");
      try {
        const ok = await notifyOwner({
          title: `Kagiso flagged ${newAlertableFindings.length} new ${
            newAlertableFindings.length === 1 ? "issue" : "issues"
          } needing review`,
          content: `Kagiso's autonomous audit just inserted ${newAlertableFindings.length} high/critical finding(s):\n\n${lines}\n\nView them on /admin/kagiso-roadmap`,
        });
        if (ok) alerted = newAlertableFindings.length;
      } catch (err) {
        console.error("[AutonomousAudit] notifyOwner failed", err);
      }
    }

    lastRunCache = Date.now();
    console.log(
      `[AutonomousAudit] Kagiso audit complete — inserted=${inserted} skipped=${skipped} autoResolved=${autoResolved} alerted=${alerted} patchesProposed=${patchesProposed} total=${result.findings.length}`,
    );
    return {
      ran: true,
      inserted,
      skipped,
      autoResolved,
      alerted,
      patchesProposed,
      totalFindings: result.findings.length,
    };
  } catch (err) {
    console.error("[AutonomousAudit] Kagiso audit failed", err);
    throw err;
  } finally {
    isRunning = false;
  }
}

/**
 * Express middleware that fires the autonomous trigger on every request. The
 * actual work happens in the background (`void`) so the request itself is
 * never delayed. The freshness check + lock keep this cheap: 99.9% of
 * requests do nothing more than read one timestamp.
 */
export function attachAutonomousAuditMiddleware(app: Express) {
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    // Fire-and-forget — the request must not wait on Kagiso.
    void triggerKagisoAuditIfDue().catch((err) => {
      console.error("[AutonomousAudit] middleware trigger error", err);
    });
    next();
  });
  console.log("[AutonomousAudit] middleware attached — Kagiso runs every 24h autonomously");
}
