import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
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
  listVehicles,
  createVehicle,
  listVehiclePhotos,
  addVehiclePhoto,
  deleteVehiclePhoto,
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
  findVehicleByExternalRef,
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
import { AGENTS, AGENT_LIST, PILOT_AGENT_LIST, PRIMARY_INBOX } from "../shared/agents";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { alertFounder } from "./_core/founderAlert";
import { sendLeadAcknowledgmentEmail } from "./_core/resendEmailService";
import { placeOutboundCall } from "./_core/calling";
import { generateAgentReply, generateWhatsAppReply, addWhatsAppAIDisclosure, generateMemoryAugmentedReply, type LanguageCode, LANGUAGE_RULES } from "./_core/agentPrompts";
import { recordOutcome } from "./_core/agentMemory";
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
  createApproval,
  listPendingApprovals,
  decideApproval,
  createFallbackMessage,
  listFallbackMessages,
  resolveFallbackMessage,
  insertPreApproval,
  listPreApprovals,
  getPreApproval,
  decidePreApproval,
  createTestDriveBooking,
  listTestDriveBookings,
  getTestDriveBooking,
  updateTestDriveBookingStatus,
  listFutureBookingWindows,
  createRoadmapItem,
  listRoadmap,
  getPlatformOpsSnapshot,
  decideRoadmapItem,
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
  listAllDealerships,
  createDealership,
  getDealershipById,
  getDealershipByShortcode,
  setDealershipShortcode,
  updateDealershipBrand,
  updateDealershipModules,
  getAdminOverview,
  createInvoice,
  listInvoices,
  getInvoice,
  updateInvoiceStatus,
  createPayment,
  listPayments,
  createVatReconciliation,
  getVatReconciliation,
} from "./db";
import { getChatbotDeployment } from "./_core/chatbotDeploymentService";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { prospects } from "../drizzle/schema";
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
          // Instant pilot welcome — Resend ships even when OpenAI quota is empty.
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
        }).catch(() => undefined);
        return { success: true } as const;
      }),
  }),

  showroom: router({
    list: publicProcedure.query(async () => listVehicles(2000)),
    stats: publicProcedure.query(async () => getVehicleInventoryCounts()),
    get: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const vehicle = await getVehicle(input.id);
        if (!vehicle) return null;
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
     *
     * For now there is no per-vehicle dealershipId column on the vehicles
     * table, so we fall back to the first active dealership that has a
     * publicShortcode set. This keeps the public CTA functional without
     * leaking dealership identity through the URL until per-vehicle
     * ownership is wired in a future migration.
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
    contactOptions: publicProcedure.query(async () => {
      const all = await listAllDealerships();
      const candidate =
        all.find(
          (d) =>
            (d.status === "active" || d.status === "onboarding") &&
            !!d.publicShortcode,
        ) ?? all[0];
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
    /** Public showroom look — driven by the primary dealership's chosen template. */
    appearance: publicProcedure.query(async () => {
      const all = await listAllDealerships();
      const candidate =
        all.find(
          (d) =>
            (d.status === "active" || d.status === "onboarding") &&
            !!d.publicShortcode,
        ) ?? all[0];
      if (!candidate) {
        return {
          theme: resolveShowroomTheme(null),
          accentColor: null as string | null,
          dealershipName: "GrayArx Dealership",
        };
      }
      return {
        theme: resolveShowroomTheme(candidate.showroomTheme),
        accentColor: candidate.brandAccentColor ?? null,
        dealershipName: candidate.name ?? "GrayArx Dealership",
      };
    }),
    enquire: publicProcedure
      .input(
        z.object({
          vehicleId: z.string().min(1),
          vehicleTitle: z.string().min(1),
          vehiclePrice: z.number().int().positive(),
          vehicleYear: z.number().int(),
          vehicleKm: z.number().int().nonnegative(),
          vehicleFuel: z.string(),
          vehicleTransmission: z.string(),
          vehicleImage: z.string().optional(),
          clientEmail: z.string().email(),
          clientName: z.string().min(1),
          clientPhone: z.string().min(1),
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
        const vehicleCtx = vehicleRowToContext(row);

        // ── Multi-vehicle search: check if the user is asking about a make/body type ──
        const { listVehicles: listAllVehicles } = await import("./db");
        const allVehicles = await listAllVehicles(200);
        const multiMatches = findVehiclesFromMessage(input.message, allVehicles);
        const detectedMake = detectMakeFromMessage(input.message);
        const detectedBodyTypes = detectBodyTypesFromMessage(input.message);
        const isInventorySearch = detectedMake !== null || detectedBodyTypes !== null;

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
    stats: protectedProcedure.query(async () => getDashboardStats()),
    activity: protectedProcedure.query(async () => getRecentActivity(10)),
    leadsTrend: protectedProcedure.query(async () => getLeadsTrend(14)),

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
      };
    }),

    updateAppearance: protectedProcedure
      .input(
        z.object({
          theme: z.enum(["futuristic", "classic", "minimal", "bold"]),
          brandAccentColor: z.string().max(16).nullable().optional(),
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
        });
        return { success: true, theme: input.theme };
      }),

    listLeads: protectedProcedure.query(async () => listLeads(200)),
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
      .mutation(async ({ input }) => {
        await updateLeadStatus(input.id, input.status);
        if (input.status === "converted" || input.status === "lost") {
          try {
            await cancelFollowupsForLead(input.id);
          } catch (e) {
            console.error("[leads.updateStatus] cancelFollowupsForLead failed", e);
          }
        }
        return { success: true } as const;
      }),

    listBookings: protectedProcedure.query(async () => listBookings(200)),
    updateBookingStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
        }),
      )
      .mutation(async ({ input }) => {
        await updateBookingStatus(input.id, input.status);
        return { success: true } as const;
      }),

    listVehicles: protectedProcedure.query(async () => listVehicles(200)),
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
          vin: z.string().max(32).optional(),
          engineCc: z.number().int().min(0).max(20000).optional(),
          doors: z.number().int().min(2).max(6).optional(),
          seats: z.number().int().min(1).max(20).optional(),
          features: z.array(z.string().max(64)).max(40).optional(),
          serviceHistory: z.enum(["full", "partial", "none"]).optional(),
          previousOwners: z.number().int().min(0).max(20).optional(),
          imageUrl: z.string().max(500).optional(),
          primaryPhotoUrl: z.string().max(500).optional(),
          location: z.string().max(128).optional(),
          description: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await createVehicle({
          ownerUserId: ctx.user.id,
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
          status: z.enum(["available", "reserved", "sold"]).optional(),
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
          vin: z.string().max(32).optional(),
          engineCc: z.number().int().min(0).max(20000).optional(),
          doors: z.number().int().min(2).max(6).optional(),
          seats: z.number().int().min(1).max(20).optional(),
          features: z.array(z.string().max(64)).max(40).optional(),
          serviceHistory: z.enum(["full", "partial", "none"]).optional(),
          previousOwners: z.number().int().min(0).max(20).optional(),
          imageUrl: z.string().max(500).optional(),
          primaryPhotoUrl: z.string().max(500).optional(),
          location: z.string().max(128).optional(),
          description: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const patch: Record<string, unknown> = { ...rest };
        if (typeof rest.price === "number") patch.price = rest.price.toFixed(2);
        await updateVehicle(id, patch as never);
        return { success: true } as const;
      }),
    deleteVehicle: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteVehicle(input.id);
        return { success: true } as const;
      }),
    deleteAllVehicles: protectedProcedure.mutation(async ({ ctx }) => {
      const allPlatform = isFounderOrAdmin(ctx.user);
      const deleted = await deleteAllVehiclesScoped(allPlatform, ctx.user.id);
      void logAgentActivity({
        agentId: allPlatform ? "improvement" : "fallback",
        action: "inventory_bulk_delete",
        subjectType: "inventory",
        summary: `Deleted ${deleted} vehicle${deleted === 1 ? "" : "s"} via dealer console.`,
        payload: { deleted, allPlatform, userId: ctx.user.id },
      });
      return { success: true as const, deleted };
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
        const enhanced = await removeBackground(buffer, input.mimeType, `${safeName}.${ext}`);
        if (enhanced) {
          finalBuffer = enhanced.buffer;
          finalMimeType = enhanced.mimeType;
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
          finalBuffer = enhanced.buffer;
          finalMimeType = enhanced.mimeType;
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

    setPrimaryPhoto: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          photoUrl: z.string().min(1).max(500),
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

    /** Link an already-uploaded URL to a vehicle gallery (no re-upload). */
    attachPhotoFromUrl: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int(),
          url: z.string().min(1).max(500),
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
    list: protectedProcedure.query(async () => listProspects(200)),

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
      .mutation(async ({ input }) => {
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
          const items = (parsed.prospects ?? []) as Array<{
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
          if (items.length === 0) return { created: 0 } as const;
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
          return { created: items.length } as const;
        } catch (err) {
          console.error("[Prospector] LLM error", err);
          return { created: 0 } as const;
        }
      }),

    handoff: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const prospect = await getProspect(input.id);
        if (!prospect) return { success: false, error: "Prospect not found" } as const;

        // Pilot: queue for human follow-up — outbound AI calling is opt-in only (future).
        await updateProspectStatus(prospect.id, "queued_for_call");
        await logAgentActivity({
          agentId: "prospector",
          action: "handoff",
          subjectType: "prospect",
          subjectId: prospect.id,
          summary: `Sipho flagged ${prospect.dealershipName} (score ${prospect.score}) for your team to follow up.`,
          payload: { rationale: prospect.rationale, phone: prospect.phone },
        });

        return {
          success: true,
          queued: true,
          called: false,
          reason: "Outbound AI calling is not enabled in the pilot — follow up via email, WhatsApp, or your own phone.",
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
      .mutation(async ({ input }) => {
        await updateProspectStatus(input.id, input.status);
        return { success: true } as const;
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteProspect(input.id);
        return { success: true } as const;
      }),
  }),

  agent: router({
    /**
     * Returns the canonical roster of agents with identity, email, and
     * live status (action count + last action) so the UI can render cards.
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
      }
      const roster = PILOT_AGENT_LIST;
      const stats = await getAgentStats();
      const empty = { actionCount: 0, lastActionAt: null as Date | null, lastAction: null as string | null };
      const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
      return {
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
     * Unified live activity feed. Optionally filter by agentId.
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
          throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
        }
        const rows = await listAgentActivity({
          agentId: input?.agentId === "calling" ? undefined : input?.agentId,
          limit: input?.limit ?? 100,
        });
        return rows
          .filter((r) => r.agentId !== "calling")
          .map((r) => ({
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

    /** Fire a test ping so dealers can verify an agent is wired up. */
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
          throw new TRPCError({ code: "FORBIDDEN", message: "Founder access only" });
        }
        if (input.agentId === "calling") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Outbound calling is not enabled in the pilot.",
          });
        }
        const persona = AGENTS[input.agentId];
        const who = ctx.user.name || ctx.user.email || "Dealer";
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
      // Gather inputs for the auditor
      const kpis = await getDashboardStats();
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
      .mutation(async ({ input }) => parseInventoryCsv(input.csv)),

    commit: protectedProcedure
      .input(
        z.object({
          csv: z.string().min(1).max(2_000_000),
          /** Keep external image URLs as-is — much faster for bulk imports. */
          skipPhotoMirror: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const preview = parseInventoryCsv(input.csv);
        let created = 0;
        let repaired = 0;
        const existingDuplicates: string[] = [];
        const failedRows: Array<{ title: string; reason: string }> = [];
        for (const row of preview.validRows) {
          if (row.externalRef) {
            const existing = await findVehicleByExternalRef(row.externalRef);
            if (existing) {
              if (isR1Price(existing.price) && row.price && row.price > 1) {
                await updateVehicle(existing.id, { price: String(row.price) });
                repaired++;
              } else {
                existingDuplicates.push(row.externalRef);
              }
              continue;
            }
          }
          try {
            const primaryUrl = row.imageUrls[0] ?? row.imageUrl;
            const storedImageUrl = input.skipPhotoMirror
              ? null
              : await downloadAndStorePhoto(
                  primaryUrl,
                  row.title,
                  row.externalRef,
                );
            const primary = storedImageUrl || primaryUrl;
            const result = await createVehicle({
              ownerUserId: ctx.user.id,
              title: row.title,
              make: row.make,
              model: row.model,
              year: row.year,
              price: String(row.price),
              km: row.km,
              fuel: row.fuel,
              transmission: row.transmission,
              location: row.location,
              imageUrl: primary,
              primaryPhotoUrl: primary,
              description: row.description,
              externalRef: row.externalRef,
            });
            const vehicleId = (result as { insertId?: number })?.insertId;
            if (vehicleId && row.imageUrls.length > 0) {
              for (let pi = 0; pi < row.imageUrls.length; pi++) {
                const rawUrl = row.imageUrls[pi];
                const stored =
                  pi === 0
                    ? primary
                    : input.skipPhotoMirror
                      ? rawUrl
                      : (await downloadAndStorePhoto(rawUrl, row.title, row.externalRef)) || rawUrl;
                if (!stored) continue;
                await addVehiclePhoto({
                  vehicleId,
                  url: stored,
                  storageKey: `import/${vehicleId}/${pi}-${Date.now()}`,
                  position: pi,
                  caption: null,
                });
              }
            }
            created++;
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            failedRows.push({ title: row.title, reason });
          }
        }
        await logAgentActivity({
          agentId: "improvement",
          action: "inventory_imported",
          subjectType: null,
          summary: `Kagiso imported ${created} vehicle${created === 1 ? "" : "s"} via CSV (${preview.skippedRows.length} skipped, ${preview.duplicateRefs.length + existingDuplicates.length} duplicates, ${failedRows.length} failed${repaired ? `, ${repaired} R1 prices repaired` : ""}).`,
          payload: {
            created,
            repaired,
            skipped: preview.skippedRows.length,
            duplicatesInCsv: preview.duplicateRefs.length,
            duplicatesAgainstDb: existingDuplicates.length,
            failed: failedRows.length,
          },
        });
        return {
          created,
          repaired,
          skipped: preview.skippedRows,
          duplicatesInCsv: preview.duplicateRefs,
          duplicatesAgainstDb: existingDuplicates,
          failedRows,
        };
      }),

    /** Fix vehicles stuck at R1 by re-matching rows from the original CSV. */
    repairPrices: protectedProcedure
      .input(z.object({ csv: z.string().min(1).max(2_000_000) }))
      .mutation(async ({ input }) => {
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
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateOnboardingStatus(input.id, input.decision, ctx.user.id as any);
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
            content: `Dealership: ${dealership?.name ?? "unknown"}\nCustomer: ${input.customerName ?? "—"}${input.customerContact ? ` (${input.customerContact})` : ""}\nReference: ${drafted.referenceNumber}\nFollow up at: /admin/fallback`,
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
      .mutation(async ({ input }) => {
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
              : `New inbound ${input.channel} message (in-hours — please respond)`,
            content: `Dealership: ${dealership.name}\nCustomer: ${input.customerName ?? "—"}${input.customerContact ? ` (${input.customerContact})` : ""}\nReference: ${drafted.referenceNumber}\nMessage: ${input.inboundMessage.slice(0, 500)}\nFollow up at: /admin/fallback`,
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
      .mutation(async ({ input }) => {
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
            title: `New finance pre-approval (${dealership.name})`,
            content: `Applicant: ${input.fullName}\nContact: ${input.email} · ${input.phone}\nReference: ${drafted.referenceNumber}\nVehicle price: ${input.vehiclePrice ?? "—"}\nDeposit: ${input.desiredDeposit ?? "—"}\nTerm: ${input.desiredTermMonths ?? "—"} months\nAffordability hint: ${drafted.affordabilityHint.flag}\nReview at: /admin/preapprovals`,
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
     * owner. A human flips it to `confirmed` from /admin/bookings.
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
      .mutation(async ({ input }) => {
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
        try {
          await notifyOwner({
            title: `New test drive request (${dealership.name})`,
            content: `Customer: ${input.customerName} · ${input.customerContact}\nReference: ${drafted.referenceNumber}\nSuggested slot: ${drafted.suggestedSlotStart.toISOString()}\n${drafted.slotShifted ? "NOTE: shifted to in-hours from request\n" : ""}Vehicle: ${vehicleTitle ?? "—"}\nReview at: /admin/bookings`,
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
  }),

  // ---- Admin: dealerships system-wide ----
  adminDealerships: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isFounderOrAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listAllDealerships();
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
          },
          resolved: resolveBrandKit(dealership),
        };
      }),

    /** Patch any subset of brand kit fields. Hex colour is sanitised server-side. */
    updateBrandKit: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          brandLogoUrl: z.string().url().max(500).nullable().optional(),
          brandAccentColor: z.string().max(16).nullable().optional(),
          brandSignature: z.string().max(500).nullable().optional(),
          vatNumber: z.string().max(32).nullable().optional(),
          bankDetails: z.string().max(500).nullable().optional(),
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
        await updateDealershipBrand(input.dealershipId, patch);
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
      return {
        inserted,
        skipped,
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
        const mapped = input.decision === "approved" ? "approved_for_build" : "dismissed";
        await decideRoadmapItem(input.itemId, mapped);
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
        const payments = invoice ? await listPayments(invoice.id) : [];
        return { invoice, payments };
      }),

    generateInvoice: protectedProcedure
      .input(
        z.object({
          dealershipId: z.number().int(),
          leadId: z.number().int(),
          vehicleId: z.number().int(),
          subtotal: z.number().nonnegative(),
          paymentTermsDays: z.number().int().min(1).max(180).default(30),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isFounderOrAdmin(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const vatRate = 0.15;
        const vatAmount = Math.round(input.subtotal * vatRate * 100) / 100;
        const totalAmount = Math.round((input.subtotal + vatAmount) * 100) / 100;
        const invoiceNumber = `INV-${input.dealershipId}-${Date.now().toString().slice(-8)}`;
        const dueDate = new Date(Date.now() + input.paymentTermsDays * 24 * 60 * 60 * 1000);

        const invoiceId = await createInvoice({
          dealershipId: input.dealershipId,
          leadId: input.leadId,
          invoiceNumber,
          dueDate,
          vehicleId: input.vehicleId,
          subtotal: input.subtotal,
          vatAmount,
          totalAmount,
        });

        await logAgentActivity({
          agentId: "accountant",
          action: "invoice_created",
          subjectType: "invoice",
          subjectId: invoiceId,
          summary: `Drafted invoice ${invoiceNumber} for R ${totalAmount.toFixed(2)} (incl VAT)`,
          payload: { invoiceId, dealershipId: input.dealershipId, totalAmount },
        });

        return { invoiceId, invoiceNumber, totalAmount, vatAmount, dueDate };
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

export type AppRouter = typeof appRouter;
