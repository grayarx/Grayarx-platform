import { COOKIE_NAME } from "@shared/const";
import { GRAYARX_LEGAL } from "../shared/companyLegal";
import { validateVin } from "@shared/validateVin";
import { z } from "zod";

/** Optional VIN: empty OK; non-empty must pass ISO 3779; stores normalized form. */
const optionalVinSchema = z
  .string()
  .max(32)
  .optional()
  .transform((val, ctx) => {
    const result = validateVin(val ?? "");
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.reason,
      });
      return z.NEVER;
    }
    return result.normalized || undefined;
  });
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { emailRouter } from "./routers/emailRouter";
import { pilotEmailRouter } from "./routers/pilotEmailRouter";
import { inventorySyncRouter } from "./routers/inventorySyncRouter";
import { whatsappRouter } from "./routers/whatsappRouter";
import { smsRouter } from "./routers/smsRouter";
import { twoFactorRouter } from "./routers/twoFactorRouter";
// import { emailAndAuthRouter } from "./routers/emailAndAuthRouter";
// import { advancedFeaturesRouter } from "./routers/advancedFeaturesRouter";
import { socialLoginRouter } from "./routers/socialLoginRouter";
import { adminUserRouter } from "./routers/adminUserRouter";
import { auditRouter } from "./routers/auditRouter";
// import { servicesRouter } from "./routers/servicesRouter";
import { campaignRouter } from "./routers/campaignRouter";
import { complianceRouter } from "./routers/complianceRouter";
import { complianceMailboxRouter } from "./routers/complianceMailboxRouter";
import { legalSignOffRouter } from "./routers/legalSignOffRouter";
// import { complianceTrainingRouter } from "./routers/complianceTrainingRouter";
// import { complianceTrainingAlertsRouter } from "./routers/complianceTrainingAlertsRouter";
import { chatbotRouter } from "./routers/chatbotRouter";
// import { emailRouter } from "./routers/emailRouter";
// import { supportChatbotRouter } from "./routers/supportChatbotRouter";
// import { chatbotAnalyticsRouter } from "./routers/chatbotAnalyticsRouter";
// import { chatbotFeedbackRouter } from "./routers/chatbotFeedbackRouter";
import { liveChatRouter } from "./routers/liveChatRouter";
import { brandingRouter } from "./routers/brandingRouter";
import { whatsappIntegrationRouter } from "./routers/whatsappIntegrationRouter";
import { leadScoringCalibrationRouter } from "./routers/leadScoringCalibrationRouter";
import { csvAutoRepairRouter } from "./routers/csvAutoRepairRouter";
import { inventoryRouter } from "./routers/inventoryRouter";
import { dashboardRouter } from "./routers/dashboardRouter";
import { dashboardAssistantRouter } from "./routers/dashboardAssistantRouter";
import { leadScoringRouter } from "./routers/leadScoringRouter";
// import { insightsRouter } from "./routers/insightsRouter";
import {
  checkRateLimit,
  looksLikeBot,
  callerIp,
  RATE_LIMITS,
} from "./_core/rateLimit";
import { generateNalaShowroomReply } from "./_core/nalaShowroomLlm";
import { resolveRoutedReply } from "./_core/agentIntentRouter";
import {
  vehicleRowToContext,
  findVehiclesFromMessage,
  buildMultiVehicleReply,
  buildNoMatchFallbackReply,
  detectMakeFromMessage,
  detectBodyTypesFromMessage,
  buildSearchTerm,
} from "./_core/nalaReplyOrchestrator";
import { generateTumiQuote } from "./_core/tumiAgent";
import {
  answerShowroomQuestion,
  detectLanguage,
} from "../shared/nalaShowroomChat";
import { composeShowroomBotReply } from "../shared/nalaGrammarPolish";
import { replyNeedsNameCapture } from "../shared/nalaTranslations";
import { isLanguageCode } from "../shared/languages";
import { notifyTradeInSeller, notifyTradeInWrittenOffer } from "./_core/tradeInSellerNotify";
import { phonesMatch } from "@shared/saMarketGuides";
import { scheduleFollowups, cancelFollowupsForLead } from "./_core/leadDrip";
import { sendShowroomEnquiry, generateEnquiryConfirmation } from "./_core/showroomEnquiry";
import { signPopiaConsent, checkPopiaConsentStatus, reconfirmPopiaConsentAction, signPopiaConsentSchema } from "./_core/popiaConsent";
import {
  createLead,
  createBooking,
  listLeads,
  listBookings,
  updateLeadStatus,
  updateBookingStatus,
  deleteBooking,
  listVehicles,
  getDemoDealershipId,
  createVehicle,
  listVehiclePhotos,
  addVehiclePhoto,
  deleteVehiclePhoto,
  reorderVehiclePhotos,
  setVehiclePrimaryPhoto,
  updateVehicle,
  deleteVehicle,
  deleteAllVehiclesScoped,
  getVehicle,
  getUserById,
  getDashboardStats,
  getVehicleInventoryCounts,
  getRecentActivity,
  getLeadsTrend,
  listProspects,
  createProspects,
  updateProspectStatus,
  deleteProspect,
  getProspect,
  createCallAttempt,
  updateCallAttempt,
  listCallAttempts,
  logAgentActivity,
  insertTradeInQuote,
  listNetworkTradeInQuotes,
  getTradeInQuoteById,
  updateTradeInQuoteNetwork,
  insertTradeInInvite,
  listTradeInInvitesForQuote,
  countTradeInInvitesForQuote,
  dealerInvitedQuote,
  updateTradeInQuoteStatus,
  listAgentActivity,
  getAgentStats,
  createImprovementAction,
  listImprovementActions,
  getImprovementAction,
  updateImprovementActionStatus,
  createWhatsappDraft,
  listWhatsappDrafts,
  updateWhatsappDraftStatus,
  findVehicleByMakeModelYear,
  findVehicleByTitle,
  countSuspiciousPriceVehicles,
  listSuspiciousPriceVehicles,
  getKagisoSettings,
  patchKagisoSettings,
  getMarketGuideRefreshMeta,
  listMarketGuideLive,
} from "./db";
import { storagePut } from "./storage";
import {
  AGENTS,
  AGENT_LIST,
  PRIMARY_INBOX,
  agentsForAudience,
} from "../shared/agents";
import {
  agentGetsDealerQaPlaybook,
  formatDealerQaForSystemPrompt,
} from "../shared/dealerQaPlaybook";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { alertFounder } from "./_core/founderAlert";
import { sendLeadAcknowledgmentEmail } from "./_core/resendEmailService";
import { placeOutboundCall } from "./_core/calling";
import { generateAgentReply, generateWhatsAppReply, addWhatsAppAIDisclosure, generateMemoryAugmentedReply, type LanguageCode, LANGUAGE_RULES } from "./_core/agentPrompts";
import { recordOutcome } from "./_core/agentMemory";
import { markNalaChatBookingConversion } from "./_core/chatBookingConversion";
import { runAudit, type AuditInput, applyFindingToSettings } from "./_core/improvementAgent";
import { proposeNewAgent, type ProposalContext } from "./_core/proposeNewAgent";
import { runFallbackAgent, isAfterHoursSAST } from "./_core/fallbackAgent";
import { runPreApprovalAgent } from "./_core/preApprovalAgent";
import { runBookingAgent } from "./_core/bookingAgent";
import { buildConfirmationMessage, buildBookingIcs } from "./_core/bookingConfirmation";
import { triggerKagisoAuditIfDue, AUDIT_INTERVAL_MS } from "./_core/autonomousAudit";
import { applyProposedPatch } from "./_core/kagisoPatchApplier";
import { resolveBrandKit, sanitizeHexColor } from "./_core/brandKit";
import { isShowroomThemeId, resolveShowroomTheme } from "../shared/showroomThemes";
import { parseInventoryCsv } from "./_core/csvInventory";
import { isR1Price, repairPricesFromRows } from "./_core/csvPriceRepair";
import { commitInventoryCsv } from "./_core/inventoryCsvCommit";
import { downloadAndStorePhoto, mirrorExternalPhoto, shouldMirrorPhoto } from "./_core/photoDownloader";
import { buildHtmlEmail, buildPlainTextSignature } from "./_core/emailSignature";
import { billingRouter } from "./_core/billingRouter";
import { emailRouter as coreEmailRouter } from "./_core/emailRouter"; // Renamed to avoid conflict
import { analyticsRouter } from "./_core/analyticsRouter";
import { agentsEnhancedRouter } from "./_core/agentsEnhancedRouter";
import { marketplaceRouter } from "./_core/marketplaceRouter";
import { exportRouter } from "./_core/exportRouter";
import { onboardingWizardRouter } from "./_core/onboardingWizardRouter";
import { emailSequencesRouter } from "./_core/emailSequencesRouter";
import { landingPagesRouter } from "./_core/landingPagesRouter";
import { analyticsEventsRouter } from "./_core/analyticsEventsRouter";
import { reportsRouter } from "./_core/reportsRouter";
import { stripeRouter } from "./_core/stripeRouter";
import { featureAccessRouter } from "./_core/featureAccessRouter";
import { customReportBuilderRouter } from "./_core/customReportBuilder";
import { scheduledReportsRouter } from "./_core/scheduledReportsRouter";
import { notificationsRouter } from "./routers/notifications";
import { findFAQAnswer, formatFAQForWhatsApp } from "./_core/faqBot";
import { facebookAgentRouter } from "./_core/facebookAgent";
import { teamMembersRouter } from "./_core/teamMembersRouter";
import { vehicleImportRouter } from "./_core/vehicleImportRouter";
import { securityAuditRouter } from "./_core/securityAuditRouter";
import { siphoEnhancedRouter } from "./_core/siphoEnhancedRouter";
import { postSignupEmailRouter } from "./_core/postSignupEmailRouter";
import { emailSendingRouter } from "./_core/emailSendingRouter";
import { valuationRouter } from "./routers/valuation";
import {
  generateRemediationSuggestions,
  applyRemediationAction,
  getRemediationHistory,
  getPendingRemediations,
  calculateRemediationImpact,
} from "./_core/remediationSuggestions";
import {
  generateSecurityReport,
  getDealershipSecurityReport,
  sendSecurityReportToDealership,
  scheduleSecurityReports,
  getSecurityReportHistory,
  calculateSecurityTrend,
  generateUpsellMetrics,
} from "./_core/dealershipSecurityReport";
import { vehicleAvailabilityRouter } from "./_core/vehicleAvailabilityRouter";
import {
  createHeartbeatJob,
  listHeartbeatJobs,
  updateHeartbeatJob,
  deleteHeartbeatJob,
} from "./_core/heartbeat";
import {
  listDealerships,
  listDealerNetworkPhotos,
  getDb,
  createOnboardingSubmission,
  listOnboardingSubmissions,
  updateOnboardingStatus,
  deleteOnboardingSubmission,
  provisionOnboardingSubmission,
  createApproval,
  listPendingApprovals,
  decideApproval,
  createFallbackMessage,
  listFallbackMessages,
  resolveFallbackMessage,
  deleteFallbackMessage,
  deleteResolvedFallbackMessages,
  insertPreApproval,
  listPreApprovals,
  getPreApproval,
  decidePreApproval,
  deletePreApproval,
  createTestDriveBooking,
  listTestDriveBookings,
  getTestDriveBooking,
  updateTestDriveBookingStatus,
  listFutureBookingWindows,
  createRoadmapItem,
  listRoadmap,
  getPlatformOpsSnapshot,
  decideRoadmapItem,
  deleteRoadmapItem,
  findRoadmapByHash,
  getKagisoSnapshot,
  getLastKagisoAuditRunAt,
  listOpenAuditFindings,
  autoResolveStaleAuditFindings,
  listProposedPatches,
  getProposedPatch,
  markPatchApplied,
  markPatchRejected,
  markPatchFailed,
  countPendingProposedPatches,
  createProposedPatch,
  findProposedPatchByFingerprint,
  listAllDealerships,
  createDealership,
  deleteDealershipCascade,
  getDealershipById,
  getDealershipByShortcode,
  setDealershipShortcode,
  updateDealershipBrand,
  updateDealershipIntegrations,
  updateDealershipModules,
  createDealerGroup,
  listDealerGroups,
  listDealershipsByGroupKey,
  setDealershipGroupKey,
  getDealerGroupOverview,
  updateUserDealershipId,
  normalizeGroupKey,
  getAdminOverview,
  createInvoice,
  listInvoices,
  getInvoice,
  updateInvoiceStatus,
  setInvoicePdfUrl,
  getLeadById,
  createPayment,
  listPayments,
  createVatReconciliation,
  getVatReconciliation,
} from "./db";
import { getChatbotDeployment } from "./_core/chatbotDeploymentService";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { prospects } from "../drizzle/schema";
import { pickNextProspects } from "./_core/saProspectPool";
// import { founderProfileRouter } from "./_core/founderProfileRouter";
// import { stagingEnvironmentRouter } from "./_core/stagingEnvironmentRouter";
import { tier2Router } from "./_core/tier2Improvements";
import { tier3Router, tier4Router, tier5Router } from "./_core/tier345Improvements";
import { authEnhancedRouter } from "./_core/authEnhancedRouter";
// import { oauthRouter } from "./routers/oauthRouter";
import { webhookRouter } from "./routers/webhookRouter";
// import { collaborationRouter } from "./routers/collaborationRouter";
import { vehicleRouter } from "./routers/vehicleRouter";
// import { vehiclePhotoRouter } from "./routers/vehiclePhotoRouter";
// import { testDriveRouter } from "./routers/testDriveRouter";
// import { leadManagementRouter } from "./routers/leadManagementRouter";
import { financingRouter } from "./routers/financingRouter";
// import { feedbackRouter } from "./routers/feedbackRouter";
// import { salesPerformanceRouter } from "./routers/salesPerformanceRouter";
import { vehicleComparisonRouter } from "./routers/vehicleComparisonRouter";
// import { followUpSchedulerRouter } from "./routers/followUpSchedulerRouter";
// import { inventoryRouter } from "./routers/inventoryRouter";
// import { analyticsRouter } from "./routers/analyticsRouter";
import { communicationHubRouter } from "./routers/communicationHubRouter";
// import { dealershipSettingsRouter } from "./routers/dealershipSettingsRouter";
import { photoGalleryRouter } from "./routers/photoGalleryRouter";
// import { appointmentCalendarRouter } from "./routers/appointmentCalendarRouter";
import { feedbackDashboardRouter } from "./routers/feedbackDashboardRouter";
import { serviceHistoryRouter } from "./routers/serviceHistoryRouter";
import { leadNurturingRouter } from "./routers/leadNurturingRouter";
import { vehicleRecommendationRouter } from "./routers/vehicleRecommendationRouter";
import { serviceAppointmentRouter } from "./routers/serviceAppointmentRouter";
import { alertPreferencesRouter } from "./routers/alertPreferencesRouter";
// import { incidentEscalationRouter } from "./routers/incidentEscalationRouter";
import { serviceRemindersRouter } from "./routers/serviceRemindersRouter";
import { documentManagementRouter } from "./routers/documentManagementRouter";
// import { advancedReportingRouter } from "./routers/advancedReportingRouter";
import { multiLocationRouter } from "./routers/multiLocationRouter";

import { taxReconciliationRouter } from "./routers/taxReconciliationRouter";
// import { auditTrailExportRouter } from "./routers/auditTrailExportRouter";
// import { onboardingRouter } from "./routers/onboardingRouter";

