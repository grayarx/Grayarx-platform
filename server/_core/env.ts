export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Prefer OpenAI when set — survives deleting Manus. Forge is optional legacy.
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Resolved chat API key: OpenAI first, then Manus Forge. */
  get llmApiKey() {
    return this.openaiApiKey || this.forgeApiKey;
  },
  /** true when using OpenAI directly (not Manus Forge). */
  get usesOpenAI() {
    return Boolean(this.openaiApiKey);
  },
  emailUser: process.env.EMAIL_USER ?? "grayarx@gmail.com",
  emailPassword: process.env.EMAIL_PASSWORD ?? "",
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioApiKey: process.env.TWILIO_API_KEY || "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
  appleOAuthClientId: process.env.APPLE_OAUTH_CLIENT_ID || "",
  appleOAuthClientSecret: process.env.APPLE_OAUTH_CLIENT_SECRET || "",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  /** Gmail / inbox that receives founder alerts when privacy@ or legal@ get mail. */
  founderAlertEmail:
    process.env.FOUNDER_ALERT_EMAIL ||
    process.env.OWNER_EMAIL ||
    process.env.EMAIL_USER ||
    "grayarx@gmail.com",
  /** Platform EFT — set on Railway; never commit real account numbers. */
  bankName: process.env.BANK_NAME || "",
  bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
  bankBranchCode: process.env.BANK_BRANCH_CODE || "",
  bankAccountName: process.env.BANK_ACCOUNT_NAME || "",
};
