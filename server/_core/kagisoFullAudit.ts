/**
 * Kagiso — Methodical Full Audit
 * --------------------------------
 *
 * One pass through ten platform sections, in order:
 *   1.  data_health        — orphan FKs, dealerships with no rows
 *   2.  agent_activity     — which agents have / haven't run lately
 *   3.  inventory          — vehicles missing photos, VIN, price
 *   4.  lead_pipeline      — funnel coverage, stuck stages
 *   5.  pre_approvals      — backlog, time-to-decide
 *   6.  fallback           — unresolved >24h, after-hours volume
 *   7.  brand_kit          — dealerships using defaults
 *   8.  language_coverage  — missing language combos per dealership
 *   9.  ui_health          — placeholder copy, broken or missing pages
 *  10.  commercial         — pricing copy, plan tiers, billing scaffolding
 *
 * Every finding is fully self-contained (title, severity, rationale, credit
 * estimate, autonomous flag) and is hash-deduped so the same finding doesn't
 * get queued twice.
 *
 * Credit estimates here are LABELLED estimates Kagiso writes for himself.
 * They are NOT billed credits. The real rate card is platform-managed.
 * If/when the founder swaps in real rates, only this file needs to change.
 */

import type { KagisoSnapshot } from "../db";

export type AuditSection =
  | "data_health"
  | "agent_activity"
  | "inventory"
  | "lead_pipeline"
  | "pre_approvals"
  | "fallback"
  | "brand_kit"
  | "language_coverage"
  | "ui_health"
  | "commercial"
  | "agent_errors"
  | "memory_health";

export const AUDIT_SECTIONS: AuditSection[] = [
  "data_health",
  "agent_activity",
  "inventory",
  "lead_pipeline",
  "pre_approvals",
  "fallback",
  "brand_kit",
  "language_coverage",
  "ui_health",
  "commercial",
  "agent_errors",
  "memory_health",
];

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export interface Finding {
  title: string;
  description: string;
  rationale: string;
  category:
    | "new_agent"
    | "agent_improvement"
    | "integration"
    | "ui_ux"
    | "performance"
    | "security"
    | "compliance"
    | "billing"
    | "other";
  priority: "critical" | "high" | "medium" | "low";
  severity: Severity;
  /** Self-estimated credit cost to BUILD this upgrade (rough, not billed). */
  creditCostEstimate: number;
  roiEstimateZar?: number | null;
  /** Self-estimated tokens Kagiso would spend if he autonomously implemented it. */
  llmTokensEstimate?: number;
  /** TRUE if a downstream agent could implement without human input. */
  agentAutonomous: boolean;
  /** TRUE if a human MUST sign off (commercial, legal, brand, copy). */
  humanRequired: boolean;
  auditSection: AuditSection;
  /** Stable hash so we don't queue the same finding twice. */
  hash: string;
  evidenceJson: Record<string, unknown>;
}

/** ~credits the audit itself costs to run end-to-end (LLM-free baseline). */
export const AUDIT_RUN_COST_ESTIMATE = 8;

/**
 * Cost of the audit + the agent-autonomous portion of the findings, in
 * Kagiso's self-estimated units. Use this for the "how much to let Kagiso
 * fix everything autonomously" rollup.
 */
export function computeAutonomousRunCost(findings: Finding[]): {
  auditRun: number;
  autonomousFindings: number;
  total: number;
  humanFindings: number;
  totalIfHumanDoesEverything: number;
} {
  let autonomous = 0;
  let humanOnly = 0;
  for (const f of findings) {
    if (f.agentAutonomous && !f.humanRequired) {
      autonomous += f.creditCostEstimate;
    } else {
      humanOnly += f.creditCostEstimate;
    }
  }
  return {
    auditRun: AUDIT_RUN_COST_ESTIMATE,
    autonomousFindings: autonomous,
    total: AUDIT_RUN_COST_ESTIMATE + autonomous,
    humanFindings: humanOnly,
    totalIfHumanDoesEverything:
      AUDIT_RUN_COST_ESTIMATE + autonomous + humanOnly,
  };
}

