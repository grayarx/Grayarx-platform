/**
 * Quick platform health check — run: npx tsx scripts/check-platform-health.ts
 */
import "dotenv/config";
import { getPlatformHealth } from "../server/_core/platformHealth";
import { previewPilotCampaign } from "../server/_core/pilotEmailCampaignService";

async function main() {
  const health = await getPlatformHealth();
  const preview = previewPilotCampaign();
  const mailable = preview.reduce((s, p) => s + p.mailable, 0);

  console.log("\n=== GrayArx platform health ===\n");
  for (const [key, svc] of Object.entries(health)) {
    if (key === "generatedAt") continue;
    const s = svc as { ok: boolean; detail: string };
    console.log(`${s.ok ? "OK" : "!!"} ${key}: ${s.detail}`);
  }
  console.log(`\nPilot outreach: ${mailable} mailable prospects across ${preview.length} segments`);
  console.log(`Checked at ${new Date(health.generatedAt).toISOString()}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
