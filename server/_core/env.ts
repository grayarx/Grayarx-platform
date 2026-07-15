export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Chat/LLM: OpenAI only. Forge keys are storage/notification legacy — not for chat.
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  /** @deprecated LLM — do not use for chat. Kept for photo storage / push if still configured. */
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  /** @deprecated LLM — do not use for chat. Kept for photo storage / push if still configured. */
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Chat API key — OpenAI only (templates if missing/failing). */
  get llmApiKey() {
    return this.openaiApiKey;
  },
  /** true when OpenAI is configured for chat. */
  get usesOpenAI() {
    return Boolean(this.openaiApiKey);
  },
  emailUser: process.env.EMAIL_USER ?? "grayarx@gmail.com",
  emailPassword: process.env.EMAIL_PASSWORD ?? "",
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
