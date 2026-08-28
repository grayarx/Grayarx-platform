import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envPath = join(root, ".env.local");

const keys = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
  "TWILIO_WEBHOOK_BASE_URL",
  "TWILIO_VOICE",
  "TWILIO_SPEECH_LANGUAGE",
] as const;

function syncFromProcessEnv(): number {
  const lines = keys
    .filter((key) => process.env[key]?.trim())
    .map((key) => `${key}=${process.env[key]!.trim()}`);

  if (lines.length === 0) return 0;

  writeFileSync(
    envPath,
    `# Synced from Cursor secrets / environment\n${lines.join("\n")}\n`,
    "utf8",
  );
  return lines.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const count = syncFromProcessEnv();
  console.log(
    count > 0
      ? `Synced ${count} Twilio variables to .env.local`
      : "No Twilio env vars in process — add secrets in Cursor first.",
  );
}

export { syncFromProcessEnv };