/** Exported so patch recipes can key off the same finding hashes. */
export function stableHash(parts: (string | number)[]): string {
  // Deterministic, short hash so a re-run of the same audit doesn't enqueue
  // duplicates. Doesn't need to be cryptographic — only collision-stable
  // enough across reruns of the same input.
  const s = parts.join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `kg-${(h >>> 0).toString(36)}`;
}

/* -------------------------------------------------------------------------- */
/*  Section walks — each one is a pure function over the snapshot.            */
/* -------------------------------------------------------------------------- */

function walkDataHealth(snap: KagisoSnapshot): Finding[] {
  const findings: Finding[] = [];
  if (snap.dealerships === 0) {
    findings.push({
      title: "No dealerships in the database yet",
      description:
        "GrayArx has no dealerships onboarded. The platform is fully built but not yet generating revenue.",
      rationale:
        "An empty dealerships table means no inbound leads, no invoices, no fallback events to learn from. The first paid sign-up is the highest-leverage next step.",
      category: "other",
      priority: "high",
      severity: "high",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "data_health",
      hash: stableHash(["data_health", "no_dealerships"]),
      evidenceJson: { dealerships: 0 },
    });
  }
  return findings;
}

function walkAgentActivity(_snap: KagisoSnapshot): Finding[] {
  return [
    {
      title: "Chart specialist routing mix (Lerato / Tumi / Bongi / Nala)",
      description:
        "Intent routing now hands booking, trade-in, and after-hours messages to specialist agents instead of Nala alone. Kagiso should track routing volume weekly to catch misclassification or dead paths.",
      rationale:
        "The `agent_activity` table already logs Lerato bookings and Bongi fallbacks. A dashboard rollup (routing mix + conversion by agent) would surface regressions before buyers feel them.",
      category: "agent_improvement",
      priority: "medium",
      severity: "medium",
      creditCostEstimate: 25,
      roiEstimateZar: 18_000,
      llmTokensEstimate: 800,
      agentAutonomous: true,
      humanRequired: false,
      auditSection: "agent_activity",
      hash: stableHash(["agent_activity", "intent_routing_metrics_v1"]),
      evidenceJson: { intentRoutingLive: true, autonomousAuditLive: true },
    },
  ];
}

function walkInventory(snap: KagisoSnapshot): Finding[] {
  const findings: Finding[] = [];
  if (snap.vehicles > 0 && snap.vehiclesWithoutPhoto > 0) {
    findings.push({
      title: `Add primary photo to ${snap.vehiclesWithoutPhoto} vehicle${snap.vehiclesWithoutPhoto === 1 ? "" : "s"}`,
      description:
        "Vehicles without a photo convert at ~30% of the rate of those with a photo (industry baseline). Each missing photo is dead inventory.",
      rationale:
        "The schema and uploader exist; this is a data-completeness gap a human (or a CSV import) can fill quickly.",
      category: "ui_ux",
      priority:
        snap.vehiclesWithoutPhoto >= 5
          ? "high"
          : snap.vehiclesWithoutPhoto >= 2
            ? "medium"
            : "low",
      severity:
        snap.vehiclesWithoutPhoto >= 5
          ? "high"
          : snap.vehiclesWithoutPhoto >= 2
            ? "medium"
            : "low",
      creditCostEstimate: 0, // no code, just data
      roiEstimateZar: snap.vehiclesWithoutPhoto * 8_000,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "inventory",
      hash: stableHash(["inventory", "missing_photo", snap.vehiclesWithoutPhoto]),
      evidenceJson: {
        vehiclesWithoutPhoto: snap.vehiclesWithoutPhoto,
        totalVehicles: snap.vehicles,
      },
    });
  }
  if (snap.vehicles > 0 && snap.vehiclesWithoutVin > 0) {
    findings.push({
      title: `Capture VIN on ${snap.vehiclesWithoutVin} vehicle${snap.vehiclesWithoutVin === 1 ? "" : "s"}`,
      description:
        "VIN unlocks NaTIS lookups and fraud checks. Vehicles without VIN cannot be auto-valuated.",
      rationale:
        "Required upstream for any future valuation agent. Cheap to capture once at intake.",
      category: "compliance",
      priority: "medium",
      severity: "medium",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "inventory",
      hash: stableHash(["inventory", "missing_vin", snap.vehiclesWithoutVin]),
      evidenceJson: { vehiclesWithoutVin: snap.vehiclesWithoutVin },
    });
  }
  return findings;
}

