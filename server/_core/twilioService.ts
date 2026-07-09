import { z } from "zod";

/**
 * Twilio Service - SMS and WhatsApp Integration
 * Supports both mock (for testing) and real (production) modes
 */

interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  mode: "mock" | "real";
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mode: "mock" | "real";
}

class TwilioService {
  private config: TwilioConfig;
  private client: any;

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_API_KEY || process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
      mode: process.env.TWILIO_MODE === "real" ? "real" : "mock",
    };

    // Initialize real Twilio client only if credentials are provided
    if (this.config.mode === "real" && this.config.accountSid && this.config.authToken) {
      try {
        const twilio = require("twilio");
        this.client = twilio(this.config.accountSid, this.config.authToken);
      } catch (e) {
        console.warn("[Twilio] Failed to initialize real client, falling back to mock mode");
        this.config.mode = "mock";
      }
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(to: string, message: string): Promise<SendResult> {
    if (this.config.mode === "mock") {
      return this.mockSendSMS(to, message);
    }

    if (!this.client) {
      return {
        success: false,
        error: "Twilio client not initialized",
        mode: "real",
      };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: to,
      });

      return {
        success: true,
        messageId: result.sid,
        mode: "real",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: "real",
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(to: string, message: string): Promise<SendResult> {
    if (this.config.mode === "mock") {
      return this.mockSendWhatsApp(to, message);
    }

    if (!this.client) {
      return {
        success: false,
        error: "Twilio client not initialized",
        mode: "real",
      };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.config.whatsappNumber}`,
        to: `whatsapp:${to}`,
      });

      return {
        success: true,
        messageId: result.sid,
        mode: "real",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: "real",
      };
    }
  }

  /**
   * Mock SMS sending for testing
   */
  private mockSendSMS(to: string, message: string): SendResult {
    const messageId = `mock_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log mock sending
    console.log(`[Twilio Mock] SMS to ${to}: "${message.substring(0, 50)}..."`);

    return {
      success: true,
      messageId,
      mode: "mock",
    };
  }

  /**
   * Mock WhatsApp sending for testing
   */
  private mockSendWhatsApp(to: string, message: string): SendResult {
    const messageId = `mock_whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log mock sending
    console.log(`[Twilio Mock] WhatsApp to ${to}: "${message.substring(0, 50)}..."`);

    return {
      success: true,
      messageId,
      mode: "mock",
    };
  }

  /**
   * Get current mode (mock or real)
   */
  getMode(): string {
    return this.config.mode;
  }

  /**
   * Check if real Twilio is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.phoneNumber &&
      this.config.whatsappNumber
    );
  }

  /**
   * Get configuration status (for debugging)
   */
  getStatus(): {
    mode: string;
    configured: boolean;
    hasAccountSid: boolean;
    hasAuthToken: boolean;
    hasPhoneNumber: boolean;
    hasWhatsappNumber: boolean;
  } {
    return {
      mode: this.config.mode,
      configured: this.isConfigured(),
      hasAccountSid: !!this.config.accountSid,
      hasAuthToken: !!this.config.authToken,
      hasPhoneNumber: !!this.config.phoneNumber,
      hasWhatsappNumber: !!this.config.whatsappNumber,
    };
  }
}

// Export singleton instance
export const twilioService = new TwilioService();

/**
 * Helper function to send SMS with automatic mode detection
 */
export async function sendSMS(to: string, message: string): Promise<SendResult> {
  return twilioService.sendSMS(to, message);
}

/**
 * Helper function to send WhatsApp with automatic mode detection
 */
export async function sendWhatsApp(to: string, message: string): Promise<SendResult> {
  return twilioService.sendWhatsApp(to, message);
}

/**
 * Get Twilio service status
 */
export function getTwilioStatus() {
  return twilioService.getStatus();
}
