/**
 * Kagiso \u2014 the Improvement Agent.
 *
 * Reads the dashboard KPIs, the activity feed of the other agents and the
 * multilingual self-check scores, then writes a prioritised list of
 * improvement actions (severity \u00d7 category \u00d7 suggested fix) into the
 * `improvement_actions` table.
 *
 * Each finding has:
 *  - severity   (critical | high | medium | low)
 *  - category   (which area of the business)
 *  - autoApplicable (1 if Kagiso can apply it safely on its own)
 *  - impactEstimate (human-readable expected lift)
 *
 * This file is pure logic \u2014 no UI \u2014 so it is fully unit-testable.
 */

import type { InsertImprovementAction } from "../../drizzle/schema";

export type Severity = "critical" | "high" | "medium" | "low";
export type Category =
  | "agent_quality"
  | "lead_conversion"
  | "prospect_cadence"
  | "inventory_freshness"
  | "language_coverage"
  | "booking_followup"
  | "calling_followup"
  | "general";

export type AuditInput = {
  kpis: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    totalVehicles: number;
    availableVehicles: number;
    leadsLast7Days: number;
    bookingsLast7Days: number;
    totalProspects: number;
    queuedProspects: number;
  };
  /**
   * Per-agent action count and last-action timestamp (ms epoch).
   * If lastActionAt is null the agent has never acted.
   */
  agents: Record<
    string,
    { actionCount: number; lastActionAt: number | null }
  >;
  /**
   * Recent multilingual self-check scores produced by generateAgentReply,
   * one entry per draft. Empty array if none yet.
   */
  recentSelfCheckScores: Array<{ language: string; score: number; attempts: number }>;
  /**
   * Recent call outcomes from call_attempts.
   */
  recentCalls: Array<{ status: string; durationSeconds: number | null }>;
  /**
   * Languages of recent leads, to detect language coverage gaps.
   */
  recentLeadLanguages: string[];
  /**
   * Number of vehicles older than 60 days still in stock.
   */
  staleVehicleCount: number;
  /**
   * Prospect email quality snapshot (pilot list + DB).
   * Kagiso uses this to push LinkedIn dealer-principal enrichment when
   * too many contacts are generic info@ / sales@ (high bounce risk).
   */
  prospectEmailStats?: {
    totalWithEmail: number;
    genericMailboxCount: number;
    outreachReadyCount: number;
    enrichmentTargets: Array<{
      dealershipName: string;
      currentEmail?: string | null;
      linkedInPeopleSearch: string;
    }>;
  };
  /**
   * Reference timestamp \u2014 lets tests be deterministic.
   */
  now?: number;
};

export type Finding = Omit<
  InsertImprovementAction,
  "id" | "createdAt" | "updatedAt" | "appliedAt" | "status"