function walkLeadPipeline(snap: KagisoSnapshot): Finding[] {
  if (snap.leadsLast30d === 0 && snap.dealerships > 0) {
    return [
      {
        title: "No leads captured in the last 30 days",
        description:
          "There are dealerships onboarded but zero inbound leads have hit the platform in the last 30 days. Either the public showroom isn't routing leads in, or marketing isn't pointing at the right URL.",
        rationale:
          "Lead capture is the core value prop. Zero leads in 30d on an active dealership is a top-priority signal.",
        category: "performance",
        priority: "critical",
        severity: "critical",
        creditCostEstimate: 40,
        roiEstimateZar: 180_000,
        llmTokensEstimate: 1_500,
        agentAutonomous: false,
        humanRequired: true,
        auditSection: "lead_pipeline",
        hash: stableHash(["lead_pipeline", "zero_30d", snap.dealerships]),
        evidenceJson: {
          leadsLast30d: snap.leadsLast30d,
          dealerships: snap.dealerships,
        },
      },
    ];
  }
  return [];
}

function walkPreApprovals(snap: KagisoSnapshot): Finding[] {
  if (snap.preApprovalsPending >= 3) {
    return [
      {
        title: `${snap.preApprovalsPending} pre-approvals waiting for human decision`,
        description:
          "Naledi has captured pre-approval applications but a human has not yet decided on them. Customer expectation is a same-day reply.",
        rationale:
          "Naledi never approves — humans do. Backlog here is a SLA risk.",
        category: "compliance",
        priority: "high",
        severity: "high",
        creditCostEstimate: 0,
        roiEstimateZar: snap.preApprovalsPending * 15_000,
        llmTokensEstimate: 0,
        agentAutonomous: false,
        humanRequired: true,
        auditSection: "pre_approvals",
        hash: stableHash([
          "pre_approvals",
          "pending_backlog",
          Math.min(snap.preApprovalsPending, 100),
        ]),
        evidenceJson: { pending: snap.preApprovalsPending },
      },
    ];
  }
  return [];
}

function walkFallback(snap: KagisoSnapshot): Finding[] {
  if (snap.fallbackUnresolved >= 5) {
    return [
      {
        title: `${snap.fallbackUnresolved} fallback messages unresolved`,
        description:
          "Bongi has after-hours messages with no human follow-up. Each unresolved message risks a lost lead and a churned customer.",
        rationale:
          "Resolution requires reading the inbound and replying. Cheap human work, but the agent can pre-draft.",
        category: "agent_improvement",
        priority: "high",
        severity: "high",
        creditCostEstimate: 25,
        roiEstimateZar: snap.fallbackUnresolved * 5_000,
        llmTokensEstimate: 800,
        agentAutonomous: true,
        humanRequired: true, // both — agent drafts, human approves
        auditSection: "fallback",
        hash: stableHash(["fallback", "unresolved_24h"]),
        evidenceJson: { unresolved: snap.fallbackUnresolved },
      },
    ];
  }
  return [];
}

function walkBrandKit(snap: KagisoSnapshot): Finding[] {
  if (snap.brandKitIncomplete > 0 && snap.dealerships > 0) {
    return [
      {
        title: `${snap.brandKitIncomplete} dealership${snap.brandKitIncomplete === 1 ? "" : "s"} on default brand kit`,
        description:
          "Brand kits are missing logo, accent colour, or signature. Every customer-facing reply uses GrayArx defaults instead of the dealership's own identity — undermining trust.",
        rationale:
          "Logo + colour + signature are 5-minute uploads. Founder needs to nudge the dealership owner.",
        category: "ui_ux",
        priority: "medium",
        severity: "medium",
        creditCostEstimate: 0,
        roiEstimateZar: snap.brandKitIncomplete * 12_000,
        llmTokensEstimate: 0,
        agentAutonomous: false,
        humanRequired: true,
        auditSection: "brand_kit",
        hash: stableHash(["brand_kit", "incomplete", snap.brandKitIncomplete]),
        evidenceJson: { incompleteCount: snap.brandKitIncomplete },
      },
    ];
  }
  return [];
}

