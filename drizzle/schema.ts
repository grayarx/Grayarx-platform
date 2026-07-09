import { boolean as mysqlBoolean } from "drizzle-orm/mysql-core";
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, date, tinyint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }), // bcrypt hash for custom auth
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth', 'email', 'phone', etc.
  role: mysqlEnum("role", ["user", "admin", "founder", "dealer_owner", "dealer_consultant"]).default("user").notNull(),
  dealershipId: int("dealershipId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  emailVerified: int("emailVerified").default(0).notNull(), // 0 = not verified, 1 = verified
  emailVerifiedAt: timestamp("emailVerifiedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Dealership leads — captured from the website lead form.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId"),
  dealershipName: varchar("dealershipName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  monthlyVehicles: int("monthlyVehicles"),
  notes: text("notes"),
  source: varchar("source", { length: 64 }).default("website"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new").notNull(),
  language: varchar("language", { length: 8 }).default("en"),
  assignedTo: int("assignedTo"),
  qualityScore: decimal("qualityScore", { precision: 3, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Demo bookings — scheduled demos from the booking dialog.
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  dealershipName: varchar("dealershipName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  preferredDate: varchar("preferredDate", { length: 16 }).notNull(),
  preferredTime: varchar("preferredTime", { length: 8 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Vehicle inventory — for dealership showrooms.
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId"),
  title: varchar("title", { length: 255 }).notNull(),
  make: varchar("make", { length: 64 }),
  model: varchar("model", { length: 64 }),
  year: int("year"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  km: int("km"),
  fuel: varchar("fuel", { length: 32 }), // petrol | diesel | hybrid | electric
  transmission: varchar("transmission", { length: 32 }), // manual | automatic | dct | cvt
  bodyType: varchar("bodyType", { length: 32 }), // sedan | suv | bakkie | hatchback | coupe | mpv
  color: varchar("color", { length: 48 }),
  condition: mysqlEnum("condition", ["new", "used", "demo", "certified"]).default("used").notNull(),
  vin: varchar("vin", { length: 32 }), // full VIN; masked client-side per POPIA
  engineCc: int("engineCc"),
  doors: int("doors"),
  seats: int("seats"),
  features: json("features"), // ["Leather seats","Sunroof","Reverse camera",...]
  serviceHistory: varchar("serviceHistory", { length: 32 }), // full | partial | none
  previousOwners: int("previousOwners"),
  imageUrl: varchar("imageUrl", { length: 500 }), // legacy primary photo (kept for back-compat)
  primaryPhotoUrl: varchar("primaryPhotoUrl", { length: 500 }),
  location: varchar("location", { length: 128 }),
  description: text("description"),
  status: mysqlEnum("status", ["available", "reserved", "sold"]).default("available").notNull(),
  externalRef: varchar("externalRef", { length: 128 }), // stock/VIN/reg from CSV import; dedup key
  views: int("views").default(0).notNull(),
  leadCount: int("leadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Vehicle photos — ordered gallery for each vehicle. Bytes live in S3,
 * we just keep the storage key + the served URL here.
 */
export const vehiclePhotos = mysqlTable("vehicle_photos", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  storageKey: varchar("storageKey", { length: 255 }).notNull(),
  position: int("position").default(0).notNull(),
  caption: varchar("caption", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VehiclePhoto = typeof vehiclePhotos.$inferSelect;
export type InsertVehiclePhoto = typeof vehiclePhotos.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Conversations — record of agent-customer interactions.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId"),
  channel: mysqlEnum("channel", ["email", "voice", "whatsapp", "webchat", "sms"]).notNull(),
  agentType: mysqlEnum("agentType", ["email", "calling", "booking", "human"]).notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  transcript: text("transcript"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Prospects — dealerships discovered by the Prospector AI agent.
 * The Calling Agent then picks up prospects with status = queued_for_call.
 */
export const prospects = mysqlTable("prospects", {
  id: int("id").autoincrement().primaryKey(),
  dealershipName: varchar("dealershipName", { length: 255 }).notNull(),
  region: varchar("region", { length: 128 }),
  city: varchar("city", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  estimatedMonthlyVolume: int("estimatedMonthlyVolume"),
  brandsCarried: text("brandsCarried"),
  score: int("score").default(0).notNull(),
  rationale: text("rationale"),
  status: mysqlEnum("status", [
    "new",
    "scouted",
    "queued_for_call",
    "called",
    "contacted",
    "converted",
    "rejected",
  ]).default("new").notNull(),
  sourceNotes: text("sourceNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;

/**
 * Outbound call attempts placed by the Calling Agent on behalf of the dealer.
 * One row per attempt; linked to a prospect.
 */
export const callAttempts = mysqlTable("call_attempts", {
  id: int("id").autoincrement().primaryKey(),
  prospectId: int("prospectId").notNull(),
  provider: varchar("provider", { length: 32 }).default("twilio").notNull(),
  providerCallSid: varchar("providerCallSid", { length: 128 }),
  toNumber: varchar("toNumber", { length: 32 }).notNull(),
  fromNumber: varchar("fromNumber", { length: 32 }),
  status: mysqlEnum("status", [
    "queued",
    "initiated",
    "in_progress",
    "completed",
    "failed",
    "no_answer",
    "busy",
    "skipped",
  ]).default("queued").notNull(),
  durationSeconds: int("durationSeconds"),
  errorMessage: text("errorMessage"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallAttempt = typeof callAttempts.$inferSelect;
export type InsertCallAttempt = typeof callAttempts.$inferInsert;


/**
 * Shared activity log written by all four agents (email, calling, booking, prospector).
 * Each row records who did what, about which subject, with a human-readable summary
 * and an optional JSON payload for context.
 *
 * This is the "shared brain" that lets agents read each other's history.
 */
export const agentActivity = mysqlTable("agent_activity", {
  id: int("id").autoincrement().primaryKey(),
  agentId: mysqlEnum("agentId", ["email", "calling", "booking", "prospector", "improvement", "whatsapp", "accountant", "fallback", "preapproval", "tradein"]).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  subjectType: varchar("subjectType", { length: 32 }), // 'lead' | 'prospect' | 'booking' | 'vehicle' | 'conversation' | null
  subjectId: int("subjectId"),
  summary: varchar("summary", { length: 500 }).notNull(),
  payload: text("payload"), // JSON-encoded extra context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentActivity = typeof agentActivity.$inferSelect;
export type InsertAgentActivity = typeof agentActivity.$inferInsert;

/**
 * Improvement actions written by Kagiso (Improvement Agent).
 * Each row is a single prioritised finding with an impact estimate and a
 * suggested fix the dealer can Apply or Dismiss.
 */
export const improvementActions = mysqlTable("improvement_actions", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", [
    "agent_quality",
    "lead_conversion",
    "prospect_cadence",
    "inventory_freshness",
    "language_coverage",
    "booking_followup",
    "calling_followup",
    "new_agent_proposal",
    "general",
  ]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  finding: text("finding").notNull(),
  suggestedFix: text("suggestedFix").notNull(),
  impactEstimate: varchar("impactEstimate", { length: 255 }),
  autoApplicable: int("autoApplicable").default(0).notNull(), // 0 = needs dealer approval, 1 = Kagiso can apply itself
  status: mysqlEnum("status", ["open", "pending_approval", "applied", "dismissed"]).default("pending_approval").notNull(),
  appliedAt: timestamp("appliedAt"),
  confidence: decimal("confidence", { precision: 4, scale: 2 }), // 0.00-1.00 — how sure Kagiso is
  evidence: text("evidence"), // JSON-encoded raw KPI numbers backing the finding
  payload: text("payload"), // JSON-encoded context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImprovementAction = typeof improvementActions.$inferSelect;
export type InsertImprovementAction = typeof improvementActions.$inferInsert;

/**
 * WhatsApp draft replies generated by Nala (WhatsApp Agent).
 * Mirrors the lead-reply pipeline but with WhatsApp tone constraints.
 */
export const whatsappDrafts = mysqlTable("whatsapp_drafts", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId"),
  prospectId: int("prospectId"),
  inboundMessage: text("inboundMessage").notNull(),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  draftText: text("draftText").notNull(),
  score: decimal("score", { precision: 4, scale: 2 }),
  attempts: int("attempts").default(1).notNull(),
  issues: text("issues"),
  status: mysqlEnum("status", ["draft", "approved", "sent", "dismissed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappDraft = typeof whatsappDrafts.$inferSelect;
export type InsertWhatsappDraft = typeof whatsappDrafts.$inferInsert;

/**
 * Kagiso persisted settings — a single-row JSON store of the levers Kagiso
 * can flip when an improvement action is auto-applied.
 */
export const kagisoSettings = mysqlTable("kagiso_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingsJson: text("settingsJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KagisoSettings = typeof kagisoSettings.$inferSelect;
export type InsertKagisoSettings = typeof kagisoSettings.$inferInsert;


/**
 * Thandi — Accountant Agent
 * Invoices generated by Thandi for dealership sales
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  leadId: int("leadId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  invoiceDate: timestamp("invoiceDate").defaultNow().notNull(),
  dueDate: date("dueDate").notNull(),
  vehicleId: int("vehicleId").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vatAmount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue"]).default("draft").notNull(),
  pdfUrl: varchar("pdfUrl", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Payments recorded against invoices
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("paymentDate").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "card", "cash", "cheque"]).notNull(),
  reference: varchar("reference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * VAT reconciliation records
 */
export const vatReconciliation = mysqlTable("vat_reconciliation", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  totalInvoices: int("totalInvoices").notNull(),
  totalVatCollected: decimal("totalVatCollected", { precision: 10, scale: 2 }).notNull(),
  vatDueDate: date("vatDueDate").notNull(),
  status: mysqlEnum("status", ["pending", "submitted", "paid"]).default("pending").notNull(),
  flagged: tinyint("flagged").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VatReconciliation = typeof vatReconciliation.$inferSelect;
export type InsertVatReconciliation = typeof vatReconciliation.$inferInsert;


// ---- Phase 17 — Founder-operated restructure ----

/**
 * Dealerships — each tenant on the platform.
 */
export const dealerships = mysqlTable("dealerships", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  region: varchar("region", { length: 64 }),
  monthlyVolume: int("monthlyVolume"),
  languages: json("languages"), // ["en","af","zu",...]
  vehicleTypes: json("vehicleTypes"), // ["sedan","suv","bakkie",...]
  businessHoursJson: json("businessHoursJson"), // { mon: { open: "08:00", close: "17:00" }, ... }
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg").notNull(),
  status: mysqlEnum("status", ["onboarding", "active", "paused", "suspended"]).default("onboarding").notNull(),
  plan: mysqlEnum("plan", ["starter", "professional", "enterprise"]).default("starter").notNull(),
  // Brand kit — used by every agent's outbound output (email signature,
  // invoice header, WhatsApp footer, etc.). Optional; defaults to GrayArx
  // gold/black look when missing.
  brandLogoUrl: varchar("brandLogoUrl", { length: 500 }),
  brandAccentColor: varchar("brandAccentColor", { length: 16 }), // "#C9A24A"
  brandSignature: varchar("brandSignature", { length: 500 }),
  vatNumber: varchar("vatNumber", { length: 32 }),
  bankDetails: varchar("bankDetails", { length: 500 }), // free-form, masked client-side
  // Public shortcode used in webhook URLs / contact forms so external
  // systems can hand off after-hours messages to Bongi without auth.
  // Format: 4-12 lowercase alphanumeric, unique per dealership.
  publicShortcode: varchar("publicShortcode", { length: 12 }).unique(),
  /**
   * Per-dealership module toggles. The platform ships ~12 modules
   * (showroom, trade-in, finance, drip, whatsapp, voice, prospector,
   * accountant, fallback, agents-page, public-network, ai-ethics).
   * Founder can flip individual modules off for a specific dealership
   * without touching code or plan-tier defaults.
   * Stored as JSON object `{ moduleId: boolean }`. Missing key = enabled.
   */
  modulesEnabled: json("modulesEnabled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Dealership = typeof dealerships.$inferSelect;
export type InsertDealership = typeof dealerships.$inferInsert;

/**
 * Onboarding submissions — public form for prospective dealerships.
 */
export const onboardingSubmissions = mysqlTable("onboarding_submissions", {
  id: int("id").autoincrement().primaryKey(),
  dealershipName: varchar("dealershipName", { length: 255 }).notNull(),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  ownerEmail: varchar("ownerEmail", { length: 320 }).notNull(),
  ownerPhone: varchar("ownerPhone", { length: 32 }).notNull(),
  region: varchar("region", { length: 64 }),
  monthlyVolume: int("monthlyVolume"),
  vehicleTypes: json("vehicleTypes"), // ["sedan","suv",...]
  languages: json("languages"),
  csvUrl: varchar("csvUrl", { length: 500 }), // uploaded stock CSV
  notes: text("notes"),
  status: mysqlEnum("status", ["new", "reviewing", "approved", "rejected", "provisioned"]).default("new").notNull(),
  provisionedDealershipId: int("provisionedDealershipId"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OnboardingSubmission = typeof onboardingSubmissions.$inferSelect;
export type InsertOnboardingSubmission = typeof onboardingSubmissions.$inferInsert;

/**
 * Onboarding drafts - temporary storage for in-progress wizard submissions
 */
export const onboardingDrafts = mysqlTable("onboarding_drafts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(),
  step: int("step").notNull().default(1),
  dealershipInfo: json("dealershipInfo"),
  vehicleData: json("vehicleData"),
  teamMembers: json("teamMembers"),
  lastSavedAt: timestamp("lastSavedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OnboardingDraft = typeof onboardingDrafts.$inferSelect;
export type InsertOnboardingDraft = typeof onboardingDrafts.$inferInsert;

/**
 * Upgrade roadmap — Kagiso's batched suggestions for platform-wide improvements.
 */
export const upgradeRoadmap = mysqlTable("upgrade_roadmap", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "new_agent",
    "agent_improvement",
    "integration",
    "ui_ux",
    "performance",
    "security",
    "compliance",
    "billing",
    "other",
  ]).notNull(),
  creditCostEstimate: int("creditCostEstimate").notNull(), // ~credits to build
  roiEstimateZar: int("roiEstimateZar"), // estimated annual ZAR impact
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "approved_for_build", "in_progress", "completed", "dismissed", "auto_resolved"]).default("pending").notNull(),
  evidenceJson: json("evidenceJson"), // raw signals Kagiso saw
  source: varchar("source", { length: 64 }).default("kagiso_audit"), // kagiso_audit | dealer_request | founder_input
  dealershipScope: varchar("dealershipScope", { length: 64 }).default("platform"), // platform | specific dealership id
  hash: varchar("hash", { length: 64 }), // dedupe hash so the same idea isn't queued twice

  // --- v23+ Kagiso methodical audit fields ---
  // Which audit section produced this finding (1 of 10).
  auditSection: varchar("auditSection", { length: 48 }),
  // The severity Kagiso assigned ("info" → "critical").
  severity: mysqlEnum("severity", ["info", "low", "medium", "high", "critical"]).default("medium"),
  // Can Kagiso (or a downstream agent) actually do this without human input?
  agentAutonomous: tinyint("agentAutonomous").default(0).notNull(),
  // Does this finding require a human to make a judgement call (commercial,
  // legal, brand, copy)? agentAutonomous + humanRequired are NOT mutually
  // exclusive — a finding can be coded by an agent but only after a human
  // signs off (e.g. pricing copy).
  humanRequired: tinyint("humanRequired").default(0).notNull(),
  // Free-text "why" (1–2 sentences) shown next to the finding in the UI.
  rationale: text("rationale"),
  // Roll-up of the LLM input/output token estimate Kagiso used to produce the
  // creditCostEstimate (so we can later swap rate cards without re-running).
  llmTokensEstimate: int("llmTokensEstimate"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UpgradeRoadmap = typeof upgradeRoadmap.$inferSelect;
export type InsertUpgradeRoadmap = typeof upgradeRoadmap.$inferInsert;

/**
 * Fallback messages — when an end-customer hits a dealership after-hours and asks for a human.
 */
export const fallbackMessages = mysqlTable("fallback_messages", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  leadId: int("leadId"),
  customerName: varchar("customerName", { length: 255 }),
  customerContact: varchar("customerContact", { length: 320 }),
  referenceNumber: varchar("referenceNumber", { length: 32 }).notNull().unique(),
  channel: mysqlEnum("channel", ["email", "whatsapp", "call", "web_chat"]).notNull(),
  inboundMessage: text("inboundMessage"),
  outboundReply: text("outboundReply").notNull(),
  language: varchar("language", { length: 8 }).default("en"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FallbackMessage = typeof fallbackMessages.$inferSelect;
export type InsertFallbackMessage = typeof fallbackMessages.$inferInsert;

/**
 * Finance pre-approval applications.
 *
 * Naledi (the Pre-Approval agent) walks an applicant through the questions a
 * human F&I manager would ask, captures the answers here, and acknowledges
 * them with a reference number. The agent NEVER grants approval — the
 * `humanDecision` field is set only by a human via the admin queue.
 */
export const preApprovals = mysqlTable("pre_approvals", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  vehicleId: int("vehicleId"),
  referenceNumber: varchar("referenceNumber", { length: 32 }).notNull().unique(),
  // Applicant identity
  fullName: varchar("fullName", { length: 255 }).notNull(),
  idNumberMasked: varchar("idNumberMasked", { length: 32 }), // last-4 only — POPIA
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  // Affordability snapshot
  employmentStatus: mysqlEnum("employmentStatus", [
    "permanent",
    "contract",
    "self_employed",
    "pensioner",
    "unemployed",
  ]),
  employer: varchar("employer", { length: 255 }),
  monthsEmployed: int("monthsEmployed"),
  grossMonthlyIncome: decimal("grossMonthlyIncome", { precision: 12, scale: 2 }),
  netMonthlyIncome: decimal("netMonthlyIncome", { precision: 12, scale: 2 }),
  totalMonthlyExpenses: decimal("totalMonthlyExpenses", { precision: 12, scale: 2 }),
  existingDebtMonthly: decimal("existingDebtMonthly", { precision: 12, scale: 2 }),
  // Deal
  vehiclePrice: decimal("vehiclePrice", { precision: 12, scale: 2 }),
  desiredDeposit: decimal("desiredDeposit", { precision: 12, scale: 2 }),
  desiredTermMonths: int("desiredTermMonths"),
  hasTradeIn: tinyint("hasTradeIn").default(0).notNull(),
  tradeInDescription: varchar("tradeInDescription", { length: 500 }),
  // Free text
  notes: text("notes"),
  // Workflow
  status: mysqlEnum("status", [
    "submitted",
    "in_review",
    "more_info_needed",
    "approved",
    "declined",
    "withdrawn",
  ])
    .default("submitted")
    .notNull(),
  agentReply: text("agentReply"), // the multilingual acknowledgement Naledi sent
  language: varchar("language", { length: 8 }).default("en"),
  humanDecision: mysqlEnum("humanDecision", [
    "none",
    "approved",
    "declined",
    "more_info",
  ])
    .default("none")
    .notNull(),
  humanNote: text("humanNote"),
  decidedBy: int("decidedBy"),
  decidedAt: timestamp("decidedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PreApproval = typeof preApprovals.$inferSelect;
export type InsertPreApproval = typeof preApprovals.$inferInsert;

/**
 * Approval queue — any agent action that needs a human (founder/owner/consultant) to approve.
 */
export const approvalQueue = mysqlTable("approval_queue", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  agentId: varchar("agentId", { length: 32 }).notNull(),
  actionType: mysqlEnum("actionType", [
    "send_email",
    "send_whatsapp",
    "make_call",
    "send_invoice",
    "send_reminder",
    "create_booking",
    "update_lead",
    "high_value_invoice",
    "other",
  ]).notNull(),
  subjectType: varchar("subjectType", { length: 32 }),
  subjectId: int("subjectId"),
  summary: text("summary").notNull(),
  payloadJson: json("payloadJson"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"]).default("pending").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("medium").notNull(),
  decidedBy: int("decidedBy"),
  decidedAt: timestamp("decidedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApprovalQueue = typeof approvalQueue.$inferSelect;
export type InsertApprovalQueue = typeof approvalQueue.$inferInsert;

/**
 * API Keys — secure authentication for third-party integrations.
 * Each dealership can generate multiple API keys with different scopes.
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  scopes: json("scopes").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  active: tinyint("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Webhooks — dealership-configured endpoints for real-time lead notifications.
 */
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  events: json("events").notNull(),
  active: tinyint("active").default(1).notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  failureCount: int("failureCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

/**
 * Webhook Events — individual events queued for delivery to webhooks.
 */
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  resourceType: varchar("resourceType", { length: 32 }).notNull(),
  resourceId: int("resourceId").notNull(),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["pending", "delivered", "failed", "retrying"]).default("pending").notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

/**
 * Webhook Logs — delivery history for debugging and auditing.
 */
export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: int("webhookId").notNull(),
  webhookEventId: int("webhookEventId").notNull(),
  attempt: int("attempt").default(1).notNull(),
  statusCode: int("statusCode"),
  responseBody: text("responseBody"),
  errorMessage: text("errorMessage"),
  duration: int("duration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

/**
 * Test drive bookings — Lerato (Booking Agent).
 *
 * Captured from the public website booking form, the showroom CTA, or via
 * WhatsApp. Lerato never *confirms* a slot autonomously; she records the
 * request, suggests the next available business-hours slot, and waits for a
 * human (or the dealer admin page) to confirm/reschedule. Reference numbers
 * share the GA- format with Bongi/Naledi for consistency.
 */
export const testDriveBookings = mysqlTable("test_drive_bookings", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  vehicleId: int("vehicleId"),
  referenceNumber: varchar("referenceNumber", { length: 32 }).notNull().unique(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerContact: varchar("customerContact", { length: 320 }).notNull(),
  // Free-text "what they actually said" (POPIA-safe; we don't echo back).
  inboundMessage: text("inboundMessage"),
  // What Lerato proposed back to them (deterministic template fallback).
  outboundReply: text("outboundReply").notNull(),
  // Slot the customer asked for, in UTC milliseconds.
  requestedSlotStart: timestamp("requestedSlotStart"),
  requestedSlotEnd: timestamp("requestedSlotEnd"),
  // Slot Lerato suggested back (may equal the requested slot, or the next
  // in-hours one if the request fell after-hours).
  suggestedSlotStart: timestamp("suggestedSlotStart"),
  suggestedSlotEnd: timestamp("suggestedSlotEnd"),
  // Confirmed slot (set by a human via dealer admin).
  confirmedSlotStart: timestamp("confirmedSlotStart"),
  confirmedSlotEnd: timestamp("confirmedSlotEnd"),
  channel: mysqlEnum("channel", ["website", "whatsapp", "call", "web_chat"]).notNull(),
  language: varchar("language", { length: 8 }).default("en"),
  status: mysqlEnum("status", [
    "requested",
    "confirmed",
    "rescheduled",
    "completed",
    "cancelled",
    "no_show",
  ]).default("requested").notNull(),
  notes: text("notes"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TestDriveBooking = typeof testDriveBookings.$inferSelect;
export type InsertTestDriveBooking = typeof testDriveBookings.$inferInsert;


/**
 * Kagiso proposed patches — autonomous low-risk fix proposals.
 *
 * Kagiso writes findings to `upgrade_roadmap`. For findings whose category +
 * audit section fall inside the safe allow-list, Kagiso generates a single
 * structured patch into this table (one row per proposal). Patches are NEVER
 * applied automatically — the founder reviews the diff in the admin UI and
 * either approves (one-click apply) or rejects. The applier is constrained
 * to a safe-path allow-list and a max-diff-size guard.
 */
export const kagisoProposedPatches = mysqlTable("kagiso_proposed_patches", {
  id: int("id").autoincrement().primaryKey(),
  findingId: int("findingId").notNull(), // FK → upgrade_roadmap.id
  category: mysqlEnum("category", [
    "stale_copy",    // outdated marketing copy / numbers
    "seo_meta",      // missing meta description / OG tag
    "safe_constant", // a copy constant in shared/
  ]).notNull(),
  patchType: mysqlEnum("patchType", ["replace_text"]).default("replace_text").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  rationale: text("rationale").notNull(),
  filePath: varchar("filePath", { length: 512 }).notNull(),
  // The exact substring Kagiso wants to remove (must be unique in the file).
  findText: text("findText").notNull(),
  // The replacement substring.
  replaceText: text("replaceText").notNull(),
  // Pre-rendered unified diff string for the admin UI.
  diffPreview: text("diffPreview").notNull(),
  status: mysqlEnum("status", [
    "proposed",
    "applied",
    "rejected",
    "failed",
    "stale", // finding was auto-resolved or replaced before founder action
  ]).default("proposed").notNull(),
  errorMessage: text("errorMessage"),
  appliedAt: timestamp("appliedAt"),
  appliedBy: int("appliedBy"),
  rejectedAt: timestamp("rejectedAt"),
  rejectedBy: int("rejectedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KagisoProposedPatch = typeof kagisoProposedPatches.$inferSelect;
export type InsertKagisoProposedPatch = typeof kagisoProposedPatches.$inferInsert;


/**
 * Trade-In Quotes — Tumi's eight-factor valuation memos.
 *
 * Buyers submit details about their existing vehicle via the public Trade-In
 * Estimator page. Tumi (the Trade-In Valuation Agent) runs the eight-factor
 * model, optionally anchors against scraped comparable listings, and writes
 * a structured estimate + a natural-language memo. The dealer's principal
 * can then convert the lead into a real offer.
 *
 * Persisted (not just session-cached) so the dealer can follow up later, and
 * so Kagiso can audit Tumi's accuracy over time.
 */
export const tradeInQuotes = mysqlTable("trade_in_quotes", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId"), // null = platform-wide enquiry
  // Buyer contact (optional — they can request a quote anonymously and
  // submit contact later via the Pre-Approval handoff).
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  // Vehicle facts — the eight factors.
  make: varchar("make", { length: 80 }).notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  year: int("year").notNull(),
  mileageKm: int("mileageKm").notNull(),
  transmission: mysqlEnum("transmission", ["manual", "automatic", "cvt", "dct"]).notNull(),
  fuel: mysqlEnum("fuel", ["petrol", "diesel", "hybrid", "electric"]).notNull(),
  bodyType: varchar("bodyType", { length: 60 }).notNull(),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "poor"]).notNull(),
  serviceHistory: mysqlEnum("serviceHistory", [
    "full_dealer",
    "full_independent",
    "partial",
    "none",
  ]).notNull(),
  // Free-text — accident history, modifications, etc.
  notes: text("notes"),
  // Tumi's structured output.
  estimateLow: int("estimateLow").notNull(), // ZAR
  estimateMid: int("estimateMid").notNull(),
  estimateHigh: int("estimateHigh").notNull(),
  confidence: mysqlEnum("confidence", ["low", "medium", "high"]).notNull(),
  // Depreciation breakdown for the chart (year/mileage/condition/market deltas in ZAR).
  factorBreakdown: text("factorBreakdown").notNull(), // JSON-encoded
  // Tumi's natural-language memo (markdown).
  memoMarkdown: text("memoMarkdown").notNull(),
  language: varchar("language", { length: 5 }).default("en").notNull(),
  /** Province for dealer network matching (e.g. Gauteng) */
  province: varchar("province", { length: 64 }),
  /** JSON array of photo URLs (or data URLs) for dealer network listing */
  photoUrls: text("photoUrls"),
  /** 1 = visible on GrayArx dealer trade-in network */
  networkListed: int("networkListed").default(0).notNull(),
  status: mysqlEnum("status", [
    "estimated",
    "principal_review",
    "offer_sent",
    "accepted",
    "rejected",
    "expired",
  ]).default("estimated").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TradeInQuote = typeof tradeInQuotes.$inferSelect;
export type InsertTradeInQuote = typeof tradeInQuotes.$inferInsert;

/**
 * Dealer invitations sent to trade-in network sellers (inspection / offer).
 */
export const tradeInInvites = mysqlTable("trade_in_invites", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  dealershipId: int("dealershipId").notNull(),
  dealershipName: varchar("dealershipName", { length: 255 }).notNull(),
  inviteMessage: text("inviteMessage").notNull(),
  indicativeOfferZar: int("indicativeOfferZar"),
  leadId: int("leadId"),
  smsSent: int("smsSent").default(0).notNull(),
  emailSent: int("emailSent").default(0).notNull(),
  whatsappSent: int("whatsappSent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TradeInInvite = typeof tradeInInvites.$inferSelect;
export type InsertTradeInInvite = typeof tradeInInvites.$inferInsert;

/** Live market guide overrides refreshed weekly from AutoTrader / Cars.co.za signals */
export const marketGuideLive = mysqlTable("market_guide_live", {
  id: int("id").autoincrement().primaryKey(),
  guideKey: varchar("guideKey", { length: 120 }).notNull(),
  year: int("year").notNull(),
  tradeInValueZar: int("tradeInValueZar").notNull(),
  confidence: varchar("confidence", { length: 16 }).default("medium").notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketGuideLive = typeof marketGuideLive.$inferSelect;

export const marketGuideRefreshMeta = mysqlTable("market_guide_refresh_meta", {
  id: int("id").primaryKey().default(1),
  lastRunAt: timestamp("lastRunAt"),
  lastGuideKey: varchar("lastGuideKey", { length: 120 }),
  modelsRefreshed: int("modelsRefreshed").default(0).notNull(),
});
export type MarketGuideRefreshMeta = typeof marketGuideRefreshMeta.$inferSelect;


/**
 * Lead follow-up cadence — Mia's drip campaign.
 *
 * For every new lead in `leads`, the system inserts three rows here:
 *   - Day 1 (warm welcome, ~24 hours after capture)
 *   - Day 3 (helpful nudge with showroom + trade-in CTAs)
 *   - Day 7 (final check-in before the lead is marked lost)
 *
 * A scheduled `/api/scheduled/lead-followup-tick` endpoint runs hourly,
 * picks every row whose `dueAt <= now()` and `status = 'pending'`, drafts the
 * email via Mia in the lead's language, and marks the row `sent`.
 *
 * If the lead converts before the row fires we mark all remaining rows
 * `cancelled` so we never spam a buyer who has already bought.
 */
export const leadFollowups = mysqlTable("lead_followups", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  step: mysqlEnum("step", ["day_1", "day_3", "day_7"]).notNull(),
  dueAt: timestamp("dueAt").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "cancelled", "failed"])
    .default("pending")
    .notNull(),
  language: varchar("language", { length: 5 }).default("en").notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  draftPreview: text("draftPreview"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeadFollowup = typeof leadFollowups.$inferSelect;
export type InsertLeadFollowup = typeof leadFollowups.$inferInsert;


export const popiaConsentSignatures = mysqlTable('popia_consent_signatures', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id),
  dealershipId: int('dealership_id').notNull().references(() => dealerships.id),
  signedName: text('signed_name').notNull(), // e-signature (typed name)
  ipAddress: text('ip_address').notNull(), // IP address at time of signing
  userAgent: text('user_agent').notNull(), // Browser/device info
  formVersion: varchar('form_version', { length: 20 }).notNull().default('1.0'), // POPIA form version
  consentText: text('consent_text').notNull(), // Full form text at time of signing (for audit trail)
  signedAt: timestamp('signed_at').notNull().defaultNow(), // Timestamp of signature
  expiresAt: timestamp('expires_at').notNull(), // Annual expiry date (1 year from signedAt)
  reconfirmedAt: timestamp('reconfirmed_at'), // When user re-confirmed (if applicable)
  status: mysqlEnum('status', ['active', 'expired', 'revoked']).notNull().default('active'),
  notes: text('notes'), // Admin notes (e.g., "manually revoked", "re-confirmed")
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type PopiaConsentSignature = typeof popiaConsentSignatures.$inferSelect;
export type PopiaConsentSignatureInsert = typeof popiaConsentSignatures.$inferInsert;


/**
 * Subscriptions — monthly billing for dealerships.
 * Tracks active subscription, billing cycle, and next renewal date.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull().unique(),
  plan: mysqlEnum("plan", ["starter", "professional", "enterprise"]).notNull(),
  monthlyPriceZar: decimal("monthlyPriceZar", { precision: 10, scale: 2 }).notNull(),
  billingCycleStart: date("billingCycleStart").notNull(),
  billingCycleEnd: date("billingCycleEnd").notNull(),
  nextRenewalDate: date("nextRenewalDate").notNull(),
  status: mysqlEnum("status", ["active", "paused", "cancelled"]).default("active").notNull(),
  autoRenew: int("autoRenew").default(1).notNull(), // 0 = manual, 1 = auto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * PayFast transactions — recorded payment attempts via PayFast gateway.
 * Webhook from PayFast updates status and links to invoice.
 */
export const payfastTransactions = mysqlTable("payfast_transactions", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  invoiceId: int("invoiceId"),
  payfastReference: varchar("payfastReference", { length: 100 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  paymentMethod: varchar("paymentMethod", { length: 64 }), // "cc" | "eft" | "mpl" | "other"
  status: mysqlEnum("status", [
    "pending",
    "completed",
    "failed",
    "cancelled",
  ]).default("pending").notNull(),
  payfastResponse: text("payfastResponse"), // Full JSON response from PayFast
  completedAt: timestamp("completedAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayfastTransaction = typeof payfastTransactions.$inferSelect;
export type InsertPayfastTransaction = typeof payfastTransactions.$inferInsert;

/**
 * Email Sequences — automated drip campaigns for leads.
 * Each sequence contains multiple email templates that fire on a schedule.
 */
export const emailSequences = mysqlTable("email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: mysqlEnum("triggerType", ["new_lead", "demo_request", "manual", "abandoned_cart"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;

/**
 * Email Templates — individual emails within a sequence.
 * Each template has a subject, body, and delay from the trigger.
 */
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull().references(() => emailSequences.id),
  stepNumber: int("stepNumber").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  delayHours: int("delayHours").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email Campaign Logs — tracks each email sent, opened, clicked.
 * Used for analytics and metrics.
 */
export const emailCampaignLogs = mysqlTable("email_campaign_logs", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull().references(() => emailSequences.id),
  templateId: int("templateId").notNull().references(() => emailTemplates.id),
  leadId: int("leadId").notNull().references(() => leads.id),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  bouncedAt: timestamp("bouncedAt"),
  unsubscribedAt: timestamp("unsubscribedAt"),
  trackingPixelId: varchar("trackingPixelId", { length: 64 }),
  status: mysqlEnum("status", ["pending", "sent", "opened", "clicked", "bounced", "unsubscribed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailCampaignLog = typeof emailCampaignLogs.$inferSelect;
export type InsertEmailCampaignLog = typeof emailCampaignLogs.$inferInsert;


/**
 * Support tickets — dealership staff report bugs/issues to support agent
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["bug", "feature_request", "user_error", "performance", "other"]).default("bug").notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  kagisoReferenceId: int("kagisoReferenceId"), // links to upgradeRoadmap
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support agent customization per dealership
 */
export const supportAgents = mysqlTable("support_agents", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull().unique(),
  name: varchar("name", { length: 100 }).default("Support Agent").notNull(),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  brandColor: varchar("brandColor", { length: 7 }).default("#d4af37").notNull(),
  personalityTone: mysqlEnum("personalityTone", ["formal", "casual", "friendly", "urgent"]).default("friendly").notNull(),
  customGreeting: varchar("customGreeting", { length: 255 }).default("Hi! I'm here to help.").notNull(),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupportAgent = typeof supportAgents.$inferSelect;
export type InsertSupportAgent = typeof supportAgents.$inferInsert;

/**
 * Marketplace sales — track sales through unified showroom
 */
export const marketplaceSales = mysqlTable("marketplace_sales", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  vehicleId: int("vehicleId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  salePrice: decimal("salePrice", { precision: 12, scale: 2 }).notNull(),
  grayarxCommission: decimal("grayarxCommission", { precision: 12, scale: 2 }).notNull(), // 20% of salePrice
  dealershipRevenue: decimal("dealershipRevenue", { precision: 12, scale: 2 }).notNull(), // 80% of salePrice
  source: mysqlEnum("source", ["showroom", "walk_in", "direct_call"]).default("showroom").notNull(),
  status: mysqlEnum("status", ["inquiry", "test_drive_booked", "test_drive_completed", "sold", "lost"]).default("inquiry").notNull(),
  saleDate: timestamp("saleDate"),
  invoiceId: int("invoiceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceSale = typeof marketplaceSales.$inferSelect;
export type InsertMarketplaceSale = typeof marketplaceSales.$inferInsert;

/**
 * Dealership payouts — track payments to dealerships
 */
export const dealershipPayouts = mysqlTable("dealership_payouts", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  payoutPeriodStart: date("payoutPeriodStart").notNull(),
  payoutPeriodEnd: date("payoutPeriodEnd").notNull(),
  totalSalesCount: int("totalSalesCount").notNull(),
  totalSalesAmount: decimal("totalSalesAmount", { precision: 12, scale: 2 }).notNull(),
  dealershipShare: decimal("dealershipShare", { precision: 12, scale: 2 }).notNull(), // 80%
  grayarxShare: decimal("grayarxShare", { precision: 12, scale: 2 }).notNull(), // 20%
  status: mysqlEnum("status", ["pending", "processed", "paid"]).default("pending").notNull(),
  paidDate: timestamp("paidDate"),
  bankDetails: varchar("bankDetails", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DealershipPayout = typeof dealershipPayouts.$inferSelect;
export type InsertDealershipPayout = typeof dealershipPayouts.$inferInsert;

/**
 * Customer inquiries from showroom chatbot
 */
export const showroomInquiries = mysqlTable("showroom_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  vehicleId: int("vehicleId").notNull(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  inquiryText: text("inquiryText").notNull(),
  aiResponse: text("aiResponse"),
  status: mysqlEnum("status", ["new", "responded", "booked", "converted", "lost"]).default("new").notNull(),
  convertedToSaleId: int("convertedToSaleId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShowroomInquiry = typeof showroomInquiries.$inferSelect;
export type InsertShowroomInquiry = typeof showroomInquiries.$inferInsert;


/**
 * Landing pages — dealership-specific landing pages for lead capture
 */
export const landingPages = mysqlTable("landing_pages", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  headline: varchar("headline", { length: 255 }).notNull(),
  subheadline: text("subheadline"),
  ctaText: varchar("ctaText", { length: 100 }).default("Get Started").notNull(),
  templateType: mysqlEnum("templateType", ["lead_magnet", "demo_request", "vehicle_showcase"]).default("lead_magnet").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;

/**
 * Landing page sections — content blocks for landing pages
 */
export const landingPageSections = mysqlTable("landing_page_sections", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  sectionType: varchar("sectionType", { length: 64 }).notNull(), // hero, features, testimonials, cta, etc
  contentJson: json("contentJson").notNull(),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LandingPageSection = typeof landingPageSections.$inferSelect;
export type InsertLandingPageSection = typeof landingPageSections.$inferInsert;

/**
 * Landing page conversions — track visitor actions on landing pages
 */
export const landingPageConversions = mysqlTable("landing_page_conversions", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  visitorId: varchar("visitorId", { length: 255 }).notNull(),
  actionType: mysqlEnum("actionType", ["view", "click", "form_submit", "call"]).notNull(),
  convertedAt: timestamp("convertedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LandingPageConversion = typeof landingPageConversions.$inferSelect;
export type InsertLandingPageConversion = typeof landingPageConversions.$inferInsert;

/**
 * Analytics events — track custom events for dealerships
 */
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(), // lead_created, contact_made, booking_created, sale_completed, etc
  eventDataJson: json("eventDataJson"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Reports — generated reports for dealerships
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  reportType: mysqlEnum("reportType", ["sales", "leads", "agents", "revenue", "custom"]).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  dataJson: json("dataJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Stripe customers — link dealerships to Stripe for payments
 */
export const stripeCustomers = mysqlTable("stripe_customers", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;

/**
 * Stripe subscriptions — dealership subscription plans
 */
export const stripeSubscriptions = mysqlTable("stripe_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  planId: varchar("planId", { length: 64 }).notNull(), // basic, professional, enterprise
  status: mysqlEnum("status", ["active", "past_due", "canceled", "unpaid"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

/**
 * Notifications — SMS/WhatsApp notifications for bookings and leads
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  recipientPhone: varchar("recipientPhone", { length: 32 }).notNull(),
  notificationType: mysqlEnum("notificationType", ["booking_confirmation", "booking_reminder", "lead_alert", "payout_notification", "system_alert"]).notNull(),
  channel: mysqlEnum("channel", ["sms", "whatsapp", "email"]).notNull(),
  messageContent: text("messageContent").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "delivered"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Scheduled reports — recurring report delivery to dealership managers
 */
export const scheduledReports = mysqlTable("scheduled_reports", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  reportTemplateId: int("reportTemplateId").notNull(),
  recipientEmails: text("recipientEmails").notNull(), // JSON array of emails
  frequency: mysqlEnum("frequency", ["weekly", "monthly", "quarterly"]).notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 for weekly (0=Sunday)
  dayOfMonth: int("dayOfMonth"), // 1-31 for monthly
  timeOfDay: varchar("timeOfDay", { length: 8 }).notNull(), // HH:MM format
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }), // Heartbeat job UID
  lastSentAt: timestamp("lastSentAt"),
  nextScheduledAt: timestamp("nextScheduledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;


/**
 * Password reset tokens — for forgot password flow
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: int("used").default(0).notNull(), // 0 = false, 1 = true
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Post-signup email sequences — automated welcome, setup, and tips emails for new dealerships
 */
export const postSignupEmailSequences = mysqlTable("post_signup_email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  sequenceType: mysqlEnum("sequenceType", ["welcome", "setup_guide", "first_lead_tips"]).notNull(),
  emailTemplateId: varchar("emailTemplateId", { length: 255 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  bouncedAt: timestamp("bouncedAt"),
  bounceReason: varchar("bounceReason", { length: 255 }),
  status: mysqlEnum("status", ["scheduled", "sent", "failed", "bounced", "opened", "clicked"]).default("scheduled").notNull(),
  trackingPixelId: varchar("trackingPixelId", { length: 255 }),
  sendgridMessageId: varchar("sendgridMessageId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostSignupEmailSequence = typeof postSignupEmailSequences.$inferSelect;
export type InsertPostSignupEmailSequence = typeof postSignupEmailSequences.$inferInsert;

/**
 * Email sequence logs — delivery history and retry tracking
 */
export const emailSequenceLogs = mysqlTable("email_sequence_logs", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  sequenceType: mysqlEnum("sequenceType", ["welcome", "setup_guide", "first_lead_tips"]).notNull(),
  emailSequenceId: int("emailSequenceId").notNull(),
  attemptNumber: int("attemptNumber").default(1).notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailSequenceLog = typeof emailSequenceLogs.$inferSelect;
export type InsertEmailSequenceLog = typeof emailSequenceLogs.$inferInsert;

/**
 * WhatsApp Conversations — tracks ongoing WhatsApp conversations with customers
 */
export const whatsappConversations = mysqlTable("whatsapp_conversations", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["open", "closed", "archived"]).default("open").notNull(),
  leadId: int("leadId"), // Link to lead if applicable
  vehicleId: int("vehicleId"), // Link to vehicle if applicable
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation = typeof whatsappConversations.$inferInsert;

/**
 * WhatsApp Messages — stores all messages in conversations (sent and received)
 */
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "document", "audio", "video"]).default("text").notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("mediaUrl", { length: 500 }), // URL to media if applicable
  metaMessageId: varchar("metaMessageId", { length: 128 }), // Message ID from Meta API
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent").notNull(),
  errorMessage: text("errorMessage"), // Error details if status is failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

/**
 * WhatsApp Queue — stores messages pending delivery with retry logic
 */
export const whatsappQueue = mysqlTable("whatsapp_queue", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }).notNull(),
  messageContent: text("messageContent").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "document", "audio", "video"]).default("text").notNull(),
  mediaUrl: varchar("mediaUrl", { length: 500 }), // URL to media if applicable
  status: mysqlEnum("status", ["pending", "processing", "sent", "failed", "dead_letter"]).default("pending").notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappQueueItem = typeof whatsappQueue.$inferSelect;
export type InsertWhatsappQueueItem = typeof whatsappQueue.$inferInsert;

/**
 * WhatsApp Webhooks — logs incoming webhook events from Meta for debugging
 */
export const whatsappWebhooks = mysqlTable("whatsapp_webhooks", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId"),
  eventType: varchar("eventType", { length: 64 }).notNull(), // message, delivery, read, etc.
  payload: json("payload").notNull(), // Full webhook payload from Meta
  processed: tinyint("processed").default(0).notNull(),
  processedAt: timestamp("processedAt"),
  error: text("error"), // Error if processing failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappWebhook = typeof whatsappWebhooks.$inferSelect;
export type InsertWhatsappWebhook = typeof whatsappWebhooks.$inferInsert;


/**
 * Two-Factor Authentication Settings
 * Stores 2FA configuration per user (authenticator app, SMS, email)
 */
export const user2faSettings = mysqlTable("user_2fa_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  method: mysqlEnum("method", ["authenticator", "sms", "email"]).notNull(),
  secret: varchar("secret", { length: 255 }), // Base32-encoded secret for TOTP
  backupCodes: text("backupCodes"), // JSON array of backup codes
  enabled: tinyint("enabled").default(0).notNull(),
  enabledAt: timestamp("enabledAt"),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type User2faSettings = typeof user2faSettings.$inferSelect;
export type InsertUser2faSettings = typeof user2faSettings.$inferInsert;

/**
 * OTP Codes — One-time passwords for 2FA verification
 * Stores SMS/Email OTP codes with expiry
 */
export const otpCodes = mysqlTable("otp_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  code: varchar("code", { length: 10 }).notNull(),
  method: mysqlEnum("method", ["sms", "email", "authenticator"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;

/**
 * Social Account Linking
 * Links user accounts to Google, Apple, or other OAuth providers
 */
export const userSocialAccounts = mysqlTable("user_social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  provider: mysqlEnum("provider", ["google", "apple"]).notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  name: varchar("name", { length: 255 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  linkedAt: timestamp("linkedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserSocialAccount = typeof userSocialAccounts.$inferSelect;
export type InsertUserSocialAccount = typeof userSocialAccounts.$inferInsert;

/**
 * Admin Audit Log
 * Tracks all admin actions for compliance and debugging
 */
export const adminAuditLog = mysqlTable("admin_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull().references(() => users.id),
  action: varchar("action", { length: 64 }).notNull(), // 'reset_password', 'disable_user', 'update_role', etc.
  targetUserId: int("targetUserId").references(() => users.id),
  changesJson: text("changesJson"), // JSON object with before/after values
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;

/**
 * User Login History
 * Tracks login attempts and successful logins for security auditing
 */
export const userLoginHistory = mysqlTable("user_login_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "failed", "2fa_pending"]).notNull(),
  failureReason: varchar("failureReason", { length: 255 }), // 'invalid_password', 'account_disabled', etc.
  loginMethod: varchar("loginMethod", { length: 64 }), // 'email', 'google', 'apple', etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserLoginHistory = typeof userLoginHistory.$inferSelect;
export type InsertUserLoginHistory = typeof userLoginHistory.$inferInsert;

/**
 * User Activity Log
 * Tracks user actions for compliance and debugging
 */
export const userActivityLog = mysqlTable("user_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  action: varchar("action", { length: 64 }).notNull(), // 'viewed_dashboard', 'created_lead', 'updated_vehicle', etc.
  resourceType: varchar("resourceType", { length: 64 }), // 'lead', 'vehicle', 'booking', etc.
  resourceId: int("resourceId"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLog.$inferInsert;

/**
 * User Sessions
 * Tracks active user sessions with device info for multi-session support
 */
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  deviceName: varchar("deviceName", { length: 255 }),
  deviceType: varchar("deviceType", { length: 64 }), // 'desktop', 'mobile', 'tablet'
  browser: varchar("browser", { length: 128 }),
  os: varchar("os", { length: 128 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  isActive: int("isActive").default(1).notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * Email Verification Tokens
 * Tokens for email verification and password reset flows
 */
export const emailVerificationTokens = mysqlTable("email_verification_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  type: mysqlEnum("type", ["email_verification", "password_reset", "email_change"]).notNull(),
  isUsed: int("isUsed").default(0).notNull(),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;


/**
 * Audit Logs
 * Tracks authentication and security events for compliance and debugging
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  email: varchar("email", { length: 320 }),
  eventType: varchar("eventType", { length: 64 }).notNull(), // 'login_success', 'login_failed', etc.
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  deviceInfo: text("deviceInfo"), // JSON: { browser, os, device }
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  message: text("message"),
  metadata: text("metadata"), // JSON for additional context
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;


/**
 * Webhook Integrations
 * Stores Slack, PagerDuty, and custom webhook configurations for security alerts
 */
export const webhookIntegrations = mysqlTable("webhook_integrations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["slack", "pagerduty", "custom"]).notNull(),
  webhookUrl: text("webhookUrl").notNull(),
  apiKey: varchar("apiKey", { length: 255 }), // For PagerDuty integration key
  channel: varchar("channel", { length: 255 }), // For Slack channel override
  enabled: int("enabled").default(1).notNull(), // 1 = enabled, 0 = disabled
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookIntegration = typeof webhookIntegrations.$inferSelect;
export type InsertWebhookIntegration = typeof webhookIntegrations.$inferInsert;

/**
 * Alert Preferences
 * Stores user alert rule configurations and notification preferences
 */
export const alertPreferences = mysqlTable("alert_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  ruleName: varchar("ruleName", { length: 255 }).notNull(),
  eventTypes: text("eventTypes").notNull(), // JSON array of event types
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  channels: text("channels").notNull(), // JSON array: ['email', 'slack', 'webhook']
  webhookId: varchar("webhookId", { length: 64 }).references(() => webhookIntegrations.id),
  cooldownMinutes: int("cooldownMinutes").default(5).notNull(),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertPreference = typeof alertPreferences.$inferSelect;
export type InsertAlertPreference = typeof alertPreferences.$inferInsert;

/**
 * Global Alert Settings
 * Stores global alert configuration for users (quiet hours, deduplication, etc.)
 */
export const globalAlertSettings = mysqlTable("global_alert_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }), // HH:MM format
  enableDeduplication: int("enableDeduplication").default(1).notNull(),
  deduplicationWindowMinutes: int("deduplicationWindowMinutes").default(10).notNull(),
  autoCreateIncidents: int("autoCreateIncidents").default(1).notNull(),
  incidentSeverityThreshold: mysqlEnum("incidentSeverityThreshold", ["critical", "high", "medium", "low"]).default("high").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GlobalAlertSettings = typeof globalAlertSettings.$inferSelect;
export type InsertGlobalAlertSettings = typeof globalAlertSettings.$inferInsert;

/**
 * Auto-Remediation Triggers
 * Stores automated remediation actions triggered by SLA escalation levels
 */
export const autoRemediationTriggers = mysqlTable("auto_remediation_triggers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  escalationLevel: int("escalationLevel").notNull(), // 1, 2, 3, etc.
  actions: text("actions").notNull(), // JSON array of actions to execute
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutoRemediationTrigger = typeof autoRemediationTriggers.$inferSelect;
export type InsertAutoRemediationTrigger = typeof autoRemediationTriggers.$inferInsert;

/**
 * Remediation Action Log
 * Tracks executed auto-remediation actions for audit and debugging
 */
export const remediationActionLog = mysqlTable("remediation_action_log", {
  id: int("id").autoincrement().primaryKey(),
  alertId: varchar("alertId", { length: 64 }).notNull(),
  triggerId: int("triggerId").notNull().references(() => autoRemediationTriggers.id),
  action: varchar("action", { length: 64 }).notNull(), // 'lock_account', 'reset_password', etc.
  status: mysqlEnum("status", ["pending", "executing", "success", "failed"]).default("pending").notNull(),
  result: text("result"), // JSON with execution details
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RemediationActionLog = typeof remediationActionLog.$inferSelect;
export type InsertRemediationActionLog = typeof remediationActionLog.$inferInsert;

/**
 * WebSocket Connections
 * Tracks active WebSocket connections for real-time updates
 */
export const websocketConnections = mysqlTable("websocket_connections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  connectionId: varchar("connectionId", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  lastHeartbeatAt: timestamp("lastHeartbeatAt").defaultNow().notNull(),
});

export type WebsocketConnection = typeof websocketConnections.$inferSelect;
export type InsertWebsocketConnection = typeof websocketConnections.$inferInsert;

// ============ DEALERSHIP-SPECIFIC TABLES ============


export const customers = mysqlTable("customers", {
  id: int().primaryKey().autoincrement(),
  dealershipId: int().notNull(),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).unique(),
  phone: varchar({ length: 20 }).notNull(),
  idNumber: varchar({ length: 20 }).unique(),
  address: text(),
  city: varchar({ length: 100 }),
  province: varchar({ length: 100 }),
  zipCode: varchar({ length: 10 }),
  source: mysqlEnum("source", ["walk_in", "phone", "email", "website", "referral", "trade_in"]).notNull(),
  status: mysqlEnum("status", ["lead", "prospect", "customer", "inactive"]).default("lead"),
  preferredContact: mysqlEnum("preferredContact", ["email", "phone", "sms", "whatsapp"]).default("phone"),
  metadata: json().$type<Record<string, any>>(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
  deletedAt: timestamp(),
});


export const testDrives = mysqlTable("test_drives", {
  id: int().primaryKey().autoincrement(),
  dealershipId: int().notNull(),
  leadId: int().notNull(),
  customerId: int().notNull(),
  vehicleId: int().notNull(),
  scheduledDate: timestamp().notNull(),
  completedDate: timestamp(),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),
  notes: text(),
  rating: int(),
  createdAt: timestamp().defaultNow(),
});

export const financing = mysqlTable("financing", {
  id: int().primaryKey().autoincrement(),
  dealershipId: int().notNull(),
  leadId: int().notNull(),
  customerId: int().notNull(),
  vehicleId: int().notNull(),
  downPayment: decimal({ precision: 10, scale: 2 }).notNull(),
  loanAmount: decimal({ precision: 10, scale: 2 }).notNull(),
  interestRate: decimal({ precision: 5, scale: 2 }).notNull(),
  loanTerm: int().notNull(), // months
  monthlyPayment: decimal({ precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed"]).default("pending"),
  bankName: varchar({ length: 100 }),
  bankReference: varchar({ length: 100 }),
  metadata: json().$type<Record<string, any>>(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});

export const dealershipUsers = mysqlTable("dealership_users", {
  id: int().primaryKey().autoincrement(),
  dealershipId: int().notNull(),
  userId: int().notNull(),
  role: mysqlEnum("role", ["manager", "sales_consultant", "finance_manager", "admin"]).notNull(),
  performanceMetrics: json().$type<Record<string, any>>(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});


export const dealershipRelations = relations(dealerships, ({ many }) => ({
  vehicles: many(vehicles),
  customers: many(customers),
  leads: many(leads),
  users: many(dealershipUsers),
}));

// ============================================================================
// SERVICE REMINDERS SCHEMA
// ============================================================================

export const serviceReminders = mysqlTable("service_reminders", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  vehicleId: int("vehicleId").notNull(),
  customerId: int("customerId").notNull(),
  serviceType: varchar("serviceType", { length: 128 }).notNull(), // Oil Change, Tire Rotation, etc.
  dueDate: timestamp("dueDate").notNull(),
  dueMileage: int("dueMileage"),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "booked", "completed", "skipped"]).default("pending").notNull(),
  channel: mysqlEnum("channel", ["sms", "email", "both"]).default("sms").notNull(),
  sentAt: timestamp("sentAt"),
  respondedAt: timestamp("respondedAt"),
  appointmentBooked: mysqlBoolean("appointmentBooked").default(false).notNull(),
  appointmentDate: timestamp("appointmentDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceReminder = typeof serviceReminders.$inferSelect;
export type InsertServiceReminder = typeof serviceReminders.$inferInsert;

export const reminderRules = mysqlTable("reminder_rules", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  serviceType: varchar("serviceType", { length: 128 }).notNull(),
  interval: varchar("interval", { length: 64 }).notNull(), // "5000 miles", "6 months", etc.
  reminderDaysBefore: int("reminderDaysBefore").notNull(), // Send reminder X days before due date
  channel: mysqlEnum("channel", ["sms", "email", "both"]).default("sms").notNull(),
  enabled: mysqlBoolean("enabled").default(true).notNull(),
  messageTemplate: text("messageTemplate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReminderRule = typeof reminderRules.$inferSelect;
export type InsertReminderRule = typeof reminderRules.$inferInsert;

export const reminderHistory = mysqlTable("reminder_history", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  customerId: int("customerId").notNull(),
  serviceType: varchar("serviceType", { length: 128 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  channel: mysqlEnum("channel", ["sms", "email"]).notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "failed"]).notNull(),
  appointmentBooked: mysqlBoolean("appointmentBooked").default(false).notNull(),
  responseTime: int("responseTime"), // minutes to respond
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReminderHistory = typeof reminderHistory.$inferSelect;
export type InsertReminderHistory = typeof reminderHistory.$inferInsert;

export const maintenanceSchedules = mysqlTable("maintenance_schedules", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  serviceType: varchar("serviceType", { length: 128 }).notNull(),
  interval: varchar("interval", { length: 64 }).notNull(),
  nextDueDate: timestamp("nextDueDate"),
  nextDueMileage: int("nextDueMileage"),
  lastServiceDate: timestamp("lastServiceDate"),
  lastServiceMileage: int("lastServiceMileage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;

// ============================================================================
// DOCUMENT MANAGEMENT SCHEMA
// ============================================================================

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  customerId: int("customerId").notNull(),
  templateId: int("templateId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(), // Sales, Financing, etc.
  status: mysqlEnum("status", ["draft", "pending_signature", "signed", "archived"]).default("draft").notNull(),
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  signedAt: timestamp("signedAt"),
  signedBy: varchar("signedBy", { length: 255 }),
  downloadUrl: varchar("downloadUrl", { length: 500 }),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const documentTemplates = mysqlTable("document_templates", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId"),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // Sales, Financing, Trade-in, Service, Warranty
  content: text("content").notNull(),
  variables: json("variables"), // ["customer_name", "vehicle_info", "price"]
  isCustom: mysqlBoolean("isCustom").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = typeof documentTemplates.$inferInsert;

export const documentSignatures = mysqlTable("document_signatures", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "signed", "declined", "expired"]).default("pending").notNull(),
  signatureLink: varchar("signatureLink", { length: 500 }),
  signedAt: timestamp("signedAt"),
  signatureImage: varchar("signatureImage", { length: 500 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentSignature = typeof documentSignatures.$inferSelect;
export type InsertDocumentSignature = typeof documentSignatures.$inferInsert;

export const documentAuditLog = mysqlTable("document_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // created, sent_for_signature, signed, downloaded, archived
  performedBy: varchar("performedBy", { length: 255 }).notNull(),
  performedAt: timestamp("performedAt").defaultNow().notNull(),
  details: json("details"),
});

export type DocumentAuditLog = typeof documentAuditLog.$inferSelect;
export type InsertDocumentAuditLog = typeof documentAuditLog.$inferInsert;

// ============================================================================
// ADVANCED REPORTING SCHEMA
// ============================================================================



/**
 * Email Change Requests
 * Tracks pending email change requests that require verification
 */
export const emailChangeRequests = mysqlTable("email_change_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  currentEmail: varchar("currentEmail", { length: 320 }).notNull(),
  newEmail: varchar("newEmail", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  isUsed: int("isUsed").default(0).notNull(),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailChangeRequest = typeof emailChangeRequests.$inferSelect;
export type InsertEmailChangeRequest = typeof emailChangeRequests.$inferInsert;


// ============================================================================
// EMAIL METRICS & TRACKING
// ============================================================================

export const emailMetrics = mysqlTable("emailMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", [
    "signup_email_sent",
    "verification_email_sent",
    "verification_email_clicked",
    "verification_email_verified",
    "password_reset_sent",
    "password_reset_completed",
    "email_change_requested",
    "email_change_verified",
    "email_bounced",
    "email_unsubscribed",
  ]).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  bounceReason: varchar("bounceReason", { length: 255 }), // "invalid", "hard_bounce", "soft_bounce", "complaint"
  metadata: json("metadata"), // Additional tracking data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type EmailMetric = typeof emailMetrics.$inferSelect;
export type InsertEmailMetric = typeof emailMetrics.$inferInsert;

// ============================================================================
// EMAIL PREFERENCES
// ============================================================================

export const emailPreferences = mysqlTable("emailPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  marketingEmails: int("marketingEmails").default(1).notNull(), // 0 = disabled, 1 = enabled
  transactionalEmails: int("transactionalEmails").default(1).notNull(), // Cannot be disabled
  alertEmails: int("alertEmails").default(1).notNull(),
  weeklyDigest: int("weeklyDigest").default(1).notNull(),
  dailyDigest: int("dailyDigest").default(0).notNull(),
  frequency: mysqlEnum("frequency", ["never", "daily", "weekly", "monthly"]).default("weekly").notNull(),
  unsubscribeToken: varchar("unsubscribeToken", { length: 255 }).unique(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailPreference = typeof emailPreferences.$inferSelect;
export type InsertEmailPreference = typeof emailPreferences.$inferInsert;

// ============================================================================
// TWO-FACTOR AUTHENTICATION (2FA)
// ============================================================================

export const twoFactorSecrets = mysqlTable("twoFactorSecrets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  secret: varchar("secret", { length: 255 }).notNull(), // Base32 encoded TOTP secret
  qrCode: text("qrCode"), // QR code data URL for setup
  isEnabled: int("isEnabled").default(0).notNull(), // 0 = pending setup, 1 = active
  enabledAt: timestamp("enabledAt"),
  backupCodesGenerated: int("backupCodesGenerated").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwoFactorSecret = typeof twoFactorSecrets.$inferSelect;
export type InsertTwoFactorSecret = typeof twoFactorSecrets.$inferInsert;

export const twoFactorBackupCodes = mysqlTable("twoFactorBackupCodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(), // Hashed backup code
  isUsed: int("isUsed").default(0).notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TwoFactorBackupCode = typeof twoFactorBackupCodes.$inferSelect;
export type InsertTwoFactorBackupCode = typeof twoFactorBackupCodes.$inferInsert;

export const twoFactorSessions = mysqlTable("twoFactorSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  isVerified: int("isVerified").default(0).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TwoFactorSession = typeof twoFactorSessions.$inferSelect;
export type InsertTwoFactorSession = typeof twoFactorSessions.$inferInsert;

export const twoFactorAuditLog = mysqlTable("twoFactorAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", [
    "setup_started",
    "setup_completed",
    "verification_success",
    "verification_failed",
    "backup_codes_generated",
    "backup_code_used",
    "disabled",
    "recovery_code_used",
  ]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type TwoFactorAuditLog = typeof twoFactorAuditLog.$inferSelect;
export type InsertTwoFactorAuditLog = typeof twoFactorAuditLog.$inferInsert;


/**
 * Admin 2FA Enforcement Log
 */
export const admin2FAEnforcement = mysqlTable("admin2FAEnforcement", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  requirementStatus: mysqlEnum("requirementStatus", ["not_required", "required", "setup_in_progress", "setup_completed", "exempted"]).default("not_required").notNull(),
  gracePeriodEndsAt: timestamp("gracePeriodEndsAt"),
  exemptionReason: text("exemptionReason"),
  exemptedBy: int("exemptedBy"),
  reminderSentAt: timestamp("reminderSentAt"),
  reminderCount: int("reminderCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Admin2FAEnforcement = typeof admin2FAEnforcement.$inferSelect;
export type InsertAdmin2FAEnforcement = typeof admin2FAEnforcement.$inferInsert;


/**
 * Email List Segments
 * Organize subscribers into groups for targeted campaigns
 */
export const emailSegments = mysqlTable("emailSegments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dealershipId: int("dealershipId").notNull(),
  criteria: json("criteria").notNull(), // JSON criteria for segment matching
  subscriberCount: int("subscriberCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSegment = typeof emailSegments.$inferSelect;
export type InsertEmailSegment = typeof emailSegments.$inferInsert;

/**
 * Segment Members
 * Track which subscribers belong to which segments
 */
export const segmentMembers = mysqlTable("segmentMembers", {
  id: int("id").autoincrement().primaryKey(),
  segmentId: int("segmentId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type SegmentMember = typeof segmentMembers.$inferSelect;
export type InsertSegmentMember = typeof segmentMembers.$inferInsert;

/**
 * SMS Campaigns
 * Store SMS campaign templates and settings
 */
export const smsCampaigns = mysqlTable("smsCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  dealershipId: int("dealershipId").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "sent", "failed"]).default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  recipientCount: int("recipientCount").default(0),
  successCount: int("successCount").default(0),
  failureCount: int("failureCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type InsertSmsCampaign = typeof smsCampaigns.$inferInsert;

/**
 * SMS Recipients
 * Track SMS delivery status for each recipient
 */
export const smsRecipients = mysqlTable("smsRecipients", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending"),
  externalId: varchar("externalId", { length: 255 }), // Twilio SID
  failureReason: text("failureReason"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
});

export type SmsRecipient = typeof smsRecipients.$inferSelect;
export type InsertSmsRecipient = typeof smsRecipients.$inferInsert;

/**
 * Email Event Webhooks
 * Store webhook events from SendGrid/Resend
 */
export const emailEventWebhooks = mysqlTable("emailEventWebhooks", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  email: varchar("email", { length: 320 }).notNull(),
  eventType: mysqlEnum("eventType", [
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "complained",
    "unsubscribed",
    "dropped",
    "deferred",
    "failed",
  ]).notNull(),
  eventData: json("eventData"), // Full event payload
  externalId: varchar("externalId", { length: 255 }), // SendGrid message ID
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type EmailEventWebhook = typeof emailEventWebhooks.$inferSelect;
export type InsertEmailEventWebhook = typeof emailEventWebhooks.$inferInsert;

/**
 * SMS Event Webhooks
 * Store webhook events from Twilio
 */
export const smsEventWebhooks = mysqlTable("smsEventWebhooks", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  phoneNumber: varchar("phoneNumber", { length: 32 }).notNull(),
  eventType: mysqlEnum("eventType", ["sent", "delivered", "failed", "unsubscribed"]).notNull(),
  eventData: json("eventData"), // Full event payload
  externalId: varchar("externalId", { length: 255 }), // Twilio SID
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type SmsEventWebhook = typeof smsEventWebhooks.$inferSelect;
export type InsertSmsEventWebhook = typeof smsEventWebhooks.$inferInsert;

/**
 * Webhook Endpoints
 * Store configured webhook endpoints for each dealership
 */
export const webhookEndpoints = mysqlTable("webhookEndpoints", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  provider: mysqlEnum("provider", ["sendgrid", "resend", "twilio"]).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  secret: varchar("secret", { length: 255 }).notNull(), // For HMAC verification
  isActive: tinyint("isActive").default(1),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = typeof webhookEndpoints.$inferInsert;


/**
 * PHASE 1: STRATEGIC FEATURES - DATABASE SCHEMA
 * 10 features to make GrayArx unbeatable in dealership market
 */

// ============================================================================
// 1. LEAD SCORING ENGINE
// ============================================================================

export const leadScores = mysqlTable("lead_scores", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().unique(),
  dealershipId: int("dealershipId").notNull(),
  
  // Scoring factors
  engagementScore: decimal("engagementScore", { precision: 5, scale: 2 }).default("0"),
  conversionProbability: decimal("conversionProbability", { precision: 5, scale: 2 }).default("0"),
  estimatedDealValue: decimal("estimatedDealValue", { precision: 12, scale: 2 }).default("0"),
  buyingUrgency: varchar("buyingUrgency", { length: 32 }), // low | medium | high | urgent
  
  // Predicted actions
  recommendedContactTime: varchar("recommendedContactTime", { length: 32 }), // morning | afternoon | evening
  recommendedSalesAgent: int("recommendedSalesAgent"), // user ID of best agent
  predictedNextAction: varchar("predictedNextAction", { length: 255 }),
  
  // Metadata
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadScore = typeof leadScores.$inferSelect;
export type InsertLeadScore = typeof leadScores.$inferInsert;

// ============================================================================
// 2. INVENTORY INTELLIGENCE
// ============================================================================

export const inventoryPredictions = mysqlTable("inventory_predictions", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().unique(),
  dealershipId: int("dealershipId").notNull(),
  
  // Predictions
  daysToSell: int("daysToSell"), // predicted days until sold
  sellProbability: decimal("sellProbability", { precision: 5, scale: 2 }), // 0-100
  optimalPrice: decimal("optimalPrice", { precision: 12, scale: 2 }),
  priceAdjustmentRecommendation: decimal("priceAdjustmentRecommendation", { precision: 12, scale: 2 }), // positive or negative
  demandLevel: varchar("demandLevel", { length: 32 }), // low | medium | high | very_high
  
  // Market data
  marketAveragePrice: decimal("marketAveragePrice", { precision: 12, scale: 2 }),
  competitorCount: int("competitorCount"),
  inventoryTurnoverRate: decimal("inventoryTurnoverRate", { precision: 5, scale: 2 }),
  
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryPrediction = typeof inventoryPredictions.$inferSelect;
export type InsertInventoryPrediction = typeof inventoryPredictions.$inferInsert;

// ============================================================================
// 3. SERVICE PREDICTIONS
// ============================================================================

export const servicePredictions = mysqlTable("service_predictions", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  dealershipId: int("dealershipId").notNull(),
  
  // Service predictions
  nextServiceDue: date("nextServiceDue"),
  daysUntilService: int("daysUntilService"),
  predictedServiceType: varchar("predictedServiceType", { length: 255 }), // oil change, tire rotation, etc.
  estimatedServiceCost: decimal("estimatedServiceCost", { precision: 12, scale: 2 }),
  
  // Customer likelihood
  bookingProbability: decimal("bookingProbability", { precision: 5, scale: 2 }), // 0-100
  recommendedReminderTime: varchar("recommendedReminderTime", { length: 32 }), // days before due date
  suggestedIncentive: varchar("suggestedIncentive", { length: 255 }), // discount offer, etc.
  
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServicePrediction = typeof servicePredictions.$inferSelect;
export type InsertServicePrediction = typeof servicePredictions.$inferInsert;

// ============================================================================
// 4. COMPETITOR PRICING INTELLIGENCE
// ============================================================================

export const competitorPricing = mysqlTable("competitor_pricing", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  
  // Vehicle details
  make: varchar("make", { length: 64 }).notNull(),
  model: varchar("model", { length: 64 }).notNull(),
  year: int("year").notNull(),
  
  // Pricing data
  ourPrice: decimal("ourPrice", { precision: 12, scale: 2 }),
  competitorAveragePrice: decimal("competitorAveragePrice", { precision: 12, scale: 2 }),
  priceGap: decimal("priceGap", { precision: 12, scale: 2 }), // positive = we're higher
  pricePercentile: int("pricePercentile"), // 0-100
  
  // Market data
  competitorCount: int("competitorCount"),
  marketTrend: varchar("marketTrend", { length: 32 }), // up | down | stable
  recommendedPrice: decimal("recommendedPrice", { precision: 12, scale: 2 }),
  
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitorPricing = typeof competitorPricing.$inferSelect;
export type InsertCompetitorPricing = typeof competitorPricing.$inferInsert;

// ============================================================================
// 5. MULTI-LOCATION MANAGEMENT
// ============================================================================

export const dealershipLocations = mysqlTable("dealership_locations", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  
  // Location info
  locationName: varchar("locationName", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  province: varchar("province", { length: 128 }),
  postalCode: varchar("postalCode", { length: 16 }),
  
  // Contact
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  
  // Performance metrics
  monthlyLeads: int("monthlyLeads").default(0),
  monthlyConversions: int("monthlyConversions").default(0),
  averageInventory: int("averageInventory").default(0),
  
  // Territory
  territory: varchar("territory", { length: 128 }),
  radius: int("radius"), // km radius served
  
  status: mysqlEnum("status", ["active", "inactive", "closed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealershipLocation = typeof dealershipLocations.$inferSelect;
export type InsertDealershipLocation = typeof dealershipLocations.$inferInsert;

// ============================================================================
// 6. CUSTOMER JOURNEY MAPPING
// ============================================================================

export const customerJourneyEvents = mysqlTable("customer_journey_events", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  dealershipId: int("dealershipId").notNull(),
  
  // Event details
  eventType: mysqlEnum("eventType", [
    "website_visit",
    "showroom_visit",
    "test_drive",
    "quote_request",
    "trade_in_inquiry",
    "financing_inquiry",
    "email_open",
    "email_click",
    "phone_call",
    "message",
    "appointment_scheduled",
    "appointment_completed",
    "purchase",
    "follow_up",
  ]).notNull(),
  
  eventDetails: json("eventDetails"), // Additional context
  duration: int("duration"), // seconds spent on this stage
  
  // Journey tracking
  stageSequence: int("stageSequence"), // order in journey
  timeToNextStage: int("timeToNextStage"), // hours until next event
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerJourneyEvent = typeof customerJourneyEvents.$inferSelect;
export type InsertCustomerJourneyEvent = typeof customerJourneyEvents.$inferInsert;

// ============================================================================
// 7. COMPLIANCE & REGULATORY DASHBOARD
// ============================================================================

export const complianceRules = mysqlTable("compliance_rules", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  
  // Rule details
  ruleType: varchar("ruleType", { length: 64 }).notNull(), // FTC, state_law, local, etc.
  jurisdiction: varchar("jurisdiction", { length: 128 }).notNull(), // state/country
  ruleName: varchar("ruleName", { length: 255 }).notNull(),
  description: text("description"),
  
  // Compliance status
  status: mysqlEnum("status", ["compliant", "at_risk", "non_compliant", "unknown"]).default("unknown").notNull(),
  lastChecked: timestamp("lastChecked"),
  nextCheckDue: timestamp("nextCheckDue"),
  
  // Actions
  suggestedActions: text("suggestedActions"), // JSON array
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceRule = typeof complianceRules.$inferSelect;
export type InsertComplianceRule = typeof complianceRules.$inferInsert;

// ============================================================================
// 8. CUSTOMER LIFETIME VALUE (CLV) PREDICTION
// ============================================================================

export const customerLifetimeValue = mysqlTable("customer_lifetime_value", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().unique(),
  dealershipId: int("dealershipId").notNull(),
  
  // CLV calculation
  predictedClv: decimal("predictedClv", { precision: 12, scale: 2 }), // total predicted lifetime value
  clvSegment: varchar("clvSegment", { length: 32 }), // low | medium | high | vip
  
  // Churn prediction
  churnRisk: decimal("churnRisk", { precision: 5, scale: 2 }), // 0-100 probability
  retentionScore: decimal("retentionScore", { precision: 5, scale: 2 }), // 0-100
  
  // Value breakdown
  vehiclePurchaseValue: decimal("vehiclePurchaseValue", { precision: 12, scale: 2 }),
  serviceValue: decimal("serviceValue", { precision: 12, scale: 2 }),
  accessoriesValue: decimal("accessoriesValue", { precision: 12, scale: 2 }),
  financingValue: decimal("financingValue", { precision: 12, scale: 2 }),
  
  // Recommendations
  recommendedOffer: varchar("recommendedOffer", { length: 255 }),
  retentionStrategy: varchar("retentionStrategy", { length: 255 }),
  
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerLifetimeValue = typeof customerLifetimeValue.$inferSelect;
export type InsertCustomerLifetimeValue = typeof customerLifetimeValue.$inferInsert;

// ============================================================================
// 9. FINANCING & TRADE-IN INTELLIGENCE
// ============================================================================

export const financingIntelligence = mysqlTable("financing_intelligence", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  dealershipId: int("dealershipId").notNull(),
  
  // Financing predictions
  financingNeeded: int("financingNeeded").default(1), // 0 = cash, 1 = likely needs financing
  financingProbability: decimal("financingProbability", { precision: 5, scale: 2 }), // 0-100
  estimatedLoanAmount: decimal("estimatedLoanAmount", { precision: 12, scale: 2 }),
  estimatedDownPayment: decimal("estimatedDownPayment", { precision: 12, scale: 2 }),
  recommendedLoanTerm: int("recommendedLoanTerm"), // months
  
  // Trade-in predictions
  tradeInLikelihood: decimal("tradeInLikelihood", { precision: 5, scale: 2 }), // 0-100
  estimatedTradeInValue: decimal("estimatedTradeInValue", { precision: 12, scale: 2 }),
  tradeInVehicleType: varchar("tradeInVehicleType", { length: 64 }),
  
  // Upsell opportunities
  warrantyUpsellProbability: decimal("warrantyUpsellProbability", { precision: 5, scale: 2 }),
  accessoriesUpsellProbability: decimal("accessoriesUpsellProbability", { precision: 5, scale: 2 }),
  
  // Approval prediction
  approvalProbability: decimal("approvalProbability", { precision: 5, scale: 2 }), // 0-100
  recommendedLender: varchar("recommendedLender", { length: 128 }),
  
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancingIntelligence = typeof financingIntelligence.$inferSelect;
export type InsertFinancingIntelligence = typeof financingIntelligence.$inferInsert;

// ============================================================================
// 10. DEALERSHIP AI AGENT CONFIGURATION
// ============================================================================

export const dealershipAIAgents = mysqlTable("dealership_ai_agents", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  
  // Agent configuration
  agentName: varchar("agentName", { length: 255 }).notNull(),
  agentType: mysqlEnum("agentType", [
    "lead_scorer",
    "inventory_optimizer",
    "service_predictor",
    "pricing_intelligence",
    "journey_mapper",
    "compliance_monitor",
    "clv_predictor",
    "financing_advisor",
    "general_assistant",
  ]).notNull(),
  
  // Customization
  customInstructions: text("customInstructions"),
  trainingData: json("trainingData"), // Historical data for fine-tuning
  
  // Performance
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // 0-100
  lastTrainedAt: timestamp("lastTrainedAt"),
  
  // Status
  status: mysqlEnum("status", ["active", "training", "paused", "inactive"]).default("active").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealershipAIAgent = typeof dealershipAIAgents.$inferSelect;
export type InsertDealershipAIAgent = typeof dealershipAIAgents.$inferInsert;


// ============================================================================
// CRITICAL SA COMPLIANCE FEATURES
// ============================================================================

// ============================================================================
// 1. POPIA (PROTECTION OF PERSONAL INFORMATION ACT) - DATA SUBJECT REQUESTS
// ============================================================================

export const popiaDataSubjectRequests = mysqlTable("popia_data_subject_requests", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  
  // Request Details
  requestType: mysqlEnum("requestType", [
    "access",           // Right to access personal information
    "correction",       // Right to correct inaccurate data
    "deletion",         // Right to be forgotten
    "objection",        // Right to object to processing
    "restrict",         // Right to restrict processing
    "portability",      // Right to data portability
  ]).notNull(),
  
  // Requester Info
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  requesterPhone: varchar("requesterPhone", { length: 32 }),
  requesterIdNumber: varchar("requesterIdNumber", { length: 64 }), // ID/Passport
  
  // Request Details
  dataSubjectDescription: text("dataSubjectDescription"), // What data is being requested
  reason: text("reason"), // Why they're requesting
  
  // Processing
  status: mysqlEnum("status", [
    "received",
    "acknowledged",
    "under_review",
    "approved",
    "denied",
    "completed",
    "withdrawn",
  ]).default("received").notNull(),
  
  receivedDate: timestamp("receivedDate").defaultNow().notNull(),
  acknowledgedDate: timestamp("acknowledgedDate"),
  completionDeadline: timestamp("completionDeadline"), // 30 days from receipt
  completedDate: timestamp("completedDate"),
  
  // Response
  responseNotes: text("responseNotes"),
  responseDocument: varchar("responseDocument", { length: 500 }), // URL to response document
  denialReason: text("denialReason"), // If denied
  
  // Audit Trail
  processedBy: int("processedBy"), // User ID of processor
  verifiedBy: int("verifiedBy"), // User ID of verifier
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PopiaDataSubjectRequest = typeof popiaDataSubjectRequests.$inferSelect;
export type InsertPopiaDataSubjectRequest = typeof popiaDataSubjectRequests.$inferInsert;

// ============================================================================
// 3. NRCS (NATIONAL CREDIT REGULATOR) - AFFORDABILITY ASSESSMENT
// ============================================================================

export const nrcsAffordabilityAssessment = mysqlTable("nrcs_affordability_assessment", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  dealershipId: int("dealershipId").notNull(),
  
  // Customer Financial Profile
  monthlyIncome: decimal("monthlyIncome", { precision: 12, scale: 2 }).notNull(),
  monthlyExpenses: decimal("monthlyExpenses", { precision: 12, scale: 2 }).notNull(),
  existingDebtObligations: decimal("existingDebtObligations", { precision: 12, scale: 2 }).notNull(),
  creditScore: int("creditScore"), // 300-850
  creditHistory: varchar("creditHistory", { length: 32 }), // excellent | good | fair | poor
  
  // Proposed Credit
  proposedLoanAmount: decimal("proposedLoanAmount", { precision: 12, scale: 2 }).notNull(),
  proposedInterestRate: decimal("proposedInterestRate", { precision: 5, scale: 2 }).notNull(),
  proposedLoanTerm: int("proposedLoanTerm").notNull(), // months
  proposedMonthlyPayment: decimal("proposedMonthlyPayment", { precision: 12, scale: 2 }).notNull(),
  
  // Affordability Calculation
  disposableIncome: decimal("disposableIncome", { precision: 12, scale: 2 }), // Income - Expenses - Existing Debt
  debtToIncomeRatio: decimal("debtToIncomeRatio", { precision: 5, scale: 2 }), // Debt / Income (should be < 0.5)
  loanPaymentToIncomeRatio: decimal("loanPaymentToIncomeRatio", { precision: 5, scale: 2 }), // Payment / Income
  affordabilityScore: decimal("affordabilityScore", { precision: 5, scale: 2 }), // 0-100
  
  // Assessment Result
  isAffordable: int("isAffordable").notNull(), // 1 = yes, 0 = no
  assessmentReason: text("assessmentReason"), // Explanation of assessment
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "very_high"]).notNull(),
  
  // Recommendations
  recommendedLoanAmount: decimal("recommendedLoanAmount", { precision: 12, scale: 2 }), // Max affordable
  recommendedMonthlyPayment: decimal("recommendedMonthlyPayment", { precision: 12, scale: 2 }),
  debtCounsellingRequired: int("debtCounsellingRequired").default(0), // 1 = yes
  debtCounsellingReferral: varchar("debtCounsellingReferral", { length: 255 }), // Counsellor contact
  
  // Compliance
  assessedBy: int("assessedBy").notNull(), // User ID
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  reviewedBy: int("reviewedBy"), // Supervisor review
  reviewDate: timestamp("reviewDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NrcsAffordabilityAssessment = typeof nrcsAffordabilityAssessment.$inferSelect;
export type InsertNrcsAffordabilityAssessment = typeof nrcsAffordabilityAssessment.$inferInsert;

// ============================================================================
// 4. COMPLAINT MANAGEMENT SYSTEM (NRCS, CONSUMER PROTECTION ACT)
// ============================================================================

export const complaints = mysqlTable("complaints", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  
  // Complaint Details
  complaintNumber: varchar("complaintNumber", { length: 50 }).notNull().unique(), // Auto-generated
  complaintType: mysqlEnum("complaintType", [
    "service_quality",
    "pricing",
    "warranty",
    "financing",
    "vehicle_condition",
    "delivery",
    "communication",
    "staff_conduct",
    "safety",
    "other",
  ]).notNull(),
  
  // Complainant Info
  complainantName: varchar("complainantName", { length: 255 }).notNull(),
  complainantEmail: varchar("complainantEmail", { length: 320 }).notNull(),
  complainantPhone: varchar("complainantPhone", { length: 32 }).notNull(),
  complainantIdNumber: varchar("complainantIdNumber", { length: 64 }),
  
  // Complaint Details
  vehicleId: int("vehicleId"), // Related vehicle (if applicable)
  invoiceId: int("invoiceId"), // Related invoice (if applicable)
  description: text("description").notNull(),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }), // Photo/document
  
  // Severity & Priority
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull(),
  
  // Resolution Process
  status: mysqlEnum("status", [
    "received",
    "acknowledged",
    "under_investigation",
    "proposed_resolution",
    "resolved",
    "escalated",
    "closed",
  ]).default("received").notNull(),
  
  receivedDate: timestamp("receivedDate").defaultNow().notNull(),
  acknowledgedDate: timestamp("acknowledgedDate"),
  resolutionDeadline: timestamp("resolutionDeadline"), // 30 days from receipt
  resolvedDate: timestamp("resolvedDate"),
  
  // Investigation & Resolution
  assignedTo: int("assignedTo"), // Staff member handling complaint
  investigationNotes: text("investigationNotes"),
  rootCause: text("rootCause"),
  proposedResolution: text("proposedResolution"),
  actualResolution: text("actualResolution"),
  
  // Compensation (if applicable)
  compensationOffered: decimal("compensationOffered", { precision: 12, scale: 2 }),
  compensationAccepted: int("compensationAccepted"), // 1 = yes, 0 = no
  compensationPaid: int("compensationPaid"), // 1 = yes, 0 = no
  compensationDate: timestamp("compensationDate"),
  
  // Escalation
  escalatedTo: int("escalatedTo"), // Manager/Director
  escalationReason: text("escalationReason"),
  escalationDate: timestamp("escalationDate"),
  
  // Regulatory Reporting
  reportedToNrcs: int("reportedToNrcs").default(0), // 1 = yes
  reportedToConsumerProtection: int("reportedToConsumerProtection").default(0), // 1 = yes
  regulatoryReferenceNumber: varchar("regulatoryReferenceNumber", { length: 100 }),
  
  // Feedback
  complainantSatisfaction: int("complainantSatisfaction"), // 1-5 rating
  complainantFeedback: text("complainantFeedback"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;


// Compliance Audit Trail
export const complianceAuditTrail = mysqlTable("compliance_audit_trail", {
  id: int("id").primaryKey().autoincrement(),
  dealershipId: int("dealership_id").notNull(),
  userId: int("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: int("entity_id").notNull(),
  description: text("description"),
  changes: json("changes").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communication Templates
export const communicationTemplates = mysqlTable("communication_templates", {
  id: int("id").primaryKey().autoincrement(),
  dealershipId: int("dealership_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  variables: json("variables").$type<string[]>(),
  version: int("version").default(1),
  status: varchar("status", { length: 20 }).default("draft"),
  approvedBy: int("approved_by"),
  approvedAt: timestamp("approved_at"),
  usageCount: int("usage_count").default(0),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Training Modules
export const trainingModules = mysqlTable("training_modules", {
  id: int("id").primaryKey().autoincrement(),
  dealershipId: int("dealership_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  topic: varchar("topic", { length: 100 }).notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  duration: int("duration"),
  content: text("content"),
  order: int("order").default(0),
  isPublished: mysqlBoolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Training Quizzes
export const trainingQuizzes = mysqlTable("training_quizzes", {
  id: int("id").primaryKey().autoincrement(),
  moduleId: int("module_id").notNull(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctAnswer: int("correct_answer").notNull(),
  explanation: text("explanation"),
  order: int("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Progress
export const trainingProgress = mysqlTable("training_progress", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  moduleId: int("module_id").notNull(),
  status: varchar("status", { length: 20 }).default("in_progress"),
  progressPercentage: int("progress_percentage").default(0),
  quizScore: int("quiz_score"),
  completedAt: timestamp("completed_at"),
  certificateUrl: varchar("certificate_url", { length: 500 }),
  startedAt: timestamp("started_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Training Assignments
export const trainingAssignments = mysqlTable("training_assignments", {
  id: int("id").primaryKey().autoincrement(),
  dealershipId: int("dealership_id").notNull(),
  moduleId: int("module_id").notNull(),
  assignedTo: int("assigned_to").notNull(),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  assignedBy: int("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type ComplianceAuditTrail = typeof complianceAuditTrail.$inferSelect;
export type InsertComplianceAuditTrail = typeof complianceAuditTrail.$inferInsert;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
export type InsertCommunicationTemplate = typeof communicationTemplates.$inferInsert;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = typeof trainingModules.$inferInsert;
export type TrainingQuiz = typeof trainingQuizzes.$inferSelect;
export type InsertTrainingQuiz = typeof trainingQuizzes.$inferInsert;
export type TrainingProgressRecord = typeof trainingProgress.$inferSelect;
export type InsertTrainingProgressRecord = typeof trainingProgress.$inferInsert;
export type TrainingAssignment = typeof trainingAssignments.$inferSelect;
export type InsertTrainingAssignment = typeof trainingAssignments.$inferInsert;


/**
 * Onboarding Tours - Define interactive tours for different user roles
 */
export const onboardingTours = mysqlTable("onboarding_tours", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetRole: mysqlEnum("target_role", ["user", "admin", "dealer_owner", "dealer_consultant"]).notNull(),
  targetPage: varchar("target_page", { length: 255 }).notNull(), // e.g., "/dashboard", "/inventory"
  order: int("order").default(0),
  isActive: tinyint("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type OnboardingTour = typeof onboardingTours.$inferSelect;
export type InsertOnboardingTour = typeof onboardingTours.$inferInsert;

/**
 * Onboarding Steps - Individual steps within a tour
 */
export const onboardingSteps = mysqlTable("onboarding_steps", {
  id: int("id").primaryKey().autoincrement(),
  tourId: int("tour_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  targetElement: varchar("target_element", { length: 255 }), // CSS selector
  position: mysqlEnum("position", ["top", "bottom", "left", "right"]).default("bottom"),
  action: varchar("action", { length: 100 }), // e.g., "click", "input", "scroll"
  actionTarget: varchar("action_target", { length: 255 }),
  order: int("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type OnboardingStep = typeof onboardingSteps.$inferSelect;
export type InsertOnboardingStep = typeof onboardingSteps.$inferInsert;

/**
 * User Onboarding Progress - Track which users have completed tours
 */
export const userOnboardingProgress = mysqlTable("user_onboarding_progress", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  tourId: int("tour_id").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "skipped"]).default("not_started"),
  currentStep: int("current_step").default(0),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type UserOnboardingProgress = typeof userOnboardingProgress.$inferSelect;
export type InsertUserOnboardingProgress = typeof userOnboardingProgress.$inferInsert;

/**
 * Help Center Articles - Knowledge base for users
 */
export const helpArticles = mysqlTable("help_articles", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Getting Started", "Inventory", "Leads"
  content: text("content").notNull(), // Markdown content
  excerpt: varchar("excerpt", { length: 500 }),
  keywords: text("keywords"), // Comma-separated for search
  videoUrl: varchar("video_url", { length: 500 }),
  order: int("order").default(0),
  views: int("views").default(0),
  isPublished: tinyint("is_published").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type HelpArticle = typeof helpArticles.$inferSelect;
export type InsertHelpArticle = typeof helpArticles.$inferInsert;

/**
 * Tooltips - Contextual help hints throughout the app
 */
export const tooltips = mysqlTable("tooltips", {
  id: int("id").primaryKey().autoincrement(),
  elementId: varchar("element_id", { length: 255 }).unique().notNull(), // Unique identifier for UI element
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  position: mysqlEnum("position", ["top", "bottom", "left", "right"]).default("top"),
  triggerType: mysqlEnum("trigger_type", ["hover", "click", "focus"]).default("hover"),
  delay: int("delay").default(0), // milliseconds
  isActive: tinyint("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Tooltip = typeof tooltips.$inferSelect;
export type InsertTooltip = typeof tooltips.$inferInsert;

/**
 * User Tooltip Dismissals - Track dismissed tooltips per user
 */
export const userTooltipDismissals = mysqlTable("user_tooltip_dismissals", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  tooltipId: int("tooltip_id").notNull(),
  dismissedAt: timestamp("dismissed_at").defaultNow(),
});

export type UserTooltipDismissal = typeof userTooltipDismissals.$inferSelect;
export type InsertUserTooltipDismissal = typeof userTooltipDismissals.$inferInsert;

/**
 * Feedback - Collect user feedback on help content
 */
export const helpFeedback = mysqlTable("help_feedback", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id"),
  articleId: int("article_id"),
  tourId: int("tour_id"),
  rating: int("rating"), // 1-5 stars
  comment: text("comment"),
  helpful: tinyint("helpful"), // 1 = yes, 0 = no
  createdAt: timestamp("created_at").defaultNow(),
});

export type HelpFeedback = typeof helpFeedback.$inferSelect;
export type InsertHelpFeedback = typeof helpFeedback.$inferInsert;


/**
 * Chatbot deployment configuration — tracks which chatbot types are enabled per dealership
 */
export const chatbotDeployments = mysqlTable("chatbot_deployments", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  // Deployment types: "web", "whatsapp", or "both"
  deploymentType: mysqlEnum("deploymentType", ["web", "whatsapp", "both"]).default("web").notNull(),
  // Web chatbot settings
  webChatbotEnabled: tinyint("webChatbotEnabled").default(1).notNull(),
  webChatbotLanguages: json("webChatbotLanguages"), // ["en", "af", "zu", ...]
  webChatbotPosition: varchar("webChatbotPosition", { length: 16 }).default("bottom-right"), // bottom-right, bottom-left, top-right, top-left
  webChatbotTheme: varchar("webChatbotTheme", { length: 32 }).default("dark"), // dark, light, custom
  // WhatsApp chatbot settings
  whatsappChatbotEnabled: tinyint("whatsappChatbotEnabled").default(0).notNull(),
  whatsappPhoneNumber: varchar("whatsappPhoneNumber", { length: 20 }), // e.g., +27123456789
  whatsappBusinessAccountId: varchar("whatsappBusinessAccountId", { length: 100 }), // Meta Business Account ID
  whatsappAccessToken: varchar("whatsappAccessToken", { length: 500 }), // Encrypted
  whatsappWebhookUrl: varchar("whatsappWebhookUrl", { length: 500 }), // Webhook for incoming messages
  whatsappVerifyToken: varchar("whatsappVerifyToken", { length: 100 }), // Token for webhook verification
  // Chatbot behavior
  autoRespondEnabled: tinyint("autoRespondEnabled").default(1).notNull(),
  businessHoursOnly: tinyint("businessHoursOnly").default(0).notNull(),
  offHoursMessage: text("offHoursMessage"), // Message to show outside business hours
  // Analytics
  totalConversations: int("totalConversations").default(0).notNull(),
  totalLeadsGenerated: int("totalLeadsGenerated").default(0).notNull(),
  totalTestDrivesBooked: int("totalTestDrivesBooked").default(0).notNull(),
  totalPreApprovalsSubmitted: int("totalPreApprovalsSubmitted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChatbotDeployment = typeof chatbotDeployments.$inferSelect;
export type InsertChatbotDeployment = typeof chatbotDeployments.$inferInsert;

/**
 * Chatbot conversations — tracks customer interactions with chatbots
 */
export const chatbotConversations = mysqlTable("chatbot_conversations", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealershipId").notNull(),
  chatbotType: mysqlEnum("chatbotType", ["web", "whatsapp"]).notNull(),
  customerId: varchar("customerId", { length: 100 }).notNull(), // Phone number for WhatsApp, session ID for web
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  lastMessage: text("lastMessage"),
  conversationStatus: mysqlEnum("conversationStatus", ["active", "completed", "abandoned"]).default("active").notNull(),
  // Conversion tracking
  inventoryViewed: json("inventoryViewed"), // [vehicleId, vehicleId, ...]
  testDriveBooked: tinyint("testDriveBooked").default(0).notNull(),
  testDriveId: int("testDriveId"),
  preApprovalSubmitted: tinyint("preApprovalSubmitted").default(0).notNull(),
  preApprovalId: int("preApprovalId"),
  leadId: int("leadId"), // Link to leads table if converted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = typeof chatbotConversations.$inferInsert;

/**
 * Chatbot messages — individual messages in conversations
 */
export const chatbotMessages = mysqlTable("chatbot_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  dealershipId: int("dealershipId").notNull(),
  role: mysqlEnum("role", ["customer", "chatbot", "agent"]).notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "document", "location", "quick_reply"]).default("text").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"), // Additional data (e.g., vehicle IDs, button clicks)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = typeof chatbotMessages.$inferInsert;


// ============================================================================
// EMAIL CAMPAIGN MANAGEMENT (PILOT CAMPAIGN)
// ============================================================================

export const pilotCampaigns = mysqlTable("pilot_campaigns", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderEmail: varchar("sender_email", { length: 320 }).notNull(),
  
  // Campaign Settings
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "paused", "failed"]).default("draft").notNull(),
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  
  // Tracking
  totalRecipients: int("total_recipients").default(0),
  successCount: int("success_count").default(0),
  failureCount: int("failure_count").default(0),
  bounceCount: int("bounce_count").default(0),
  openCount: int("open_count").default(0),
  clickCount: int("click_count").default(0),
  
  // Metadata
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PilotCampaign = typeof pilotCampaigns.$inferSelect;
export type InsertPilotCampaign = typeof pilotCampaigns.$inferInsert;

export const pilotRecipients = mysqlTable("pilot_recipients", {
  id: int("id").primaryKey().autoincrement(),
  campaignId: int("campaign_id").notNull(),
  dealershipName: varchar("dealership_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  
  // Delivery Status
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced", "unsubscribed"]).default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  
  // Engagement Tracking
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  clickedLink: varchar("clicked_link", { length: 500 }),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PilotRecipient = typeof pilotRecipients.$inferSelect;
export type InsertPilotRecipient = typeof pilotRecipients.$inferInsert;


/**
 * Phase 33: Email Notification System
 */
export const emailNotifications = mysqlTable("email_notifications", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealership_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // 'new_lead', 'lead_status_change', 'booking_request', 'preapproval_submission'
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  bounceAt: timestamp("bounce_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealership_id").notNull().unique(),
  newLeadEnabled: tinyint("new_lead_enabled").default(1).notNull(),
  leadStatusChangeEnabled: tinyint("lead_status_change_enabled").default(1).notNull(),
  bookingRequestEnabled: tinyint("booking_request_enabled").default(1).notNull(),
  preapprovalSubmissionEnabled: tinyint("preapproval_submission_enabled").default(1).notNull(),
  notificationFrequency: varchar("notification_frequency", { length: 32 }).default("immediate").notNull(), // 'immediate', 'daily_digest', 'weekly_digest'
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // HH:MM format, e.g. "18:00"
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }), // HH:MM format, e.g. "08:00"
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

/**
 * Phase 33: Lead Quality Scoring Enhancement
 */
export const leadQualityFactors = mysqlTable("lead_quality_factors", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  sourceScore: decimal("source_score", { precision: 3, scale: 2 }).default("0.00").notNull(), // 0-1.0
  languageScore: decimal("language_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  responseTimeScore: decimal("response_time_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  vehicleTypeScore: decimal("vehicle_type_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  priceRangeScore: decimal("price_range_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  locationScore: decimal("location_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  urgencyScore: decimal("urgency_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  contactQualityScore: decimal("contact_quality_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  historyScore: decimal("history_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  overallScore: decimal("overall_score", { precision: 3, scale: 2 }).default("0.00").notNull(),
  factors: json("factors").$type<Record<string, any>>(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LeadQualityFactors = typeof leadQualityFactors.$inferSelect;
export type InsertLeadQualityFactors = typeof leadQualityFactors.$inferInsert;

/**
 * Phase 33: Dealership Performance Analytics
 */
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealership_id").notNull(),
  date: date("date").notNull(),
  leadVolume: int("lead_volume").default(0).notNull(),
  leadConversionRate: decimal("lead_conversion_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  avgResponseTime: int("avg_response_time").default(0).notNull(), // in minutes
  revenueImpact: decimal("revenue_impact", { precision: 12, scale: 2 }).default("0.00").notNull(),
  costPerLead: decimal("cost_per_lead", { precision: 8, scale: 2 }).default("0.00").notNull(),
  roi: decimal("roi", { precision: 5, scale: 2 }).default("0.00").notNull(),
  bookingRate: decimal("booking_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  preapprovalRate: decimal("preapproval_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  avgLeadQuality: decimal("avg_lead_quality", { precision: 3, scale: 2 }).default("0.00").notNull(),
  metrics: json("metrics").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetrics = typeof performanceMetrics.$inferInsert;

/**
 * Phase 33: Bulk Lead Import
 */
export const leadImports = mysqlTable("lead_imports", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealership_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  totalRows: int("total_rows").notNull(),
  successCount: int("success_count").default(0).notNull(),
  errorCount: int("error_count").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  importedAt: timestamp("imported_at"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LeadImport = typeof leadImports.$inferSelect;
export type InsertLeadImport = typeof leadImports.$inferInsert;

export const leadImportErrors = mysqlTable("lead_import_errors", {
  id: int("id").autoincrement().primaryKey(),
  importId: int("import_id").notNull(),
  rowNumber: int("row_number").notNull(),
  errorMessage: text("error_message").notNull(),
  rawData: json("raw_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LeadImportError = typeof leadImportErrors.$inferSelect;
export type InsertLeadImportError = typeof leadImportErrors.$inferInsert;


/**
 * Phase 33: Dealership Activity Audit Logging
 */
export const dealershipAuditLogs = mysqlTable("dealership_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealership_id"),
  userId: int("user_id"),
  action: varchar("action", { length: 64 }).notNull(), // 'create', 'update', 'delete', 'status_change', etc.
  resourceType: varchar("resource_type", { length: 64 }).notNull(), // 'lead', 'vehicle', 'booking', 'preapproval', 'settings'
  resourceId: int("resource_id"),
  resourceName: varchar("resource_name", { length: 255 }),
  oldValue: json("old_value").$type<Record<string, any>>(),
  newValue: json("new_value").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DealershipAuditLog = typeof dealershipAuditLogs.$inferSelect;
export type InsertDealershipAuditLog = typeof dealershipAuditLogs.$inferInsert;


/**
 * Phase 38: Feature Access Control & Subscription Management
 */

export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  tier: varchar("tier", { length: 50 }).notNull().unique(), // 'starter', 'professional', 'enterprise'
  name: varchar("name", { length: 255 }).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  features: json("features").$type<string[]>().notNull(), // list of feature IDs
  limits: json("limits").$type<Record<string, number>>().notNull(), // feature limits: { 'api_calls': 1000, 'webhooks': 5 }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const dealershipSubscriptions = mysqlTable("dealership_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealership_id").notNull().unique(),
  planId: int("plan_id").notNull(),
  tier: varchar("tier", { length: 50 }).notNull(), // 'starter', 'professional', 'enterprise'
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'cancelled', 'suspended', 'expired'
  startDate: timestamp("start_date").notNull(),
  renewalDate: timestamp("renewal_date").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  isTrialActive: tinyint("is_trial_active").default(0),
  usageData: json("usage_data").$type<Record<string, number>>(), // tracks usage: { 'api_calls': 450, 'webhooks_created': 2 }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const featureAccessLogs = mysqlTable("feature_access_logs", {
  id: int("id").autoincrement().primaryKey(),
  dealershipId: int("dealership_id").notNull(),
  userId: int("user_id"),
  feature: varchar("feature", { length: 255 }).notNull(), // 'api_access', 'webhook_support', 'advanced_analytics', etc.
  action: varchar("action", { length: 50 }).notNull(), // 'accessed', 'denied', 'limited', 'upgraded'
  reason: varchar("reason", { length: 255 }), // 'tier_limit_exceeded', 'trial_expired', 'not_included_in_plan'
  metadata: json("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const featureDefinitions = mysqlTable("feature_definitions", {
  id: int("id").autoincrement().primaryKey(),
  featureId: varchar("feature_id", { length: 255 }).notNull().unique(), // 'api_access', 'webhook_support', etc.
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(), // 'integration', 'support', 'analytics', 'communication'
  isLimited: tinyint("is_limited").default(0), // 1 if feature has usage limits
  defaultLimit: int("default_limit"), // default limit per tier
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type DealershipSubscription = typeof dealershipSubscriptions.$inferSelect;
export type InsertDealershipSubscription = typeof dealershipSubscriptions.$inferInsert;
export type FeatureAccessLog = typeof featureAccessLogs.$inferSelect;
export type InsertFeatureAccessLog = typeof featureAccessLogs.$inferInsert;
export type FeatureDefinition = typeof featureDefinitions.$inferSelect;
export type InsertFeatureDefinition = typeof featureDefinitions.$inferInsert;
