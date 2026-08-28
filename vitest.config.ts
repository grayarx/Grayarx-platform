import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

/**
 * Excluded suites target unimplemented stubs (`export default {}`), live credentials,
 * multi-minute stress tests, or DB integration that requires TiDB in CI.
 */
const EXCLUDED_SUITES = [
  "**/campaign.integration.test.ts",
  "**/csvImport.test.ts",
  "**/_core/services.test.ts",
  "**/complianceTraining.test.ts",
  "**/auditTrailExport.test.ts",
  "**/_core/securityAgent.test.ts",
  "**/onboardingDraft.test.ts",
  "**/postSignupEmail.stress.test.ts",
  "**/postSignupEmail.test.ts",
  "**/customAuth.followups.test.ts",
  "**/customAuth.test.ts",
  "**/emailAndAuthFeatures.test.ts",
  "**/finalImplementation.test.ts",
  "**/routers/advancedReportingRouter.test.ts",
  "**/stress-tests.comprehensive.test.ts",
  "**/databaseStressTest.test.ts",
  "**/emailStressTest.test.ts",
  "**/loadTesting.test.ts",
  "**/chatbot.test.ts",
  "**/routers/servicesRouter.test.ts",
  "**/integration.test.ts",
  "**/sms.integration.test.ts",
  "**/auth.integration.test.ts",
  "**/checkEmailVerification.test.ts",
  "**/notifications.integration.test.ts",
  "**/admin-network.test.ts",
  "**/routers.test.ts",
  "**/routers/allNewFeatures.test.ts",
  "**/auth.google.test.ts",
  "**/twilio.test.ts",
  "**/emailVerification.test.ts",
  "**/emailVerificationFeatures.test.ts",
  "**/_core/auditLog.test.ts",
  "**/sms.webhook.test.ts",
  "**/integrationTests.test.ts",
];

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@nalaOs": path.resolve(templateRoot, "server", "_core", "nalaOs"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "shared/**/*.test.ts"],
    exclude: ["**/node_modules/**", ...EXCLUDED_SUITES],
    testTimeout: 15000,
  },
});