function walkLanguageCoverage(_snap: KagisoSnapshot): Finding[] {
  // Coverage was just brought to 11/11 in v23 — record it as a positive
  // info-level finding the founder can dismiss.
  return [
    {
      title: "Language coverage now 11/11 SA official + Portuguese",
      description:
        "All four customer-facing agents (Mia, Nala, Bongi, Naledi) now ship templates in every SA official language and Portuguese.",
      rationale:
        "Audit recorded as info — no action required. Marks a delivery checkpoint so future regressions show up.",
      category: "compliance",
      priority: "low",
      severity: "info",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: false,
      auditSection: "language_coverage",
      hash: stableHash(["language_coverage", "11_official_v23"]),
      evidenceJson: { saOfficial: 11, portuguese: true },
    },
  ];
}

function walkUiHealth(_snap: KagisoSnapshot): Finding[] {
  return [
    {
      title: "Sweep public marketing surfaces for stale language counts",
      description:
        "Homepage, Pricing, FAQ, and competitor docs were updated to 'all 11 SA official languages'. Run a periodic grep for stale '7 languages' / 'seven languages' phrasing in any newly added marketing copy, screenshots, or social cards.",
      rationale:
        "Cheap deterministic sweep. Prevents regression as new copy is added. No founder approval needed for a copy-only edit, but flag any change >50 words for human review.",
      category: "ui_ux",
      priority: "low",
      severity: "low",
      creditCostEstimate: 3,
      roiEstimateZar: null,
      llmTokensEstimate: 120,
      agentAutonomous: true,
      humanRequired: false,
      auditSection: "ui_health",
      hash: stableHash(["ui_health", "marketing_language_count_sweep_v2"]),
      evidenceJson: { saOfficial: 11, portuguese: true, source: "shared/languages.ts" },
    },
    {
      title: "Email preview still claims pulsing logo animation",
      description:
        "Admin Email Preview sidebar shows 'Pulsing animation (2s cycle)' but production emails use a sharp static emblem (no CSS pulse). Misleading for founders testing pilot outreach.",
      rationale:
        "Safe single-string UI copy fix on AdminEmailPreview — founders should Approve the proposed patch so the test page matches real sends.",
      category: "ui_ux",
      priority: "medium",
      severity: "medium",
      creditCostEstimate: 2,
      roiEstimateZar: null,
      llmTokensEstimate: 80,
      agentAutonomous: true,
      humanRequired: false,
      auditSection: "ui_health",
      hash: stableHash(["ui_health", "email_preview_pulse_copy_v1"]),
      evidenceJson: { file: "client/src/pages/AdminEmailPreview.tsx" },
    },
  ];
}

/**
 * Infra upgrade milestones from docs/PRICING_WITH_COST_MODEL_2026.md §5 / §8.5.
 * Kagiso surfaces these on the roadmap when dealer count crosses each trigger.
 */
const INFRA_UPGRADE_MILESTONES: Array<{
  id: string;
  minDealers: number;
  title: string;
  description: string;
  rationale: string;
  priority: Finding["priority"];
  severity: Severity;
}> = [
  {
    id: "resend_pro",
    minDealers: 15,
    title: "Upgrade Resend Free → Pro (email volume)",
    description:
      "Platform is at ~15+ dealerships. Resend free is 3,000 emails/mo — moderate transactional mail hits ~80% (~2,400) around 15–20 dealers. Upgrade to Pro (~$20/mo ≈ R360) before lead/booking mail hard-fails.",
    rationale:
      "Founder action in Resend dashboard. Kagiso cannot change billing; this is a scheduled upgrade reminder.",
    priority: "high",
    severity: "high",
  },
  {
    id: "tidb_spend",
    minDealers: 20,
    title: "TiDB: leave free / confirm spending limit",
    description:
      "Approaching ~20 dealerships. Confirm TiDB Cloud free RU/storage headroom; if leaving free or adding a card, set a monthly spending limit immediately (pilot cap ~USD $30–50 ≈ R550–R900).",
    rationale:
      "Spend limits are set in TiDB Cloud (console or ticloud CLI) — not via GrayArx API. Founder must act before RU throttling or surprise bills.",
    priority: "high",
    severity: "high",
  },
  {
    id: "railway_scale",
    minDealers: 20,
    title: "Railway: bump RAM / replicas for traffic",
    description:
      "~20–25 dealerships is when traffic spikes justify a Railway plan bump (+R500–1,500/mo typical).",
    rationale:
      "Founder scales hosting in Railway dashboard when latency or OOM appears — Kagiso only flags the milestone.",
    priority: "medium",
    severity: "medium",
  },
  {
    id: "openai_budget",
    minDealers: 20,
    title: "OpenAI: raise budget / auto top-up floor",
    description:
      "~20 active dealerships (especially WhatsApp Growth) — revisit OpenAI monthly budget and keep auto top-up on so polish does not die on insufficient_quota.",
    rationale:
      "Billing is OpenAI dashboard only. Templates still work without quota; quality drops.",
    priority: "high",
    severity: "medium",
  },
  {
    id: "infra_scale_60",
    minDealers: 60,
    title: "Larger infra: TiDB / Railway / OpenAI reserved budget",
    description:
      "~60 dealerships — plan TiDB dedicated or higher RU, Railway pro, OpenAI reserved budget, and CDN. Infra step-up roughly +R5k–15k/mo.",
    rationale:
      "Strategic founder decision from PRICING_WITH_COST_MODEL_2026 §5. Not autonomous.",
    priority: "high",
    severity: "high",
  },
];

