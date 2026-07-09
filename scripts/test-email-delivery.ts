/**
 * Test email delivery system
 * Run with: npx tsx scripts/test-email-delivery.ts
 * 
 * This script:
 * 1. Verifies test dealerships exist
 * 2. Triggers email processing
 * 3. Checks email status in database
 * 4. Provides monitoring instructions
 */

import { getDb } from "../server/db";
import { postSignupEmailSequences, emailSequenceLogs } from "../drizzle/schema";
import { eq, inArray, and, gte } from "drizzle-orm";

const TEST_EMAILS = ["test1@grayarx.com", "test2@grayarx.com", "test3@grayarx.com"];
const TEST_DEALERSHIP_IDS = [30001, 30002, 30003];

async function testEmailDelivery() {
  try {
    console.log("\n📧 GrayArx Email Delivery Test\n");
    console.log("=".repeat(80));

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Step 1: Verify test dealerships
    console.log("\n✅ Step 1: Verify Test Dealerships\n");

    const sequences = await db
      .select()
      .from(postSignupEmailSequences)
      .where(inArray(postSignupEmailSequences.recipientEmail, TEST_EMAILS));

    if (sequences.length === 0) {
      console.log("❌ No test email sequences found");
      console.log("   Run: npx tsx scripts/setup-test-dealerships.ts");
      return;
    }

    console.log(`✅ Found ${sequences.length} test email sequences`);
    console.log(`   - Test 1 (Gauteng): test1@grayarx.com`);
    console.log(`   - Test 2 (Western Cape): test2@grayarx.com`);
    console.log(`   - Test 3 (KwaZulu-Natal): test3@grayarx.com`);

    // Step 2: Check email status
    console.log("\n✅ Step 2: Check Email Status\n");

    const statusCounts = {
      scheduled: sequences.filter((s) => s.status === "scheduled").length,
      sent: sequences.filter((s) => s.status === "sent").length,
      opened: sequences.filter((s) => s.status === "opened").length,
      clicked: sequences.filter((s) => s.status === "clicked").length,
      bounced: sequences.filter((s) => s.status === "bounced").length,
      failed: sequences.filter((s) => s.status === "failed").length,
    };

    console.log(`Scheduled: ${statusCounts.scheduled}`);
    console.log(`Sent:      ${statusCounts.sent}`);
    console.log(`Opened:    ${statusCounts.opened}`);
    console.log(`Clicked:   ${statusCounts.clicked}`);
    console.log(`Bounced:   ${statusCounts.bounced}`);
    console.log(`Failed:    ${statusCounts.failed}`);

    // Step 3: Check recent email logs
    console.log("\n✅ Step 3: Recent Email Events\n");

    const logs = await db
      .select()
      .from(emailSequenceLogs)
      .where(inArray(emailSequenceLogs.dealershipId, TEST_DEALERSHIP_IDS))
      .orderBy((t) => t.createdAt);

    if (logs.length === 0) {
      console.log("No email events logged yet");
    } else {
      console.log(`Found ${logs.length} email events`);
      console.log("\nRecent events:");
      for (const log of logs.slice(-5)) {
        const time = new Date(log.createdAt).toLocaleString();
        console.log(`  - ${time}: ${log.sequenceType}`);
        if (log.errorMessage) {
          console.log(`    Error: ${log.errorMessage}`);
        }
      }
    }

    // Step 4: Provide next steps
    console.log("\n" + "=".repeat(80));
    console.log("\n📋 Next Steps:\n");

    if (statusCounts.scheduled > 0) {
      console.log("1. ✅ Test emails are scheduled");
      console.log("   Waiting for Heartbeat job to process them...\n");
    }

    if (statusCounts.sent > 0) {
      console.log("1. ✅ Test emails have been sent");
      console.log("   Check test email inboxes for delivery\n");
    }

    console.log("2. 📧 Check test email inboxes:");
    console.log("   - test1@grayarx.com");
    console.log("   - test2@grayarx.com");
    console.log("   - test3@grayarx.com\n");

    console.log("3. 🔗 Open emails and click links to trigger tracking\n");

    console.log("4. ⏱️  Wait 5 minutes for Heartbeat job to process events\n");

    console.log("5. 📊 Run this script again to see updated status\n");

    console.log("6. 🔧 Configure SendGrid webhook:");
    console.log("   - Go to SendGrid Dashboard");
    console.log("   - Settings → Mail Send Settings → Event Webhook");
    console.log("   - Add: https://www.grayarx.com/api/webhooks/sendgrid\n");

    console.log("7. 📈 View analytics in admin dashboard:");
    console.log("   - Go to /admin/dealerships");
    console.log("   - Select a dealership");
    console.log("   - View email sequences with open/click rates\n");

    // Step 5: Database query reference
    console.log("=".repeat(80));
    console.log("\n🗄️  Database Queries:\n");

    console.log("View all test email sequences:");
    console.log("```sql");
    console.log("SELECT id, recipientEmail, sequenceType, status, sentAt, openedAt, clickedAt");
    console.log("FROM post_signup_email_sequences");
    console.log("WHERE recipientEmail IN ('test1@grayarx.com', 'test2@grayarx.com', 'test3@grayarx.com')");
    console.log("ORDER BY createdAt DESC;");
    console.log("```\n");

    console.log("View email events:");
    console.log("```sql");
    console.log("SELECT id, dealershipId, sequenceType, attemptNumber, errorMessage, createdAt");
    console.log("FROM email_sequence_logs");
    console.log("WHERE dealershipId IN (30001, 30002, 30003)");
    console.log("ORDER BY createdAt DESC");
    console.log("LIMIT 20;");
    console.log("```\n");

    console.log("View email statistics:");
    console.log("```sql");
    console.log("SELECT");
    console.log("  sequenceType,");
    console.log("  COUNT(*) as total,");
    console.log("  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,");
    console.log("  SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,");
    console.log("  SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,");
    console.log("  SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced");
    console.log("FROM post_signup_email_sequences");
    console.log("WHERE recipientEmail IN ('test1@grayarx.com', 'test2@grayarx.com', 'test3@grayarx.com')");
    console.log("GROUP BY sequenceType;");
    console.log("```\n");

    console.log("=".repeat(80));
    console.log("\n✅ Email delivery test complete\n");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
}

testEmailDelivery();
