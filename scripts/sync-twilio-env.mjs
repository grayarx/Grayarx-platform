const keys = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
  "TWILIO_WEBHOOK_BASE_URL",
  "TWILIO_VOICE",
  "TWILIO_SPEECH_LANGUAGE",
];

const lines = keys
  .filter((key) => process.env[key]?.trim())
  .map((key) => `${key}=${process.env[key].trim()}`);

if (lines.length === 0) {
  console.log("No Twilio env vars found. Add secrets in Cursor first.");
  process.exit(0);
}

const fs = await import("node:fs");
const content = `# Synced from Cursor secrets / environment\n${lines.join("\n")}\n`;
fs.writeFileSync(".env.local", content, "utf8");
console.log(`Synced ${lines.length} Twilio variables to .env.local`);