function walkCommercial(snap: KagisoSnapshot): Finding[] {
  const dealers = snap.dealerships ?? 0;
  const findings: Finding[] = [
    {
      title: "Confirm pricing copy matches Showroom / Growth / Multi-site",
      description:
        "Public /pricing is hidden during pilot (PILOT_PRICING_HIDDEN). When unhiding, confirm Showroom R3,999 / Growth R7,999 / Multi-site R11,999 and usage caps match shared/subscriptionTiers.ts.",
      rationale:
        "Pricing is a founder-only call. Agent shouldn't change numbers without sign-off.",
      category: "billing",
      priority: "medium",
      severity: "medium",
      creditCostEstimate: 10,
      roiEstimateZar: null,
      llmTokensEstimate: 400,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "commercial",
      hash: stableHash(["commercial", "pricing_review_v2"]),
      evidenceJson: { dealerships: dealers, source: "docs/PRICING_WITH_COST_MODEL_2026.md" },
    },
  ];

  for (const m of INFRA_UPGRADE_MILESTONES) {
    if (dealers < m.minDealers) continue;
    findings.push({
      title: m.title,
      description: m.description,
      rationale: m.rationale,
      category: "billing",
      priority: m.priority,
      severity: m.severity,
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "commercial",
      hash: stableHash(["commercial", "infra_upgrade", m.id, m.minDealers]),
      evidenceJson: {
        dealerships: dealers,
        triggerAt: m.minDealers,
        doc: "docs/PRICING_WITH_COST_MODEL_2026.md §5 / §8.5",
      },
    });
  }

  return findings;
}

function walkAgentErrors(snap: KagisoSnapshot): Finding[] {
  const findings: Finding[] = [];
  const cb = snap.circuitBreakerState ?? {};

  if (cb["openai"]?.state === "open") {
    findings.push({
      title: "OpenAI circuit breaker is open — LLM offline",
      description:
        "The OpenAI circuit breaker has tripped after repeated failures. All AI-generated replies are falling back to templates. Agents cannot learn or generate personalised responses.",
      rationale:
        "Check OpenAI billing quota or API key. Top up credits or rotate the key. Replies degrade to static templates until resolved.",
      category: "agent_improvement",
      priority: "critical",
      severity: "critical",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "agent_errors",
      hash: stableHash(["agent_errors", "openai_circuit_open"]),
      evidenceJson: { breakerState: cb["openai"] },
    });
  } else if ((cb["openai"]?.failures ?? 0) >= 3) {
    findings.push({
      title: "OpenAI has 3+ consecutive failures — at risk of circuit open",
      description:
        `OpenAI has recorded ${cb["openai"]?.failures} consecutive failures. If it reaches 5, the circuit breaker will open and all LLM calls will be blocked.`,
      rationale:
        "Investigate API key validity and OpenAI quota before the breaker fully opens.",
      category: "agent_improvement",
      priority: "high",
      severity: "high",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "agent_errors",
      hash: stableHash(["agent_errors", "openai_failures_high", Math.min(cb["openai"]?.failures ?? 0, 10)]),
      evidenceJson: { breakerState: cb["openai"] },
    });
  }

  if (cb["whatsapp"]?.state === "open") {
    findings.push({
      title: "WhatsApp circuit breaker is open — messaging offline",
      description:
        "The WhatsApp API circuit breaker has tripped. Nala cannot send or receive WhatsApp messages. Inbound customer leads are unserviced.",
      rationale:
        "Check WhatsApp Business API credentials and Meta phone number registration. This is a revenue-impacting outage.",
      category: "integration",
      priority: "high",
      severity: "high",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "agent_errors",
      hash: stableHash(["agent_errors", "whatsapp_circuit_open"]),
      evidenceJson: { breakerState: cb["whatsapp"] },
    });
  }

  if (cb["resend"]?.state === "open") {
    findings.push({
      title: "Resend email circuit breaker is open — email offline",
      description:
        "The Resend transactional email circuit breaker has tripped. Mia cannot send drip emails, follow-ups, or notifications.",
      rationale:
        "Check Resend API key and account status. Email follow-up cadences will stall until resolved.",
      category: "integration",
      priority: "medium",
      severity: "medium",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: true,
      auditSection: "agent_errors",
      hash: stableHash(["agent_errors", "resend_circuit_open"]),
      evidenceJson: { breakerState: cb["resend"] },
    });
  }

  return findings;
}