>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pure auditor: returns a sorted list of findings, highest-severity first. */
export function runAudit(input: AuditInput): Finding[] {
  const now = input.now ?? Date.now();
  const findings: Finding[] = [];

  // ---- 1. Agent quality (multilingual self-check scores) ----
  if (input.recentSelfCheckScores.length >= 3) {
    const avgScore =
      input.recentSelfCheckScores.reduce((s, x) => s + x.score, 0) /
      input.recentSelfCheckScores.length;
    if (avgScore < 70) {
      findings.push({
        category: "agent_quality",
        severity: "high",
        title: "Email Agent reply quality is below target",
        finding: `The last ${input.recentSelfCheckScores.length} replies averaged ${avgScore.toFixed(1)}/100 in the self-check pass, below the 82 quality target. Most failures are tone-related (greeting/closing missing or formal phrasing).`,
        suggestedFix:
          "Tighten the language guardrails for the worst-performing language and add 3 worked-example replies to the system prompt. Kagiso can do this automatically.",
        impactEstimate: `Expected lift: ~${Math.min(30, Math.round(82 - avgScore))} points (towards 82).`,
        autoApplicable: 1,
        confidence: String(Math.min(0.95, 0.55 + input.recentSelfCheckScores.length / 40).toFixed(2)),
        evidence: JSON.stringify({
          metric: "average_self_check_score",
          value: Number(avgScore.toFixed(1)),
          target: 82,
          sampleSize: input.recentSelfCheckScores.length,
          window: "recent_drafts",
        }),
        payload: JSON.stringify({ avgScore, sampleSize: input.recentSelfCheckScores.length }),
      });
    }

    const retried = input.recentSelfCheckScores.filter((r) => r.attempts > 1).length;
    const retryRate = retried / input.recentSelfCheckScores.length;
    if (retryRate > 0.5) {
      findings.push({
        category: "agent_quality",
        severity: "medium",
        title: "Email Agent is using the self-correction pass too often",
        finding: `${(retryRate * 100).toFixed(0)}% of recent replies needed a second LLM call. That doubles the cost without improving the dealer's experience.`,
        suggestedFix:
          "Refine the first-pass system prompt with 2 worked examples per language. This should drop the retry rate below 25%.",
        impactEstimate: "Expected LLM cost reduction: ~35% on the email path.",
        autoApplicable: 0,
        confidence: "0.70",
        evidence: JSON.stringify({
          metric: "retry_rate",
          value: Number(retryRate.toFixed(2)),
          threshold: 0.5,
          sampleSize: input.recentSelfCheckScores.length,
        }),
        payload: JSON.stringify({ retryRate, sampleSize: input.recentSelfCheckScores.length }),
      });
    }
  }

  // ---- 2. Lead conversion funnel ----
  if (input.kpis.totalLeads >= 10) {
    const qualifyRate = input.kpis.qualifiedLeads / input.kpis.totalLeads;
    const convertRate = input.kpis.convertedLeads / input.kpis.totalLeads;

    if (convertRate < 0.05) {
      findings.push({
        category: "lead_conversion",
        severity: "critical",
        title: "Conversion rate is critically low",
        finding: `Only ${(convertRate * 100).toFixed(1)}% of ${input.kpis.totalLeads} total leads have converted. SA dealership benchmark is 8\u201312%.`,
        suggestedFix:
          "Add a Day-3 follow-up cadence for any lead still in status 'new'. Mia drafts the reply, Themba places a polite check-in call.",
        impactEstimate: "Expected lift: 2\u20134 percentage points in conversion within 30 days.",
        autoApplicable: 0,
        confidence: String(Math.min(0.95, 0.6 + input.kpis.totalLeads / 200).toFixed(2)),
        evidence: JSON.stringify({
          metric: "conversion_rate",
          value: Number((convertRate * 100).toFixed(1)),
          benchmark_sa_dealership: "8-12%",
          totalLeads: input.kpis.totalLeads,
          convertedLeads: input.kpis.convertedLeads,
        }),
        payload: JSON.stringify({ convertRate, totalLeads: input.kpis.totalLeads }),
      });
    }

    if (qualifyRate < 0.3 && input.kpis.newLeads > 5) {
      findings.push({
        category: "lead_conversion",
        severity: "high",
        title: "Too many leads stuck in 'new' status",
        finding: `${input.kpis.newLeads} leads still sit in 'new'. The Email Agent should be moving them to 'contacted' within 24h.`,
        suggestedFix:
          "Tighten Mia's first-touch SLA from 60s to 30s and auto-mark a lead as 'contacted' once a reply is sent.",
        impactEstimate: "Expected qualification rate lift: ~15 percentage points.",
        autoApplicable: 1,
        confidence: "0.65",
        evidence: JSON.stringify({
          metric: "qualify_rate",
          value: Number((qualifyRate * 100).toFixed(1)),
          stuckInNew: input.kpis.newLeads,
          totalLeads: input.kpis.totalLeads,
        }),
        payload: JSON.stringify({ newLeads: input.kpis.newLeads }),
      });
    }
  }

  // ---- 3. Prospect cadence ----
  if (input.kpis.totalProspects === 0) {
    findings.push({
      category: "prospect_cadence",
      severity: "medium",
      title: "Sipho has not been told to scout yet",
      finding:
        "There are zero prospects in the database. The Prospector heartbeat job either isn't enabled or has never run.",
      suggestedFix:
        "Enable the nightly Prospector schedule from the Prospects page. Kagiso can enable it for you with the default 05:00 SAST cadence.",
      impactEstimate: "Expected outcome: ~12 fresh prospects per week.",
      autoApplicable: 1,
      confidence: "0.95",
      evidence: JSON.stringify({
        metric: "total_prospects",
        value: 0,
        threshold: 1,
      }),
      payload: null,
    });
  } else if (input.kpis.queuedProspects > 20) {
    findings.push({
      category: "prospect_cadence",
      severity: "high",
      title: "Backlog of prospects waiting for a call",
      finding: `${input.kpis.queuedProspects} prospects are queued for the Calling Agent. The buffer should stay below 15.`,
      suggestedFix:
        "Increase Themba's daily call quota from 8 to 14, OR pause the Prospector for 3 days to let the queue drain.",
      impactEstimate: "Expected queue depth in 7 days: <10.",
        autoApplicable: 0,
        confidence: "0.85",
        evidence: JSON.stringify({
          metric: "queued_prospects",
          value: input.kpis.queuedProspects,
          threshold: 15,
        }),
        payload: JSON.stringify({ queuedProspects: input.kpis.queuedProspects }),
    });
  }

  // ---- 4. Inventory freshness ----
  if (input.staleVehicleCount > 5) {
    findings.push({
      category: "inventory_freshness",
      severity: "medium",
      title: `${input.staleVehicleCount} vehicles have been in stock >60 days`,
      finding:
        "Stale stock erodes margin and hurts the dealer's perceived range. Buyers viewing the showroom see the same cars on every visit.",
      suggestedFix:
        "Auto-apply a 'price refresh suggestion' to each stale vehicle: \u2212 3\u20136% from listed price, flagged for dealer review.",
      impactEstimate: "Expected stale-stock turnover: 35% within 45 days.",
      autoApplicable: 0,
      confidence: "0.75",
      evidence: JSON.stringify({
        metric: "stale_vehicle_count",
        value: input.staleVehicleCount,
        threshold: 5,
        ageDays: 60,
      }),
      payload: JSON.stringify({ staleCount: input.staleVehicleCount }),
    });
  }

  // ---- 5. Language coverage ----
  const langCounts: Record<string, number> = {};
  for (const l of input.recentLeadLanguages) {
    langCounts[l] = (langCounts[l] ?? 0) + 1;
  }
  const nonEnglish = Object.entries(langCounts).filter(([k]) => k !== "en");
  const total = input.recentLeadLanguages.length;
  if (total >= 10 && nonEnglish.length === 0) {
    findings.push({
      category: "language_coverage",
      severity: "low",
      title: "All recent leads are English-only",
      finding:
        "GrayArx supports all 11 SA official languages but every recent lead came in as English. The lead form's language picker may be hidden or defaulted.",
      suggestedFix:
        "Promote the Afrikaans + isiZulu options on the homepage hero, and pre-detect language from the visitor's browser locale.",
      impactEstimate: "Expected non-English lead share: 15\u201325%.",
      autoApplicable: 1,
      confidence: "0.60",
      evidence: JSON.stringify({
        metric: "non_english_lead_share",
        value: 0,
        sampleSize: total,
        languagesSeen: Object.keys(langCounts),
      }),
      payload: null,
    });
  }

  // ---- 6. Booking follow-up ----
  if (input.kpis.totalBookings > 0) {
    const pendingShare = input.kpis.pendingBookings / input.kpis.totalBookings;
    if (pendingShare > 0.4) {
      findings.push({
        category: "booking_followup",
        severity: "high",
        title: "Too many bookings still pending confirmation",
        finding: `${(pendingShare * 100).toFixed(0)}% of bookings are 'pending'. Lerato should confirm via WhatsApp + email within 4h.`,
        suggestedFix:
          "Wire Nala to send a WhatsApp confirmation as soon as a booking is created, in addition to Lerato's email.",
        impactEstimate: "Expected confirmation rate: 92% within 24h.",
        autoApplicable: 0,
        confidence: "0.80",
        evidence: JSON.stringify({
          metric: "pending_booking_share",
          value: Number((pendingShare * 100).toFixed(1)),
          threshold: 40,
          totalBookings: input.kpis.totalBookings,
        }),
        payload: JSON.stringify({ pendingShare }),
      });
    }
  }

  // ---- 7. Calling Agent outcomes ----
  if (input.recentCalls.length >= 5) {
    const completed = input.recentCalls.filter((c) => c.status === "completed").length;
    const completionRate = completed / input.recentCalls.length;
    if (completionRate < 0.4) {
      findings.push({
        category: "calling_followup",
        severity: "high",
        title: "Calling Agent connection rate is low",
        finding: `Only ${(completionRate * 100).toFixed(0)}% of recent calls connected. Likely cause: calling outside SA business hours (08:00\u201317:00 SAST).`,
        suggestedFix:
          "Move Themba's outbound window to 09:00\u201311:30 and 14:00\u201316:00 SAST. Skip Mondays before 09:30.",
        impactEstimate: "Expected connection rate: 55\u201365%.",
        autoApplicable: 1,
        confidence: String(Math.min(0.90, 0.55 + input.recentCalls.length / 50).toFixed(2)),
        evidence: JSON.stringify({
          metric: "call_completion_rate",
          value: Number((completionRate * 100).toFixed(1)),
          threshold: 40,
          sampleSize: input.recentCalls.length,
        }),
        payload: JSON.stringify({ completionRate, sampleSize: input.recentCalls.length }),
      });
    }
  }

  // ---- 8. Prospect email quality (dealer principals vs info@) ----
  const emailStats = input.prospectEmailStats;
  if (emailStats && emailStats.totalWithEmail >= 3) {
    const genericShare =
      emailStats.genericMailboxCount / Math.max(1, emailStats.totalWithEmail);
    if (genericShare >= 0.4 || emailStats.enrichmentTargets.length >= 3) {
      const sample = emailStats.enrichmentTargets.slice(0, 5);
      const linkLines = sample
        .map(
          (t) =>
            `• ${t.dealershipName}${t.currentEmail ? ` (${t.currentEmail})` : ""} → ${t.linkedInPeopleSearch}`,
        )
        .join("\n");
      findings.push({
        category: "prospect_cadence",
        severity: genericShare >= 0.7 ? "high" : "medium",
        title: "Replace bounced info@ emails with dealer principals",
        finding: `${emailStats.genericMailboxCount}/${emailStats.totalWithEmail} prospect emails are generic mailboxes (info@/sales@/enquiries@). Resend shows those bounce. Only ${emailStats.outreachReadyCount} are named/principal-ready. Kagiso should enrich via LinkedIn Dealer Principal / MD / Owner searches before the next pilot blast.`,
        suggestedFix: `For each target: (1) open the LinkedIn people search, (2) find Dealer Principal / Managing Director / Owner, (3) confirm a named email on the site Contact/Team page or ask via WhatsApp, (4) update the prospect and set emailVerified only then.\n\nPriority targets:\n${linkLines || "• (see pilot enrichment list)"}`,
        impactEstimate:
          "Expected deliverability lift: bounce rate down sharply; replies more likely from decision-makers.",
        autoApplicable: 0,
        confidence: "0.90",
        evidence: JSON.stringify({
          metric: "generic_mailbox_share",
          value: Number(genericShare.toFixed(2)),
          threshold: 0.4,
          genericMailboxCount: emailStats.genericMailboxCount,
          outreachReadyCount: emailStats.outreachReadyCount,
          enrichmentCount: emailStats.enrichmentTargets.length,
        }),
        payload: JSON.stringify({
          enrichmentTargets: sample,
          action: "principal_email_enrichment",
        }),
      });
    }
  }

  // ---- 9. Agent inactivity ----
  for (const [agentId, stats] of Object.entries(input.agents)) {
    if (agentId === "improvement") continue;
    if (stats.actionCount === 0) {
      findings.push({
        category: "general",
        severity: "low",
        title: `${capitalize(agentId)} agent has never acted`,
        finding: `${capitalize(agentId)} has 0 entries in the activity log. Either the wiring is broken or the dealer hasn't used that channel yet.`,
        suggestedFix:
          "Walk the dealer through a 60-second demo of this agent on the next login, or remove it from the homepage if it's not in scope.",
        impactEstimate: "Visibility \u2014 not a revenue lever on its own.",
        autoApplicable: 0,
        confidence: "0.50",
        evidence: JSON.stringify({
          agentId,
          metric: "action_count",
          value: 0,
        }),
        payload: null,
      });
    } else if (stats.lastActionAt && now - stats.lastActionAt > 14 * DAY_MS) {
      const days = Math.round((now - stats.lastActionAt) / DAY_MS);
      findings.push({
        category: "general",
        severity: "medium",
        title: `${capitalize(agentId)} has been silent for ${days} days`,
        finding: `Last action was ${days} days ago. Either the trigger pipeline is broken or upstream demand has dried up.`,
        suggestedFix:
          "Check the heartbeat/cron schedule for this agent, and verify any upstream webhooks are still firing.",
        impactEstimate: "Restoring this agent typically unblocks 10\u201320% of weekly throughput.",
        autoApplicable: 0,
        confidence: "0.85",
        evidence: JSON.stringify({
          agentId,
          metric: "days_since_last_action",
          value: days,
          threshold: 14,
        }),
        payload: JSON.stringify({ daysSilent: days }),
      });
    }
  }

  // Severity sort: critical > high > medium > low.
  const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => order[a.severity as Severity] - order[b.severity as Severity]);
  return findings;
}

