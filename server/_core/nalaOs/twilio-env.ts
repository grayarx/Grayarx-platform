import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type TwilioEnv = {
  accountSid: string;
  authToken: string;
  webhookBaseUrl: string;
  fromNumber?: string;
};

const ENV_PATH = join(process.cwd(), ".env.local");
const JSON_PATH = join(process.cwd(), "data", "twilio-credentials.json");

/** Strip invisible junk from copy-paste. */
export function sanitizeCredential(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function parseEnvFile(content: string): Partial<TwilioEnv> {
  const result: Partial<TwilioEnv> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "TWILIO_ACCOUNT_SID") result.accountSid = val;
    if (key === "TWILIO_AUTH_TOKEN" || key === "TWILIO_API_KEY")
      result.authToken = val;
    if (key === "TWILIO_WEBHOOK_BASE_URL") result.webhookBaseUrl = val;
    if (key === "TWILIO_FROM_NUMBER" || key === "TWILIO_PHONE_NUMBER")
      result.fromNumber = val;
  }
  return result;
}

function loadJsonFile(): Partial<TwilioEnv> {
  try {
    if (!existsSync(JSON_PATH)) return {};
    return JSON.parse(readFileSync(JSON_PATH, "utf8")) as Partial<TwilioEnv>;
  } catch {
    return {};
  }
}

/** Always read fresh from disk — never trust stale process.env alone. */
export function loadTwilioEnv(): Partial<TwilioEnv> {
  let fromFile: Partial<TwilioEnv> = {};
  if (existsSync(ENV_PATH)) {
    fromFile = parseEnvFile(readFileSync(ENV_PATH, "utf8"));
  }
  const fromJson = loadJsonFile();

  return {
    accountSid:
      fromJson.accountSid ??
      fromFile.accountSid ??
      process.env.TWILIO_ACCOUNT_SID,
    authToken:
      fromJson.authToken ??
      fromFile.authToken ??
      process.env.TWILIO_AUTH_TOKEN ??
      process.env.TWILIO_API_KEY,
    webhookBaseUrl:
      fromJson.webhookBaseUrl ??
      fromFile.webhookBaseUrl ??
      process.env.TWILIO_WEBHOOK_BASE_URL,
    fromNumber:
      fromJson.fromNumber ??
      fromFile.fromNumber ??
      process.env.TWILIO_FROM_NUMBER ??
      process.env.TWILIO_PHONE_NUMBER,
  };
}

export function applyTwilioEnv(env: TwilioEnv): void {
  process.env.TWILIO_ACCOUNT_SID = env.accountSid;
  process.env.TWILIO_AUTH_TOKEN = env.authToken;
  process.env.TWILIO_WEBHOOK_BASE_URL = env.webhookBaseUrl;
  if (env.fromNumber) process.env.TWILIO_FROM_NUMBER = env.fromNumber;
}

/**
 * Grayarx-Final keeps Twilio on process.env / Railway.
 * Never write .env or .env.local — only apply in-memory for this process.
 */
export function saveTwilioEnv(env: TwilioEnv): { envPath: string; jsonPath: string } {
  applyTwilioEnv(env);
  return {
    envPath: "(not written — Grayarx-Final uses existing .env / Railway)",
    jsonPath: "(not written)",
  };
}

export function maskSid(sid: string): string {
  if (sid.length < 8) return "****";
  return `${sid.slice(0, 6)}…${sid.slice(-4)}`;
}