function walkMemoryHealth(snap: KagisoSnapshot): Finding[] {
  const count = snap.agentActivityCount ?? 0;

  if (count > 500) {
    return [
      {
        title: "Memory healthy — agents have rich interaction history",
        description: `The agent_activity table holds ${count} entries. Agents now have enough context to surface meaningful patterns and personalise replies via memory retrieval.`,
        rationale:
          "Rich memory = smarter agents. No action required — recorded as a positive checkpoint.",
        category: "agent_improvement",
        priority: "low",
        severity: "info",
        creditCostEstimate: 0,
        roiEstimateZar: null,
        llmTokensEstimate: 0,
        agentAutonomous: false,
        humanRequired: false,
        auditSection: "memory_health",
        hash: stableHash(["memory_health", "rich_v1"]),
        evidenceJson: { agentActivityCount: count },
      },
    ];
  }

  return [
    {
      title: "Agent memory is thin — reply quality improves as agents interact",
      description: `Only ${count} agent_activity entries exist. Memory-augmented generation has little context to draw from. Reply personalisation will improve as interactions accumulate.`,
      rationale:
        "Encourage usage: each customer interaction, drip email, and booking confirmation adds to the shared brain. No immediate action required.",
      category: "agent_improvement",
      priority: "medium",
      severity: "medium",
      creditCostEstimate: 0,
      roiEstimateZar: null,
      llmTokensEstimate: 0,
      agentAutonomous: false,
      humanRequired: false,
      auditSection: "memory_health",
      hash: stableHash(["memory_health", "thin_v1", Math.min(count, 10)]),
      evidenceJson: { agentActivityCount: count },
    },
  ];
}

/* -------------------------------------------------------------------------- */

const SECTION_WALKERS: Record<AuditSection, (s: KagisoSnapshot) => Finding[]> = {
  data_health: walkDataHealth,
  agent_activity: walkAgentActivity,
  inventory: walkInventory,
  lead_pipeline: walkLeadPipeline,
  pre_approvals: walkPreApprovals,
  fallback: walkFallback,
  brand_kit: walkBrandKit,
  language_coverage: walkLanguageCoverage,
  ui_health: walkUiHealth,
  commercial: walkCommercial,
  agent_errors: walkAgentErrors,
  memory_health: walkMemoryHealth,
};

/**
 * Run the full audit. Pure function over a snapshot, so it's trivially
 * unit-testable without a database.
 */
export function runKagisoFullAudit(snap: KagisoSnapshot): {
  findings: Finding[];
  cost: ReturnType<typeof computeAutonomousRunCost>;
  sectionsWalked: AuditSection[];
} {
  const findings: Finding[] = [];
  for (const section of AUDIT_SECTIONS) {
    findings.push(...SECTION_WALKERS[section](snap));
  }
  const cost = computeAutonomousRunCost(findings);
  return { findings, cost, sectionsWalked: AUDIT_SECTIONS };
}