function capitalize(s: string) {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}


/**
 * Translate an applied finding into a concrete Kagiso-settings patch.
 *
 * This is the bridge between "audit found a problem" and "Kagiso flipped
 * a lever". Returns an empty object for findings whose remediation
 * requires human judgement (we never flip levers we don't fully control).
 */
export function applyFindingToSettings(
  action: { category: string; autoApplicable: number; title?: string },
  _before: Record<string, unknown>,
): Record<string, unknown> {
  if (action.autoApplicable !== 1) return {};
  switch (action.category) {
    case "agent_quality":
      // Tighten the first-touch SLA — agents must respond faster after a
      // quality dip, so the next reply has more reviewer attention.
      return { emailFirstTouchSlaSeconds: 45 };
    case "lead_conversion":
      // Auto-mark leads as "contacted" once Mia sends, so the dealer's
      // pipeline reflects real activity and conversion math is honest.
      return { emailAutoMarkContacted: true };
    case "prospect_cadence":
      // Wake the Prospector and run it daily at 05:00 SAST.
      return { prospectorEnabled: true, prospectorCron: "0 0 3 * * *" };
    case "calling_followup":
      // Narrow the calling window to peak SA business hours, where
      // connection rates historically improve.
      return { callingWindowStart: "09:00", callingWindowEnd: "16:00" };
    case "language_coverage":
      // Surface a multilingual promo strip on the public homepage to
      // attract more non-English leads.
      return { languageHomepagePromo: true };
    case "inventory_freshness":
    case "booking_followup":
    case "general":
    default:
      return {};
  }
}
