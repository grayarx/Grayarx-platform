import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertCircle, X } from "lucide-react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";

// Public
import Home from "./pages/Home";
import Showroom from "./pages/Showroom";
import VehicleDetail from "./pages/VehicleDetail";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import LoginEnhanced from "./pages/LoginEnhanced";
import LoginCustom from "./pages/LoginCustom";
import SignUp from "./pages/SignUp";
import CheckEmail from "./pages/CheckEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import ForDealers from "./pages/ForDealers";
import OnboardingWizardNew from "./pages/OnboardingWizardNew";
import AccountSecurity from "./pages/AccountSecurity";
import ConnectedAccounts from "./pages/ConnectedAccounts";
import SecurityDashboard from "./pages/SecurityDashboard";
import AccountRecovery from "./pages/AccountRecovery";
import { TwoFactorSetup } from "./pages/TwoFactorSetup";
import { SocialLoginSetup } from "./pages/SocialLoginSetup";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminAuditLog } from "./pages/AdminAuditLog";
import { AdminRouteGuard } from "./components/AdminRouteGuard";
// import { OAuthCallbackPage } from "./pages/OAuthCallback";
// import { TwoFactorSetupPage } from "./pages/TwoFactorSetupPage";
// import { PasswordResetFlowPage } from "./pages/PasswordResetFlow";
import AdminAuditDashboard from "./pages/AdminAuditDashboard";
import DealershipSecurityReport from "./pages/DealershipSecurityReport";
import DealershipSecurityDashboard from "./pages/DealershipSecurityDashboard";
import AdminAutomationPage from "./pages/AdminAutomationPage";
// import { AdminControlPanel } from "./pages/AdminControlPanel";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import SecurityAgentActivation from "./pages/SecurityAgentActivation";
import ComprehensiveSecurityDashboard from "./pages/ComprehensiveSecurityDashboard";
import { SecurityDashboardPage } from "./pages/SecurityDashboardPage";
import VerifyEmailRequired from "./pages/VerifyEmailRequired";
// import { ProtectedRoute } from "./components/ProtectedRoute";
// import ComplianceDashboard from "./pages/ComplianceDashboard";
import ComplianceAuditTrail from "./pages/ComplianceAuditTrail";
import CommunicationTemplateEditor from "./pages/CommunicationTemplateEditor";
import TrainingModules from "./pages/TrainingModules";
import { AdminDataImport } from "./pages/AdminDataImport";
import InsightsDashboard from "./pages/InsightsDashboard";
import TrainingAssignments from "./pages/TrainingAssignments";
import HelpCenter from "./pages/HelpCenter";
import KPIDashboardPage from "./pages/KPIDashboardPage";

// Dealer (dealer_owner / dealer_consultant)
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/dealer/Leads";
import Bookings from "./pages/dealer/Bookings";
import Inventory from "./pages/dealer/Inventory";
import Agents from "./pages/dealer/Agents";
import AgentChat from "./pages/dealer/AgentChat";
import DealerNetwork from "./pages/dealer/DealerNetwork";

