import { getDb } from "./db";
import { subscriptions, dealerships } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Feature Access Control System
 * Enforces subscription tier limits and prevents unauthorized feature access
 */

export type SubscriptionTier = "starter" | "professional" | "enterprise";

export interface FeatureDefinition {
  id: string;
  name: string;
  tiers: SubscriptionTier[]; // which tiers have access
  limit?: number; // usage limit per month (if applicable)
  category: "integration" | "support" | "analytics" | "communication" | "api";
}

// Define all features and which tiers can access them
export const FEATURE_DEFINITIONS: Record<string, FeatureDefinition> = {
  // API Features
  api_access: {
    id: "api_access",
    name: "API Access",
    tiers: ["enterprise"],
    category: "api",
  },
  webhook_support: {
    id: "webhook_support",
    name: "Webhook Integration",
    tiers: ["professional", "enterprise"],
    category: "integration",
  },
  custom_webhooks: {
    id: "custom_webhooks",
    name: "Custom Webhook Setup",
    tiers: ["enterprise"],
    category: "integration",
  },

  // Analytics Features
  advanced_analytics: {
    id: "advanced_analytics",
    name: "Advanced Analytics & Reporting",
    tiers: ["professional", "enterprise"],
    category: "analytics",
  },
  lead_prioritization: {
    id: "lead_prioritization",
    name: "AI Lead Prioritization",
    tiers: ["professional", "enterprise"],
    category: "analytics",
  },
  performance_reports: {
    id: "performance_reports",
    name: "Monthly Performance Reports",
    tiers: ["professional", "enterprise"],
    category: "analytics",
  },
  custom_analytics: {
    id: "custom_analytics",
    name: "Custom Analytics Dashboards",
    tiers: ["enterprise"],
    category: "analytics",
  },

  // Integration Features
  inventory_sync: {
    id: "inventory_sync",
    name: "Inventory AI Sync",
    tiers: ["professional", "enterprise"],
    category: "integration",
  },
  crm_integration: {
    id: "crm_integration",
    name: "CRM Integration Support",
    tiers: ["enterprise"],
    category: "integration",
  },

  // Support Features
  priority_support: {
    id: "priority_support",
    name: "Priority Email Support (12-24h)",
    tiers: ["professional", "enterprise"],
    category: "support",
  },
  phone_support: {
    id: "phone_support",
    name: "Phone Support",
    tiers: ["enterprise"],
    category: "support",
  },
  dedicated_account_manager: {
    id: "dedicated_account_manager",
    name: "Dedicated Account Manager",
    tiers: ["enterprise"],
    category: "support",
  },

  // Communication Features — Cloud API WhatsApp on Starter OS and up (PRICING.md)
  whatsapp_chatbot: {
    id: "whatsapp_chatbot",
    name: "WhatsApp Chatbot (Cloud API)",
    tiers: ["starter", "professional", "enterprise"],
    category: "communication",
  },
  whatsapp_api: {
    id: "whatsapp_api",
    name: "WhatsApp Nala (Cloud API)",
    tiers: ["starter", "professional", "enterprise"],
    category: "communication",
  },
  email_notifications: {
    id: "email_notifications",
    name: "Email Notifications",
    tiers: ["starter", "professional", "enterprise"],
    category: "communication",
  },
  sms_alerts: {
    id: "sms_alerts",
    name: "SMS Alerts (Twilio)",
    tiers: ["professional", "enterprise"],
    category: "communication",
  },
};

/**
 * Check if a dealership has access to a specific feature
 */
export async function checkFeatureAccess(
  dealershipId: number,
  featureId: string
): Promise<{ hasAccess: boolean; tier: SubscriptionTier | null; reason?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { hasAccess: false, tier: null, reason: "Database unavailable" };
    }

    // Get dealership subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dealershipId, dealershipId))
      .limit(1);

    if (!subscription) {
      return { hasAccess: false, tier: null, reason: "No active subscription" };
    }

    // Check subscription status
    if (subscription.status !== "active") {
      return {
        hasAccess: false,
        tier: subscription.plan as SubscriptionTier,
        reason: `Subscription is ${subscription.status}`,
      };
    }

    // Check if subscription is expired
    const renewalDate = new Date(subscription.nextRenewalDate);
    if (renewalDate < new Date()) {
      return {
        hasAccess: false,
        tier: subscription.plan as SubscriptionTier,
        reason: "Subscription expired",
      };
    }

    // Get feature definition
    const feature = FEATURE_DEFINITIONS[featureId];
    if (!feature) {
      return { hasAccess: false, tier: subscription.plan as SubscriptionTier, reason: "Feature not found" };
    }

    // Check if tier has access
    const tier = subscription.plan as SubscriptionTier;
    const hasAccess = feature.tiers.includes(tier);

    return {
      hasAccess,
      tier,
      reason: hasAccess ? undefined : `Feature not included in ${tier} tier`,
    };
  } catch (error) {
    console.error("Error checking feature access:", error);
    return { hasAccess: false, tier: null, reason: "Error checking access" };
  }
}

/**
 * Get all accessible features for a dealership
 */
export async function getAccessibleFeatures(dealershipId: number): Promise<FeatureDefinition[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dealershipId, dealershipId))
      .limit(1);

    if (!subscription || subscription.status !== "active") {
      return [];
    }

    const tier = subscription.plan as SubscriptionTier;
    return Object.values(FEATURE_DEFINITIONS).filter((f) => f.tiers.includes(tier));
  } catch (error) {
    console.error("Error getting accessible features:", error);
    return [];
  }
}

/**
 * Get subscription tier for a dealership
 */
export async function getSubscriptionTier(dealershipId: number): Promise<SubscriptionTier | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dealershipId, dealershipId))
      .limit(1);

    if (!subscription || subscription.status !== "active") {
      return null;
    }

    return subscription.plan as SubscriptionTier;
  } catch (error) {
    console.error("Error getting subscription tier:", error);
    return null;
  }
}

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export async function isSubscriptionExpiringsoon(dealershipId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dealershipId, dealershipId))
      .limit(1);

    if (!subscription) return false;

    const renewalDate = new Date(subscription.nextRenewalDate);
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return renewalDate <= sevenDaysFromNow && renewalDate > today;
  } catch (error) {
    console.error("Error checking subscription expiry:", error);
    return false;
  }
}

/**
 * Get subscription details including renewal info
 */
export async function getSubscriptionDetails(dealershipId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dealershipId, dealershipId))
      .limit(1);

    if (!subscription) return null;

    const renewalDate = new Date(subscription.nextRenewalDate);
    const today = new Date();
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = renewalDate < today;
    const isExpiringoon = daysUntilRenewal <= 7 && daysUntilRenewal > 0;

    return {
      tier: subscription.plan as SubscriptionTier,
      status: subscription.status,
      renewalDate,
      daysUntilRenewal,
      isExpired,
      isExpiringoon,
      monthlyPrice: subscription.monthlyPriceZar,
      startDate: subscription.billingCycleStart,
    };
  } catch (error) {
    console.error("Error getting subscription details:", error);
    return null;
  }
}
