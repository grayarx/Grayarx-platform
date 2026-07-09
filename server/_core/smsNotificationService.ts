import { Twilio } from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_API_KEY;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client: Twilio | null = null;

if (accountSid && authToken && fromNumber) {
  client = new Twilio(accountSid, authToken);
}

interface SMSMessage {
  to: string;
  body: string;
}

interface TestDriveNotification {
  customerPhone: string;
  customerName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  appointmentTime: Date;
  dealershipName: string;
  dealershipPhone: string;
}

class SMSNotificationService {
  async sendTestDriveReminder(notification: TestDriveNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!client || !fromNumber) {
      return { success: false, error: "SMS service not configured" };
    }

    try {
      const timeStr = notification.appointmentTime.toLocaleString("en-ZA", {
        dateStyle: "short",
        timeStyle: "short",
      });

      const message = `Hi ${notification.customerName}, reminder: Your test drive for the ${notification.vehicleYear} ${notification.vehicleMake} ${notification.vehicleModel} is scheduled for ${timeStr}. Contact ${notification.dealershipName} at ${notification.dealershipPhone} if you need to reschedule. -${notification.dealershipName}`;

      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: notification.customerPhone,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error("SMS reminder error:", error);
      return { success: false, error: String(error) };
    }
  }

  async sendTestDriveConfirmation(notification: TestDriveNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!client || !fromNumber) {
      return { success: false, error: "SMS service not configured" };
    }

    try {
      const timeStr = notification.appointmentTime.toLocaleString("en-ZA", {
        dateStyle: "short",
        timeStyle: "short",
      });

      const message = `Thank you ${notification.customerName}! Your test drive for the ${notification.vehicleYear} ${notification.vehicleMake} ${notification.vehicleModel} is confirmed for ${timeStr} at ${notification.dealershipName}. Reply CONFIRM to confirm or call ${notification.dealershipPhone} to reschedule.`;

      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: notification.customerPhone,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error("SMS confirmation error:", error);
      return { success: false, error: String(error) };
    }
  }

  async sendTestDriveFollowUp(notification: TestDriveNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!client || !fromNumber) {
      return { success: false, error: "SMS service not configured" };
    }

    try {
      const message = `Hi ${notification.customerName}, thanks for test driving the ${notification.vehicleYear} ${notification.vehicleMake} ${notification.vehicleModel}! Are you interested? Reply YES to proceed or call ${notification.dealershipPhone} for more info. -${notification.dealershipName}`;

      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: notification.customerPhone,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error("SMS follow-up error:", error);
      return { success: false, error: String(error) };
    }
  }

  async sendRescheduleReminder(
    customerPhone: string,
    customerName: string,
    dealershipName: string,
    dealershipPhone: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!client || !fromNumber) {
      return { success: false, error: "SMS service not configured" };
    }

    try {
      const message = `Hi ${customerName}, we noticed you haven't confirmed your test drive appointment. Would you like to reschedule? Call ${dealershipPhone} or reply to this message. -${dealershipName}`;

      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: customerPhone,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error("SMS reschedule reminder error:", error);
      return { success: false, error: String(error) };
    }
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!client || !fromNumber) {
      return { success: 0, failed: messages.length, errors: ["SMS service not configured"] };
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const msg of messages) {
      try {
        await client.messages.create({
          body: msg.body,
          from: fromNumber,
          to: msg.to,
        });
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Failed to send to ${msg.to}: ${String(error)}`);
      }
    }

    return { success: successCount, failed: failedCount, errors };
  }
}

export const smsNotificationService = new SMSNotificationService();