// Admin / founder
import AdminOverview from "./pages/admin/AdminOverview";
import AdminOps from "./pages/admin/AdminOps";
import AdminProspector from "./pages/admin/AdminProspector";
import AdminOnboarding from "./pages/admin/AdminOnboarding";
import AdminPlatformDemos from "./pages/admin/AdminPlatformDemos";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminKagisoRoadmap from "./pages/admin/AdminKagisoRoadmap";
import AdminFallback from "./pages/admin/AdminFallback";
import AdminDealerships from "./pages/admin/AdminDealerships";
import AdminGroupOverview from "./pages/admin/AdminGroupOverview";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminInventoryImport from "./pages/admin/AdminInventoryImport";
import DealerInventoryImport from "./pages/dealer/InventoryImport";
import DealerSettings from "./pages/dealer/Settings";
import DealerTeam from "./pages/dealer/Team";
import TradeInNetwork from "./pages/dealer/TradeInNetwork";
import { InventoryManagementPage } from "./pages/InventoryManagementPage";
import TradeIn from "./pages/TradeIn";
import TradeInStatus from "./pages/TradeInStatus";
import Compare from "./pages/Compare";
import FinanceCalculator from "./pages/FinanceCalculator";
import AdminInvoices from "./pages/admin/AdminInvoices";
import InvoicePrint from "./pages/admin/InvoicePrint";
import AdminBrandKit from "./pages/admin/AdminBrandKit";
import AdminPreApprovals from "./pages/admin/AdminPreApprovals";
import AdminEmailPreview from "./pages/AdminEmailPreview";
import TaxDashboard from "./pages/TaxDashboard";
import CampaignDashboard from "./pages/CampaignDashboard";
import PreApproval from "./pages/PreApproval";
import Book from "./pages/Book";
import EmailSequences from "./pages/EmailSequences";
import Enable2FA from "./pages/Enable2FA";
import EmailPreferences from "./pages/EmailPreferences";
import AdminEmailMetrics from "./pages/AdminEmailMetrics";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AdminHelpCenter from "./pages/admin/AdminHelpCenter";
import AdminMarketGuide from "./pages/admin/AdminMarketGuide";
import AdminPilotDashboard from "./pages/admin/AdminPilotDashboard";
import AgentsEnhanced from "./pages/AgentsEnhanced";
import CSVPhotoManager from "./pages/CSVPhotoManager";
// import { ChatbotAnalyticsDashboard } from "./pages/ChatbotAnalyticsDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDashboardEnhanced from "./pages/AdminDashboardEnhanced";
import AdminDashboardCustomizable from "./pages/AdminDashboardCustomizable";

// Marketplace
import { DealershipOnboarding } from "./pages/DealershipOnboarding";
import DealershipOnboardingForm from "./components/DealershipOnboardingForm";
import { UnifiedShowroom } from "./pages/UnifiedShowroom";
import { RevenueDashboard } from "./pages/RevenueDashboard";

// Chatbot Analytics
// // import { ChatbotAnalyticsDashboard } from "./pages/ChatbotAnalyticsDashboard";
import { SupportAgentCustomization } from "./pages/SupportAgentCustomization";
import { LeadRouting } from "./pages/LeadRouting";
import { PayoutManagement } from "./pages/PayoutManagement";
import { MarketplaceAnalytics } from "./pages/MarketplaceAnalytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import ComparisonAnalytics from "./pages/ComparisonAnalytics";

