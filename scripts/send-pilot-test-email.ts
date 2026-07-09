/**
 * Send pilot template test email (logo verification).
 *
 * Usage:
 *   npx tsx scripts/send-pilot-test-email.ts grayarx@gmail.com
 *   npx tsx scripts/send-pilot-test-email.ts grayarx@gmail.com gmail   # via pilot@ SMTP (shows Gmail avatar)
 */
import "dotenv/config";
import { sendPilotTestEmail } from "../server/_core/pilotEmailCampaignService";
import { grayArxLogoIconUrl } from "../shared/emailBranding";
import { isPilotGmailConfigured } from "../server/_core/gmailPilotSender";

const to = process.argv[2] || "grayarx@gmail.com";
const viaArg = process.argv[3]?.toLowerCase();
const via = viaArg === "gmail" ? "gmail" : viaArg === "resend" ? "resend" : "auto";

async function main() {
  console.log(`Sending pilot test email to ${to} (via=${via})…`);
  console.log(`Hosted logo URL (after deploy): ${grayArxLogoIconUrl()}`);
  console.log(`Gmail SMTP configured: ${isPilotGmailConfigured()}`);

  const result = await sendPilotTestEmail(to, "basic_website_no_showroom", { via });

  if (!result.success) {
    console.error("Failed:", result.error);
    if (via === "gmail" || process.env.PILOT_SEND_VIA === "gmail") {
      console.error("\nSet PILOT_GMAIL_USER=pilot@grayarx.com and PILOT_GMAIL_APP_PASSWORD in .env");
    }
    process.exit(1);
  }

  console.log(`Sent via ${result.via}. Message ID:`, result.id);
  if (result.via === "resend") {
    console.log("\nNote: Gmail inbox avatar (pilot@ pfp) only shows when sending via Google SMTP + GIF on profile.");
    console.log("See docs/EDWARD_STURM_GMAIL_AVATAR.md");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
