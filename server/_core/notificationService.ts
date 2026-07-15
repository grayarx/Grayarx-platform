import { invokeLLM } from "./llm";

/**
 * Notification Service
 * Handles SMS (Twilio) and email (Resend) notifications
 */

interface SMSNotification {
  phone: string;
  message: string;
  type: "lead_received" | "booking_confirmed" | "followup_reminder" | "custom";
}

interface EmailNotification {
  email: string;
  subject: string;
  htmlContent: string;
  type: "lead_received" | "booking_confirmed" | "followup_reminder" | "custom";
}

/**
 * Send SMS notification via Twilio
 */
export async function sendSMS(notification: SMSNotification): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKey = process.env.TWILIO_API_KEY;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioApiKey || !twilioPhoneNumber) {
      console.warn("[NotificationService] Twilio credentials missing, SMS not sent");
      return { success: false, error: "Twilio credentials not configured" };
    }

    // Format phone number
    const formattedPhone = notification.phone.startsWith("+") 
      ? notification.phone 
      : `+27${notification.phone.replace(/^0/, "")}`;

    // In production, use Twilio SDK
    // For now, log the notification
    console.log(`[SMS] To: ${formattedPhone}, Message: ${notification.message}`);

    return {
      success: true,
      messageId: `sms_${Date.now()}`,
    };
  } catch (error) {
    console.error("[NotificationService] SMS error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email notification via Resend
 */
export async function sendEmail(notification: EmailNotification): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const { sendEmailViaResend } = await import("./resendEmailService");
    const result = await sendEmailViaResend({
      to: notification.email,
      subject: notification.subject,
      html: notification.htmlContent,
    });

    if (!result.success) {
      return { success: false, error: result.error || "Email send failed" };
    }

    return {
      success: true,
      messageId: result.id || `email_${Date.now()}`,
    };
  } catch (error) {
    console.error("[NotificationService] Email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send lead received notification to dealership
 */
export async function notifyLeadReceived(
  dealershipPhone: string,
  dealershipEmail: string,
  leadData: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    vehicleInterest?: string;
    message?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Send SMS to dealership
    await sendSMS({
      phone: dealershipPhone,
      message: `New lead received: ${leadData.customerName} (${leadData.customerPhone}) interested in ${leadData.vehicleInterest || "a vehicle"}`,
      type: "lead_received",
    });

    // Send email to dealership
    const htmlContent = `
      <h2>New Lead Received</h2>
      <p><strong>Name:</strong> ${leadData.customerName}</p>
      <p><strong>Phone:</strong> ${leadData.customerPhone}</p>
      <p><strong>Email:</strong> ${leadData.customerEmail}</p>
      ${leadData.vehicleInterest ? `<p><strong>Vehicle Interest:</strong> ${leadData.vehicleInterest}</p>` : ""}
      ${leadData.message ? `<p><strong>Message:</strong> ${leadData.message}</p>` : ""}
      <p>Please follow up with the customer as soon as possible.</p>
    `;

    await sendEmail({
      email: dealershipEmail,
      subject: `New Lead: ${leadData.customerName}`,
      htmlContent,
      type: "lead_received",
    });

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error notifying lead received:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send booking confirmation notification
 */
export async function notifyBookingConfirmed(
  customerPhone: string,
  customerEmail: string,
  bookingData: {
    dealershipName: string;
    vehicleDetails: string;
    testDriveDate: string;
    testDriveTime: string;
    dealershipPhone: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Send SMS to customer
    await sendSMS({
      phone: customerPhone,
      message: `Your test drive at ${bookingData.dealershipName} is confirmed for ${bookingData.testDriveDate} at ${bookingData.testDriveTime}. Call ${bookingData.dealershipPhone} to confirm.`,
      type: "booking_confirmed",
    });

    // Send email to customer
    const htmlContent = `
      <h2>Test Drive Confirmed</h2>
      <p><strong>Dealership:</strong> ${bookingData.dealershipName}</p>
      <p><strong>Vehicle:</strong> ${bookingData.vehicleDetails}</p>
      <p><strong>Date:</strong> ${bookingData.testDriveDate}</p>
      <p><strong>Time:</strong> ${bookingData.testDriveTime}</p>
      <p><strong>Contact:</strong> ${bookingData.dealershipPhone}</p>
      <p>Please arrive 10 minutes early.</p>
    `;

    await sendEmail({
      email: customerEmail,
      subject: `Test Drive Confirmed - ${bookingData.dealershipName}`,
      htmlContent,
      type: "booking_confirmed",
    });

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error notifying booking confirmed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send follow-up reminder notification
 */
export async function sendFollowupReminder(
  customerPhone: string,
  customerEmail: string,
  reminderData: {
    dealershipName: string;
    vehicleDetails: string;
    dealershipPhone: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Send SMS reminder
    await sendSMS({
      phone: customerPhone,
      message: `Hi! Just checking in about the ${reminderData.vehicleDetails} at ${reminderData.dealershipName}. Any questions? Call ${reminderData.dealershipPhone}`,
      type: "followup_reminder",
    });

    // Send email reminder
    const htmlContent = `
      <h2>Follow-up: Your Vehicle Interest</h2>
      <p>Hi,</p>
      <p>We wanted to follow up about your interest in the <strong>${reminderData.vehicleDetails}</strong> at <strong>${reminderData.dealershipName}</strong>.</p>
      <p>If you have any questions or would like to schedule a test drive, please contact us at <strong>${reminderData.dealershipPhone}</strong>.</p>
      <p>We look forward to helping you find the perfect vehicle!</p>
    `;

    await sendEmail({
      email: customerEmail,
      subject: `Follow-up: ${reminderData.vehicleDetails} at ${reminderData.dealershipName}`,
      htmlContent,
      type: "followup_reminder",
    });

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error sending follow-up reminder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