// Legal
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import Terms from "./pages/legal/Terms";
import AIEthics from "./pages/legal/AIEthics";
import DPA from "./pages/legal/DPA";
import AUP from "./pages/legal/AUP";
import SLA from "./pages/legal/SLA";
import CreditDisclaimer from "./pages/legal/CreditDisclaimer";
import LegalHub from "./pages/legal/LegalHub";
import DealerAgreement from "./pages/legal/DealerAgreement";
import PopiaConsentForm from "./pages/legal/PopiaConsentForm";
import PopiaIOGuide from "./pages/legal/PopiaIOGuide";
import DealerLegal from "./pages/dealer/Legal";
import AdminCompliance from "./pages/admin/AdminCompliance";
import { POPIAConsentModal } from "./components/POPIAConsentModal";
import { POPIAReconfirmationBanner } from "./components/POPIAReconfirmationBanner";
import { usePopiaConsent } from "./hooks/usePopiaConsent";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/showroom" component={Showroom} />
      <Route path="/showroom/:id" component={VehicleDetail} />
      {/* Pricing hidden during pilot — see Navigation.tsx comment */}
      <Route path="/pricing">
        <Redirect to="/" />
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={SignUp} />
      <Route path="/check-email" component={CheckEmail} />
      {/* <Route path="/oauth/callback" component={OAuthCallbackPage} /> */}
      {/* <Route path="/auth/2fa-setup" component={TwoFactorSetupPage} /> */}
      {/* <Route path="/auth/reset-password" component={PasswordResetFlowPage} /> */}
      <Route path="/security/activate" component={SecurityAgentActivation} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/account/security" component={AccountSecurity} />
      <Route path="/account/connected-accounts" component={ConnectedAccounts} />
      <Route path="/account/security-dashboard" component={SecurityDashboard} />
      <Route path="/account/recovery" component={AccountRecovery} />
      <Route path="/account/2fa-setup" component={TwoFactorSetup} />
      <Route path="/account/social-login" component={SocialLoginSetup} />
      <Route path="/admin/users">
        <AdminRouteGuard>
          <AdminUsers />
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/audit-log">
        <AdminRouteGuard>
          <AdminAuditLog />
        </AdminRouteGuard>
      </Route>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/for-dealers" component={ForDealers} />
      <Route path="/onboarding/form" component={() => <div>Page disabled</div>} />
      <Route path="/wizard" component={OnboardingWizardNew} />
      <Route path="/apply/:shortcode" component={PreApproval} />
      <Route path="/book/:shortcode" component={Book} />
      <Route path="/trade-in" component={TradeIn} />
      <Route path="/trade-in/status" component={TradeInStatus} />
      <Route path="/compare" component={Compare} />
      <Route path="/finance" component={FinanceCalculator} />
      <Route path="/verify-email-required" component={VerifyEmailRequired} />
      <Route path="/enable-2fa" component={Enable2FA} />
      <Route path="/email-preferences" component={EmailPreferences} />

      {/* Dealer */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dealer/leads" component={Leads} />
      <Route path="/dealer/bookings" component={Bookings} />
      <Route path="/dealer/inventory" component={Inventory} />
      <Route path="/dealer/security-report" component={DealershipSecurityReport} />
      <Route path="/dealer/security" component={DealershipSecurityDashboard} />
      <Route path="/dealer/inventory/import" component={DealerInventoryImport} />
      <Route path="/dealer/settings" component={DealerSettings} />
      <Route path="/dealer/team" component={DealerTeam} />
      <Route path="/dealer/legal" component={DealerLegal} />
      <Route path="/dealer/trade-ins" component={TradeInNetwork} />
      <Route path="/dealer/inventory-management" component={InventoryManagementPage} />
      <Route path="/dealer/agents/chat/:agentId">
        <AdminRouteGuard><AgentChat /></AdminRouteGuard>
      </Route>
      <Route path="/dealer/agents/chat">
        <AdminRouteGuard><AgentChat /></AdminRouteGuard>
      </Route>
      <Route path="/dealer/agents">
        <AdminRouteGuard><Agents /></AdminRouteGuard>
      </Route>
      <Route path="/dealer/network" component={DealerNetwork} />
      <Route path="/dealer/email-sequences" component={EmailSequences} />
      <Route path="/dealer/analytics" component={AnalyticsDashboard} />
      <Route path="/dealer/agents-enhanced">
        <AdminRouteGuard><AgentsEnhanced /></AdminRouteGuard>
      </Route>
      <Route path="/dealer/csv-photo" component={CSVPhotoManager} />
      <Route path="/dealer/fix-r1-prices">
        <Redirect to="/dealer/inventory/import" />
      </Route>
      <Route path="/dealer/revenue" component={RevenueDashboard} />
      <Route path="/dealer/support-agent" component={SupportAgentCustomization} />
      <Route path="/dealer/conversation-insights" component={InsightsDashboard} />
      {/* <Route path="/dealer/chatbot-analytics" component={ChatbotAnalyticsDashboard} /> */}
      <Route path="/dealer/insights" component={InsightsDashboard} />

      {/* Marketplace */}
      <Route path="/marketplace/onboarding" component={DealershipOnboarding} />
      <Route path="/marketplace/showroom" component={UnifiedShowroom} />
      <Route path="/dealer/leads" component={LeadRouting} />
      <Route path="/dealer/payouts" component={PayoutManagement} />
      <Route path="/dealer/marketplace-analytics" component={MarketplaceAnalytics} />
      <Route path="/dealer/kpi-dashboard" component={KPIDashboardPage} />
      <Route path="/analytics/advanced" component={AdvancedAnalytics} />
      <Route path="/analytics/comparison" component={ComparisonAnalytics} />

      {/* Admin / founder — all gated behind AdminRouteGuard (role === "admin" or "founder") */}
      <Route path="/admin">
        <AdminRouteGuard><AdminOverview /></AdminRouteGuard>
      </Route>
      <Route path="/admin/prospector">
        <AdminRouteGuard><AdminProspector /></AdminRouteGuard>
      </Route>
      <Route path="/admin/onboarding">
        <AdminRouteGuard><AdminOnboarding /></AdminRouteGuard>
      </Route>
      <Route path="/admin/platform-demos">
        <AdminRouteGuard><AdminPlatformDemos /></AdminRouteGuard>
      </Route>
      <Route path="/admin/bookings">
        <Redirect to="/admin/platform-demos" />
      </Route>
      <Route path="/admin/approvals">
        <AdminRouteGuard><AdminApprovals /></AdminRouteGuard>
      </Route>
      <Route path="/admin/kagiso-roadmap">
        <AdminRouteGuard><AdminKagisoRoadmap /></AdminRouteGuard>
      </Route>
      <Route path="/admin/fallback">
        <AdminRouteGuard><AdminFallback /></AdminRouteGuard>
      </Route>
      <Route path="/admin/compliance">
        <AdminRouteGuard><AdminCompliance /></AdminRouteGuard>
      </Route>
      <Route path="/admin/ops">
        <AdminRouteGuard><AdminOps /></AdminRouteGuard>
      </Route>
      <Route path="/admin/dealerships">
        <AdminRouteGuard><AdminDealerships /></AdminRouteGuard>
      </Route>
      <Route path="/admin/groups/:groupKey">
        <AdminRouteGuard><AdminGroupOverview /></AdminRouteGuard>
      </Route>
      <Route path="/admin/agents">
        <AdminRouteGuard><AdminAgents /></AdminRouteGuard>
      </Route>
      <Route path="/admin/billing">
        <AdminRouteGuard><AdminBilling /></AdminRouteGuard>
      </Route>
      <Route path="/admin/inventory-import">
        <AdminRouteGuard><AdminInventoryImport /></AdminRouteGuard>
      </Route>
      <Route path="/admin/invoices/:id/print">
        <AdminRouteGuard><InvoicePrint /></AdminRouteGuard>
      </Route>
      <Route path="/admin/invoices">
        <AdminRouteGuard><AdminInvoices /></AdminRouteGuard>
      </Route>
      <Route path="/admin/brand-kit">
        <AdminRouteGuard><AdminBrandKit /></AdminRouteGuard>
      </Route>
      <Route path="/admin/preapprovals">
        <AdminRouteGuard><AdminPreApprovals /></AdminRouteGuard>
      </Route>
      <Route path="/admin/email-preview">
        <AdminRouteGuard><AdminEmailPreview /></AdminRouteGuard>
      </Route>
      <Route path="/admin/tax-dashboard">
        <AdminRouteGuard><TaxDashboard /></AdminRouteGuard>
      </Route>
      <Route path="/admin/campaigns">
        <AdminRouteGuard><CampaignDashboard /></AdminRouteGuard>
      </Route>
      <Route path="/admin/audit-dashboard">
        <AdminRouteGuard><AdminAuditDashboard /></AdminRouteGuard>
      </Route>
      <Route path="/admin/email-metrics">
        <AdminRouteGuard><AdminEmailMetrics /></AdminRouteGuard>
      </Route>
      <Route path="/admin/help-center">
        <AdminRouteGuard><AdminHelpCenter /></AdminRouteGuard>
      </Route>
      <Route path="/admin/market-guides">
        <AdminRouteGuard><AdminMarketGuide /></AdminRouteGuard>
      </Route>
      <Route path="/admin/pilot">
        <AdminRouteGuard><AdminPilotDashboard /></AdminRouteGuard>
      </Route>
      <Route path="/admin/automation">
        <AdminRouteGuard><AdminAutomationPage /></AdminRouteGuard>
      </Route>
      {/* <Route path="/admin/control-panel" component={AdminControlPanel} /> */}
      {/* <Route path="/admin/compliance" component={ComplianceDashboard} /> */}
      <Route path="/admin/compliance/audit-trail">
        <AdminRouteGuard><ComplianceAuditTrail /></AdminRouteGuard>
      </Route>
      <Route path="/admin/compliance/templates">
        <AdminRouteGuard><CommunicationTemplateEditor /></AdminRouteGuard>
      </Route>
      <Route path="/admin/compliance/training">
        <AdminRouteGuard><TrainingModules /></AdminRouteGuard>
      </Route>
      <Route path="/admin/compliance/assignments">
        <AdminRouteGuard><TrainingAssignments /></AdminRouteGuard>
      </Route>
      <Route path="/admin/data-import">
        <AdminRouteGuard><AdminDataImport /></AdminRouteGuard>
      </Route>
      <Route path="/admin/dashboard">
        <AdminRouteGuard><AdminDashboard /></AdminRouteGuard>
      </Route>
      <Route path="/admin/dashboard-pro">
        <AdminRouteGuard><AdminDashboardEnhanced /></AdminRouteGuard>
      </Route>
      <Route path="/admin/dashboard-custom">
        <AdminRouteGuard><AdminDashboardCustomizable /></AdminRouteGuard>
      </Route>
      <Route path="/help" component={HelpCenter} />
      <Route path="/security/comprehensive" component={ComprehensiveSecurityDashboard} />
      <Route path="/security" component={SecurityDashboardPage} />

      {/* Legal */}
      <Route path="/legal/dealer-agreement" component={DealerAgreement} />
      <Route path="/legal/popia-consent-form" component={PopiaConsentForm} />
      <Route path="/legal/popia-information-officer" component={PopiaIOGuide} />
      <Route path="/legal" component={LegalHub} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/ai-ethics" component={AIEthics} />
      <Route path="/dpa" component={DPA} />
      <Route path="/legal/dpa">
        <Redirect to="/dpa" />
      </Route>
      <Route path="/aup" component={AUP} />
      <Route path="/sla" component={SLA} />
      <Route path="/credit-disclaimer" component={CreditDisclaimer} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

const POPIA_BANNER_Z = 'z-[100]'; // above site nav (z-50) so the X is always clickable

function AppContent() {
  const {
    showModal,
    needsReconfirmation,
    handleSign,
    handleReconfirm,
    handleDismiss,
    handleBannerDismiss,
    isFounderOrAdmin,
    isLoading,
    consentStatus,
    unsignedButDismissed,
  } = usePopiaConsent();

  // Founders/admins never see the dealer POPIA pending banner.
  const showPendingBanner = unsignedButDismissed && !isFounderOrAdmin;

  const consentId =
    consentStatus && "consentId" in consentStatus ? consentStatus.consentId : undefined;

  return (
    <>
      <POPIAConsentModal
        open={showModal}
        onClose={handleDismiss}
        onSign={handleSign}
        isLoading={isLoading}
      />
      {showPendingBanner && (
        <div
          className={`fixed top-0 left-0 right-0 ${POPIA_BANNER_Z} bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-4`}
          role="status"
        >
          <div className="flex items-center gap-2 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              POPIA acknowledgment pending —{' '}
              <a href="/dealer/legal" className="underline font-medium hover:text-amber-700">
                complete it in Legal → POPIA
              </a>
            </span>
          </div>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBannerDismiss();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBannerDismiss();
            }}
            className="relative z-[1] p-2 -mr-1 text-amber-600 hover:text-amber-800 shrink-0 rounded-sm cursor-pointer"
            aria-label="Dismiss POPIA banner"
          >
            <X className="h-4 w-4 pointer-events-none" />
          </button>
        </div>
      )}
      {needsReconfirmation && consentId != null && !isFounderOrAdmin && (
        <div className="fixed top-20 left-0 right-0 z-50 px-4 max-w-3xl mx-auto">
          <POPIAReconfirmationBanner
            onReconfirm={() => handleReconfirm(consentId)}
            isLoading={isLoading}
            daysUntilExpiry={
              consentStatus && "daysUntilExpiry" in consentStatus
                ? consentStatus.daysUntilExpiry
                : undefined
            }
          />
        </div>
      )}
      <OfflineIndicator />
      <PWAInstallPrompt />
      <ScrollToTop />
      <Router />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
