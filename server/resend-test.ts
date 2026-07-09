import { testEmailDelivery } from "./_core/resendEmailService";

async function validateResendKey() {
  console.log("🧪 Testing Resend API key...");
  
  const result = await testEmailDelivery("test@grayarx.local");
  
  if (result.success) {
    console.log("✅ Resend API key is valid!");
    console.log("Email ID:", result.id);
    process.exit(0);
  } else {
    console.log("❌ Resend API key is invalid or expired");
    console.log("Error:", result.error);
    process.exit(1);
  }
}

validateResendKey();
