/**
 * WhatsApp Integration Service
 * Enables full parity between web chatbot and WhatsApp Business API
 * Requires: Business Account ID, API Token, Phone Number ID
 */

// Message type definition
interface Message {
  text: string;
  timestamp: Date;
  sender: string;
}

interface WhatsAppConfig {
  businessAccountId: string;
  apiToken: string;
  phoneNumberId: string;
  businessPhoneNumber: string;
  webhookToken: string;
  enabled: boolean;
}

interface WhatsAppMessage {
  from: string; // Customer phone number
  to: string; // Business phone number
  type: "text" | "image" | "document" | "audio" | "video";
  content: string | Buffer;
  timestamp: Date;
  messageId?: string;
  metadata?: Record<string, any>;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppIntegrationService {
  private config: WhatsAppConfig | null = null;
  private isInitialized = false;

  /**
   * Initialize WhatsApp integration with credentials
   */
  initialize(config: WhatsAppConfig): boolean {
    if (!this.validateConfig(config)) {
      console.error("[WhatsApp] Invalid configuration");
      return false;
    }

    this.config = config;
    this.isInitialized = config.enabled;

    if (this.isInitialized) {
      console.log("[WhatsApp] Integration initialized successfully");
    }

    return this.isInitialized;
  }

  /**
   * Validate WhatsApp configuration
   */
  private validateConfig(config: WhatsAppConfig): boolean {
    const required = ["businessAccountId", "apiToken", "phoneNumberId", "businessPhoneNumber", "webhookToken"];
    return required.every((field) => config[field as keyof WhatsAppConfig]);
  }

  /**
   * Send message via WhatsApp Business API
   */
  async sendMessage(phoneNumber: string, message: string): Promise<WhatsAppResponse> {
    if (!this.isInitialized || !this.config) {
      return {
        success: false,
        error: "WhatsApp integration not initialized",
      };
    }

    try {
      // Format phone number (remove +, add country code if needed)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Prepare WhatsApp API request
      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      };

      // Send via WhatsApp Business API
      const response = await this.makeApiRequest("POST", "/messages", payload);

      if (response.messages && response.messages[0]) {
        return {
          success: true,
          messageId: response.messages[0].id,
        };
      }

      return {
        success: false,
        error: "Failed to send message",
      };
    } catch (error) {
      console.error("[WhatsApp] Send message error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send template message (pre-approved by WhatsApp)
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    parameters?: string[]
  ): Promise<WhatsAppResponse> {
    if (!this.isInitialized || !this.config) {
      return {
        success: false,
        error: "WhatsApp integration not initialized",
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en_US",
          },
          ...(parameters && {
            components: [
              {
                type: "body",
                parameters: parameters.map((param) => ({ type: "text", text: param })),
              },
            ],
          }),
        },
      };

      const response = await this.makeApiRequest("POST", "/messages", payload);

      if (response.messages && response.messages[0]) {
        return {
          success: true,
          messageId: response.messages[0].id,
        };
      }

      return {
        success: false,
        error: "Failed to send template message",
      };
    } catch (error) {
      console.error("[WhatsApp] Send template message error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send media message (image, document, video, audio)
   */
  async sendMediaMessage(
    phoneNumber: string,
    mediaUrl: string,
    mediaType: "image" | "document" | "video" | "audio",
    caption?: string
  ): Promise<WhatsAppResponse> {
    if (!this.isInitialized || !this.config) {
      return {
        success: false,
        error: "WhatsApp integration not initialized",
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          ...(caption && mediaType === "image" && { caption }),
        },
      };

      const response = await this.makeApiRequest("POST", "/messages", payload);

      if (response.messages && response.messages[0]) {
        return {
          success: true,
          messageId: response.messages[0].id,
        };
      }

      return {
        success: false,
        error: "Failed to send media message",
      };
    } catch (error) {
      console.error("[WhatsApp] Send media message error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle incoming WhatsApp message webhook
   */
  async handleWebhookMessage(payload: any): Promise<boolean> {
    try {
      // Verify webhook token
      if (payload.token !== this.config?.webhookToken) {
        console.warn("[WhatsApp] Invalid webhook token");
        return false;
      }

      const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages;
      if (!messages || messages.length === 0) {
        return true; // No messages to process
      }

      for (const message of messages) {
        await this.processIncomingMessage(message);
      }

      return true;
    } catch (error) {
      console.error("[WhatsApp] Webhook processing error:", error);
      return false;
    }
  }

  /**
   * Process incoming WhatsApp message
   */
  private async processIncomingMessage(message: any): Promise<void> {
    try {
      const phoneNumber = message.from;
      let messageText = "";

      // Extract message content based on type
      if (message.type === "text") {
        messageText = message.text?.body || "";
      } else if (message.type === "image") {
        messageText = message.image?.caption || "[Image received]";
      } else if (message.type === "document") {
        messageText = `[Document: ${message.document?.filename || "unknown"}]`;
      } else if (message.type === "audio") {
        messageText = "[Audio message received]";
      } else if (message.type === "video") {
        messageText = "[Video message received]";
      }

      // Log incoming message
      console.log(`[WhatsApp] Incoming message from ${phoneNumber}: ${messageText}`);

      // TODO: Process with chatbot service and send response
      // This would integrate with the main chatbot service to provide responses
    } catch (error) {
      console.error("[WhatsApp] Process incoming message error:", error);
    }
  }

  /**
   * Make API request to WhatsApp Business API
   */
  private async makeApiRequest(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.config) {
      throw new Error("WhatsApp configuration not available");
    }

    const url = `https://graph.facebook.com/v22.0/${this.config.phoneNumberId}${endpoint}`;

    const headers = {
      Authorization: `Bearer ${this.config.apiToken}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`WhatsApp API error: ${error.error?.message || "Unknown error"}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[WhatsApp] API request error:", error);
      throw error;
    }
  }

  /**
   * Format phone number for WhatsApp API (E.164 format)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove common formatting characters
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Remove leading +
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present (assume South Africa +27)
    if (!cleaned.startsWith("27") && cleaned.startsWith("0")) {
      cleaned = "27" + cleaned.substring(1);
    } else if (!cleaned.startsWith("27")) {
      cleaned = "27" + cleaned;
    }

    return cleaned;
  }

  /**
   * Get WhatsApp configuration status
   */
  getStatus(): {
    enabled: boolean;
    configured: boolean;
    phoneNumber?: string;
  } {
    return {
      enabled: this.isInitialized,
      configured: !!this.config,
      phoneNumber: this.config?.businessPhoneNumber,
    };
  }

  /**
   * Disable WhatsApp integration
   */
  disable(): void {
    this.isInitialized = false;
    console.log("[WhatsApp] Integration disabled");
  }

  /**
   * Create WhatsApp-specific message template
   */
  createMessageTemplate(message: Message): string {
    return `
${message.text}

---
Sent via GrayArx AI Assistant
${new Date().toLocaleTimeString()}
    `.trim();
  }
}

export const whatsappIntegrationService = new WhatsAppIntegrationService();
