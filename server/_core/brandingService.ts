/**
 * Branding Configuration Service
 * Manages dealership branding, colors, logos, and customization
 */

interface BrandingConfig {
  dealershipName: string;
  dealershipPhone: string;
  dealershipEmail: string;
  dealershipAddress: string;
  dealershipWebsite?: string;
  dealershipHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  logo?: {
    url: string;
    width: number;
    height: number;
  };
  favicon?: string;
  primaryColor: string; // Hex color
  secondaryColor: string; // Hex color
  accentColor: string; // Hex color
  backgroundColor: string; // Hex color
  textColor: string; // Hex color
  fontFamily?: string; // Google Font name
  tagline?: string;
  description?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  customCSS?: string; // Additional custom CSS
  customJavaScript?: string; // Additional custom JS (limited)
  chatbotGreeting?: string;
  chatbotTheme?: "light" | "dark" | "custom";
  enableWhatsApp?: boolean;
  whatsAppNumber?: string;
  enableLiveChat?: boolean;
  timezone?: string;
  language?: string;
}

class BrandingService {
  private defaultConfig: BrandingConfig = {
    dealershipName: "GrayArx Dealership",
    dealershipPhone: "+27 (0) 11 123 4567",
    dealershipEmail: "info@grayarx.com",
    dealershipAddress: "123 Motor Street, Johannesburg, South Africa",
    dealershipWebsite: "https://www.grayarx.com",
    dealershipHours: {
      monday: "08:00 - 18:00",
      tuesday: "08:00 - 18:00",
      wednesday: "08:00 - 18:00",
      thursday: "08:00 - 18:00",
      friday: "08:00 - 18:00",
      saturday: "09:00 - 16:00",
      sunday: "Closed",
    },
    primaryColor: "#1e40af", // Blue
    secondaryColor: "#64748b", // Slate
    accentColor: "#dc2626", // Red
    backgroundColor: "#ffffff", // White
    textColor: "#1f2937", // Dark gray
    fontFamily: "Inter",
    tagline: "Your AI-Powered Dealership Assistant",
    description: "Experience the future of car buying with our intelligent AI chatbot",
    socialMedia: {
      facebook: "https://facebook.com/grayarx",
      instagram: "https://instagram.com/grayarx",
      twitter: "https://twitter.com/grayarx",
    },
    chatbotGreeting: "Welcome to GrayArx! 👋 How can I help you find your perfect vehicle today?",
    chatbotTheme: "light",
    enableWhatsApp: false,
    enableLiveChat: true,
    timezone: "Africa/Johannesburg",
    language: "en",
  };

  private currentConfig: BrandingConfig = { ...this.defaultConfig };

  /**
   * Get current branding configuration
   */
  getConfig(): BrandingConfig {
    return { ...this.currentConfig };
  }

  /**
   * Update branding configuration
   */
  updateConfig(updates: Partial<BrandingConfig>): BrandingConfig {
    this.currentConfig = {
      ...this.currentConfig,
      ...updates,
    };
    return { ...this.currentConfig };
  }

  /**
   * Reset to default configuration
   */
  resetToDefault(): BrandingConfig {
    this.currentConfig = { ...this.defaultConfig };
    return { ...this.currentConfig };
  }

  /**
   * Get CSS variables for theming
   */
  getCSSVariables(): string {
    const config = this.currentConfig;
    return `
:root {
  --primary-color: ${config.primaryColor};
  --secondary-color: ${config.secondaryColor};
  --accent-color: ${config.accentColor};
  --background-color: ${config.backgroundColor};
  --text-color: ${config.textColor};
  --dealership-name: "${config.dealershipName}";
}

body {
  --font-family: "${config.fontFamily || "Inter"}";
  color: ${config.textColor};
  background-color: ${config.backgroundColor};
}

.primary-btn {
  background-color: ${config.primaryColor};
  color: white;
}

.secondary-btn {
  background-color: ${config.secondaryColor};
  color: white;
}

.accent-btn {
  background-color: ${config.accentColor};
  color: white;
}

.chatbot-container {
  ${config.chatbotTheme === "dark" ? "background-color: #1f2937; color: white;" : "background-color: white; color: #1f2937;"}
}

${config.customCSS || ""}
    `.trim();
  }

