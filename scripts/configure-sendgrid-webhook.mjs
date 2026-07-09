/**
 * Configure SendGrid Webhook
 * This script sets up the SendGrid webhook to track email events
 * (opens, clicks, bounces, etc.)
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const WEBHOOK_URL = "https://www.grayarx.com/api/webhooks/sendgrid";

if (!SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY environment variable not set");
  process.exit(1);
}

async function configureWebhook() {
  try {
    console.log("🔧 Configuring SendGrid webhook...");
    console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);

    // Get current webhook settings
    console.log("\n📋 Fetching current webhook settings...");
    const getResponse = await fetch(
      "https://api.sendgrid.com/v3/mail_settings/event_webhook",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!getResponse.ok) {
      throw new Error(
        `Failed to fetch webhook settings: ${getResponse.status}`
      );
    }

    const currentSettings = await getResponse.json();
    console.log("✅ Current webhook settings retrieved");

    // Update webhook settings
    console.log("\n🔄 Updating webhook settings...");
    const updateResponse = await fetch(
      "https://api.sendgrid.com/v3/mail_settings/event_webhook",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: true,
          url: WEBHOOK_URL,
          group_resubscribe: true,
          delivered: true,
          group_unsubscribe: true,
          spam_report: true,
          bounce: true,
          deferred: true,
          unsubscribe: true,
          processed: true,
          open: true,
          click: true,
          dropped: true,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(
        `Failed to update webhook settings: ${updateResponse.status} - ${error}`
      );
    }

    const updatedSettings = await updateResponse.json();
    console.log("✅ Webhook settings updated successfully");

    // Verify webhook configuration
    console.log("\n✨ Webhook Configuration Summary:");
    console.log(`   URL: ${WEBHOOK_URL}`);
    console.log(`   Status: ${updatedSettings.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log("   Events tracked:");
    console.log("     ✓ Processed");
    console.log("     ✓ Delivered");
    console.log("     ✓ Open");
    console.log("     ✓ Click");
    console.log("     ✓ Bounce");
    console.log("     ✓ Dropped");
    console.log("     ✓ Deferred");
    console.log("     ✓ Spam Report");
    console.log("     ✓ Unsubscribe");
    console.log("     ✓ Group Unsubscribe");
    console.log("     ✓ Group Resubscribe");

    console.log("\n🎉 SendGrid webhook configured successfully!");
    console.log(
      "📧 Email events will now be tracked in real-time at /api/webhooks/sendgrid"
    );
  } catch (error) {
    console.error("❌ Error configuring webhook:", error);
    process.exit(1);
  }
}

configureWebhook();