export const appRouter = router({
  campaign: campaignRouter,
  auth: authEnhancedRouter,
  // oauth: oauthRouter,
  webhooks: webhookRouter,
  alertPreferences: alertPreferencesRouter,
  // incidentEscalation: incidentEscalationRouter,
  serviceReminders: serviceRemindersRouter,
  documentManagement: documentManagementRouter,
  // advancedReporting: advancedReportingRouter,
  multiLocation: multiLocationRouter,
  system: systemRouter,
  billing: billingRouter,
  email: coreEmailRouter,
  emailSequences: emailSequencesRouter,
  landingPages: landingPagesRouter,
  analyticsEvents: analyticsEventsRouter,
  reports: reportsRouter,
  stripe: stripeRouter,
  featureAccess: featureAccessRouter,
  notifications: notificationsRouter,
  // analytics: analyticsRouter,
  agentsEnhanced: agentsEnhancedRouter,
  marketplace: marketplaceRouter,
  export: exportRouter,
  customReportBuilder: customReportBuilderRouter,
  scheduledReports: scheduledReportsRouter,
  teamMembers: teamMembersRouter,
  vehicleImport: vehicleImportRouter,
  securityAudit: securityAuditRouter,
  siphoEnhanced: siphoEnhancedRouter,
  emailSending: emailSendingRouter,
  postSignupEmail: postSignupEmailRouter,
  vehicleAvailability: vehicleAvailabilityRouter,
  vehicleComparison: vehicleComparisonRouter,
  auditLog: auditRouter,
  valuation: valuationRouter,
  onboarding: onboardingWizardRouter,
  emailNotifications: emailRouter,
  inventorySync: inventorySyncRouter,
  whatsapp: whatsappRouter,
  sms: smsRouter,
  twoFactor: twoFactorRouter,
  // emailAndAuth: emailAndAuthRouter,
  // advancedFeatures: advancedFeaturesRouter,
  socialLogin: socialLoginRouter,
  adminUsers: adminUserRouter,
  // services: servicesRouter,
  compliance: complianceRouter,
  complianceMailbox: complianceMailboxRouter,
  legalSignOff: legalSignOffRouter,
  // complianceTraining: complianceTrainingRouter,
  // complianceTrainingAlerts: complianceTrainingAlertsRouter,
  // auditTrailExport: auditTrailExportRouter,
  chatbot: chatbotRouter,
  // supportChatbot: supportChatbotRouter,
  // chatbotAnalytics: chatbotAnalyticsRouter,
  // chatbotFeedback: chatbotFeedbackRouter,
  liveChat: liveChatRouter,
  branding: brandingRouter,
  whatsappIntegration: whatsappIntegrationRouter,
  leadScoringCalibration: leadScoringCalibrationRouter,
  csvAutoRepair: csvAutoRepairRouter,
  inventory: inventoryRouter,
  dashboard: dashboardRouter,
  dashboardAssistant: dashboardAssistantRouter,
  leadScoring: leadScoringRouter,
  // insights: insightsRouter,
  // vehiclePhoto: vehiclePhotoRouter,
  // help: onboardingRouter,
  // founderProfile: founderProfileRouter,
  // staging: stagingEnvironmentRouter,
  tier2: tier2Router,
  tier3: tier3Router,

  tier4: tier4Router,
  tier5: tier5Router,
  taxReconciliation: taxReconciliationRouter,

  remediation: router({
    getSuggestions: protectedProcedure
      .input(z.object({ dealershipId: z.string() }))
      .query(async ({ input }: any) => {
        return await generateRemediationSuggestions(input.dealershipId, 75, ["authorization"]);
      }),
    applyAction: protectedProcedure
      .input(z.object({ actionId: z.string(), dealershipId: z.string() }))
      .mutation(async ({ input }: any) => {
        return await applyRemediationAction(input.actionId, input.dealershipId, "founder");
      }),
    getHistory: protectedProcedure
      .input(z.object({ dealershipId: z.string() }))
      .query(async ({ input }: any) => {
        return await getRemediationHistory(input.dealershipId);
      }),
    getPending: protectedProcedure
      .input(z.object({ dealershipId: z.string() }))
      .query(async ({ input }: any) => {
        return await getPendingRemediations(input.dealershipId);
      }),
  }),

  dealershipSecurityReport: router({
    generateReport: protectedProcedure
      .input(z.object({ dealershipId: z.string(), dealershipName: z.string(), score: z.number() }))
      .mutation(async ({ input }: any) => {
        return await generateSecurityReport(input.dealershipId, input.dealershipName, input.score, []);
      }),
    getReport: protectedProcedure
      .input(z.object({ reportId: z.string() }))
      .query(async ({ input }: any) => {
        return await getDealershipSecurityReport(input.reportId);
      }),
    getHistory: protectedProcedure
      .input(z.object({ dealershipId: z.string() }))
      .query(async ({ input }: any) => {
        return await getSecurityReportHistory(input.dealershipId);
      }),
  }),

  faq: router({
    search: publicProcedure
      .input(z.object({ query: z.string().min(1).max(500) }))
      .query(({ input }) => {
        const answer = findFAQAnswer(input.query);
        if (!answer) {
          return {
            found: false,
            message: "I couldn't find an answer to that question. Please contact support at grayarx@gmail.com or call 079 491 5187.",
          };
        }
        return {
          found: true,
          question: answer.question,
          answer: answer.answer,
          followUp: answer.followUp,
          formatted: formatFAQForWhatsApp(answer),
        };
      }),
  }),

  facebook: facebookAgentRouter,

  leads: router({
    create: publicProcedure
      .input(
        z.object({
          dealershipName: z.string().min(1).max(255),
          contactName: z.string().min(1).max(255),
          email: z.string().email(),
          phone: z.string().min(5).max(32),
          monthlyVehicles: z.number().int().positive().optional(),
          notes: z.string().max(2000).optional(),
          language: z.string().length(2).optional(),
          // Anti-bot fields. Honeypot is hidden in the DOM; real users leave
          // it empty. renderedAtMs is set by the form on mount and used to
          // enforce the brief's "2 s timing threshold".
          honeypot: z.string().max(255).optional(),
          renderedAtMs: z.number().int().nonnegative().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Anti-abuse gate — silent reject (we don't want bots learning the
        // exact thresholds, so the error message is intentionally generic).
        const ip = callerIp(ctx.req);
        const bot = looksLikeBot({
          honeypot: input.honeypot,
          renderedAtMs: input.renderedAtMs,
        });
        if (bot.bot) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Submission rejected. Please try again.",
          });
        }
        const rl = checkRateLimit(
          `leads.create:${ip}`,
          RATE_LIMITS.LEAD_CREATE.max,
          RATE_LIMITS.LEAD_CREATE.windowMs,
        );
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Too many submissions from your network. Please try again in ${Math.ceil(rl.retryAfterMs / 60000)} minute(s).`,
          });
        }
        const leadId = await createLead({
          dealershipName: input.dealershipName,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone,
          monthlyVehicles: input.monthlyVehicles ?? null,
          notes: input.notes ?? null,
          language: input.language ?? "en",
          source: "website",
        });
        const rawLang = (input.language ?? "en").toLowerCase();
        const lang: LanguageCode = (LANGUAGE_RULES as Record<string, unknown>)[rawLang]
          ? (rawLang as LanguageCode)
          : "en";
        await logAgentActivity({
          agentId: "email",
          action: "lead_received",
          subjectType: "lead",
          subjectId: leadId,
          summary: `Mia received a new lead from ${input.contactName} (${input.dealershipName}) — drafting reply in ${LANGUAGE_RULES[lang].name}.`,
          payload: { email: input.email, language: lang },
        });
        // Queue Day 1 / Day 3 / Day 7 follow-ups. Failures here must NOT
        // fail the lead capture itself — log and continue.
        if (leadId > 0) {
          try {
            await scheduleFollowups(leadId, lang);
          } catch (e) {
            console.error("[leads.create] scheduleFollowups failed", e);
          }
          // Instant pilot welcome — Resend ships even if OpenAI is unavailable.
          sendLeadAcknowledgmentEmail(
            input.email,
            input.contactName,
            input.dealershipName,
          ).catch((e) => console.error("[leads.create] Resend acknowledgment failed", e));
        }

        // Live guarded multilingual reply via Mia (Email Agent).
        // Failures here must NOT fail the lead capture — log a fallback entry instead.
        try {
          const customerSummary = [
            `Dealership: ${input.dealershipName}`,
            `Contact: ${input.contactName}`,
            `Email: ${input.email}`,
            `Phone: ${input.phone}`,
            input.monthlyVehicles ? `Monthly vehicles: ${input.monthlyVehicles}` : null,
            input.notes ? `Notes from the dealer: ${input.notes}` : null,
          ]
            .filter(Boolean)
            .join("\n");

          const drafted = await generateAgentReply({
            agentId: "email",
            language: lang,
            customerMessage:
              `A new dealership has submitted an enquiry on the GrayArx website. Write a warm welcome reply confirming we received the enquiry, that we will follow up within one working day, and inviting them to book a 30-minute demo at their convenience. Their details:\n\n${customerSummary}`,
          });
          // Wrap Mia's plain-text body in the GrayArx HTML envelope so when
          // an outbound mailer is connected it ships pixel-perfect across
          // every email client, with the static gold-glow logo embedded.
          const htmlEnvelope = buildHtmlEmail({
            agentId: "email",
            bodyPlainText: drafted.reply,
            language: lang,
            subject: `Welcome to GrayArx, ${input.contactName}`,
          });
          const plainTextReply = `${drafted.reply}\n${buildPlainTextSignature({ agentId: "email", language: lang })}`;
          await logAgentActivity({
            agentId: "email",
            action: "draft_ready",
            subjectType: "lead",
            summary: `Mia drafted a ${LANGUAGE_RULES[lang].name} reply (quality score ${drafted.score}/100, ${drafted.attempts} attempt${drafted.attempts === 1 ? "" : "s"}).`,
            payload: {
              score: drafted.score,
              issues: drafted.issues,
              attempts: drafted.attempts,
              language: lang,
              reply: drafted.reply,
              replyHtml: htmlEnvelope,
              replyText: plainTextReply,
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await logAgentActivity({
            agentId: "email",
            action: "draft_failed",
            subjectType: "lead",
            summary: `Mia could not draft an automatic reply — a human will follow up. (${message.slice(0, 120)})`,
          });
        }

        alertFounder({
          title: "New GrayArx lead",
          content: `${input.dealershipName} (${input.contactName}, ${input.email}, ${input.phone})`,
          category: "lead",
          actionUrl: "https://www.grayarx.com/admin/ops",
        }).catch(() => undefined);
        return { success: true } as const;
      }),
  }),

  bookings: router({
    create: publicProcedure
      .input(
        z.object({
          dealershipName: z.string().min(1).max(255),
          contactName: z.string().min(1).max(255),
          email: z.string().email(),
          phone: z.string().min(5).max(32),
          preferredDate: z.string().min(8).max(16),
          preferredTime: z.string().min(4).max(8),
          notes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await createBooking({
          dealershipName: input.dealershipName,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone,
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          notes: input.notes ?? null,
        });
        await logAgentActivity({
          agentId: "booking",
          action: "booking_created",
          subjectType: "booking",
          summary: `Lerato confirmed a demo for ${input.dealershipName} on ${input.preferredDate} at ${input.preferredTime}.`,
          payload: { contact: input.contactName, email: input.email },
        });
        notifyOwner({
          title: "New GrayArx demo booking",
          content: `${input.dealershipName} — ${input.preferredDate} ${input.preferredTime}`,
          actionUrl: `${ENV.appUrl}/admin/platform-demos`,
        }).catch(() => undefined);
        return { success: true } as const;
      }),
  }),

  showroom: router({
    /**
     * Public showroom vehicle list.
     * - With dealershipId: tenant-scoped stock for that dealer (e.g. a shortcode preview).
     * - A signed-in dealer OR founder/admin linked to a dealership sees THEIR OWN stock,
     *   so the top-nav "Showroom" never mixes other yards' cars with theirs.
     * - Anonymous buyers (and staff with no dealership linked) see the platform marketplace,
     *   with the seeded demo dealership excluded so demo cars don't leak in.
     * Input may be omitted or null (tRPC batch clients send null).
     */
    list: publicProcedure
      .input(
        z
          .object({
            dealershipId: z.number().int().optional(),
            /** Optional page size (default keeps prior full-list behaviour). */
            limit: z.number().int().min(1).max(200).optional(),
            offset: z.number().int().min(0).optional(),
          })
          .nullish(),
      )
      .query(async ({ input, ctx }) => {
        const pageLimit = input?.limit ?? 2000;
        const pageOffset = input?.offset ?? 0;
        if (input?.dealershipId != null) {
          return listVehicles(pageLimit, {
            dealershipId: input.dealershipId,
            excludeSold: true,
            excludePlaceholderPrices: true,
            includeGallery: false,
            offset: pageOffset,
          });
        }
        const user = ctx.user;
        const yardId = user?.dealershipId ?? null;
        const isYardScoped =
          !!user &&
          yardId != null &&
          (user.role === "dealer_owner" ||
            user.role === "dealer_consultant" ||
            isFounderOrAdmin(user));
        if (isYardScoped) {
          return listVehicles(pageLimit, {
            dealershipId: yardId!,
            excludeSold: true,
            excludePlaceholderPrices: true,
            includeGallery: false,
            offset: pageOffset,
          });
        }
        const demoDealershipId = await getDemoDealershipId();
        return listVehicles(pageLimit, {
          excludeSold: true,
          excludePlaceholderPrices: true,
          excludeDealershipId: demoDealershipId ?? undefined,
          includeGallery: false,
          offset: pageOffset,
        });
      }),
    stats: publicProcedure.query(async () => getVehicleInventoryCounts()),
    get: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const vehicle = await getVehicle(input.id);
        if (!vehicle) return null;
        // Sold + R1 placeholders stay off the public showroom until fixed
        if (vehicle.status === "sold") return null;
        if (isR1Price(vehicle.price)) return null;
        const photos = await listVehiclePhotos(input.id);
        return {
          ...vehicle,
          gallery: photos.map((p) => ({
            id: p.id,
            url: p.url,
            caption: p.caption,
            position: p.position,
          })),
        };
      }),
    /**
     * Public discovery: which dealership shortcode should the front-end
     * link to from the showroom "Get pre-approved" CTA?
     * Falls back to the first active dealership with a publicShortcode set.
     */
    primaryShortcode: publicProcedure.query(async () => {
      const all = await listAllDealerships();
      const candidate =
        all.find(
          (d) =>
            (d.status === "active" || d.status === "onboarding") &&
            !!d.publicShortcode,
        ) ?? all.find((d) => !!d.publicShortcode);
      return { shortcode: candidate?.publicShortcode ?? null };
    }),
    /** Public contact options for showroom vehicle cards (WhatsApp / web chat). */
    contactOptions: publicProcedure
      .input(
        z
          .object({
            dealershipId: z.number().int().optional(),
            shortcode: z.string().min(1).max(64).optional(),
          })
          .nullish(),
      )
      .query(async ({ input }) => {
      const all = await listAllDealerships();
      const code = input?.shortcode?.trim().toLowerCase();
      const candidate = input?.dealershipId
        ? (all.find((d) => d.id === input.dealershipId) ?? null)
        : code
          ? (all.find(
              (d) => (d.publicShortcode ?? "").trim().toLowerCase() === code,
            ) ?? null)
          : (all.find(
              (d) =>
                (d.status === "active" || d.status === "onboarding") &&
                !!d.publicShortcode,
            ) ?? all[0]);
      if (!candidate) {
        return {
          shortcode: null as string | null,
          dealershipName: "GrayArx Dealership",
          webChatbotEnabled: true,
          whatsappChatbotEnabled: false,
          whatsappPhoneNumber: null as string | null,
        };
      }
      const deployment = await getChatbotDeployment(candidate.id);
      return {
        shortcode: candidate.publicShortcode ?? null,
        dealershipName: candidate.name ?? "GrayArx Dealership",
        webChatbotEnabled: deployment ? deployment.webChatbotEnabled === 1 : true,
        whatsappChatbotEnabled: deployment?.whatsappChatbotEnabled === 1,
        whatsappPhoneNumber: deployment?.whatsappPhoneNumber ?? "0820532685",
      };
    }),
    /** Public showroom look — pass dealershipId or shortcode for that yard's theme. */
    appearance: publicProcedure
      .input(
        z
          .object({
            dealershipId: z.number().int().optional(),
            shortcode: z.string().min(1).max(64).optional(),
          })
          .nullish(),
      )
      .query(async ({ input }) => {
        const all = await listAllDealerships();
        const code = input?.shortcode?.trim().toLowerCase();
        const candidate = input?.dealershipId
          ? (all.find((d) => d.id === input.dealershipId) ?? null)
          : code
            ? (all.find(
                (d) => (d.publicShortcode ?? "").trim().toLowerCase() === code,
              ) ?? null)
            : (all.find(
                (d) =>
                  (d.status === "active" || d.status === "onboarding") &&
                  !!d.publicShortcode,
              ) ?? all[0]);
        if (!candidate) {
          return {
            dealershipId: null as number | null,
            theme: resolveShowroomTheme(null),
            accentColor: null as string | null,
            dealershipName: "GrayArx Dealership",
            publicShortcode: null as string | null,
          };
        }
        return {
          dealershipId: candidate.id,
          theme: resolveShowroomTheme(candidate.showroomTheme),
          accentColor: candidate.brandAccentColor ?? null,
          dealershipName: candidate.name ?? "GrayArx Dealership",
          publicShortcode: candidate.publicShortcode ?? null,
        };
      }),
    enquire: publicProcedure
      .input(
        z.object({
          // Coerce — chat/UI sometimes send numeric ids from the DB row.
          vehicleId: z.coerce.string().min(1),
          vehicleTitle: z.string().min(1),
          vehiclePrice: z.number().int().positive(),
          vehicleYear: z.number().int(),
          vehicleKm: z.number().int().nonnegative(),
          vehicleFuel: z.string(),
          vehicleTransmission: z.string(),
          vehicleImage: z.string().optional(),
          clientEmail: z.string().trim().email("Please enter a valid email"),
          clientName: z.string().trim().min(1, "Name is required"),
          clientPhone: z.string().trim().min(1, "Phone is required"),
          clientMessage: z.string().optional(),
          dealershipEmail: z.string().email(),
          dealershipName: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const enquiryResult = await sendShowroomEnquiry(input);
          if (!enquiryResult.success) {
            throw new Error(enquiryResult.error || "Failed to send enquiry");
          }
          const confirmationMessage = await generateEnquiryConfirmation(
            input.vehicleTitle,
            input.dealershipName,
          );
          return {
            success: true,
            message: confirmationMessage,
            messageId: enquiryResult.messageId,
          };
        } catch (error) {
          throw new Error(
            error instanceof Error ? error.message : "Failed to process enquiry",
          );
        }
      }),
    /**
     * Nala showroom chat — multilingual Q&A with template + LLM grammar polish.
     */
    chat: publicProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          message: z.string().min(1).max(500),
          dealershipName: z.string().max(255).optional(),
          language: z.string().max(5).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ip = callerIp(ctx.req);
        const rl = checkRateLimit(`showroom.chat:${ip}`, 40, 60_000);
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many messages. Please wait a moment.",
          });
        }

        const row = await getVehicle(input.vehicleId);
        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found." });
        }

        let dealershipId = 1;
        if (row.ownerUserId) {
          const owner = await getUserById(row.ownerUserId);
          if (owner?.dealershipId) dealershipId = owner.dealershipId;
        }
        const dealership = await getDealershipById(dealershipId);

        const lang = input.language && isLanguageCode(input.language)
          ? input.language
          : detectLanguage(input.message);

        const dealerName = input.dealershipName ?? dealership?.name ?? "GrayArx Dealership";
        const { resolveAgentDisplayName } = await import("../shared/agentIdentity");
        const agentName = resolveAgentDisplayName(dealership?.agentDisplayName);
        const vehicleCtx = vehicleRowToContext(row);

        // ── Multi-vehicle search: DB-filtered when make/body/colour/budget detected ──
        const { listVehicles: listAllVehicles, searchVehiclesForChat } = await import("./db");
        const detectedMake = detectMakeFromMessage(input.message);
        const detectedBodyTypes = detectBodyTypesFromMessage(input.message);
        const { detectColorFromMessage } = await import("./_core/nalaReplyOrchestrator");
        const detectedColor = detectColorFromMessage(input.message);
        const isInventorySearch =
          detectedMake !== null || detectedBodyTypes !== null || detectedColor !== null;

        const allVehicles = isInventorySearch
          ? await searchVehiclesForChat({
              dealershipId,
              make: detectedMake,
              bodyTypes: detectedBodyTypes,
              color: detectedColor,
              limit: 40,
            })
          : await listAllVehicles(80, {
              dealershipId,
              excludeSold: true,
            });
        const multiMatches = findVehiclesFromMessage(input.message, allVehicles);

        if (multiMatches.length >= 2) {
          const searchTerm = buildSearchTerm(detectedMake, detectedBodyTypes);
          const listReply = buildMultiVehicleReply(multiMatches, searchTerm, lang, dealerName);
          return {
            reply: listReply,
            language: lang,
            intent: "inventory_search",
            answered: true,
            source: "template" as const,
            agent: "nala" as const,
            referenceNumber: undefined,
            actions: [{ label: "Browse more deals", url: "/showroom?sort=best_deals" }],
          };
        }

        if (multiMatches.length === 0 && isInventorySearch) {
          const searchTerm = buildSearchTerm(detectedMake, detectedBodyTypes);
          const availableVehicles = allVehicles.filter((v) => v.status === "available" || v.status == null);
          const alternatives = (detectedBodyTypes
            ? availableVehicles.filter((v) => {
                const vbt = (v.bodyType ?? "").toLowerCase();
                return detectedBodyTypes.some((bt) => vbt.includes(bt));
              })
            : availableVehicles
          ).sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)).slice(0, 5);
          const fallbackReply = buildNoMatchFallbackReply(searchTerm, alternatives.length ? alternatives : availableVehicles.slice(0, 5), lang);
          return {
            reply: fallbackReply,
            language: lang,
            intent: "inventory_search",
            answered: true,
            source: "template" as const,
            agent: "nala" as const,
            referenceNumber: undefined,
            actions: [{ label: "Browse all stock", url: "/showroom" }],
          };
        }

        let resolved;
        try {
          resolved = await resolveRoutedReply({
            message: input.message,
            vehicle: vehicleCtx,
            vehicleId: input.vehicleId,
            dealershipId,
            dealershipName: dealerName,
            businessHoursOverride: dealership?.businessHoursJson ?? undefined,
            language: lang,
            channel: "web",
            includeDealScore: true,
            agentDisplayName: agentName,
          });
        } catch (routeErr) {
          console.warn("[showroom.chat] route failed, using template fallback", routeErr);
          const heuristic = answerShowroomQuestion(vehicleCtx, input.message, lang);
          resolved = {
            agent: "nala" as const,
            reply: composeShowroomBotReply(heuristic.reply, lang, {
              appendFollowUp: heuristic.answered && !replyNeedsNameCapture(heuristic.reply),
            }),
            language: lang,
            intent: heuristic.intent,
            answered: heuristic.answered,
            source: "template" as const,
          };
        }
        // Append next-step CTAs when Nala answered a vehicle-specific question
        const showCtas =
          resolved.answered &&
          input.vehicleId > 0 &&
          resolved.intent !== "test_drive" &&
          resolved.intent !== "pre_approval" &&
          resolved.intent !== "trade_in";

        const actions: Array<{ label: string; url: string }> = showCtas
          ? [
              { label: "Book test drive", url: "/showroom" },
              { label: "Get pre-approved", url: "/finance" },
              { label: "Browse more deals", url: "/showroom?sort=best_deals" },
            ]
          : [];

        return {
          reply: resolved.reply,
          language: resolved.language,
          intent: resolved.intent,
          answered: resolved.answered,
          source: resolved.source,
          agent: resolved.agent,
          referenceNumber: resolved.referenceNumber,
          actions,
        };
      }),
    aiSearch: publicProcedure
      .input(z.object({ query: z.string().min(1).max(500) }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful AI assistant for a luxury South African car dealership. Given a customer query, suggest 1-2 vehicle types that match. Keep responses under 80 words. Be conversational, warm, and direct. Never invent specific listings — only describe what would suit the customer.",
              },
              { role: "user", content: input.query },
            ],
          });
          const summary =
            response.choices?.[0]?.message?.content ||
            "I'd recommend exploring our SUV and sedan range — let me know your budget for tailored picks.";
          return { summary };
        } catch {
          return {
            summary:
              "Let our showroom team help you find the perfect vehicle — try filtering by fuel and transmission below.",
          };
        }
      }),
  }),

  // Protected dealer-only endpoints
  dealer: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = isFounderOrAdmin(ctx.user);
      const dealershipId = ctx.user.dealershipId ?? null;
      if (!isAdmin && !dealershipId) {
        return {
          totalLeads: 0,
          newLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          totalVehicles: 0,
          availableVehicles: 0,
          reservedVehicles: 0,
          soldVehicles: 0,
          leadsLast7Days: 0,
          bookingsLast7Days: 0,
          totalProspects: 0,
          queuedProspects: 0,
        };
      }
      // Dealer dashboard never surfaces platform Prospector aggregates.
      // Scope to the user's dealership when set (including founder viewing a branch).
      return getDashboardStats({
        dealershipId: dealershipId ?? undefined,
        includeProspects: false,
      });
    }),
    activity: protectedProcedure.query(async ({ ctx }) => {
      const dealershipId = ctx.user.dealershipId;
      // No dealership context → empty feed (prevents cross-tenant / Prospector bleed).
      if (!dealershipId) return [];
      return getRecentActivity(10, {
        dealershipId,
        includeProspects: false,
      });
    }),
    leadsTrend: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = isFounderOrAdmin(ctx.user);
      const dealershipId = ctx.user.dealershipId ?? null;
      if (!isAdmin && !dealershipId) return [];
      return getLeadsTrend(14, dealershipId ?? undefined);
    }),

    /**
     * Sibling branches for the user's current dealership group.
     * Empty when dealership has no groupKey (single-dealer — no switcher).
     */
    listBranches: protectedProcedure.query(async ({ ctx }) => {
      assertDealerOrAdmin(ctx.user);
      const dealershipId = ctx.user.dealershipId;
      if (!dealershipId) {
        return { groupKey: null as string | null, branches: [] as Array<{
          id: number;
          name: string;
          region: string | null;
          publicShortcode: string | null;
        }>, activeDealershipId: null as number | null };
      }
      const home = await getDealershipById(dealershipId);
      if (!home?.groupKey) {
        return {
          groupKey: null as string | null,
          branches: [],
          activeDealershipId: dealershipId,
        };
      }
      const siblings = await listDealershipsByGroupKey(home.groupKey);
      return {
        groupKey: home.groupKey,
        activeDealershipId: dealershipId,
        branches: siblings.map((b) => ({
          id: b.id,
          name: b.name,
          region: b.region ?? null,
          publicShortcode: b.publicShortcode ?? null,
        })),
      };
    }),

    /**
     * Switch active branch: updates users.dealershipId so dashboard queries
     * scope to the selected branch. Allowed when target shares groupKey with
     * the user's current dealership (or founder/admin).
     */
    switchBranch: protectedProcedure
      .input(z.object({ dealershipId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        assertDealerOrAdmin(ctx.user);
        const target = await getDealershipById(input.dealershipId);
        if (!target) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dealership not found" });
        }

        if (isFounderOrAdmin(ctx.user)) {
          await updateUserDealershipId(ctx.user.id, input.dealershipId);
          return {
            ok: true as const,
            dealershipId: target.id,
            name: target.name,
            groupKey: target.groupKey ?? null,
          };
        }

        const currentId = ctx.user.dealershipId;
        if (!currentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your account is not linked to a dealership.",
          });
        }
        if (currentId === input.dealershipId) {
          return {
            ok: true as const,
            dealershipId: target.id,
            name: target.name,
            groupKey: target.groupKey ?? null,
          };
        }
        const current = await getDealershipById(currentId);
        if (!current?.groupKey || !target.groupKey || current.groupKey !== target.groupKey) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only switch to branches in your dealer group.",
          });
        }
        await updateUserDealershipId(ctx.user.id, input.dealershipId);
        return {
          ok: true as const,
          dealershipId: target.id,
          name: target.name,
          groupKey: target.groupKey ?? null,
        };
      }),

    /** Dealer-controlled showroom appearance (template + accent). */
    getAppearance: protectedProcedure.query(async ({ ctx }) => {
      const dealershipId = ctx.user.dealershipId;
      if (!dealershipId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
      }
      const dealership = await getDealershipById(dealershipId);
      if (!dealership) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        theme: resolveShowroomTheme(dealership.showroomTheme),
        brandAccentColor: dealership.brandAccentColor ?? null,
        brandLogoUrl: dealership.brandLogoUrl ?? null,
        dealershipName: dealership.name ?? "Your dealership",
        agentDisplayName: dealership.agentDisplayName ?? null,
        publicShortcode: dealership.publicShortcode ?? null,
        whatsappPhoneNumberId: dealership.whatsappPhoneNumberId ?? null,
      };
    }),

    updateAppearance: protectedProcedure
      .input(
        z.object({
          theme: z.enum(["futuristic", "classic", "minimal", "bold"]),
          brandAccentColor: z.string().max(16).nullable().optional(),
          agentDisplayName: z.string().max(40).nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
        }
        if (!isShowroomThemeId(input.theme)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid theme" });
        }
        const accent = input.brandAccentColor
          ? sanitizeHexColor(input.brandAccentColor)
          : undefined;
        await updateDealershipBrand(dealershipId, {
          showroomTheme: input.theme,
          ...(Object.prototype.hasOwnProperty.call(input, "brandAccentColor")
            ? { brandAccentColor: accent ?? null }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(input, "agentDisplayName")
            ? { agentDisplayName: input.agentDisplayName?.trim() || null }
            : {}),
        });
        return { success: true, theme: input.theme };
      }),

    listLeads: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = isFounderOrAdmin(ctx.user);
      const dealershipId = ctx.user.dealershipId;
      if (!isAdmin && !dealershipId) return [];
      // Founders without a selected branch see nothing here — use admin tools for platform-wide.
      if (!dealershipId) return [];
      return listLeads(200, dealershipId);
    }),
    listNetworkTradeIns: protectedProcedure.query(async ({ ctx }) => {
      const rows = await listNetworkTradeInQuotes(100);
      const dealershipId = ctx.user.dealershipId ?? 0;
      const now = Date.now();
      return Promise.all(
        rows.map(async (r) => {
          const inviteCount = await countTradeInInvitesForQuote(r.id);
          const dealerAlreadyInvited =
            dealershipId > 0 ? await dealerInvitedQuote(r.id, dealershipId) : false;
          const listingAgeHours = Math.max(
            0,
            Math.floor((now - new Date(r.createdAt).getTime()) / 3_600_000),
          );
          return {
            id: r.id,
            make: r.make,
            model: r.model,
            year: r.year,
            mileageKm: r.mileageKm,
            transmission: r.transmission,
            fuel: r.fuel,
            bodyType: r.bodyType,
            condition: r.condition,
            serviceHistory: r.serviceHistory,
            notes: r.notes,
            province: r.province,
            estimateLow: r.estimateLow,
            estimateMid: r.estimateMid,
            estimateHigh: r.estimateHigh,
            confidence: r.confidence,
            photoUrls: r.photoUrls ? (JSON.parse(r.photoUrls) as string[]) : [],
            contactName: r.contactName,
            contactEmail: r.contactEmail,
            contactPhone: r.contactPhone,
            status: r.status,
            createdAt: r.createdAt,
            listingAgeHours,
            inviteCount,
            dealerAlreadyInvited,
          };
        }),
      );
    }),
    requestTradeInInspection: protectedProcedure
      .input(
        z.object({
          quoteId: z.number().int(),
          message: z.string().max(500).optional(),
          indicativeOfferZar: z.number().int().min(15_000).max(5_000_000).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const quote = await getTradeInQuoteById(input.quoteId);
        if (!quote || quote.networkListed !== 1) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Trade-in listing not found." });
        }
        if (!quote.contactPhone && !quote.contactEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller has no contact details on file.",
          });
        }
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your account is not linked to a dealership.",
          });
        }
        const dealership = await getDealershipById(dealershipId);
        const dealerName = dealership?.name ?? "GrayArx dealership";
        const vehicleLabel = `${quote.year} ${quote.make} ${quote.model}`;
        const range = `R${quote.estimateLow.toLocaleString("en-ZA")}–R${quote.estimateHigh.toLocaleString("en-ZA")}`;
        const offerLine = input.indicativeOfferZar
          ? ` Our indicative offer (subject to inspection): R${input.indicativeOfferZar.toLocaleString("en-ZA")}.`
          : "";
        const inviteMsg =
          input.message?.trim() ||
          `Hi${quote.contactName ? ` ${quote.contactName}` : ""}, we're ${dealerName}. We saw your ${vehicleLabel} on the GrayArx trade-in network (Tumi guide ${range}).${offerLine} We'd like to invite you for a quick inspection and test drive so we can confirm a written offer. When suits you this week?`;

        const leadId = await createLead({
          dealershipId,
          dealershipName: dealerName,
          contactName: quote.contactName ?? "Trade-in seller",
          email: quote.contactEmail ?? "trade-in@grayarx.local",
          phone: quote.contactPhone ?? "0000000000",
          notes: `Trade-in network #${quote.id}: ${vehicleLabel}, ${quote.mileageKm.toLocaleString("en-ZA")} km, ${quote.province ?? "SA"}. Tumi range ${range}.${input.indicativeOfferZar ? ` Dealer indicative: R${input.indicativeOfferZar.toLocaleString("en-ZA")} (pre-inspection).` : ""} Invite: ${inviteMsg}`,
          source: "trade_in_network",
          status: "new",
          language: quote.language ?? "en",
        });

        await logAgentActivity({
          agentId: "tradein",
          action: "inspection_invited",
          subjectType: "trade_in_quote",
          subjectId: quote.id,
          summary: `${dealerName} invited seller to inspect ${vehicleLabel} (quote #${quote.id}).`,
          payload: { leadId, dealershipId, quoteId: quote.id },
        });

        const notify = await notifyTradeInSeller({
          contactName: quote.contactName,
          contactPhone: quote.contactPhone,
          contactEmail: quote.contactEmail,
          dealershipName: dealerName,
          vehicleLabel,
          inviteMessage: inviteMsg,
          indicativeOfferZar: input.indicativeOfferZar ?? null,
          quoteId: quote.id,
        });

        const inviteId = await insertTradeInInvite({
          quoteId: quote.id,
          dealershipId,
          dealershipName: dealerName,
          inviteMessage: inviteMsg,
          indicativeOfferZar: input.indicativeOfferZar ?? null,
          leadId,
          smsSent: notify.smsSent ? 1 : 0,
          emailSent: notify.emailSent ? 1 : 0,
          whatsappSent: notify.whatsappSent ? 1 : 0,
        });

        return {
          success: true as const,
          leadId,
          inviteId,
          inviteMessage: inviteMsg,
          notifications: notify,
          contactPhone: quote.contactPhone,
          contactEmail: quote.contactEmail,
          contactName: quote.contactName,
        };
      }),
    confirmTradeInOffer: protectedProcedure
      .input(
        z.object({
          quoteId: z.number().int(),
          writtenOfferZar: z.number().int().min(15_000).max(5_000_000),
          message: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const quote = await getTradeInQuoteById(input.quoteId);
        if (!quote || quote.networkListed !== 1) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Trade-in listing not found." });
        }
        const dealershipId = ctx.user.dealershipId;
        if (!dealershipId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned." });
        }
        const dealership = await getDealershipById(dealershipId);
        const dealerName = dealership?.name ?? "GrayArx dealership";
        const vehicleLabel = `${quote.year} ${quote.make} ${quote.model}`;
        const offerMsg =
          input.message?.trim() ||
          `Hi${quote.contactName ? ` ${quote.contactName}` : ""}, following our inspection of your ${vehicleLabel}, ${dealerName} is pleased to confirm a written trade-in offer of R${input.writtenOfferZar.toLocaleString("en-ZA")}. This offer is subject to final paperwork and is valid for 7 days.`;

        await updateTradeInQuoteStatus(quote.id, "offer_sent");

        const notify = await notifyTradeInWrittenOffer({
          contactName: quote.contactName,
          contactPhone: quote.contactPhone,
          contactEmail: quote.contactEmail,
          dealershipName: dealerName,
          vehicleLabel,
          inviteMessage: offerMsg,
          quoteId: quote.id,
          writtenOfferZar: input.writtenOfferZar,
        });

        const inviteId = await insertTradeInInvite({
          quoteId: quote.id,
          dealershipId,
          dealershipName: dealerName,
          inviteMessage: offerMsg,
          indicativeOfferZar: input.writtenOfferZar,
          leadId: null,
          smsSent: notify.smsSent ? 1 : 0,
          emailSent: notify.emailSent ? 1 : 0,
          whatsappSent: notify.whatsappSent ? 1 : 0,
        });

        await logAgentActivity({
          agentId: "tradein",
          action: "offer_confirmed",
          subjectType: "trade_in_quote",
          subjectId: quote.id,
          summary: `${dealerName} confirmed written offer R${input.writtenOfferZar.toLocaleString("en-ZA")} for ${vehicleLabel}.`,
          payload: { dealershipId, quoteId: quote.id, inviteId },
        });

        return { success: true as const, inviteId, notifications: notify, offerMessage: offerMsg };
      }),
    updateLeadStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const lead = await getLeadById(input.id);
        if (!lead) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        if (
          !isFounderOrAdmin(ctx.user) &&
          (!ctx.user.dealershipId || lead.dealershipId !== ctx.user.dealershipId)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This lead belongs to another dealership.",
          });
        }
        await updateLeadStatus(input.id, input.status);
        if (
          input.status === "converted" ||
          input.status === "lost" ||
          input.status === "contacted" ||
          input.status === "qualified"
        ) {
          try {
            await cancelFollowupsForLead(input.id);
          } catch (e) {
            console.error("[leads.updateStatus] cancelFollowupsForLead failed", e);
          }
        }
        return { success: true } as const;
      }),

    /** Mia drip follow-ups for this dealership (pending + drafted). */
    listLeadFollowups: protectedProcedure.query(async ({ ctx }) => {
      assertDealerOrAdmin(ctx.user);
      if (isFounderOrAdmin(ctx.user) && ctx.user.dealershipId == null) {
        return [];
      }
      if (ctx.user.dealershipId == null) return [];
      const { listLeadFollowupsForDealership } = await import("./db");
      return listLeadFollowupsForDealership(ctx.user.dealershipId);
    }),

    /** Mark a lead as contacted and cancel remaining drip reminders. */
    markLeadFollowedUp: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        assertDealerOrAdmin(ctx.user);
        const lead = await getLeadById(input.id);
        if (!lead) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        if (
          !isFounderOrAdmin(ctx.user) &&
          (!ctx.user.dealershipId || lead.dealershipId !== ctx.user.dealershipId)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This lead belongs to another dealership.",
          });
        }
        await updateLeadStatus(input.id, "contacted");
        try {
          await cancelFollowupsForLead(input.id);
        } catch (e) {
          console.error("[leads.markLeadFollowedUp] cancelFollowupsForLead failed", e);
        }
        return { success: true as const };
      }),

    /** Platform SaaS demo bookings — founder/admin only (not dealer customer test drives). */
    listBookings: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Platform demos are founder/admin only",
        });
      }
      return listBookings(200);
    }),
    updateBookingStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Platform demos are founder/admin only",
          });
        }
        await updateBookingStatus(input.id, input.status);
        return { success: true } as const;
      }),
    deleteBooking: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Platform demos are founder/admin only",
          });
        }
        await deleteBooking(input.id);
        return { success: true } as const;
      }),

    listVehicles: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = isFounderOrAdmin(ctx.user);
      // Accounts with no dealership assigned see nothing (prevents cross-tenant bleed).
      if (!isAdmin && !ctx.user.dealershipId) return [];
      // Founders/admins linked to a yard see that yard only — same as dealers.
      // Platform-wide stock stays in Admin tools, so onboarding dealers never
      // share inventory with founder demo CSVs in the dealer console.
      if (ctx.user.dealershipId != null) {
        return listVehicles(2000, {
          dealershipId: ctx.user.dealershipId,
          includeGallery: false,
        });
      }
      // Founder with no dealership linked: platform overview (admin only).
      return listVehicles(2000, { includeGallery: false });
    }),
    createVehicle: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          make: z.string().max(64).optional(),
          model: z.string().max(64).optional(),
          year: z.number().int().min(1980).max(2030).optional(),
          price: z.number().positive(),
          km: z.number().int().nonnegative().optional(),
          fuel: z.string().max(32).optional(),
          transmission: z.string().max(32).optional(),
          bodyType: z.string().max(32).optional(),
          color: z.string().max(48).optional(),
          condition: z.enum(["new", "used", "demo", "certified"]).default("used"),
          vin: optionalVinSchema,
          engineCc: z.number().int().min(0).max(20000).optional(),
          doors: z.number().int().min(2).max(6).optional(),
          seats: z.number().int().min(1).max(20).optional(),
          features: z.array(z.string().max(64)).max(40).optional(),
          serviceHistory: z.enum(["full", "partial", "none"]).optional(),
          previousOwners: z.number().int().min(0).max(20).optional(),
          imageUrl: z.string().optional(), // no max — supports base64 data URLs
          primaryPhotoUrl: z.string().optional(), // no max — supports base64 data URLs
          location: z.string().max(128).optional(),
          description: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await createVehicle({
          ownerUserId: ctx.user.id,
          dealershipId: ctx.user.dealershipId ?? null,
          title: input.title,
          make: input.make ?? null,
          model: input.model ?? null,
          year: input.year ?? null,
          price: input.price.toFixed(2),
          km: input.km ?? null,
          fuel: input.fuel ?? null,
          transmission: input.transmission ?? null,
          bodyType: input.bodyType ?? null,
          color: input.color ?? null,
          condition: input.condition,
          vin: input.vin ?? null,
          engineCc: input.engineCc ?? null,
          doors: input.doors ?? null,
          seats: input.seats ?? null,
          features: (input.features as never) ?? null,
          serviceHistory: input.serviceHistory ?? null,
          previousOwners: input.previousOwners ?? null,
          imageUrl: input.imageUrl ?? null,
          primaryPhotoUrl: input.primaryPhotoUrl ?? input.imageUrl ?? null,
          location: input.location ?? null,
          description: input.description ?? null,
        });
        return { success: true as const, id: (result as { insertId?: number })?.insertId ?? 0 };
      }),
    updateVehicle: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["available", "reserved", "sold", "fix"]).optional(),
          price: z.number().positive().optional(),
          title: z.string().min(1).max(255).optional(),
          make: z.string().max(64).optional(),
          model: z.string().max(64).optional(),
          year: z.number().int().min(1980).max(2030).optional(),
          km: z.number().int().nonnegative().optional(),
          fuel: z.string().max(32).optional(),
          transmission: z.string().max(32).optional(),
          bodyType: z.string().max(32).optional(),
          color: z.string().max(48).optional(),
          condition: z.enum(["new", "used", "demo", "certified"]).optional(),
          vin: optionalVinSchema,
          engineCc: z.number().int().min(0).max(20000).optional(),
          doors: z.number().int().min(2).max(6).optional(),
          seats: z.number().int().min(1).max(20).optional(),
          features: z.array(z.string().max(64)).max(40).optional(),
          serviceHistory: z.enum(["full", "partial", "none"]).optional(),
          previousOwners: z.number().int().min(0).max(20).optional(),
          imageUrl: z.string().optional(), // no max — supports base64 data URLs
          primaryPhotoUrl: z.string().optional(), // no max — supports base64 data URLs
          location: z.string().max(128).optional(),
          description: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...rest } = input;
        // Ownership guard: non-admin dealers can only update their own dealership's vehicles.
        if (!isFounderOrAdmin(ctx.user)) {
          const existing = await getVehicle(id);
          if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found." });
          if (existing.dealershipId !== ctx.user.dealershipId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own dealership's vehicles." });
          }
        }
        const patch: Record<string, unknown> = { ...rest };
        if (typeof rest.price === "number") patch.price = rest.price.toFixed(2);
        // Empty VIN clears the field; omit key when undefined so unrelated updates keep existing VIN.
        if (rest.vin === undefined) delete patch.vin;
        else patch.vin = rest.vin;
        await updateVehicle(id, patch as never);
        return { success: true } as const;
      }),
    deleteVehicle: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        // Ownership guard: non-admin dealers can only delete their own dealership's vehicles.
        if (!isFounderOrAdmin(ctx.user)) {
          const existing = await getVehicle(input.id);
          if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found." });
          if (existing.dealershipId !== ctx.user.dealershipId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own dealership's vehicles." });
          }
        }
        await deleteVehicle(input.id);
        return { success: true } as const;
      }),
    deleteAllVehicles: protectedProcedure.mutation(async ({ ctx }) => {
      assertDealerOrAdmin(ctx.user);
      const allPlatform = isFounderOrAdmin(ctx.user);
      if (!allPlatform && ctx.user.dealershipId == null) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No dealership linked — cannot wipe inventory.",
        });
      }
      const deleted = await deleteAllVehiclesScoped({
        allPlatform,
        dealershipId: allPlatform ? null : ctx.user.dealershipId,
        ownerUserId: ctx.user.id,
      });
      void logAgentActivity({
        agentId: allPlatform ? "improvement" : "fallback",
        action: "inventory_bulk_delete",
        subjectType: "inventory",
        summary: `Deleted ${deleted} vehicle${deleted === 1 ? "" : "s"} via dealer console.`,
        payload: { deleted, allPlatform, userId: ctx.user.id },
      });
      return { success: true as const, deleted };
    }),

    /** Delete selected vehicles (checkboxes on Inventory). Tenant-scoped. */
    deleteVehicles: protectedProcedure
      .input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(500) }))
      .mutation(async ({ input, ctx }) => {
        assertDealerOrAdmin(ctx.user);
        const allPlatform = isFounderOrAdmin(ctx.user);
        if (!allPlatform && ctx.user.dealershipId == null) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No dealership linked — cannot delete inventory.",
          });
        }
        const { deleteVehiclesByIds } = await import("./db");
        const deleted = await deleteVehiclesByIds(input.ids, {
          allPlatform,
          dealershipId: allPlatform ? null : ctx.user.dealershipId,
        });
        void logAgentActivity({
          agentId: allPlatform ? "improvement" : "fallback",
          action: "inventory_bulk_delete_selected",
          subjectType: "inventory",
          summary: `Deleted ${deleted} selected vehicle${deleted === 1 ? "" : "s"} via dealer console.`,
          payload: { deleted, requested: input.ids.length, userId: ctx.user.id },
        });
        return { success: true as const, deleted };
      }),

    /** Bulk-set status for selected vehicles (Available / Reserved / Fix / Sold). */
    updateVehiclesStatus: protectedProcedure
      .input(
        z.object({
          ids: z.array(z.number().int().positive()).min(1).max(2000),
          status: z.enum(["available", "reserved", "sold", "fix"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        assertDealerOrAdmin(ctx.user);
        const allPlatform = isFounderOrAdmin(ctx.user);
        if (!allPlatform && ctx.user.dealershipId == null) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No dealership linked — cannot update inventory.",
          });
        }
        const { updateVehiclesStatusByIds } = await import("./db");
        const updated = await updateVehiclesStatusByIds(input.ids, input.status, {
          allPlatform,
          dealershipId: allPlatform ? null : ctx.user.dealershipId,
        });
        void logAgentActivity({
          agentId: allPlatform ? "improvement" : "fallback",
          action: "inventory_bulk_status",
          subjectType: "inventory",
          summary: `Set ${updated} vehicle${updated === 1 ? "" : "s"} to ${input.status}.`,
          payload: {
            updated,
            requested: input.ids.length,
            status: input.status,
            userId: ctx.user.id,
          },
        });
        return { success: true as const, updated, status: input.status };
      }),

    // Accept a base64-encoded image (from a phone camera or file picker),
    // upload it to S3 storage, and return the public URL.
    uploadVehiclePhoto: protectedProcedure
      .input(
        z.object({
          dataBase64: z.string().min(20),
          mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
          filename: z.string().max(128).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const cleanBase64 = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        if (buffer.length === 0) {
          throw new Error("Empty image data");
        }
        if (buffer.length > 12 * 1024 * 1024) {
          throw new Error("Image too large (max 12 MB)");
        }
        
        const { removeBackground } = await import("./_core/imageEnhancement");
        const safeName = (input.filename || `vehicle-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
        let ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
        
        let finalBuffer = buffer;
        let finalMimeType = input.mimeType;
        
        // Try to remove background
        let enhanced: { buffer: Buffer; mimeType: string } | null = null;
        try {
          enhanced = await removeBackground(buffer, input.mimeType, `${safeName}.${ext}`);
        } catch (enhancementError) {
          console.error("[ImageEnhancement] Unexpected error during background removal:", enhancementError);
          console.log("[Upload] Falling back to original upload.");
        }
        if (enhanced) {
          finalBuffer = Buffer.from(enhanced.buffer) as Buffer<ArrayBuffer>;
          finalMimeType = enhanced.mimeType as "image/jpeg" | "image/png" | "image/webp";
          ext = "png"; // remove.bg always returns PNG
        }

        const key = `vehicles/${ctx.user.id}/${safeName}.${ext}`;
        const { url } = await storagePut(key, finalBuffer, finalMimeType);
        return { url, key } as const;
      }),

    // ---- Per-vehicle photo gallery ----
    listPhotos: publicProcedure
      .input(z.object({ vehicleId: z.number().int() }))
      .query(async ({ input }) => listVehiclePhotos(input.vehicleId)),

    /**
     * Upload a photo and immediately attach it to a vehicle's gallery.
     * Returns the new photo row id + url. If the vehicle has no
     * primaryPhotoUrl yet, this photo becomes the primary.
     */
    addPhoto: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          dataBase64: z.string().min(20),
          mimeType: z
            .enum(["image/jpeg", "image/png", "image/webp"])
            .default("image/jpeg"),
          caption: z.string().max(200).optional(),
          filename: z.string().max(128).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const cleanBase64 = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        if (buffer.length === 0) throw new Error("Empty image data");
        if (buffer.length > 12 * 1024 * 1024)
          throw new Error("Image too large (max 12 MB)");
        
        let ext =
          input.mimeType === "image/png"
            ? "png"
            : input.mimeType === "image/webp"
              ? "webp"
              : "jpg";
        const safeName = (
          input.filename || `vehicle-${input.vehicleId}-${Date.now()}`
        ).replace(/[^a-zA-Z0-9._-]/g, "_");

        let finalBuffer = buffer;
        let finalMimeType = input.mimeType;

        // Try to remove background to composite seamlessly into the showroom frame
        const { removeBackground } = await import("./_core/imageEnhancement");
        const enhanced = await removeBackground(buffer, input.mimeType, `${safeName}.${ext}`);
        if (enhanced) {
          finalBuffer = Buffer.from(enhanced.buffer) as Buffer<ArrayBuffer>;
          finalMimeType = enhanced.mimeType as "image/jpeg" | "image/png" | "image/webp";
          ext = "png"; // remove.bg always returns PNG
        }

        const key = `vehicles/${ctx.user.id}/${input.vehicleId}/${safeName}.${ext}`;
        const { url } = await storagePut(key, finalBuffer, finalMimeType);

        const existing = await listVehiclePhotos(input.vehicleId);
        const nextPosition = existing.length
          ? Math.max(...existing.map((p) => p.position)) + 1
          : 0;
        const photo = await addVehiclePhoto({
          vehicleId: input.vehicleId,
          url,
          storageKey: key,
          position: nextPosition,
          caption: input.caption ?? null,
        });
        // First photo becomes primary unless one is already set.
        const vehicle = await getVehicle(input.vehicleId);
        if (vehicle && !vehicle.primaryPhotoUrl) {
          await setVehiclePrimaryPhoto(input.vehicleId, url);
        }
        return { id: photo.id, url } as const;
      }),

    deletePhoto: protectedProcedure
      .input(z.object({ photoId: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteVehiclePhoto(input.photoId);
        return { success: true } as const;
      }),

    /** Delete ALL photos for a vehicle and clear its primary/imageUrl. */
    deleteAllPhotos: protectedProcedure
      .input(z.object({ vehicleId: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        const vehicle = await getVehicle(input.vehicleId);
        if (!vehicle) throw new Error("Vehicle not found");
        // Non-admin users can only delete their own dealership's photos
        if (ctx.user.role !== "admin" && ctx.user.role !== "founder") {
          if (vehicle.dealershipId !== ctx.user.dealershipId) {
            throw new Error("Not authorised");
          }
        }
        const photos = await listVehiclePhotos(input.vehicleId);
        await Promise.all(photos.map((p) => deleteVehiclePhoto(p.id)));
        await updateVehicle(input.vehicleId, { primaryPhotoUrl: null, imageUrl: null });
        return { deleted: photos.length } as const;
      }),

    setPrimaryPhoto: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          photoUrl: z.string().min(1), // no max — supports base64 data URLs
        }),
      )
      .mutation(async ({ input }) => {
        await setVehiclePrimaryPhoto(input.vehicleId, input.photoUrl);
        await updateVehicle(input.vehicleId, {
          primaryPhotoUrl: input.photoUrl,
          imageUrl: input.photoUrl,
        });
        return { success: true } as const;
      }),

    /** Drag-to-reorder: update photo positions. orderedPhotoIds[0] becomes hero (position 0). */
    reorderPhotos: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          orderedPhotoIds: z.array(z.number().int()).min(1),
        }),
      )
      .mutation(async ({ input }) => {
        await reorderVehiclePhotos(input.orderedPhotoIds);
        // Sync primary photo URL to position 0
        const photos = await listVehiclePhotos(input.vehicleId);
        const hero = photos.find((p) => p.id === input.orderedPhotoIds[0]);
        if (hero) {
          await setVehiclePrimaryPhoto(input.vehicleId, hero.url);
          await updateVehicle(input.vehicleId, {
            primaryPhotoUrl: hero.url,
            imageUrl: hero.url,
          });
        }
        return { success: true } as const;
      }),

    /** Link an already-uploaded URL to a vehicle gallery (no re-upload). */
    attachPhotoFromUrl: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          url: z.string().min(1), // no max — supports base64 data URLs
          caption: z.string().max(200).optional(),
          setPrimary: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const existing = await listVehiclePhotos(input.vehicleId);
        const nextPosition = existing.length
          ? Math.max(...existing.map((p) => p.position)) + 1
          : 0;
        const photo = await addVehiclePhoto({
          vehicleId: input.vehicleId,
          url: input.url,
          storageKey: `linked/${input.vehicleId}/${Date.now()}`,
          position: nextPosition,
          caption: input.caption ?? null,
        });
        if (input.setPrimary || existing.length === 0) {
          await setVehiclePrimaryPhoto(input.vehicleId, input.url);
          await updateVehicle(input.vehicleId, {
            primaryPhotoUrl: input.url,
            imageUrl: input.url,
          });
        }
        return { id: photo.id, url: input.url } as const;
      }),
  }),

  prospects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
      }
      return listProspects(200);
    }),

    scout: protectedProcedure
      .input(
        z.object({
          region: z.string().min(1).max(128),
          city: z.string().max(128).optional(),
          targetVolume: z.string().max(64).optional(),
          brandFocus: z.string().max(255).optional(),
          count: z.number().int().min(1).max(10).default(5),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
        }
        // Fetch names already in the DB so we can deduplicate both paths
        const existingRows = await listProspects(1000);
        const existingNames = existingRows.map((r) => r.dealershipName);

        const system = `You are GrayArx Prospector, an AI scout for a South African dealership SaaS. Generate ${input.count} REALISTIC potential dealership prospects in ${input.city ? input.city + ", " : ""}${input.region}, South Africa. Use plausible but FICTIONAL dealership names (do not impersonate real businesses). For each, provide: dealershipName, region, city, phone (SA format starting with 0), email (use info@dealership-slug.co.za style), website, estimatedMonthlyVolume (10-200), brandsCarried (comma list of 2-4 brands), score (0-100 based on fit), rationale (1 sentence why they're a good fit for GrayArx AI agents). Return JSON only.`;
        const userMsg = `Region: ${input.region}\nCity: ${input.city ?? "any"}\nTarget monthly volume: ${input.targetVolume ?? "any"}\nBrand focus: ${input.brandFocus ?? "any"}\nGenerate ${input.count} prospects.`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: system },
              { role: "user", content: userMsg },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "prospects",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    prospects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          dealershipName: { type: "string" },
                          region: { type: "string" },
                          city: { type: "string" },
                          phone: { type: "string" },
                          email: { type: "string" },
                          website: { type: "string" },
                          estimatedMonthlyVolume: { type: "integer" },
                          brandsCarried: { type: "string" },
                          score: { type: "integer" },
                          rationale: { type: "string" },
                        },
                        required: [
                          "dealershipName",
                          "region",
                          "city",
                          "phone",
                          "email",
                          "website",
                          "estimatedMonthlyVolume",
                          "brandsCarried",
                          "score",
                          "rationale",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["prospects"],
                  additionalProperties: false,
                },
              },
            },
          });
          const raw = response.choices?.[0]?.message?.content ?? "{\"prospects\":[]}";
          const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
          const allItems = (parsed.prospects ?? []) as Array<{
            dealershipName: string;
            region: string;
            city: string;
            phone: string;
            email: string;
            website: string;
            estimatedMonthlyVolume: number;
            brandsCarried: string;
            score: number;
            rationale: string;
          }>;
          // Deduplicate against existing DB records
          const existingSet = new Set(existingNames.map((n) => n.toLowerCase().trim()));
          const items = allItems.filter(
            (p) => !existingSet.has(p.dealershipName.toLowerCase().trim()),
          );
          if (items.length === 0) return { created: 0, poolRemaining: null } as const;
          await logAgentActivity({
            agentId: "prospector",
            action: "scouted_batch",
            subjectType: "prospect",
            summary: `Sipho scouted ${items.length} dealership${items.length === 1 ? "" : "s"} in ${input.region}${input.city ? ", " + input.city : ""}.`,
            payload: { region: input.region, city: input.city, names: items.map((p) => p.dealershipName) },
          });
          await createProspects(
            items.map((p) => ({
              dealershipName: p.dealershipName,
              region: p.region,
              city: p.city,
              phone: p.phone,
              email: p.email,
              website: p.website,
              estimatedMonthlyVolume: p.estimatedMonthlyVolume,
              brandsCarried: p.brandsCarried,
              score: Math.max(0, Math.min(100, p.score)),
              rationale: p.rationale,
              status: "scouted" as const,
              sourceNotes: `AI Prospector — ${input.region}${input.city ? ", " + input.city : ""}`,
            })),
          );
          return { created: items.length, poolRemaining: null } as const;
        } catch (err) {
          console.error("[Prospector] LLM unavailable — using rotating SA prospect pool", err);
          const region = input.region || "Gauteng";
          const sourceNotes = `Pool fallback — ${region}${input.city ? ", " + input.city : ""}`;

          const { batch, poolRemaining } = pickNextProspects(existingNames, 8);

          if (batch.length === 0) {
            return {
              created: 0,
              poolRemaining: 0,
              message: "All prospects in pool have been added — expand the pool or try again next month",
            } as const;
          }

          const fallbackProspects: Parameters<typeof createProspects>[0] = batch.map((p) => ({
            dealershipName: p.name,
            region: p.province,
            city: p.city,
            phone: p.phone,
            email: p.email,
            website: p.website ?? "",
            estimatedMonthlyVolume: p.estimatedMonthlyVolume,
            brandsCarried: p.brands.join(", "),
            score: p.segment === "luxury" || p.segment === "exotic" ? 88 : p.segment === "volume" ? 82 : 72,
            rationale: `${p.segment.charAt(0).toUpperCase() + p.segment.slice(1)} dealership in ${p.city} (${p.province}) — GrayArx agents would accelerate their lead capture and conversion pipeline.`,
            status: "scouted" as const,
            sourceNotes,
          }));

          await logAgentActivity({
            agentId: "prospector",
            action: "scouted_batch",
            subjectType: "prospect",
            summary: `Sipho scouted ${fallbackProspects.length} dealerships in ${region}${input.city ? ", " + input.city : ""} (pool fallback, ${poolRemaining} remaining).`,
            payload: { region, city: input.city, fallback: true, poolRemaining, names: fallbackProspects.map((p) => p.dealershipName) },
          });
          await createProspects(fallbackProspects);
          return { created: fallbackProspects.length, fallback: true, poolRemaining } as const;
        }
      }),

    handoff: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
        }
        const prospect = await getProspect(input.id);
        if (!prospect) return { success: false, error: "Prospect not found" } as const;

        // Sipho → Themba: attempt outbound sales call (playbook script). Falls back to queue.
        await updateProspectStatus(prospect.id, "queued_for_call");
        await logAgentActivity({
          agentId: "prospector",
          action: "handoff",
          subjectType: "prospect",
          subjectId: prospect.id,
          summary: `Sipho handed ${prospect.dealershipName} (score ${prospect.score}) to Themba for a GrayArx sales call.`,
          payload: { rationale: prospect.rationale, phone: prospect.phone },
        });

        const {
          buildThembaSalesFollowUpText,
          buildThembaSalesSayScript,
        } = await import("./_core/salesCallScript");
        const prospectCtx = {
          dealershipName: prospect.dealershipName,
          city: prospect.city,
          region: prospect.region,
          rationale: prospect.rationale,
          score: prospect.score,
        };
        const followUpText = buildThembaSalesFollowUpText(prospectCtx);
        const callScript = buildThembaSalesSayScript(prospectCtx);

        if (!prospect.phone) {
          await createCallAttempt({
            prospectId: prospect.id,
            toNumber: "unknown",
            status: "skipped",
            errorMessage: "No phone on prospect",
            notes: followUpText,
          });
          await logAgentActivity({
            agentId: "calling",
            action: "call_skipped",
            subjectType: "prospect",
            subjectId: prospect.id,
            summary: `Themba could not dial ${prospect.dealershipName} — no phone on file. Use the WhatsApp/email follow-up.`,
            payload: { followUpText },
          });
          return {
            success: true,
            queued: true,
            called: false,
            followUpText,
            callScript,
            reason: "No phone number on the prospect — queued with playbook follow-up text.",
          } as const;
        }

        const callResult = await placeOutboundCall({
          toNumber: prospect.phone,
          prospect: prospectCtx,
        });

        if (callResult.ok) {
          await updateProspectStatus(prospect.id, "called");
          await createCallAttempt({
            prospectId: prospect.id,
            toNumber: prospect.phone,
            fromNumber: process.env.TWILIO_FROM_NUMBER ?? null,
            providerCallSid: callResult.sid,
            status: "initiated",
            notes: followUpText,
          });
          await logAgentActivity({
            agentId: "calling",
            action: "outbound_call",
            subjectType: "prospect",
            subjectId: prospect.id,
            summary: `Themba dialled ${prospect.dealershipName} with the GrayArx sales pitch (SID ${callResult.sid}).`,
            payload: {
              sid: callResult.sid,
              status: callResult.status,
              phone: prospect.phone,
              followUpText,
            },
          });
          return {
            success: true,
            queued: false,
            called: true,
            sid: callResult.sid,
            followUpText,
            callScript,
            reason: "Themba placed the outbound sales call.",
          } as const;
        }

        const skipReason =
          "skipped" in callResult && callResult.skipped
            ? callResult.reason
            : "error" in callResult
              ? callResult.error
              : "Call not placed";

        await createCallAttempt({
          prospectId: prospect.id,
          toNumber: prospect.phone,
          status: "skipped",
          errorMessage: skipReason,
          notes: followUpText,
        });
        await logAgentActivity({
          agentId: "calling",
          action: "call_queued",
          subjectType: "prospect",
          subjectId: prospect.id,
          summary: `Themba queued ${prospect.dealershipName} — ${skipReason}`,
          payload: { phone: prospect.phone, followUpText, callScript, skipReason },
        });

        return {
          success: true,
          queued: true,
          called: false,
          followUpText,
          callScript,
          reason: skipReason,
        } as const;
      }),

    callHistory: protectedProcedure
      .input(z.object({ prospectId: z.number().int().optional() }).optional())
      .query(async ({ input }) => listCallAttempts(input?.prospectId, 50)),

    // ===== Schedule management =====
    listSchedules: protectedProcedure.query(async () => {
      try {
        const result = await listHeartbeatJobs("");
        const jobs = result.jobs.filter((j) => j.name.startsWith("prospector-"));
        return { jobs };
      } catch (err) {
        return { jobs: [], error: String(err) };
      }
    }),

    enableNightlySchedule: protectedProcedure.mutation(async () => {
      try {
        const result = await createHeartbeatJob(
          {
            name: "prospector-nightly",
            cron: "0 0 3 * * *", // every day at 03:00 UTC (05:00 SAST)
            path: "/api/scheduled/prospect-nightly",
            method: "POST",
            description: "GrayArx Prospector — rotates SA provinces nightly, adds 5 fresh prospects.",
          },
          "",
        );
        return { success: true, taskUid: result.taskUid } as const;
      } catch (err) {
        const msg = String(err);
        if (msg.toLowerCase().includes("conflict") || msg.includes("409")) {
          return { success: true, alreadyExists: true } as const;
        }
        return { success: false, error: msg } as const;
      }
    }),

    enableMarketGuideSchedule: protectedProcedure.mutation(async () => {
      try {
        const result = await createHeartbeatJob(
          {
            name: "market-guide-weekly",
            cron: "0 0 4 * * 1", // Mondays 04:00 UTC (06:00 SAST)
            path: "/api/scheduled/market-guide-weekly",
            method: "POST",
            description: "GrayArx — weekly live SA market guide refresh for Tumi valuations.",
          },
          "",
        );
        return { success: true, taskUid: result.taskUid } as const;
      } catch (err) {
        const msg = String(err);
        if (msg.toLowerCase().includes("conflict") || msg.includes("409")) {
          return { success: true, alreadyExists: true } as const;
        }
        return { success: false, error: msg } as const;
      }
    }),

    setScheduleEnabled: protectedProcedure
      .input(z.object({ taskUid: z.string().min(1), enable: z.boolean() }))
      .mutation(async ({ input }) => {
        try {
          await updateHeartbeatJob(input.taskUid, { enable: input.enable }, "");
          return { success: true } as const;
        } catch (err) {
          return { success: false, error: String(err) } as const;
        }
      }),

    deleteSchedule: protectedProcedure
      .input(z.object({ taskUid: z.string().min(1) }))
      .mutation(async ({ input }) => {
        try {
          await deleteHeartbeatJob(input.taskUid, "");
          return { success: true } as const;
        } catch (err) {
          return { success: false, error: String(err) } as const;
        }
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum([
            "new",
            "scouted",
            "queued_for_call",
            "called",
            "contacted",
            "converted",
            "rejected",
          ]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
        }
        await updateProspectStatus(input.id, input.status);
        return { success: true } as const;
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
        }
        await deleteProspect(input.id);
        return { success: true } as const;
      }),
  }),

  agent: router({
    /**
     * Returns the roster for the current viewer:
     * - Dealers → customer-ops agents only (Nala, Mia, Lerato, Naledi, Tumi, Bongi)
     * - Founders/admins → full pilot roster + GrayArx primary inbox
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      // Agent roster is founder/admin ops only — dealers see outcomes (leads/bookings), not personas.
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Agent roster is GrayArx founder ops only. Dealership AI runs in the background.",
        });
      }
      const roster = agentsForAudience("founder");
      const stats = await getAgentStats();
      const empty = { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null };
      const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
      return {
        audience: "founder" as const,
        primaryInbox: PRIMARY_INBOX,
        agents: roster.map((persona) => {
          const s = stats[persona.id] ?? empty;
          const lastMs = s.lastActionAt ? new Date(s.lastActionAt).getTime() : 0;
          const recentlyActive =
            s.actionCount > 0 && lastMs > Date.now() - ACTIVE_WINDOW_MS;
          return {
            ...persona,
            stats: s,
            status: recentlyActive ? "active" : "idle",
          };
        }),
      };
    }),

    /**
     * Unified live activity feed. Founder/admin ops only.
     */
    feed: protectedProcedure
      .input(
        z
          .object({
            agentId: z.enum(["email", "calling", "booking", "prospector", "improvement", "whatsapp", "accountant", "fallback", "preapproval", "tradein"]).optional(),
            limit: z.number().int().min(1).max(500).optional(),
          })
          .optional(),
      )
      .query(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Agent activity is GrayArx founder ops only.",
          });
        }
        const rows = await listAgentActivity({
          agentId: input?.agentId,
          limit: input?.limit ?? 100,
        });
        return rows.map((r) => ({
          id: r.id,
          agentId: r.agentId,
          action: r.action,
          subjectType: r.subjectType,
          subjectId: r.subjectId,
          summary: r.summary,
          createdAt: r.createdAt,
          agentName: AGENTS[r.agentId as keyof typeof AGENTS]?.displayName ?? r.agentId,
          agentRole: AGENTS[r.agentId as keyof typeof AGENTS]?.role ?? r.agentId,
          agentEmail: AGENTS[r.agentId as keyof typeof AGENTS]?.email ?? null,
        }));
      }),

    /** Fire a test ping so founders can verify an agent is wired up. */
    ping: protectedProcedure
      .input(
        z.object({
          agentId: z.enum([
            "email",
            "calling",
            "booking",
            "prospector",
            "improvement",
            "whatsapp",
            "accountant",
            "fallback",
            "preapproval",
            "tradein",
          ]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Agent ping is GrayArx founder ops only.",
          });
        }
        const persona = AGENTS[input.agentId];
        const who = ctx.user.name || ctx.user.email || "Founder";
        const summary = `${persona.displayName} responded to a test ping from ${who}. Agent is online and logging activity.`;
        await logAgentActivity({
          agentId: input.agentId,
          action: "test_ping",
          subjectType: "user",
          subjectId: ctx.user.id,
          summary,
          payload: { triggeredBy: who },
        });
        return {
          ok: true as const,
          message: summary,
          agentEmail: persona.email,
        };
      }),
  }),

  // Owner-only admin views.
  // ---- Kagiso, the Improvement Agent ----
  improvement: router({
    list: protectedProcedure
      .input(
        z
          .object({
            status: z.enum(["open", "pending_approval", "applied", "dismissed"]).optional(),
            limit: z.number().int().min(1).max(200).optional(),
          })
          .optional(),
      )
      .query(async ({ input }) =>
        listImprovementActions({ status: input?.status, limit: input?.limit }),
      ),

    runAudit: protectedProcedure.mutation(async () => {
      // Gather inputs for the auditor (platform-wide founder audit)
      const kpis = await getDashboardStats({ includeProspects: true });
      const agentStats = await getAgentStats();
      const recentActivity = await listAgentActivity({ limit: 200 });

      const recentSelfCheckScores = recentActivity
        .filter((a) => a.agentId === "email" && a.action === "draft_ready" && a.payload)
        .slice(0, 30)
        .map((a) => {
          try {
            const p = JSON.parse(a.payload as string) as {
              score?: number;
              attempts?: number;
              language?: string;
            };
            return {
              language: p.language ?? "en",
              score: Number(p.score ?? 0),
              attempts: Number(p.attempts ?? 1),
            };
          } catch {
            return null;
          }
        })
        .filter((x): x is { language: string; score: number; attempts: number } => x !== null);

      const recentCalls = await listCallAttempts(undefined, 50);
      const recentLeads = await listLeads(100);
      const allVehicles = await listVehicles(500);
      const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
      const staleVehicleCount = allVehicles.filter(
        (v) =>
          v.status === "available" &&
          v.createdAt instanceof Date &&
          v.createdAt.getTime() < sixtyDaysAgo,
      ).length;

      const auditInput: AuditInput = {
        kpis: {
          totalLeads: Number(kpis.totalLeads),
          newLeads: Number(kpis.newLeads),
          qualifiedLeads: Number(kpis.qualifiedLeads),
          convertedLeads: Number(kpis.convertedLeads),
          totalBookings: Number(kpis.totalBookings),
          pendingBookings: Number(kpis.pendingBookings),
          confirmedBookings: Number(kpis.confirmedBookings),
          totalVehicles: Number(kpis.totalVehicles),
          availableVehicles: Number(kpis.availableVehicles),
          leadsLast7Days: Number(kpis.leadsLast7Days),
          bookingsLast7Days: Number(kpis.bookingsLast7Days),
          totalProspects: Number(kpis.totalProspects),
          queuedProspects: Number(kpis.queuedProspects),
        },
        agents: Object.fromEntries(
          Object.entries(agentStats).map(([k, v]) => [
            k,
            {
              actionCount: v.actionCount,
              lastActionAt: v.lastActionAt ? v.lastActionAt.getTime() : null,
            },
          ]),
        ),
        recentSelfCheckScores,
        recentCalls: recentCalls.map((c) => ({
          status: c.status,
          durationSeconds: c.durationSeconds,
        })),
        recentLeadLanguages: recentLeads.map((l) => l.language ?? "en"),
        staleVehicleCount,
      };

      const findings = runAudit(auditInput);
      const created: Array<{ id: number; title: string; severity: string }> = [];
      
      // Persist all findings to the database
      for (const f of findings) {
        const row = await createImprovementAction(f);
        if (row) {
          created.push({ id: row.id, title: row.title, severity: row.severity });
        }
      }

      // Log the audit completion
      await logAgentActivity({
        agentId: "improvement",
        action: "audit_run",
        subjectType: null,
        summary: `Kagiso completed an audit and recorded ${created.length} improvement action${created.length === 1 ? "" : "s"}.`,
        payload: { count: created.length, severities: created.map((c) => c.severity) },
      });

      return { created, total: findings.length } as const;
    }),

    /**
     * Step 1 of ask-first apply: Kagiso PROPOSES the change.
     * Returns the exact before/after diff but does NOT mutate.
     * The dealer reviews this diff, then calls `confirmApply` with
     * `acknowledged: true` to actually flip the lever.
     */
    proposeApply: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const action = await getImprovementAction(input.id);
        if (!action) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Improvement action not found" });
        }
        if (action.autoApplicable !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This action is flagged for human review and cannot be auto-applied.",
          });
        }
        const before = await getKagisoSettings();
        const patch = applyFindingToSettings(action, before);
        const after = { ...before, ...patch };
        const changedKeys = Object.keys(patch);
        return {
          action,
          before,
          patch,
          after,
          changedKeys,
          requiresAcknowledgement: changedKeys.length > 0,
        };
      }),

    /**
     * Step 2 of ask-first apply: dealer has read the proposed diff and
     * explicitly approves by sending `acknowledged: true`. Only at this
     * point does Kagiso mutate persisted settings.
     */
    confirmApply: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          acknowledged: z.literal(true),
        }),
      )
      .mutation(async ({ input }) => {
        const action = await getImprovementAction(input.id);
        if (!action) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Improvement action not found" });
        }
        if (action.autoApplicable !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This action is flagged for human review and cannot be auto-applied.",
          });
        }
        if (action.status === "applied") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This action has already been applied.",
          });
        }
        const before = await getKagisoSettings();
        const patch = applyFindingToSettings(action, before);
        let after = before;
        if (Object.keys(patch).length > 0) {
          after = await patchKagisoSettings(patch);
        }
        await updateImprovementActionStatus(input.id, "applied");
        await logAgentActivity({
          agentId: "improvement",
          action: "action_applied",
          subjectType: "improvement_action",
          subjectId: input.id,
          summary: `Kagiso applied (with dealer approval): ${action.title}.`,
          payload: { patch, before, after, acknowledged: true },
        });
        return { success: true, patch, before, after } as const;
      }),

    /**
     * Back-compat alias: old client code calling `applyAction` now hits
     * the ask-first proposal path. It will NEVER mutate — the client must
     * call `confirmApply` after showing the diff to the dealer.
     * Kept as a `query` so existing callers don't accidentally mutate.
     */
    applyAction: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async () => {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Kagiso now asks first. Call `proposeApply` to preview the diff, then `confirmApply` with acknowledged:true.",
        });
      }),

    dismiss: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const action = await getImprovementAction(input.id);
        if (!action) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Improvement action not found" });
        }
        await updateImprovementActionStatus(input.id, "dismissed");
        await logAgentActivity({
          agentId: "improvement",
          action: "action_dismissed",
          subjectType: "improvement_action",
          subjectId: input.id,
          summary: `Kagiso dismissed: ${action.title}.`,
        });
                return { success: true } as const;
      }),
  }),
  // ---- Nala, the WhatsApp Agent ---- (moved to whatsappRouter)
  nalaWhatsapp: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).optional() }).optional())
      .query(async ({ input }) => listWhatsappDrafts({ limit: input?.limit })),

    draftReply: protectedProcedure
      .input(
        z.object({
          inboundMessage: z.string().min(1).max(2000),
          language: z.enum(["en", "af", "zu", "xh", "st", "tn", "ve"]).default("en"),
          leadId: z.number().int().optional(),
          prospectId: z.number().int().optional(),
          context: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await generateWhatsAppReply({
          language: input.language as LanguageCode,
          customerMessage: input.inboundMessage,
          context: input.context,
        });
        // Always prepend a short AI disclosure so the customer sees it's AI.
        const replyWithDisclosure = addWhatsAppAIDisclosure(
          result.reply,
          input.language as LanguageCode,
        );
        const row = await createWhatsappDraft({
          leadId: input.leadId ?? null,
          prospectId: input.prospectId ?? null,
          inboundMessage: input.inboundMessage,
          language: input.language,
          draftText: replyWithDisclosure,
          score: result.score.toFixed(2),
          attempts: result.attempts,
          issues: result.issues.length > 0 ? JSON.stringify(result.issues) : null,
        });
        await logAgentActivity({
          agentId: "whatsapp",
          action: "draft_ready",
          subjectType: input.leadId ? "lead" : input.prospectId ? "prospect" : null,
          subjectId: input.leadId ?? input.prospectId ?? null,
          summary: `Nala drafted a ${LANGUAGE_RULES[input.language as LanguageCode].name} WhatsApp reply (quality ${result.score}/100, ${result.attempts} attempt${result.attempts === 1 ? "" : "s"}).`,
          payload: {
            language: input.language,
            score: result.score,
            attempts: result.attempts,
            issues: result.issues,
            reply: result.reply,
          },
        });
        return {
          id: row?.id,
          reply: replyWithDisclosure,
          score: result.score,
          attempts: result.attempts,
          issues: result.issues,
        };
      }),

    setStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["draft", "approved", "sent", "dismissed"]),
        }),
      )
      .mutation(async ({ input }) => {
        await updateWhatsappDraftStatus(input.id, input.status);
        return { success: true } as const;
      }),
  }),

  // ---- CSV inventory importer (DMS / dealer stock export) ----
  inventoryImport: router({
    preview: protectedProcedure
      .input(z.object({ csv: z.string().min(1).max(2_000_000) }))
      .mutation(async ({ input, ctx }) => {
        assertDealerOrAdmin(ctx.user);
        const ip = callerIp(ctx.req);
        const rl = checkRateLimit(
          `inventoryImport.preview:${ip}`,
          RATE_LIMITS.INVENTORY_CSV.max,
          RATE_LIMITS.INVENTORY_CSV.windowMs,
        );
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many CSV imports. Please try again later.",
          });
        }
        return parseInventoryCsv(input.csv);
      }),

    commit: protectedProcedure
      .input(
        z.object({
          csv: z.string().min(1).max(2_000_000),
          /** Keep external image URLs as-is — much faster for bulk imports. */
          skipPhotoMirror: z.boolean().optional(),
          /** Mark stock-ref vehicles missing from this CSV as sold. */
          markMissingAsSold: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        assertDealerOrAdmin(ctx.user);
        const ip = callerIp(ctx.req);
        const rl = checkRateLimit(
          `inventoryImport.commit:${ip}`,
          RATE_LIMITS.INVENTORY_CSV.max,
          RATE_LIMITS.INVENTORY_CSV.windowMs,
        );
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many CSV imports. Please try again later.",
          });
        }
        // Founders/admins have no dealershipId — fall back to 1 (primary seed dealer).
        const importDealershipId = ctx.user.dealershipId ?? 1;
        return commitInventoryCsv({
          csv: input.csv,
          dealershipId: importDealershipId,
          ownerUserId: ctx.user.id,
          skipPhotoMirror: input.skipPhotoMirror,
          markMissingAsSold: input.markMissingAsSold,
        });
      }),

    /** Fix vehicles stuck at R1 by re-matching rows from the original CSV. */
    repairPrices: protectedProcedure
      .input(z.object({ csv: z.string().min(1).max(2_000_000) }))
      .mutation(async ({ input, ctx }) => {
        assertDealerOrAdmin(ctx.user);
        const preview = parseInventoryCsv(input.csv);
        const { updated, notFound, alreadyCorrect } = await repairPricesFromRows(
          preview.validRows,
        );

        await logAgentActivity({
          agentId: "improvement",
          action: "prices_repaired",
          subjectType: null,
          summary: `Repaired ${updated} vehicle price${updated === 1 ? "" : "s"} from CSV (${notFound} not found, ${alreadyCorrect} already correct).`,
          payload: { updated, notFound, alreadyCorrect },
        });

        return { updated, notFound, alreadyCorrect, csvRows: preview.validRows.length };
      }),

    suspiciousPriceCount: protectedProcedure.query(async () => {
      const count = await countSuspiciousPriceVehicles(1);
      return { count };
    }),

    suspiciousVehicles: protectedProcedure.query(async () => {
      const vehicles = await listSuspiciousPriceVehicles(1, 100);
      return { vehicles, count: vehicles.length };
    }),

    /** Inventory photography health — for dealer dashboard & photo manager. */
    photoHealth: protectedProcedure.query(async () => {
      const all = await listVehicles(500);
      let withoutPhoto = 0;
      let externalOnly = 0;
      let belowRecommended = 0;
      let totalPhotoCount = 0;

      for (const v of all) {
        const gallery = await listVehiclePhotos(v.id);
        const count =
          gallery.length > 0
            ? gallery.length
            : v.primaryPhotoUrl || v.imageUrl
              ? 1
              : 0;
        totalPhotoCount += count;
        if (count === 0) withoutPhoto++;
        else if (count < 8) belowRecommended++;
        const primary = v.primaryPhotoUrl || v.imageUrl;
        if (shouldMirrorPhoto(primary)) externalOnly++;
      }

      const total = all.length;
      return {
        totalVehicles: total,
        withoutPhoto,
        externalOnly,
        belowRecommended,
        avgPhotosPerVehicle: total > 0 ? Math.round((totalPhotoCount / total) * 10) / 10 : 0,
        showroomReady: total > 0 && withoutPhoto === 0 && externalOnly === 0 && belowRecommended === 0,
      };
    }),

    /** Copy external listing photos into GrayArx storage so links never break. */
    mirrorMissingPhotos: protectedProcedure.mutation(async () => {
      const all = await listVehicles(500);
      let mirrored = 0;
      let skipped = 0;
      let failed = 0;

      for (const v of all) {
        const primary = v.primaryPhotoUrl || v.imageUrl;
        if (!shouldMirrorPhoto(primary)) {
          skipped++;
          continue;
        }
        const stored = await mirrorExternalPhoto(primary, v.title, v.externalRef);
        if (!stored) {
          failed++;
          continue;
        }
        await updateVehicle(v.id, {
          imageUrl: stored,
          primaryPhotoUrl: stored,
        });
        const gallery = await listVehiclePhotos(v.id);
        if (gallery.length === 0) {
          await addVehiclePhoto({
            vehicleId: v.id,
            url: stored,
            storageKey: `mirror/${v.id}/${Date.now()}`,
            position: 0,
            caption: "front_3_4",
          });
        }
        mirrored++;
      }

      await logAgentActivity({
        agentId: "improvement",
        action: "photos_mirrored",
        subjectType: null,
        summary: `Mirrored ${mirrored} external photo${mirrored === 1 ? "" : "s"} into GrayArx storage (${failed} failed, ${skipped} already hosted).`,
        payload: { mirrored, failed, skipped },
      });

      return { mirrored, skipped, failed };
    }),

    sendEmail: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
        }
        const prospect = await getProspect(input.id);
        if (!prospect) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Prospect not found" });
        }

        // Generate a branded email with the prospect details
        const dealerName = ctx.user.name || "GrayArx";
        const subject = `Opportunity from ${dealerName}`;
        const emailBody = `Hi ${prospect.dealershipName},\n\nWe've identified your dealership as a potential partner for our premium automotive network.\n\nAbout you: ${prospect.dealershipName} in ${prospect.region}\n${prospect.brandsCarried ? `Brands: ${prospect.brandsCarried}\n` : ""}\nWe'd love to explore how we can work together. Would you be open to a brief conversation?\n\nBest regards,\nThe GrayArx Team`;
        const htmlBody = buildHtmlEmail({
          agentId: "prospector",
          bodyPlainText: emailBody,
          language: "en",
          subject,
        });

        // Send the email via Resend or similar service
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY || ""}`
            },
            body: JSON.stringify({
              from: "prospector@grayarx.com",
              to: prospect.email || prospect.phone,
              subject,
              html: htmlBody,
              text: emailBody,
            }),
          });

          if (!response.ok) {
            throw new Error(`Email service returned ${response.status}`);
          }

          // Log the activity
          await logAgentActivity({
            agentId: "prospector",
            action: "email_sent",
            subjectType: "prospect",
            subjectId: prospect.id,
            summary: `Prospector sent outreach email to ${prospect.dealershipName}`,
            payload: { email: prospect.email, phone: prospect.phone },
          });

          return { success: true, message: "Email sent successfully" };
        } catch (err) {
          console.error("[sendEmail] Failed:", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send email — please try again",
          });
        }
      }),
  }),

  // Peer network — photos only, no contact or pricing info.
  network: router({
    photos: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(120).optional() }).optional())
      .query(async ({ input }) => listDealerNetworkPhotos(input?.limit ?? 60)),
  }),

  // ---- Public onboarding form (no auth) ----
  publicOnboarding: router({
    submit: publicProcedure
      .input(
        z.object({
          dealershipName: z.string().min(2).max(120),
          ownerName: z.string().min(2).max(120),
          ownerEmail: z.string().email(),
          ownerPhone: z.string().min(6).max(40),
          region: z.string().min(2).max(60),
          monthlyVolume: z.string().optional(),
          primaryLanguage: z.string().min(2).max(8),
          brandsCarried: z.string().optional(),
          csvUrl: z.string().optional(),
          notes: z.string().optional(),
          /** Optional Meta WhatsApp Business phone_number_id (from Meta API Setup). */
          whatsappPhoneNumberId: z
            .string()
            .max(64)
            .regex(/^\d*$/, "Meta Phone Number ID must be digits only")
            .optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const reference = `GRX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const monthlyVolume = input.monthlyVolume ? parseInt(input.monthlyVolume, 10) : null;
        if (monthlyVolume !== null && (!Number.isFinite(monthlyVolume) || monthlyVolume < 0)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Monthly vehicle sales must be zero or higher.",
          });
        }
        const languages = input.primaryLanguage ? [input.primaryLanguage] : null;
        const vehicleTypes = input.brandsCarried
          ? input.brandsCarried.split(",").map((b) => b.trim()).filter(Boolean)
          : null;
        const waId = input.whatsappPhoneNumberId?.trim() || null;
        await createOnboardingSubmission({
          dealershipName: input.dealershipName,
          ownerName: input.ownerName,
          ownerEmail: input.ownerEmail,
          ownerPhone: input.ownerPhone,
          region: input.region,
          monthlyVolume: Number.isFinite(monthlyVolume) ? monthlyVolume : null,
          languages,
          vehicleTypes,
          csvUrl: input.csvUrl ?? null,
          notes: input.notes ? `${input.notes}\n[ref: ${reference}]` : `[ref: ${reference}]`,
          whatsappPhoneNumberId: waId,
        });
        try {
          await alertFounder({
            title: `New onboarding application — ${input.dealershipName}`,
            content: `Reference: ${reference}\nOwner: ${input.ownerName} <${input.ownerEmail}>\nPhone: ${input.ownerPhone}\nRegion: ${input.region}\nLanguage: ${input.primaryLanguage}`,
            category: "onboarding",
            actionUrl: "https://www.grayarx.com/admin/onboarding",
          });
          const { sendOnboardingWelcomeEmail } = await import("./_core/onboardingEmails");
          sendOnboardingWelcomeEmail({
            to: input.ownerEmail,
            ownerName: input.ownerName,
            dealershipName: input.dealershipName,
            reference,
          }).catch((e) => console.warn("[publicOnboarding] welcome email failed", e));
        } catch (e) {
          console.warn("[publicOnboarding] notify failed", e);
        }
        return { reference };
      }),
  }),

  // ---- Founder admin overview KPIs ----
  admin: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin access only" });
      }
      return getAdminOverview();
    }),
    listDealerships: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin access only" });
      }
      return listAllDealerships();
    }),
    marketGuideStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin access only" });
      }
      const meta = await getMarketGuideRefreshMeta();
      const live = await listMarketGuideLive();
      const { getLiveGuideCacheStats } = await import("./_core/marketGuideCache");
      return {
        meta: meta
          ? {
              lastRunAt: meta.lastRunAt,
              lastGuideKey: meta.lastGuideKey,
              modelsRefreshed: meta.modelsRefreshed,
            }
          : null,
        liveEntries: live.length,
        cache: getLiveGuideCacheStats(),
        recent: live.slice(0, 20).map((r) => ({
          guideKey: r.guideKey,
          year: r.year,
          tradeInValueZar: r.tradeInValueZar,
          confidence: r.confidence,
          source: r.source,
          updatedAt: r.updatedAt,
        })),
      };
    }),
    triggerMarketGuideRefresh: protectedProcedure.mutation(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder/admin access only" });
      }
      const { triggerMarketGuideRefreshIfDue } = await import("./_core/marketGuideRefresh");
      return triggerMarketGuideRefreshIfDue(true);
    }),
  }),

  // ---- Admin: onboarding submissions ----
  adminOnboarding: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listOnboardingSubmissions();
    }),
    decide: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          decision: z.enum(["approved", "rejected", "reviewing"]),
          /** Optional multi-branch group key (same slug on each branch). */
          groupKey: z.string().max(64).nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (input.decision === "approved") {
          const result = await provisionOnboardingSubmission(input.id, ctx.user.id as any, {
            groupKey: input.groupKey,
          });
          return { ok: true, dealershipId: result.dealershipId, created: result.created };
        }
        await updateOnboardingStatus(input.id, input.decision, ctx.user.id as any);
        return { ok: true };
      }),
    /** Remove rejected / new test junk from the queue (not provisioned dealerships). */
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const result = await deleteOnboardingSubmission(input.id);
        if (!result.deleted) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.reason ?? "Could not delete submission",
          });
        }
        return { ok: true };
      }),
  }),

  // ---- Admin: approval queue ----
  adminApprovals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listPendingApprovals();
    }),
    decide: protectedProcedure
      .input(
        z.object({
          approvalId: z.number().int(),
          decision: z.enum(["approved", "rejected"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await decideApproval(input.approvalId, input.decision, ctx.user.id as any);
        return { ok: true };
      }),
  }),

  // ---- Admin: fallback inbox ----
  adminFallback: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listFallbackMessages();
    }),
    resolve: protectedProcedure
      .input(z.object({ messageId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await resolveFallbackMessage(input.messageId);
        return { ok: true };
      }),

    /** Permanently remove one inbox row (test/junk cleanup). */
    delete: protectedProcedure
      .input(z.object({ messageId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteFallbackMessage(input.messageId);
        return { ok: true };
      }),

    /** Clear all resolved fallback rows from the inbox. */
    clearResolved: protectedProcedure.mutation(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const removed = await deleteResolvedFallbackMessages();
      return { ok: true, removed };
    }),

    /**
     * Founder-triggered fallback. Drafts the reply, persists the message
     * with a reference number, and logs the activity for Bongi.
     */
    trigger: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          channel: z.enum(["email", "whatsapp", "call", "web_chat"]),
          customerName: z.string().max(120).optional(),
          customerContact: z.string().max(160).optional(),
          inboundMessage: z.string().max(4000).optional(),
          language: z.string().max(8).optional(),
          force: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const afterHours = isAfterHoursSAST();
        if (!afterHours && !input.force) {
          return {
            ok: false,
            reason: "Inside business hours — a human should respond. Pass force=true to override.",
          } as const;
        }
        const dealerships = await listAllDealerships();
        const dealership = dealerships.find((d) => d.id === input.dealershipId);
        const drafted = await runFallbackAgent(input.dealershipId, {
          customerName: input.customerName ?? null,
          customerContact: input.customerContact ?? null,
          channel: input.channel,
          inboundMessage: input.inboundMessage ?? null,
          language: input.language ?? "en",
          dealershipName: dealership?.name ?? null,
        });
        const persisted = await createFallbackMessage({
          referenceNumber: drafted.referenceNumber,
          dealershipId: input.dealershipId,
          customerName: input.customerName ?? null,
          customerContact: input.customerContact ?? null,
          channel: input.channel,
          inboundMessage: input.inboundMessage ?? null,
          outboundReply: drafted.outboundReply,
          language: drafted.language,
        });
        await logAgentActivity({
          agentId: "fallback",
          action: "fallback_replied",
          subjectType: "fallback_message",
          subjectId: persisted.id,
          summary: `Bongi drafted an after-hours reply (${input.channel}) with reference ${drafted.referenceNumber}`,
          payload: { reference: drafted.referenceNumber, dealershipId: input.dealershipId },
        });

        // Tell the founder so they can follow up the next business morning.
        // Failures are non-fatal — the customer reply is the priority.
        try {
          await notifyOwner({
            title: `Bongi handled an after-hours ${input.channel} message`,
            content: `Dealership: ${dealership?.name ?? "unknown"}\nCustomer: ${input.customerName ?? "—"}${input.customerContact ? ` (${input.customerContact})` : ""}\nReference: ${drafted.referenceNumber}`,
            actionUrl: `${ENV.appUrl}/admin/fallback`,
          });
        } catch {
          // best-effort; never fail the trigger because the notification failed.
        }
        return {
          ok: true,
          reference: drafted.referenceNumber,
          reply: drafted.outboundReply,
          messageId: persisted.id,
        } as const;
      }),

    /**
     * Founder-only: rotate or set a dealership's public shortcode. The
     * shortcode is what's used in `/api/inbound/{shortcode}` style webhook
     * URLs and in the public contact form so external systems can hand
     * messages off to Bongi without authenticating.
     */
    setShortcode: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          shortcode: z
            .string()
            .min(4)
            .max(12)
            .regex(/^[a-z0-9]+$/, "shortcode must be lowercase a-z and 0-9"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const existing = await getDealershipByShortcode(input.shortcode);
        if (existing && existing.id !== input.dealershipId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That shortcode is already taken by another dealership.",
          });
        }
        await setDealershipShortcode(input.dealershipId, input.shortcode);
        return { ok: true as const };
      }),
  }),

  // ---- Public: Tumi Trade-In Estimator ----
  tradeIn: router({
    /**
     * Public unauthenticated valuation endpoint. Anyone can request a trade-in
     * estimate — we persist it so the dealer principal can follow up. Rate
     * limited and honeypot-guarded exactly like the lead form, since the same
     * abuse vectors apply.
     */
    estimate: publicProcedure
      .input(
        z.object({
          make: z.string().min(1).max(80),
          model: z.string().min(1).max(120),
          year: z.number().int().gte(1980).lte(new Date().getFullYear()),
          mileageKm: z.number().int().gte(0).lte(1_000_000),
          transmission: z.enum(["manual", "automatic", "cvt", "dct"]),
          fuel: z.enum(["petrol", "diesel", "hybrid", "electric"]),
          bodyType: z.string().min(1).max(60),
          condition: z.enum(["excellent", "good", "fair", "poor"]),
          serviceHistory: z.enum([
            "full_dealer",
            "full_independent",
            "partial",
            "none",
          ]),
          notes: z.string().max(1000).optional(),
          province: z.string().max(64).optional(),
          photoUrls: z.array(z.string().url().max(500)).max(4).optional(),
          listOnNetwork: z.boolean().optional(),
          contactName: z.string().max(255).optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().max(32).optional(),
          language: z.string().max(5).optional(),
          honeypot: z.string().max(255).optional(),
          renderedAtMs: z.number().int().nonnegative().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ip = callerIp(ctx.req);
        const bot = looksLikeBot({
          honeypot: input.honeypot,
          renderedAtMs: input.renderedAtMs,
        });
        if (bot.bot) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Submission rejected. Please try again.",
          });
        }
        const rl = checkRateLimit(
          `tradeIn.estimate:${ip}`,
          RATE_LIMITS.LEAD_CREATE.max,
          RATE_LIMITS.LEAD_CREATE.windowMs,
        );
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many trade-in requests from your network. Try again later.",
          });
        }

        if (input.listOnNetwork) {
          if (!input.province?.trim()) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Province is required to list on the dealer network.",
            });
          }
          if (!input.contactPhone?.trim() && !input.contactEmail?.trim()) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Phone or email is required so dealerships can invite you for inspection.",
            });
          }
        }

        // Run Tumi.
        const quote = await generateTumiQuote({
          make: input.make,
          model: input.model,
          year: input.year,
          mileageKm: input.mileageKm,
          transmission: input.transmission,
          fuel: input.fuel,
          bodyType: input.bodyType,
          condition: input.condition,
          serviceHistory: input.serviceHistory,
          notes: input.notes,
          language: (input.language ?? "en") as never,
        });

        const id = await insertTradeInQuote({
          dealershipId: null,
          contactName: input.contactName ?? null,
          contactEmail: input.contactEmail ?? null,
          contactPhone: input.contactPhone ?? null,
          make: input.make,
          model: input.model,
          year: input.year,
          mileageKm: input.mileageKm,
          transmission: input.transmission,
          fuel: input.fuel,
          bodyType: input.bodyType,
          condition: input.condition,
          serviceHistory: input.serviceHistory,
          notes: input.notes ?? null,
          estimateLow: quote.estimateLow,
          estimateMid: quote.estimateMid,
          estimateHigh: quote.estimateHigh,
          confidence: quote.confidence,
          factorBreakdown: JSON.stringify(quote.factorBreakdown),
          memoMarkdown: quote.memoMarkdown,
          language: input.language ?? "en",
          province: input.province ?? null,
          photoUrls: input.photoUrls?.length
            ? JSON.stringify(input.photoUrls)
            : null,
          networkListed: input.listOnNetwork ? 1 : 0,
        });

        await logAgentActivity({
          agentId: "tradein",
          action: input.listOnNetwork ? "network_listed" : "valuation_drafted",
          subjectType: "trade_in_quote",
          subjectId: id,
          summary: input.listOnNetwork
            ? `Trade-in listed on dealer network: ${input.year} ${input.make} ${input.model} (${input.province}).`
            : `Tumi drafted a trade-in valuation for a ${input.year} ${input.make} ${input.model} — estimated R${quote.estimateLow.toLocaleString("en-ZA")}–R${quote.estimateHigh.toLocaleString("en-ZA")}.`,
          payload: { quoteId: id, confidence: quote.confidence, networkListed: !!input.listOnNetwork },
        });

        return {
          quoteId: id,
          estimateLow: quote.estimateLow,
          estimateMid: quote.estimateMid,
          estimateHigh: quote.estimateHigh,
          confidence: quote.confidence,
          factorBreakdown: quote.factorBreakdown,
          memoMarkdown: quote.memoMarkdown,
          networkListed: !!input.listOnNetwork,
        };
      }),

    /** Public photo upload for trade-in listings (rate-limited). */
    uploadPhoto: publicProcedure
      .input(
        z.object({
          dataBase64: z.string().min(20),
          mimeType: z
            .enum(["image/jpeg", "image/png", "image/webp"])
            .default("image/jpeg"),
          filename: z.string().max(128).optional(),
          honeypot: z.string().max(255).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ip = callerIp(ctx.req);
        const bot = looksLikeBot({ honeypot: input.honeypot });
        if (bot.bot) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Upload rejected." });
        }
        const rl = checkRateLimit(`tradeIn.upload:${ip}`, 12, 60_000);
        if (!rl.ok) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many uploads. Try again shortly." });
        }
        const cleanBase64 = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image (max 8 MB)." });
        }
        const ext =
          input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
        const safeName = (input.filename || `trade-in-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `trade-ins/public/${safeName}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url } as const;
      }),

    /**
     * Seller dashboard — verify phone matches quote, return invite activity.
     * AutoTrader has no equivalent: sellers see which dealers reached out.
     */
    sellerStatus: publicProcedure
      .input(
        z.object({
          quoteId: z.number().int(),
          phone: z.string().min(9).max(32),
        }),
      )
      .query(async ({ input, ctx }) => {
        const ip = callerIp(ctx.req);
        const rl = checkRateLimit(`tradeIn.sellerStatus:${ip}`, 20, 60_000);
        if (!rl.ok) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many lookups. Try again shortly." });
        }

        const quote = await getTradeInQuoteById(input.quoteId);
        if (!quote) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found." });
        }
        if (!quote.contactPhone || !phonesMatch(quote.contactPhone, input.phone)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Phone number does not match this quote." });
        }

        const invites = await listTradeInInvitesForQuote(quote.id);
        const photoUrls = quote.photoUrls ? (JSON.parse(quote.photoUrls) as string[]) : [];
        const quoteCreated = new Date(quote.createdAt);

        return {
          quoteId: quote.id,
          vehicle: `${quote.year} ${quote.make} ${quote.model}`,
          province: quote.province,
          networkListed: quote.networkListed === 1,
          estimateLow: quote.estimateLow,
          estimateMid: quote.estimateMid,
          estimateHigh: quote.estimateHigh,
          confidence: quote.confidence,
          inviteCount: invites.length,
          invites: invites.map((inv) => {
            const responseMinutes = Math.max(
              0,
              Math.round((new Date(inv.createdAt).getTime() - quoteCreated.getTime()) / 60_000),
            );
            const isWritten = quote.status === "offer_sent" && inv.indicativeOfferZar != null;
            return {
              id: inv.id,
              dealershipName: inv.dealershipName,
              indicativeOfferZar: inv.indicativeOfferZar,
              messagePreview: inv.inviteMessage.slice(0, 200),
              createdAt: inv.createdAt,
              responseMinutes,
              offerType: isWritten ? ("written" as const) : ("indicative" as const),
              smsSent: inv.smsSent === 1,
              emailSent: inv.emailSent === 1,
              whatsappSent: inv.whatsappSent === 1,
            };
          }),
          photoUrls,
          status: quote.status,
          createdAt: quote.createdAt,
          statusUrl: `/trade-in/status?quote=${quote.id}`,
        };
      }),
  }),

  // ---- Public: inbound webhook / contact form for Bongi ----
  publicFallback: router({
    /**
     * Public, unauthenticated inbound endpoint for fallback messages.
     * External systems (chat widget, WhatsApp webhook, contact form, etc.)
     * call this with a dealership shortcode + the customer's message and
     * Bongi takes it from there. Always persists the inbound message,
     * even during business hours — we just don't auto-reply when a human
     * is around. The founder is paged via notifyOwner on every persisted
     * inbound so nothing slips through.
     */
    inbound: publicProcedure
      .input(
        z.object({
          shortcode: z
            .string()
            .min(4)
            .max(12)
            .regex(/^[a-z0-9]+$/),
          channel: z.enum(["email", "whatsapp", "call", "web_chat"]),
          customerName: z.string().max(120).optional(),
          customerContact: z.string().max(160).optional(),
          inboundMessage: z.string().min(1).max(4000),
          language: z.string().max(8).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ip = callerIp(ctx.req);
        const rl = checkRateLimit(
          `publicFallback.inbound:${ip}`,
          RATE_LIMITS.PUBLIC_FALLBACK_INBOUND.max,
          RATE_LIMITS.PUBLIC_FALLBACK_INBOUND.windowMs,
        );
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many messages. Please try again shortly.",
          });
        }

        const dealership = await getDealershipByShortcode(input.shortcode);
        if (!dealership) {
          // Don't reveal whether the shortcode exists — just refuse cleanly.
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Unknown dealership shortcode.",
          });
        }

        const afterHours = isAfterHoursSAST(
          new Date(),
          dealership.businessHoursJson ?? undefined,
        );
        // Always draft a courteous holding reply — in business hours we mark
        // it as a heads-up; after-hours it's the actual customer-facing reply.
        const drafted = await runFallbackAgent(dealership.id, {
          customerName: input.customerName ?? null,
          customerContact: input.customerContact ?? null,
          channel: input.channel,
          inboundMessage: input.inboundMessage,
          language: input.language ?? "en",
          dealershipName: dealership.name,
        });
        const persisted = await createFallbackMessage({
          referenceNumber: drafted.referenceNumber,
          dealershipId: dealership.id,
          customerName: input.customerName ?? null,
          customerContact: input.customerContact ?? null,
          channel: input.channel,
          inboundMessage: input.inboundMessage,
          outboundReply: drafted.outboundReply,
          language: drafted.language,
        });
        await logAgentActivity({
          agentId: "fallback",
          action: afterHours ? "fallback_replied" : "fallback_forwarded",
          subjectType: "fallback_message",
          subjectId: persisted.id,
          summary: afterHours
            ? `Bongi drafted an after-hours reply (${input.channel}) with reference ${drafted.referenceNumber}`
            : `Inbound ${input.channel} message captured (in-hours) for ${dealership.name}, reference ${drafted.referenceNumber}`,
          payload: {
            reference: drafted.referenceNumber,
            dealershipId: dealership.id,
            inHours: !afterHours,
          },
        });
        try {
          await notifyOwner({
            title: afterHours
              ? `Bongi handled an after-hours ${input.channel} message`
              : `⚠️ Human reply needed — ${input.channel} message (in-hours)`,
            content: `Dealership: ${dealership.name}\nCustomer: ${input.customerName ?? "—"}${input.customerContact ? ` (${input.customerContact})` : ""}\nReference: ${drafted.referenceNumber}\nMessage: ${input.inboundMessage.slice(0, 500)}`,
            actionUrl: `${ENV.appUrl}/admin/fallback`,
          });
        } catch {
          // best-effort
        }
        return {
          ok: true as const,
          reference: drafted.referenceNumber,
          // Only echo the auto-reply when we actually want the caller (chat
          // widget) to display it. In-hours we ask the caller to wait.
          autoReply: afterHours ? drafted.outboundReply : null,
          afterHours,
        };
      }),
  }),

  // ---- Public: pre-approval (Naledi) ----
  publicPreApproval: router({
    /**
     * Public, unauthenticated submission endpoint for finance pre-approval
     * applications. Naledi captures the answers, masks the SA ID number to
     * the last 4 digits, generates a reference, and acknowledges receipt with
     * an explicit "a human will get back to you" message. The agent NEVER
     * grants approval — the human decision is set later from /admin/preapprovals.
     */
    submit: publicProcedure
      .input(
        z.object({
          shortcode: z
            .string()
            .min(4)
            .max(12)
            .regex(/^[a-z0-9]+$/),
          vehicleId: z.number().int().optional(),
          fullName: z.string().min(2).max(255),
          idNumber: z.string().max(32).optional(),
          email: z.string().email().max(320),
          phone: z.string().min(7).max(32),
          employmentStatus: z
            .enum([
              "permanent",
              "contract",
              "self_employed",
              "pensioner",
              "unemployed",
            ])
            .optional(),
          employer: z.string().max(255).optional(),
          monthsEmployed: z.number().int().min(0).max(720).optional(),
          grossMonthlyIncome: z.number().min(0).max(10_000_000).optional(),
          netMonthlyIncome: z.number().min(0).max(10_000_000).optional(),
          totalMonthlyExpenses: z.number().min(0).max(10_000_000).optional(),
          existingDebtMonthly: z.number().min(0).max(10_000_000).optional(),
          vehiclePrice: z.number().min(0).max(50_000_000).optional(),
          desiredDeposit: z.number().min(0).max(50_000_000).optional(),
          desiredTermMonths: z.number().int().min(12).max(84).optional(),
          hasTradeIn: z.boolean().optional(),
          tradeInDescription: z.string().max(500).optional(),
          notes: z.string().max(2000).optional(),
          language: z.string().max(8).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ip = callerIp(ctx.req);
        const rl = checkRateLimit(
          `preApprovals.submit:${ip}`,
          RATE_LIMITS.PREAPPROVAL_SUBMIT.max,
          RATE_LIMITS.PREAPPROVAL_SUBMIT.windowMs,
        );
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many applications from your network. Please try again later.",
          });
        }

        const dealership = await getDealershipByShortcode(input.shortcode);
        if (!dealership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Unknown dealership shortcode.",
          });
        }
        const drafted = await runPreApprovalAgent(dealership.id, {
          fullName: input.fullName,
          idNumber: input.idNumber ?? null,
          email: input.email,
          phone: input.phone,
          employmentStatus: input.employmentStatus ?? null,
          employer: input.employer ?? null,
          monthsEmployed: input.monthsEmployed ?? null,
          grossMonthlyIncome: input.grossMonthlyIncome ?? null,
          netMonthlyIncome: input.netMonthlyIncome ?? null,
          totalMonthlyExpenses: input.totalMonthlyExpenses ?? null,
          existingDebtMonthly: input.existingDebtMonthly ?? null,
          vehiclePrice: input.vehiclePrice ?? null,
          desiredDeposit: input.desiredDeposit ?? null,
          desiredTermMonths: input.desiredTermMonths ?? null,
          hasTradeIn: input.hasTradeIn ?? false,
          tradeInDescription: input.tradeInDescription ?? null,
          notes: input.notes ?? null,
          language: input.language ?? "en",
          dealershipName: dealership.name,
        });
        const persisted = await insertPreApproval({
          dealershipId: dealership.id,
          vehicleId: input.vehicleId ?? null,
          referenceNumber: drafted.referenceNumber,
          fullName: input.fullName,
          idNumberMasked: drafted.idNumberMasked,
          email: input.email,
          phone: input.phone,
          employmentStatus: input.employmentStatus ?? null,
          employer: input.employer ?? null,
          monthsEmployed: input.monthsEmployed ?? null,
          grossMonthlyIncome: input.grossMonthlyIncome ?? null,
          netMonthlyIncome: input.netMonthlyIncome ?? null,
          totalMonthlyExpenses: input.totalMonthlyExpenses ?? null,
          existingDebtMonthly: input.existingDebtMonthly ?? null,
          vehiclePrice: input.vehiclePrice ?? null,
          desiredDeposit: input.desiredDeposit ?? null,
          desiredTermMonths: input.desiredTermMonths ?? null,
          hasTradeIn: input.hasTradeIn ?? false,
          tradeInDescription: input.tradeInDescription ?? null,
          notes: input.notes ?? null,
          agentReply: drafted.agentReply,
          language: drafted.language,
        });
        await logAgentActivity({
          agentId: "preapproval",
          action: "preapproval_received",
          subjectType: "pre_approval",
          subjectId: persisted.id,
          summary: `Naledi captured a pre-approval request from ${input.fullName} for ${dealership.name} (ref ${drafted.referenceNumber}). Awaiting human decision.`,
          payload: {
            reference: drafted.referenceNumber,
            dealershipId: dealership.id,
            affordability: drafted.affordabilityHint,
          },
        });
        try {
          await notifyOwner({
            title: `⚠️ Human decision needed — Finance pre-approval (${dealership.name})`,
            content: `Applicant: ${input.fullName}\nContact: ${input.email} · ${input.phone}\nReference: ${drafted.referenceNumber}\nVehicle price: ${input.vehiclePrice ?? "—"}\nDeposit: ${input.desiredDeposit ?? "—"}\nTerm: ${input.desiredTermMonths ?? "—"} months\nAffordability hint: ${drafted.affordabilityHint.flag}`,
            actionUrl: `${ENV.appUrl}/admin/pre-approvals`,
          });
        } catch {
          // best-effort
        }
        return {
          ok: true as const,
          reference: drafted.referenceNumber,
          replyToCustomer: drafted.agentReply,
        };
      }),
  }),

  // ---- Public: test-drive bookings (Lerato) ----
  publicBooking: router({
    /**
     * Public, unauthenticated test-drive booking endpoint. Used by the
     * website booking page, the Showroom "Book a test drive" CTA, and the
     * WhatsApp inbound webhook (when Nala classifies an intent as a
     * booking). Lerato never confirms a slot autonomously: she persists a
     * `requested` row + her suggested next-in-hours slot and notifies the
     * owner. A human flips it to `confirmed` from /admin/platform-demos.
     */
    submit: publicProcedure
      .input(
        z.object({
          shortcode: z
            .string()
            .min(4)
            .max(12)
            .regex(/^[a-z0-9]+$/),
          vehicleId: z.number().int().optional(),
          customerName: z.string().min(2).max(255),
          customerContact: z.string().min(5).max(320),
          channel: z.enum(["website", "whatsapp", "call", "web_chat"]).default("website"),
          inboundMessage: z.string().max(2000).optional(),
          requestedSlotStart: z.union([z.string(), z.number()]).optional(),
          requestedSlotEnd: z.union([z.string(), z.number()]).optional(),
          language: z.string().max(8).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ip = callerIp(ctx.req);
        const rl = checkRateLimit(
          `bookings.submit:${ip}`,
          RATE_LIMITS.BOOKING_SUBMIT.max,
          RATE_LIMITS.BOOKING_SUBMIT.windowMs,
        );
        if (!rl.ok) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many booking requests. Please try again later.",
          });
        }

        const dealership = await getDealershipByShortcode(input.shortcode);
        if (!dealership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Unknown dealership shortcode.",
          });
        }
        // Best-effort vehicle title lookup so Lerato's reply mentions the car.
        let vehicleTitle: string | null = null;
        if (input.vehicleId) {
          try {
            const v = await getVehicle(input.vehicleId);
            if (v) vehicleTitle = v.title;
          } catch {
            // ignore
          }
        }
        const existingWindows = await listFutureBookingWindows(
          dealership.id,
          input.vehicleId ?? null,
        );
        const drafted = await runBookingAgent(dealership.id, {
          customerName: input.customerName,
          customerContact: input.customerContact,
          channel: input.channel,
          inboundMessage: input.inboundMessage ?? null,
          vehicleTitle,
          requestedSlotStart: input.requestedSlotStart ?? null,
          requestedSlotEnd: input.requestedSlotEnd ?? null,
          language: input.language ?? "en",
          dealershipName: dealership.name,
          businessHoursOverride: dealership.businessHoursJson ?? undefined,
          existingWindows,
        });
        const persisted = await createTestDriveBooking({
          dealershipId: dealership.id,
          vehicleId: input.vehicleId ?? null,
          referenceNumber: drafted.referenceNumber,
          customerName: input.customerName,
          customerContact: input.customerContact,
          inboundMessage: input.inboundMessage ?? null,
          outboundReply: drafted.outboundReply,
          requestedSlotStart: drafted.requestedSlotStart,
          requestedSlotEnd: drafted.requestedSlotEnd,
          suggestedSlotStart: drafted.suggestedSlotStart,
          suggestedSlotEnd: drafted.suggestedSlotEnd,
          channel: input.channel,
          language: drafted.language,
        });
        await logAgentActivity({
          agentId: "booking",
          action: "booking_received",
          subjectType: "test_drive_booking",
          subjectId: persisted.id,
          summary: `Lerato pencilled in a test drive for ${input.customerName} at ${dealership.name} (ref ${drafted.referenceNumber}, ${drafted.slotShifted ? "slot shifted to in-hours" : "slot honoured"})`,
          payload: {
            reference: drafted.referenceNumber,
            dealershipId: dealership.id,
            vehicleId: input.vehicleId ?? null,
            slotShifted: drafted.slotShifted,
            channel: input.channel,
          },
        });
        // Tag chat-originated bookings as conversion wins for Nala/Lerato learning.
        void markNalaChatBookingConversion({
          dealershipId: dealership.id,
          referenceNumber: drafted.referenceNumber,
          channel: input.channel,
          bookingId: persisted.id,
          customerContact: input.customerContact,
        });
        try {
          await notifyOwner({
            title: `⚠️ Human confirmation needed — Test drive (${dealership.name})`,
            content: `Customer: ${input.customerName} · ${input.customerContact}\nReference: ${drafted.referenceNumber}\nSuggested slot: ${drafted.suggestedSlotStart.toISOString()}\n${drafted.slotShifted ? "NOTE: shifted to in-hours from request\n" : ""}Vehicle: ${vehicleTitle ?? "—"}`,
            actionUrl: `${ENV.appUrl}/dealer/bookings`,
          });
        } catch {
          // best-effort
        }
        return {
          ok: true as const,
          reference: drafted.referenceNumber,
          replyToCustomer: drafted.outboundReply,
          suggestedSlotStart: drafted.suggestedSlotStart.toISOString(),
          suggestedSlotEnd: drafted.suggestedSlotEnd.toISOString(),
          slotShifted: drafted.slotShifted,
        };
      }),
  }),

  // ---- Admin/dealer: test-drive bookings queue ----
  adminBookings: router({
    list: protectedProcedure
      .input(
        z
          .object({
            dealershipId: z.number().int().optional(),
            status: z
              .enum([
                "requested",
                "confirmed",
                "rescheduled",
                "completed",
                "cancelled",
                "no_show",
              ])
              .optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const user: any = ctx.user;
        let scopedDealershipId: number | undefined = input?.dealershipId;
        if (!isFounderOrAdmin(user)) {
          // Dealer-side users can only see their own dealership's bookings.
          if (!user?.dealershipId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Your account is not linked to a dealership yet.",
            });
          }
          scopedDealershipId = user.dealershipId;
        }
        return listTestDriveBookings(scopedDealershipId, input?.status, 200);
      }),
    decide: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          decision: z.enum([
            "confirm",
            "reschedule",
            "cancel",
            "complete",
            "no_show",
          ]),
          confirmedSlotStart: z.union([z.string(), z.number()]).optional(),
          confirmedSlotEnd: z.union([z.string(), z.number()]).optional(),
          notes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const user: any = ctx.user;
        const existing = await getTestDriveBooking(input.id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        if (
          !isFounderOrAdmin(user) &&
          (!user?.dealershipId || user.dealershipId !== existing.dealershipId)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This booking belongs to another dealership.",
          });
        }
        const statusMap = {
          confirm: "confirmed" as const,
          reschedule: "rescheduled" as const,
          cancel: "cancelled" as const,
          complete: "completed" as const,
          no_show: "no_show" as const,
        };
        const status = statusMap[input.decision];
        const start = input.confirmedSlotStart ? new Date(input.confirmedSlotStart) : undefined;
        const end = input.confirmedSlotEnd ? new Date(input.confirmedSlotEnd) : undefined;
        await updateTestDriveBookingStatus(input.id, {
          status,
          ...(start ? { confirmedSlotStart: start } : {}),
          ...(end ? { confirmedSlotEnd: end } : {}),
          ...(input.notes != null ? { notes: input.notes } : {}),
          resolvedBy: user?.id ?? null,
          resolvedAt: new Date(),
        });

        // On Confirm, generate the localized confirmation reply + ICS so the
        // dealer's UI can show "Send to customer" / "Download .ics" actions.
        // We deliberately do NOT auto-send via WhatsApp here — the dealer
        // remains the human-in-the-loop. Mia/Nala/the WhatsApp drafter can
        // re-use this text downstream.
        let confirmation: { message: string; language: string; ics: string } | null = null;
        if (input.decision === "confirm") {
          const dealershipRow = await getDealershipById(existing.dealershipId);
          const slotStart =
            start ??
            existing.suggestedSlotStart ??
            existing.requestedSlotStart ??
            new Date(Date.now() + 60 * 60 * 1000);
          const slotEnd =
            end ??
            existing.suggestedSlotEnd ??
            existing.requestedSlotEnd ??
            new Date(slotStart.getTime() + 60 * 60 * 1000);
          let vehicleTitle: string | null = null;
          if (existing.vehicleId) {
            try {
              const v = await getVehicle(existing.vehicleId);
              if (v) vehicleTitle = v.title;
            } catch {
              // ignore
            }
          }
          const built = buildConfirmationMessage({
            customerName: existing.customerName,
            dealershipName: dealershipRow?.name ?? "the dealership",
            vehicleTitle,
            reference: existing.referenceNumber,
            slotStart,
            slotEnd,
            language: existing.language ?? "en",
            locationText: dealershipRow?.region ?? null,
          });
          const ics = buildBookingIcs({
            customerName: existing.customerName,
            dealershipName: dealershipRow?.name ?? "the dealership",
            vehicleTitle,
            reference: existing.referenceNumber,
            slotStart,
            slotEnd,
            language: existing.language ?? "en",
            locationText: dealershipRow?.region ?? null,
          });
          confirmation = { message: built.message, language: built.language, ics };
        }

        await logAgentActivity({
          agentId: "booking",
          action: `booking_${input.decision}`,
          subjectType: "test_drive_booking",
          subjectId: input.id,
          summary: `Booking ${existing.referenceNumber} for ${existing.customerName} → ${status}`,
          payload: {
            reference: existing.referenceNumber,
            decidedBy: user?.id ?? null,
            decision: input.decision,
            confirmationLanguage: confirmation?.language ?? null,
          },
        });
        return { ok: true as const, status, confirmation };
      }),

    /**
     * Reclassify a booking that was incorrectly categorised as a test drive.
     * Marks the booking with a "RECLASSIFIED" note so the original intent is
     * preserved, and optionally sets status to cancelled if it was never a
     * real test drive. Does NOT delete the row — the audit trail stays intact.
     */
    reclassify: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          actualType: z.enum([
            "general_viewing",
            "consultation",
            "call",
            "inquiry",
            "other",
          ]),
          notes: z.string().max(2000).optional(),
          cancelBooking: z.boolean().optional().default(true),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const user: any = ctx.user;
        const existing = await getTestDriveBooking(input.id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        if (
          !isFounderOrAdmin(user) &&
          (!user?.dealershipId || user.dealershipId !== existing.dealershipId)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This booking belongs to another dealership.",
          });
        }
        const reclassifiedNote = [
          `[RECLASSIFIED] Was logged as test_drive — actual type: ${input.actualType.replace(/_/g, " ")}`,
          input.notes ?? null,
          existing.notes ?? null,
        ]
          .filter(Boolean)
          .join("\n");

        await updateTestDriveBookingStatus(input.id, {
          ...(input.cancelBooking ? { status: "cancelled" } : {}),
          notes: reclassifiedNote,
          resolvedBy: user?.id ?? null,
          resolvedAt: new Date(),
        });
        await logAgentActivity({
          agentId: "booking",
          action: "booking_reclassified",
          subjectType: "test_drive_booking",
          subjectId: input.id,
          summary: `Booking ${existing.referenceNumber} for ${existing.customerName} reclassified from test_drive → ${input.actualType.replace(/_/g, " ")}`,
          payload: {
            reference: existing.referenceNumber,
            reclassifiedBy: user?.id ?? null,
            actualType: input.actualType,
            cancelled: input.cancelBooking,
          },
        });
        return { ok: true as const, actualType: input.actualType };
      }),
  }),

  // ---- Admin: pre-approvals queue ----
  adminPreApprovals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listPreApprovals();
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const row = await getPreApproval(input.id);
        if (!row) throw new TRPCError({ code: "NOT_FOUND" });
        return row;
      }),
    decide: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          decision: z.enum(["approved", "declined", "more_info"]),
          note: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const row = await getPreApproval(input.id);
        if (!row) throw new TRPCError({ code: "NOT_FOUND" });
        const reviewerId =
          typeof ctx.user?.id === "number" ? ctx.user.id : null;
        await decidePreApproval({
          id: input.id,
          decision: input.decision,
          note: input.note ?? null,
          reviewerId,
        });
        await logAgentActivity({
          agentId: "preapproval",
          action: `human_${input.decision}`,
          subjectType: "pre_approval",
          subjectId: input.id,
          summary: `Human reviewer set pre-approval ${row.referenceNumber} to ${input.decision}`,
          payload: { note: input.note ?? null },
        });
        return { ok: true as const };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deletePreApproval(input.id);
        return { ok: true as const };
      }),
  }),

  // ---- Admin: dealerships system-wide ----
  adminDealerships: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listAllDealerships();
    }),

    /**
     * Create a dealership (founder ops). Optional groupKey assigns the branch
     * to a multi-branch group — one dealership per branch, same groupKey.
     */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(255),
          contactEmail: z.string().email().max(320).optional().nullable(),
          contactPhone: z.string().max(32).optional().nullable(),
          region: z.string().max(64).optional().nullable(),
          plan: z.enum(["starter", "professional", "enterprise"]).optional(),
          groupKey: z.string().max(64).optional().nullable(),
          whatsappPhoneNumberId: z.string().max(64).optional().nullable(),
          status: z.enum(["onboarding", "active", "paused", "suspended"]).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const created = await createDealership({
          name: input.name,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          region: input.region,
          plan: input.plan,
          groupKey: input.groupKey,
          whatsappPhoneNumberId: input.whatsappPhoneNumberId,
          status: input.status ?? "active",
        });
        return { ok: true as const, ...created };
      }),

    /**
     * Founder/admin: permanently delete a dealership and everything scoped to
     * it (vehicles + photos, leads, test-drive bookings). Users pointed at it
     * are unlinked (their accounts are kept). Requires an exact name match to
     * guard against mis-clicks.
     */
    remove: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int().positive(),
          confirmName: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const dealership = await getDealershipById(input.dealershipId);
        if (!dealership) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dealership not found" });
        }
        if (dealership.name.trim() !== input.confirmName.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Confirmation name does not match the dealership name.",
          });
        }
        const removed = await deleteDealershipCascade(input.dealershipId);
        void logAgentActivity({
          agentId: "improvement",
          action: "dealership_deleted",
          subjectType: "dealership",
          summary: `Deleted dealership "${dealership.name}" (#${input.dealershipId}) — ${removed.vehicles} vehicle(s), ${removed.leads} lead(s), ${removed.bookings} booking(s); ${removed.usersUnlinked} user(s) unlinked.`,
          payload: { dealershipId: input.dealershipId, ...removed, by: ctx.user.id },
        });
        return { ok: true as const, ...removed };
      }),

    /** Create a dealer_groups row (or return existing by key). */
    createGroup: protectedProcedure
      .input(
        z.object({
          key: z.string().min(2).max(64),
          name: z.string().min(1).max(255).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        try {
          return await createDealerGroup({
            key: input.key,
            name: input.name?.trim() || input.key,
            ownerUserId: ctx.user.id,
          });
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e instanceof Error ? e.message : "Invalid group key",
          });
        }
      }),

    listGroups: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listDealerGroups();
    }),

    /** Assign / clear groupKey on a dealership (ensures dealer_groups row). */
    setGroupKey: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int().positive(),
          groupKey: z.string().max(64).nullable(),
          groupName: z.string().max(255).optional().nullable(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        try {
          return await setDealershipGroupKey(input.dealershipId, input.groupKey, {
            groupName: input.groupName,
            ownerUserId: ctx.user.id,
          });
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e instanceof Error ? e.message : "Failed to set groupKey",
          });
        }
      }),

    /** Minimal group overview — branches + stock/leads counts. */
    groupOverview: protectedProcedure
      .input(z.object({ groupKey: z.string().min(1).max(64) }))
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const overview = await getDealerGroupOverview(input.groupKey);
        if (!overview) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
        }
        return overview;
      }),

    /** Read a single dealership's resolved brand kit (with defaults applied). */
    getBrandKit: protectedProcedure
      .input(z.object({ dealershipId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const dealership = await getDealershipById(input.dealershipId);
        if (!dealership) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          dealershipId: dealership.id,
          dealershipName: dealership.name,
          raw: {
            brandLogoUrl: dealership.brandLogoUrl ?? null,
            brandAccentColor: dealership.brandAccentColor ?? null,
            brandSignature: dealership.brandSignature ?? null,
            vatNumber: dealership.vatNumber ?? null,
            bankDetails: dealership.bankDetails ?? null,
            businessHoursJson: (dealership.businessHoursJson as Record<string, unknown> | null) ?? null,
            agentDisplayName: dealership.agentDisplayName ?? null,
            groupKey: dealership.groupKey ?? null,
            publicShortcode: dealership.publicShortcode ?? null,
          },
          resolved: resolveBrandKit(dealership),
        };
      }),

    /**
     * Upload a dealership logo (from the admin console file picker).
     * Accepts a base64-encoded image, stores it via the shared storage
     * helper (S3/R2 if configured, else a base64 data: URL fallback — same
     * path as vehicle photo uploads), and returns the resulting URL. The
     * caller still has to call `updateBrandKit` to persist the URL.
     */
    uploadBrandLogo: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          dataBase64: z.string().min(20),
          mimeType: z.enum([
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/svg+xml",
          ]),
          filename: z.string().max(128).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const dealership = await getDealershipById(input.dealershipId);
        if (!dealership) throw new TRPCError({ code: "NOT_FOUND" });

        const cleanBase64 = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        if (buffer.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Empty image data" });
        }
        const MAX_LOGO_BYTES = 5 * 1024 * 1024;
        if (buffer.length > MAX_LOGO_BYTES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Logo image too large (max 5MB)",
          });
        }

        const ext =
          input.mimeType === "image/png"
            ? "png"
            : input.mimeType === "image/webp"
              ? "webp"
              : input.mimeType === "image/svg+xml"
                ? "svg"
                : "jpg";
        const safeName = (input.filename || `logo-${Date.now()}`).replace(
          /[^a-zA-Z0-9._-]/g,
          "_",
        );
        const key = `brand-logos/${input.dealershipId}/${safeName}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url } as const;
      }),

    /** Patch any subset of brand kit fields. Hex colour is sanitised server-side. */
    updateBrandKit: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          // Accepts a hosted https:// URL (paste-URL fallback) or a base64
          // data: URL returned by uploadBrandLogo when no S3/R2 bucket is
          // configured — hence the generous max length.
          brandLogoUrl: z.string().url().max(8_000_000).nullable().optional(),
          brandAccentColor: z.string().max(16).nullable().optional(),
          brandSignature: z.string().max(500).nullable().optional(),
          vatNumber: z.string().max(32).nullable().optional(),
          bankDetails: z.string().max(500).nullable().optional(),
          agentDisplayName: z.string().max(40).nullable().optional(),
          groupKey: z.string().max(64).nullable().optional(),
          businessHoursJson: z
            .record(
              z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]),
              z.object({
                open: z
                  .string()
                  .regex(/^\d{1,2}:\d{2}$/)
                  .optional(),
                close: z
                  .string()
                  .regex(/^\d{1,2}:\d{2}$/)
                  .optional(),
                closed: z.boolean().optional(),
              }),
            )
            .nullable()
            .optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const accent = input.brandAccentColor
          ? sanitizeHexColor(input.brandAccentColor)
          : null;
        const patch: Parameters<typeof updateDealershipBrand>[1] = {
          brandLogoUrl: input.brandLogoUrl ?? null,
          brandAccentColor: accent,
          brandSignature: input.brandSignature ?? null,
          vatNumber: input.vatNumber ?? null,
          bankDetails: input.bankDetails ?? null,
        };
        if (Object.prototype.hasOwnProperty.call(input, "businessHoursJson")) {
          patch.businessHoursJson = input.businessHoursJson ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(input, "agentDisplayName")) {
          patch.agentDisplayName = input.agentDisplayName?.trim() || null;
        }
        if (Object.prototype.hasOwnProperty.call(input, "groupKey")) {
          patch.groupKey = input.groupKey
            ? normalizeGroupKey(input.groupKey) || null
            : null;
        }
        await updateDealershipBrand(input.dealershipId, patch);
        return { ok: true };
      }),

    /** Meta WhatsApp phone_number_id + optional LLM model override. */
    getIntegrations: protectedProcedure
      .input(z.object({ dealershipId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) throw new TRPCError({ code: "FORBIDDEN" });
        const d = await getDealershipById(input.dealershipId);
        if (!d) throw new TRPCError({ code: "NOT_FOUND" });
        const { resolveOpenAIModelForDealership } = await import("../shared/llmModelTiers");
        return {
          dealershipId: d.id,
          dealershipName: d.name,
          plan: d.plan,
          whatsappPhoneNumberId: d.whatsappPhoneNumberId ?? null,
          llmModel: d.llmModel ?? null,
          resolvedLlmModel: resolveOpenAIModelForDealership({
            plan: d.plan,
            llmModel: d.llmModel,
          }),
        };
      }),

    updateIntegrations: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          whatsappPhoneNumberId: z.string().max(64).nullable().optional(),
          llmModel: z.string().max(64).nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) throw new TRPCError({ code: "FORBIDDEN" });
        const patch: Parameters<typeof updateDealershipIntegrations>[1] = {};
        if (Object.prototype.hasOwnProperty.call(input, "whatsappPhoneNumberId")) {
          patch.whatsappPhoneNumberId = input.whatsappPhoneNumberId ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(input, "llmModel")) {
          patch.llmModel = input.llmModel ?? null;
        }
        await updateDealershipIntegrations(input.dealershipId, patch);
        return { ok: true };
      }),

    /** Read the module-toggle map for one dealership (with defaults). */
    getModules: protectedProcedure
      .input(z.object({ dealershipId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) throw new TRPCError({ code: "FORBIDDEN" });
        const d = await getDealershipById(input.dealershipId);
        if (!d) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          dealershipId: d.id,
          dealershipName: d.name,
          modulesEnabled: (d.modulesEnabled as Record<string, boolean> | null) ?? {},
        };
      }),

    /** Patch one or more module toggles (partial merge, null = unset). */
    updateModules: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          patch: z.record(z.string().max(64), z.union([z.boolean(), z.null()])),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) throw new TRPCError({ code: "FORBIDDEN" });
        await updateDealershipModules(input.dealershipId, input.patch);
        await logAgentActivity({
          agentId: "improvement",
          action: "dealership_modules_updated",
          subjectType: "dealership",
          subjectId: input.dealershipId,
          summary: `Kagiso recorded a module toggle change for dealership ${input.dealershipId}.`,
          payload: { patch: input.patch },
        });
        return { ok: true };
      }),
  }),

  // ---- Admin: founder ops dashboard (platform-wide KPI snapshot) ----
  adminOps: router({
    snapshot: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getPlatformOpsSnapshot();
    }),
    health: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getPlatformHealth } = await import("./_core/platformHealth");
      return getPlatformHealth();
    }),
    /** Preview weekly pilot proof numbers (leads / bookings / Bongi / F&I). */
    pilotDigest: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { buildPilotProofDigest, formatPilotProofDigestText } = await import(
        "./_core/pilotProofDigest"
      );
      const digest = await buildPilotProofDigest(7);
      return { digest, text: formatPilotProofDigestText(digest) };
    }),
    /** Email the pilot proof digest to the founder alert inbox. */
    sendPilotDigest: protectedProcedure.mutation(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { sendPilotProofDigestEmail } = await import("./_core/pilotProofDigest");
      return sendPilotProofDigestEmail();
    }),
  }),

  // ---- Admin: agents system-wide ----
  adminAgents: router({
    systemWideStats: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // Aggregate agent activity across all dealerships
      const allStats = await getAgentStats();
      const stats = AGENT_LIST.map((a) => {
        const s = (allStats as Record<string, { actionCount: number; lastActionAt: Date | null; lastAction: string | null } | undefined>)[a.id];
        return {
          agentId: a.id,
          name: a.displayName,
          role: a.role,
          avatarUrl: a.avatarUrl,
          totalActions: s?.actionCount ?? 0,
          lastActionAt: s?.lastActionAt ?? null,
          lastAction: s?.lastAction ?? null,
        };
      });
      return stats;
    }),
  }),

  // ---- Admin: Kagiso upgrade roadmap ----
  adminKagiso: router({
    listRoadmap: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listRoadmap();
    }),
    runAuditNow: protectedProcedure.mutation(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // Synthesize a quick set of platform-level suggestions.
      const seedItems: Array<{
        title: string;
        description: string;
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
        creditCostEstimate: number;
        roiEstimateZar: number;
        evidenceJson: any;
      }> = [
        {
          title: "Add SMS fallback channel",
          description:
            "15% of customers do not respond to email or WhatsApp. SMS as a third channel could lift response by ~12pp.",
          category: "integration",
          priority: "high",
          creditCostEstimate: 80,
          roiEstimateZar: 240000,
          evidenceJson: { source: "channel response rates last 30 days" },
        },
        {
          title: "Auto-route high-value invoices to founder approval",
          description:
            "Invoices over R 100k should require founder sign-off before Thandi sends them.",
          category: "compliance",
          priority: "medium",
          creditCostEstimate: 30,
          roiEstimateZar: 50000,
          evidenceJson: { source: "invoice value distribution" },
        },
        {
          title: "Sentiment analysis on inbound replies",
          description:
            "Detect angry or frustrated customers earlier and escalate before they churn.",
          category: "agent_improvement",
          priority: "medium",
          creditCostEstimate: 60,
          roiEstimateZar: 90000,
          evidenceJson: { source: "churn correlation analysis" },
        },
      ];
      let added = 0;
      for (const it of seedItems) {
        await createRoadmapItem(it);
        added += 1;
      }
      return { added };
    }),
    /**
     * Methodical full audit. Walks 10 sections, dedupes by hash, persists
     * findings, and returns the per-finding + total credit estimates so the
     * UI can show "this is what it would cost Kagiso to do all of this
     * autonomously". The numbers are Kagiso's self-estimates, not billed.
     */
    runFullAudit: protectedProcedure.mutation(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { runKagisoFullAudit } = await import("./_core/kagisoFullAudit");
      const { proposePatchesForFindings } = await import("./_core/kagisoPatchGenerator");
      const snap = await getKagisoSnapshot();
      const result = runKagisoFullAudit(snap);
      let inserted = 0;
      let skipped = 0;
      const currentHashes = new Set(result.findings.map((f) => f.hash));
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

      // Draft allow-listed code patches for any finding that has a recipe
      // (including ones already on the board from a prior run).
      let patchesProposed = 0;
      try {
        const drafts = await proposePatchesForFindings(result.findings);
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
        console.error("[Kagiso] patch generation failed", err);
      }

      // Clear findings that no longer apply (e.g. OpenAI healthy again).
      const openHashes = await listOpenAuditFindings();
      const stale = openHashes.filter((h) => h.hash && !currentHashes.has(h.hash));
      const autoResolved = await autoResolveStaleAuditFindings(stale.map((s) => s.id));

      return {
        inserted,
        skipped,
        patchesProposed,
        autoResolved,
        totalFindings: result.findings.length,
        cost: result.cost,
        snapshot: snap,
        sections: result.sectionsWalked,
      };
    }),
    /**
     * Read-only preview: tells the UI what the audit WOULD report and what
     * it WOULD cost without actually persisting anything. Useful for the
     * "how much would Kagiso cost to run autonomously?" rollup card.
     */
    auditCostPreview: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { runKagisoFullAudit } = await import("./_core/kagisoFullAudit");
      const snap = await getKagisoSnapshot();
      const result = runKagisoFullAudit(snap);
      return {
        cost: result.cost,
        sections: result.sectionsWalked,
        findingCount: result.findings.length,
        autonomousCount: result.findings.filter(
          (f) => f.agentAutonomous && !f.humanRequired,
        ).length,
        humanCount: result.findings.filter((f) => f.humanRequired).length,
        snapshot: snap,
      };
    }),
    decideRoadmap: protectedProcedure
      .input(
        z.object({
          itemId: z.number().int(),
          decision: z.enum(["approved", "dismissed"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { getDb } = await import("./db");
        const { upgradeRoadmap } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        const [item] = db
          ? await db.select().from(upgradeRoadmap).where(eq(upgradeRoadmap.id, input.itemId)).limit(1)
          : [];

        if (input.decision === "dismissed") {
          await decideRoadmapItem(input.itemId, "dismissed");
          return { ok: true, action: "dismissed" as const };
        }

        // OpenAI / WhatsApp / Resend circuit findings: Approve = apply the fix now.
        const title = (item?.title ?? "").toLowerCase();
        const section = item?.auditSection ?? "";
        if (section === "agent_errors" || title.includes("openai") || title.includes("circuit")) {
          const { resetCircuitBreaker } = await import("./_core/agentResilience");
          if (title.includes("whatsapp")) resetCircuitBreaker("whatsapp");
          else if (title.includes("resend")) resetCircuitBreaker("resend");
          else resetCircuitBreaker("openai");
          await decideRoadmapItem(input.itemId, "completed");
          return { ok: true, action: "circuit_reset" as const };
        }

        // If Kagiso drafted a code patch for this finding, apply it on Approve.
        const { listProposedPatches, getProposedPatch, markPatchApplied, markPatchFailed } =
          await import("./db");
        const linked = (await listProposedPatches({ status: "proposed", limit: 100 })).filter(
          (p) => p.findingId === input.itemId,
        );
        if (linked[0]) {
          const { applyProposedPatch } = await import("./_core/kagisoPatchApplier");
          const patch = await getProposedPatch(linked[0].id);
          if (patch) {
            const result = await applyProposedPatch({
              filePath: patch.filePath,
              findText: patch.findText,
              replaceText: patch.replaceText,
            });
            if (!result.ok) {
              await markPatchFailed(patch.id, result.error);
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Patch apply failed: ${result.error}`,
              });
            }
            await markPatchApplied(patch.id, ctx.user.id);
            await decideRoadmapItem(input.itemId, "completed");
            return { ok: true, action: "patch_applied" as const, bytesWritten: result.bytesWritten };
          }
        }

        await decideRoadmapItem(input.itemId, "approved_for_build");
        return { ok: true, action: "approved_for_build" as const };
      }),
    deleteRoadmap: protectedProcedure
      .input(z.object({ itemId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteRoadmapItem(input.itemId);
        return { ok: true };
      }),

    /**
     * Kagiso meta-step: ask the LLM to propose ONE high-impact new agent
     * for a given dealership and persist it as a `new_agent` roadmap item
     * for founder review. Returns the proposal so the UI can preview it.
     */
    proposeAgent: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int().optional(),
          painPoints: z.array(z.string()).max(10).optional(),
          recentActivity: z.string().max(1000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const dealershipId = input.dealershipId ?? 0;
        const dealership = dealershipId
          ? await getDealershipById(dealershipId)
          : null;
        const ctxForKagiso: ProposalContext = {
          dealershipId,
          dealershipName: dealership?.name ?? "GrayArx (platform-wide)",
          currentAgents: AGENT_LIST.map((a) => a.displayName),
          recentActivity:
            input.recentActivity ??
            "Mixed inbound across email and WhatsApp; some after-hours messages handled by Bongi; a few invoices generated by Thandi.",
          kpis: {
            leadResponseTime: 6,
            conversionRate: 0.18,
            invoiceProcessingTime: 2,
            invoiceAccuracy: 0.95,
            manualApprovalRate: 0.4,
          },
          languageCoverage: ((dealership?.languages as string[] | null) ?? [
            "en",
            "af",
            "zu",
          ]),
          painPoints: input.painPoints ?? [
            "too many manual approvals",
            "no automated valuation step",
          ],
        };

        let proposal;
        try {
          proposal = await proposeNewAgent(ctxForKagiso);
        } catch (err: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Kagiso could not draft a proposal: ${err?.message ?? err}`,
          });
        }

        // Persist as a roadmap item so it shows up in the Kagiso Roadmap UI.
        await createRoadmapItem({
          title: `New agent proposal: ${proposal.name} — ${proposal.role}`,
          description: `${proposal.description}\n\nImpact: ${proposal.impactEstimate}\nGap: ${proposal.evidence.gapAnalysis}`,
          category: "new_agent",
          priority: proposal.confidence >= 0.7 ? "high" : "medium",
          creditCostEstimate: 120,
          roiEstimateZar: 150000,
          evidenceJson: {
            source: "kagiso.proposeAgent",
            confidence: proposal.confidence,
            sampleOutput: proposal.sampleOutput,
            evidence: proposal.evidence,
            dealershipId,
          },
        });

        await logAgentActivity({
          agentId: "improvement",
          action: "proposed_agent",
          subjectType: "roadmap_item",
          subjectId: 0,
          summary: `Kagiso proposed ${proposal.name} (${proposal.role}) for ${ctxForKagiso.dealershipName}`,
          payload: { proposal, dealershipId },
        });

        return { ok: true as const, proposal };
      }),

    /**
     * v28 #1 — Kagiso visibility: returns last audit timestamp, autonomous mode status,
     * pending findings count, and next audit due time. Shown on /admin/kagiso-roadmap banner.
     */
    autonomousStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getAutonomousAuditStatus } = await import("./db");
      return getAutonomousAuditStatus();
    }),

    /**
     * Lightweight pending-patch count for the admin sidebar badge. Returns a
     * single integer; safe to poll every minute without flooding the DB.
     */
    pendingPatchCount: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const n = await countPendingProposedPatches();
      return { count: n };
    }),

    listProposedPatches: protectedProcedure
      .input(
        z
          .object({
            status: z
              .enum(["proposed", "applied", "rejected", "failed", "stale"])
              .optional(),
            limit: z.number().int().min(1).max(500).optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return listProposedPatches({
          status: input?.status,
          limit: input?.limit,
        });
      }),

    /**
     * v29 — Apply a previously proposed patch (founder one-click). Runs
     * through the constrained applier, which re-validates path/size and
     * verifies the replacement post-write.
     */
    applyPatch: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const patch = await getProposedPatch(input.id);
        if (!patch) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Patch not found" });
        }
        if (patch.status !== "proposed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Patch is ${patch.status}, not proposed`,
          });
        }
        const result = await applyProposedPatch({
          filePath: patch.filePath,
          findText: patch.findText,
          replaceText: patch.replaceText,
        });
        if (!result.ok) {
          await markPatchFailed(patch.id, result.error);
          return { ok: false, error: result.error };
        }
        await markPatchApplied(patch.id, ctx.user.id);
        return { ok: true, bytesWritten: result.bytesWritten };
      }),

    /**
     * v29 — Reject a proposed patch (founder dismiss). Records the reason for
     * audit trail. The underlying finding is left in place so it can be
     * surfaced again next audit run if it still applies.
     */
    rejectPatch: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          reason: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const patch = await getProposedPatch(input.id);
        if (!patch) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Patch not found" });
        }
        if (patch.status !== "proposed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Patch is ${patch.status}, not proposed`,
          });
        }
        await markPatchRejected(patch.id, ctx.user.id, input.reason);
        return { ok: true };
      }),
  }),

  // ---- Thandi: Accountant Agent ----
  thandi: router({
    listInvoices: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          status: z.string().optional(),
          limit: z.number().int().min(1).max(200).default(50),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return listInvoices(input.dealershipId, input.status, input.limit);
      }),

    getInvoice: protectedProcedure
      .input(z.object({ invoiceId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const invoice = await getInvoice(input.invoiceId);
        if (!invoice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
        }
        const payments = await listPayments(invoice.id);
        const dealership = await getDealershipById(invoice.dealershipId);
        const lead =
          invoice.leadId > 0 ? await getLeadById(invoice.leadId) : null;
        const vehicle =
          invoice.vehicleId > 0 ? await getVehicle(invoice.vehicleId) : null;

        const { buildInvoiceDocumentView } = await import(
          "../shared/invoiceDocument"
        );
        const { getGrayArxBankDetailsFromEnv } = await import(
          "./_core/grayArxBank"
        );
        const document = buildInvoiceDocumentView({
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            leadId: Number(invoice.leadId) || 0,
            vehicleId: Number(invoice.vehicleId) || 0,
            subtotal: invoice.subtotal,
            vatAmount: invoice.vatAmount,
            totalAmount: invoice.totalAmount,
          },
          dealership,
          lead,
          vehicle,
          payments,
          platformBank: getGrayArxBankDetailsFromEnv(),
        });

        return { invoice, payments, dealership, lead, vehicle, document };
      }),

    /**
     * Preview the invoice document (letterhead, line items, VAT, EFT details)
     * WITHOUT persisting anything — lets Thandi/founder sanity-check a draft
     * before it's actually created or sent. Same rendering used by the real
     * print page (buildInvoiceDocumentView), just fed synthetic invoice data.
     */
    previewInvoice: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          // Only set for a referral/commission invoice tied to a specific
          // lead+vehicle. Leave unset (or 0) for standard subscription
          // billing — GrayArx bills dealerships a flat monthly platform fee,
          // not per-lead / per-vehicle-sold.
          leadId: z.number().int().optional(),
          vehicleId: z.number().int().optional(),
          subtotal: z.number().nonnegative(),
          paymentTermsDays: z.number().int().min(1).max(180).default(30),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const leadId = input.leadId ?? 0;
        const vehicleId = input.vehicleId ?? 0;
        const vatRate = GRAYARX_LEGAL.vatRegistered ? 0.15 : 0;
        const vatAmount = Math.round(input.subtotal * vatRate * 100) / 100;
        const totalAmount =
          vatRate === 0
            ? Math.round(input.subtotal * 100) / 100
            : Math.round((input.subtotal + vatAmount) * 100) / 100;
        const dueDate = new Date(Date.now() + input.paymentTermsDays * 24 * 60 * 60 * 1000);

        const dealership = await getDealershipById(input.dealershipId);
        const lead = leadId > 0 ? await getLeadById(leadId) : null;
        const vehicle = vehicleId > 0 ? await getVehicle(vehicleId) : null;

        const { buildInvoiceDocumentView } = await import(
          "../shared/invoiceDocument"
        );
        const { getGrayArxBankDetailsFromEnv } = await import(
          "./_core/grayArxBank"
        );
        const document = buildInvoiceDocumentView({
          invoice: {
            invoiceNumber: "PREVIEW — not yet created",
            status: "draft",
            invoiceDate: new Date(),
            dueDate,
            leadId,
            vehicleId,
            subtotal: input.subtotal,
            vatAmount,
            totalAmount,
          },
          dealership,
          lead,
          vehicle,
          payments: [],
          platformBank: getGrayArxBankDetailsFromEnv(),
        });

        return { document, vatAmount, totalAmount, dueDate };
      }),

    generateInvoice: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          // Optional — only relevant for a referral/commission invoice tied
          // to a specific lead+vehicle. Standard subscription invoices (the
          // common case) leave these unset; the platform letterhead kicks in
          // automatically (see resolveLetterheadMode) whenever either is 0.
          leadId: z.number().int().optional(),
          vehicleId: z.number().int().optional(),
          subtotal: z.number().nonnegative(),
          paymentTermsDays: z.number().int().min(1).max(180).default(30),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const leadId = input.leadId ?? 0;
        const vehicleId = input.vehicleId ?? 0;
        const vatRate = GRAYARX_LEGAL.vatRegistered ? 0.15 : 0;
        const vatAmount = Math.round(input.subtotal * vatRate * 100) / 100;
        const totalAmount =
          vatRate === 0
            ? Math.round(input.subtotal * 100) / 100
            : Math.round((input.subtotal + vatAmount) * 100) / 100;
        const invoiceNumber = `INV-${input.dealershipId}-${Date.now().toString().slice(-8)}`;
        const dueDate = new Date(Date.now() + input.paymentTermsDays * 24 * 60 * 60 * 1000);

        const invoiceId = await createInvoice({
          dealershipId: input.dealershipId,
          leadId,
          invoiceNumber,
          dueDate,
          vehicleId,
          subtotal: input.subtotal,
          vatAmount,
          totalAmount,
        });

        const pdfUrl = `/admin/invoices/${invoiceId}/print`;
        if (invoiceId) {
          await setInvoicePdfUrl(invoiceId, pdfUrl);
        }

        const vatLabel = GRAYARX_LEGAL.vatRegistered
          ? "incl VAT"
          : "no VAT — not VAT-registered";
        await logAgentActivity({
          agentId: "accountant",
          action: "invoice_created",
          subjectType: "invoice",
          subjectId: invoiceId,
          summary: `Drafted invoice ${invoiceNumber} for R ${totalAmount.toFixed(2)} (${vatLabel})`,
          payload: { invoiceId, dealershipId: input.dealershipId, totalAmount, pdfUrl },
        });

        return { invoiceId, invoiceNumber, totalAmount, vatAmount, dueDate, pdfUrl };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          invoiceId: z.number().int(),
          status: z.enum(["draft", "sent", "paid", "overdue"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateInvoiceStatus(input.invoiceId, input.status);
        return { ok: true };
      }),

    recordPayment: protectedProcedure
      .input(
        z.object({
          invoiceId: z.number().int(),
          amount: z.number().positive(),
          paymentDate: z.date(),
          paymentMethod: z.enum(["bank_transfer", "card", "cash", "cheque"]),
          reference: z.string().max(100).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const paymentId = await createPayment({
          invoiceId: input.invoiceId,
          amount: input.amount,
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          reference: input.reference,
        });
        // Auto-mark paid if total payments cover the invoice
        const invoice = await getInvoice(input.invoiceId);
        if (invoice) {
          const allPayments = await listPayments(input.invoiceId);
          const totalPaid = allPayments.reduce(
            (sum: number, p: any) => sum + Number(p.amount),
            0,
          );
          if (totalPaid >= Number(invoice.totalAmount)) {
            await updateInvoiceStatus(input.invoiceId, "paid");
          }
        }
        await logAgentActivity({
          agentId: "accountant",
          action: "payment_recorded",
          subjectType: "invoice",
          subjectId: input.invoiceId,
          summary: `Recorded payment of R ${input.amount.toFixed(2)} against invoice #${input.invoiceId}`,
          payload: { paymentId, invoiceId: input.invoiceId },
        });
        return { paymentId };
      }),

    vatReport: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          periodStart: z.date(),
          periodEnd: z.date(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const invoiceList = await listInvoices(input.dealershipId, undefined, 500);
        const inPeriod = invoiceList.filter((inv: any) => {
          const d = new Date(inv.invoiceDate);
          return d >= input.periodStart && d <= input.periodEnd;
        });
        const totalVatCollected = inPeriod.reduce(
          (sum: number, inv: any) => sum + Number(inv.vatAmount ?? 0),
          0,
        );
        const flagged = totalVatCollected > 50000;
        return {
          totalInvoices: inPeriod.length,
          totalVatCollected: Math.round(totalVatCollected * 100) / 100,
          flagged,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
        };
      }),
  }),

  // ---- POPIA Consent Management ----
  popia: router({
    sign: publicProcedure
      .input(signPopiaConsentSchema)
      .mutation(async ({ input }) => {
        return await signPopiaConsent(input);
      }),

    checkStatus: protectedProcedure
      .input(
        z.object({
          userId: z.number().int(),
          dealershipId: z.number().int(),
        }),
      )
      .query(async ({ input }) => {
        return await checkPopiaConsentStatus(input.userId, input.dealershipId);
      }),

    reconfirm: protectedProcedure
      .input(
        z.object({
          consentId: z.number().int(),
        }),
      )
      .mutation(async ({ input }) => {
        return await reconfirmPopiaConsentAction(input.consentId);
      }),
  }),

  // ---- Pilot Email Campaign Management ----
  pilotEmail: pilotEmailRouter,

  // ---- Phase 33: Advanced Features ----
  // (Using existing routers: notifications, auditLog)
  // New routers added:
  
  // Lead quality scoring
  leadQuality: router({
    calculateScore: protectedProcedure
      .input(z.object({ leadId: z.number().int() }))
      .mutation(async ({ input }) => {
        const { calculateLeadQualityScore } = await import("./leadQualityScorer");
        return calculateLeadQualityScore(input.leadId);
      }),
    
    getInsights: protectedProcedure
      .input(z.object({ leadId: z.number().int() }))
      .query(async ({ input }) => {
        const { getLeadQualityInsights } = await import("./leadQualityScorer");
        return getLeadQualityInsights(input.leadId);
      }),
  }),

  // Performance metrics
  performance: router({
    calculateDaily: protectedProcedure
      .input(z.object({ date: z.date().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { calculateDailyMetrics } = await import("./performanceMetrics");
        return calculateDailyMetrics(ctx.user.dealershipId || 0, input?.date ?? new Date());
      }),
    
    getMetrics: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        const { getMetricsForDateRange } = await import("./performanceMetrics");
        return getMetricsForDateRange(ctx.user.dealershipId || 0, input.startDate, input.endDate);
      }),
    
    getSummary: protectedProcedure
      .input(z.object({ days: z.number().int().min(1).max(365).optional() }))
      .query(async ({ ctx, input }) => {
        const { getPerformanceSummary } = await import("./performanceMetrics");
        return getPerformanceSummary(ctx.user.dealershipId || 0, input?.days ?? 30);
      }),
  }),

  // ---- Agent Chat — founder/admin direct chat with named agents ----
  agentChat: router({
    /**
     * Send a message to a named agent (by display name) and receive an
     * intelligent reply. The agent has access to relevant DB context (recent
     * bookings, leads, activity) and can perform real actions when the message
     * contains an explicit intent like "cancel", "reclassify", "update status".
     */
    sendMessage: protectedProcedure
      .input(
        z.object({
          agentId: z.enum([
            "nala",
            "kagiso",
            "lerato",
            "tumi",
            "mia",
            "sipho",
            "thandi",
            "bongi",
            "naledi",
            "themba",
          ]),
          message: z.string().min(1).max(2000),
          conversationId: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Direct agent chat is a GrayArx founder/admin ops tool — not for dealers.
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Agent chat is reserved for GrayArx founders and admins.",
          });
        }
        const user: any = ctx.user;
        const db = await getDb();

        // Map display name → internal AgentId
        const nameToId: Record<string, string> = {
          nala: "whatsapp",
          kagiso: "improvement",
          lerato: "booking",
          tumi: "tradein",
          mia: "email",
          sipho: "prospector",
          thandi: "accountant",
          bongi: "fallback",
          naledi: "preapproval",
          themba: "calling",
        };
        const internalAgentId = nameToId[input.agentId] as any;
        const persona = AGENTS[internalAgentId as keyof typeof AGENTS];

        // Build context blob for the agent (recent relevant data)
        const contextParts: string[] = [];
        const dealershipId: number | undefined = user?.dealershipId ?? undefined;

        try {
          // Always include recent activity for this agent
          const recentActivity = await listAgentActivity({ agentId: internalAgentId, limit: 10 });
          if (recentActivity.length) {
            contextParts.push(
              "Your recent actions:\n" +
                recentActivity
                  .map((a) => `- [${new Date(a.createdAt).toLocaleString("en-ZA")}] ${a.summary}`)
                  .join("\n"),
            );
          }

          // Booking agent gets test-drive context
          if (internalAgentId === "booking" && db) {
            const bookings = await listTestDriveBookings(dealershipId, undefined, 20);
            if (bookings.length) {
              contextParts.push(
                "Recent test-drive bookings:\n" +
                  bookings
                    .slice(0, 10)
                    .map(
                      (b) =>
                        `- ${b.referenceNumber}: ${b.customerName} (${b.status}) — ${b.suggestedSlotStart ? new Date(b.suggestedSlotStart).toLocaleString("en-ZA") : "no slot"}`,
                    )
                    .join("\n"),
              );
            }
          }

          // Lead-facing agents get leads context
          if ((internalAgentId === "whatsapp" || internalAgentId === "email") && db) {
            const leadsData = await listLeads(20);
            if (leadsData && leadsData.length) {
              contextParts.push(
                "Recent leads:\n" +
                  leadsData
                    .slice(0, 10)
                    .map((l: any) => `- ${l.name ?? l.customerName ?? "?"} (${l.status}) — ${l.source ?? "unknown source"}`)
                    .join("\n"),
              );
            }
          }
        } catch {
          // context enrichment is best-effort
        }

        // Build a founder-chat-specific system prompt
        const dealerQaBlock = agentGetsDealerQaPlaybook(internalAgentId)
          ? `\n${formatDealerQaForSystemPrompt()}`
          : "";
        const agentSystemPrompt = [
          `You are ${persona.displayName}, the ${persona.role} at GrayArx — the AI operating system for South African car dealerships.`,
          `You are chatting directly with the GrayArx founder/admin via an internal console. This is NOT a customer-facing channel.`,
          `Be concise, honest, and action-oriented. You can refer to internal data.`,
          `Your personality: professional, SA-context aware, helpful. Short replies (under 150 words) unless asked for detail.`,
          ``,
          `Your role: ${persona.description}`,
          ``,
          contextParts.length
            ? `Current data context:\n${contextParts.join("\n\n")}`
            : "No live data available right now.",
          dealerQaBlock,
          ``,
          "If the founder asks you to perform an action (cancel a booking, update a status, etc.), respond with:",
          "1. Confirmation of what you understood",
          "2. The action you took (or will take)",
          "3. Any caveats or follow-up needed",
          "If you cannot perform an action directly, say so clearly and suggest how to do it manually.",
          "",
          "IMPORTANT: Never claim to be a human. Never use forbidden AI phrases like 'As an AI...'",
        ]
          .filter(Boolean)
          .join("\n");

        // Detect intent for real DB actions (simple keyword parsing)
        type ActionResult = { actionTaken: string; details: string } | null;
        let actionResult: ActionResult = null;
        const lowerMsg = input.message.toLowerCase();

        // Action: reclassify a booking
        const reclassifyMatch =
          /reclassif|wasn.t a test drive|not a test drive|mark.+as.+(viewing|consult|call|inquiry)/i.test(
            input.message,
          );
        const refMatch = input.message.match(/\bGA-[A-Z0-9]+\b/i);

        if (reclassifyMatch && refMatch && internalAgentId === "booking") {
          try {
            const bookings = await listTestDriveBookings(dealershipId, undefined, 200);
            const target = bookings.find(
              (b) => b.referenceNumber.toUpperCase() === refMatch[0].toUpperCase(),
            );
            if (target && db) {
              let actualType: "general_viewing" | "consultation" | "call" | "inquiry" | "other" = "general_viewing";
              if (/consult/i.test(input.message)) actualType = "consultation";
              else if (/\bcall\b/i.test(input.message)) actualType = "call";
              else if (/inquiry|enquiry/i.test(input.message)) actualType = "inquiry";

              const reclassifiedNote = `[RECLASSIFIED via Agent Chat] Actual type: ${actualType.replace(/_/g, " ")}\nReclassified by: ${user?.email ?? "founder"} at ${new Date().toISOString()}`;
              await updateTestDriveBookingStatus(target.id, {
                status: "cancelled",
                notes: reclassifiedNote,
                resolvedBy: user?.id ?? null,
                resolvedAt: new Date(),
              });
              actionResult = {
                actionTaken: "reclassify_booking",
                details: `Booking ${target.referenceNumber} reclassified from test_drive → ${actualType.replace(/_/g, " ")} and cancelled.`,
              };
            }
          } catch {
            // best-effort
          }
        }

        // Cancel a booking by reference
        const cancelMatch = /cancel|cancel.+booking/i.test(input.message);
        if (cancelMatch && refMatch && internalAgentId === "booking" && !actionResult) {
          try {
            const bookings = await listTestDriveBookings(dealershipId, undefined, 200);
            const target = bookings.find(
              (b) => b.referenceNumber.toUpperCase() === refMatch[0].toUpperCase(),
            );
            if (target && db) {
              await updateTestDriveBookingStatus(target.id, {
                status: "cancelled",
                notes: `Cancelled via Agent Chat by ${user?.email ?? "founder"} at ${new Date().toISOString()}`,
                resolvedBy: user?.id ?? null,
                resolvedAt: new Date(),
              });
              actionResult = {
                actionTaken: "cancel_booking",
                details: `Booking ${target.referenceNumber} for ${target.customerName} has been cancelled.`,
              };
            }
          } catch {
            // best-effort
          }
        }

        // Build context message with action result
        const userMessage = actionResult
          ? `${input.message}\n\n[System: Action already executed — ${actionResult.details} Please confirm and summarise what happened for the founder.]`
          : input.message;

        // Call memory-augmented LLM — fetches relevant past interactions automatically
        let reply = "";
        let memoryUsed = 0;
        try {
          const memResult = await generateMemoryAugmentedReply({
            agentId: internalAgentId,
            language: "en",
            customerMessage: userMessage,
            context: contextParts.length ? contextParts.join("\n\n") : undefined,
          });
          reply = memResult.reply;
          memoryUsed = memResult.memoryUsed;
        } catch (llmErr) {
          // Data-driven fallback when LLM is unavailable
          if (actionResult) {
            reply = `Done. ${actionResult.details} Let me know if you need anything else.`;
          } else {
            // Build a useful response from the DB data we already fetched
            const q = input.message.toLowerCase();
            const lines: string[] = [];

            if (contextParts.length) {
              // Detect what the founder is asking about and surface relevant data
              if (/audit|finding|error|fail|problem|issue/i.test(q)) {
                const activityCtx = contextParts.find((p) => p.startsWith("Your recent actions"));
                lines.push(activityCtx ? `Here's what I have from recent activity:\n\n${activityCtx}` : "No recent activity recorded for this agent.");
              } else if (/lead|customer|prospect/i.test(q)) {
                const leadsCtx = contextParts.find((p) => p.startsWith("Recent leads"));
                lines.push(leadsCtx ? leadsCtx : "No recent leads data available right now.");
              } else if (/booking|test.?drive|appointment|slot/i.test(q)) {
                const bookCtx = contextParts.find((p) => p.startsWith("Recent test-drive"));
                lines.push(bookCtx ? bookCtx : "No recent bookings found.");
              } else if (/status|health|how.+doing|summary|report/i.test(q)) {
                lines.push(`Status summary for ${persona.displayName}:\n\n${contextParts.join("\n\n")}`);
              } else {
                // Default: surface everything available
                lines.push(`Here's what I can see right now:\n\n${contextParts.join("\n\n")}`);
              }
              lines.push("\n_(AI reasoning temporarily unavailable — showing live DB data directly.)_");
            } else {
              lines.push(`I'm ${persona.displayName}. No live data available right now, and the AI reasoning layer is temporarily offline. Try asking about bookings, leads, or agent activity once the system reconnects.`);
            }
            reply = lines.join("\n");
          }
          // Record the failure so agents learn from it
          void recordOutcome({
            agentId: internalAgentId,
            relatedAction: "founder_chat",
            outcome: "failure",
            detail: `LLM unavailable — served data-driven fallback. Error: ${llmErr instanceof Error ? llmErr.message.slice(0, 120) : String(llmErr).slice(0, 120)}`,
          });
        }

        // Parse any "action: <type> <args>" directives embedded in the reply
        const actionLineMatches = reply.match(/^action:\s+(\S+)\s+(.+)$/gim) ?? [];
        for (const line of actionLineMatches) {
          const m = line.match(/^action:\s+(\S+)\s+(.+)$/i);
          if (!m) continue;
          const [, directive, rest] = m;
          const parts = rest.trim().split(/\s+/);
          const ref = parts[0] ?? "";
          const extra = parts.slice(1).join(" ");
          try {
            if (directive === "cancel_booking" && !actionResult) {
              const bookings = await listTestDriveBookings(dealershipId, undefined, 200);
              const target = bookings.find(
                (b) => b.referenceNumber.toUpperCase() === ref.toUpperCase(),
              );
              if (target && db) {
                await updateTestDriveBookingStatus(target.id, {
                  status: "cancelled",
                  notes: `Cancelled via AI directive at ${new Date().toISOString()}`,
                  resolvedBy: null,
                  resolvedAt: new Date(),
                });
                actionResult = {
                  actionTaken: "cancel_booking",
                  details: `Booking ${target.referenceNumber} cancelled via AI directive.`,
                };
              }
            } else if (directive === "update_lead_status") {
              const leadId = parseInt(ref, 10);
              if (!isNaN(leadId) && extra) {
                await updateLeadStatus(leadId, extra as any);
                actionResult = {
                  actionTaken: "update_lead_status",
                  details: `Lead ${leadId} status updated to "${extra}" via AI directive.`,
                };
              }
            } else if (directive === "reschedule_booking" && !actionResult) {
              const bookings = await listTestDriveBookings(dealershipId, undefined, 200);
              const target = bookings.find(
                (b) => b.referenceNumber.toUpperCase() === ref.toUpperCase(),
              );
              if (target && db && extra) {
                const newDate = new Date(extra);
                if (!isNaN(newDate.getTime())) {
                  await updateTestDriveBookingStatus(target.id, {
                    status: "confirmed",
                    notes: `Rescheduled via AI directive to ${extra}`,
                    resolvedBy: null,
                    resolvedAt: null,
                  });
                  actionResult = {
                    actionTaken: "reschedule_booking",
                    details: `Booking ${target.referenceNumber} rescheduled to ${extra}.`,
                  };
                }
              }
            }
          } catch {
            // best-effort directive execution
          }
        }

        const conversationId =
          input.conversationId ?? `chat-${input.agentId}-${Date.now()}`;

        // Log to agent_activity
        await logAgentActivity({
          agentId: internalAgentId,
          action: "founder_chat",
          subjectType: "agent_chat",
          subjectId: null,
          summary: `Founder asked: "${input.message.slice(0, 80)}${input.message.length > 80 ? "…" : ""}"`,
          payload: {
            conversationId,
            userMessage: input.message,
            agentReply: reply,
            actionTaken: actionResult ?? null,
            memoryUsed,
            userId: user?.id ?? null,
          },
        });

        return {
          reply,
          agentId: input.agentId,
          agentName: persona.displayName,
          conversationId,
          actionTaken: actionResult ?? null,
          timestamp: new Date().toISOString(),
        };
      }),

    /**
     * Fetch recent agent chat history from agent_activity, optionally
     * filtered to a specific agent by display name.
     */
    getHistory: protectedProcedure
      .input(z.object({ agentId: z.string().optional(), limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ input }) => {
        const nameToId: Record<string, string> = {
          nala: "whatsapp",
          kagiso: "improvement",
          lerato: "booking",
          tumi: "tradein",
          mia: "email",
          sipho: "prospector",
          thandi: "accountant",
          bongi: "fallback",
          naledi: "preapproval",
          themba: "calling",
        };
        const internalId = input.agentId ? nameToId[input.agentId] : undefined;
        const rows = await listAgentActivity({
          agentId: internalId as any,
          limit: input.limit ?? 50,
        });
        // Filter to only founder_chat actions
        return rows.filter((r) => r.action === "founder_chat");
      }),
  }),

  // Bulk lead import
  leadImport: router({
    importCSV: protectedProcedure
      .input(z.object({
        fileName: z.string().max(255),
        csvData: z.string().max(1_000_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const { importLeadsFromCSV } = await import("./bulkLeadImporter");
        return importLeadsFromCSV(ctx.user.dealershipId || 0, input.fileName, input.csvData);
      }),
    
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ ctx, input }) => {
        const { getImportHistory } = await import("./bulkLeadImporter");
        return getImportHistory(ctx.user.dealershipId || 0, input?.limit ?? 50);
      }),
    
    getDetails: protectedProcedure
      .input(z.object({ importId: z.number().int() }))
      .query(async ({ input }) => {
        const { getImportDetails } = await import("./bulkLeadImporter");
        return getImportDetails(input.importId);
      }),
    
    retryFailed: protectedProcedure
      .input(z.object({ importId: z.number().int() }))
      .mutation(async ({ input }) => {
        const { retryFailedImport } = await import("./bulkLeadImporter");
        return retryFailedImport(input.importId);
      }),
  }),
});

function isFounderOrAdmin(user: any): boolean {
  return user && (user.role === "founder" || user.role === "admin");
}

function assertDealerOrAdmin(user: any): void {
  if (isFounderOrAdmin(user)) return;
  const dealerRoles = ["dealer_owner", "dealer_consultant"];
  if (user && dealerRoles.includes(user.role)) return;
  throw new TRPCError({ code: "FORBIDDEN", message: "Dealer or admin access required" });
}

export type AppRouter = typeof appRouter;
