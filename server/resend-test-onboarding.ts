import { sendEmailViaResend } from "./_core/resendEmailService";

async function testResendWithTestDomain() {
  console.log("🧪 Testing Resend with test domain (resend.dev)...");
  
  const result = await sendEmailViaResend({
    from: "onboarding@resend.dev",
    to: "test@grayarx.local",
    subject: "GrayArx Email Delivery Test",
    html: "<h1>Email Delivery Test</h1><p>If you received this, Resend is working!</p>",
  });
  
  if (result.success) {
    console.log("✅ Resend integration is working!");
    console.log("Email ID:", result.id);
    console.log("");
    console.log("📋 Next steps to use your own domain:");
    console.log("1. Go to https://resend.com/domains");
    console.log("2. Add domain 'grayarx.com'");
    console.log("3. Add the DNS records Resend provides");
    console.log("4. Wait for verification (5-10 minutes)");
    console.log("5. Update email 'from' address to use your domain");
    process.exit(0);
  } else {
    console.log("❌ Resend integration failed");
    console.log("Error:", result.error);
    process.exit(1);
  }
}

testResendWithTestDomain();
