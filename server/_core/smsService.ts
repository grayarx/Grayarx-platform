import { Twilio } from "twilio";
import { ENV } from "./env";

const twilio = new Twilio(ENV.twilioAccountSid, ENV.twilioApiKey);

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send OTP code via SMS
 */
export async function sendOTPSMS(phoneNumber: string, code: string): Promise<SMSResult> {
  try {
    if (!ENV.twilioPhoneNumber) {
      console.error("[SMS] Twilio phone number not configured");
      return { success: false, error: "SMS service not configured" };
    }

    const message = await twilio.messages.create({
      body: `Your GrayArx verification code is: ${code}. This code expires in 10 minutes.`,
      from: ENV.twilioPhoneNumber,
      to: phoneNumber,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("[SMS] Failed to send OTP:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}

/**
 * Send 2FA verification code via SMS
 */
export async function send2FASMS(phoneNumber: string, code: string): Promise<SMSResult> {
  try {
    const message = await twilio.messages.create({
      body: `Your GrayArx 2FA code is: ${code}. Do not share this code with anyone.`,
      from: ENV.twilioPhoneNumber,
      to: phoneNumber,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("[SMS] Failed to send 2FA code:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}

/**
 * Send account recovery code via SMS
 */
export async function sendRecoverySMS(phoneNumber: string, code: string): Promise<SMSResult> {
  try {
    const message = await twilio.messages.create({
      body: `Your GrayArx account recovery code is: ${code}. If you didn't request this, ignore this message.`,
      from: ENV.twilioPhoneNumber,
      to: phoneNumber,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("[SMS] Failed to send recovery code:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}

/**
 * Send security alert via SMS
 */
export async function sendSecurityAlertSMS(phoneNumber: string, alertMessage: string): Promise<SMSResult> {
  try {
    const message = await twilio.messages.create({
      body: `GrayArx Security Alert: ${alertMessage}. If this wasn't you, please change your password immediately.`,
      from: ENV.twilioPhoneNumber,
      to: phoneNumber,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("[SMS] Failed to send security alert:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}