  /**
   * Get HTML meta tags for branding
   */
  getMetaTags(): Record<string, string> {
    const config = this.currentConfig;
    return {
      "og:title": config.dealershipName,
      "og:description": config.description || "",
      "og:image": config.logo?.url || "",
      "twitter:card": "summary_large_image",
      "twitter:title": config.dealershipName,
      "twitter:description": config.description || "",
      "theme-color": config.primaryColor,
    };
  }

  /**
   * Get dealership hours as readable string
   */
  getHoursString(): string {
    const hours = this.currentConfig.dealershipHours;
    if (!hours) return "Hours not available";

    return Object.entries(hours)
      .map(([day, time]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}`)
      .join("\n");
  }

  /**
   * Check if dealership is currently open
   */
  isCurrentlyOpen(): boolean {
    const config = this.currentConfig;
    const timezone = config.timezone || "Africa/Johannesburg";
    const now = new Date();

    // Get current day and time in dealership timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const dayPart = parts.find((p) => p.type === "weekday");
    const hourPart = parts.find((p) => p.type === "hour");
    const minutePart = parts.find((p) => p.type === "minute");

    if (!dayPart || !hourPart || !minutePart) return false;

    const currentDay = dayPart.value.toLowerCase();
    const currentHour = parseInt(hourPart.value);
    const currentMinute = parseInt(minutePart.value);
    const currentTime = currentHour * 60 + currentMinute;

    const hoursConfig = config.dealershipHours?.[currentDay as keyof BrandingConfig["dealershipHours"]];
    if (!hoursConfig || hoursConfig === "Closed") return false;

    const [openStr, closeStr] = (hoursConfig as string).split(" - ");
    if (!openStr || !closeStr) return false;
    const [openHour, openMin] = openStr.split(":").map(Number);
    const [closeHour, closeMin] = closeStr.split(":").map(Number);

    const openTime = (openHour || 0) * 60 + (openMin || 0);
    const closeTime = (closeHour || 0) * 60 + (closeMin || 0);

    return openTime > 0 && closeTime > 0 && currentTime >= openTime && currentTime < closeTime;
  }

  /**
   * Get next opening time
   */
  getNextOpeningTime(): Date | null {
    // Implementation would check hours and calculate next opening
    // This is a simplified version that returns current time
    return new Date();
  }

  /**
   * Validate branding configuration
   */
  validateConfig(config: Partial<BrandingConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.primaryColor && !this.isValidHexColor(config.primaryColor)) {
      errors.push("Invalid primary color format");
    }

    if (config.secondaryColor && !this.isValidHexColor(config.secondaryColor)) {
      errors.push("Invalid secondary color format");
    }

    if (config.accentColor && !this.isValidHexColor(config.accentColor)) {
      errors.push("Invalid accent color format");
    }

    if (config.dealershipPhone && !this.isValidPhoneNumber(config.dealershipPhone)) {
      errors.push("Invalid phone number format");
    }

    if (config.dealershipEmail && !this.isValidEmail(config.dealershipEmail)) {
      errors.push("Invalid email format");
    }

    if (config.customCSS && config.customCSS.length > 5000) {
      errors.push("Custom CSS exceeds maximum length (5000 characters)");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.length >= 10;
  }

  /**
   * Export branding configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.currentConfig, null, 2);
  }

  /**
   * Import branding configuration from JSON
   */
  importConfig(jsonString: string): { success: boolean; error?: string } {
    try {
      const config = JSON.parse(jsonString) as Partial<BrandingConfig>;
      const validation = this.validateConfig(config);

      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(", ")}`,
        };
      }

      this.currentConfig = {
        ...this.currentConfig,
        ...config,
      };

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

export const brandingService = new BrandingService();
