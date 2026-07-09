/**
 * Feature descriptions for tooltips in upgrade modal
 * Each feature has a name, description, and which tiers it's available in
 */

export const featureDescriptions = {
  whatsapp_chatbot: {
    name: "WhatsApp Chatbot",
    description: "AI-powered chatbot that handles customer inquiries on WhatsApp. Responds to questions, qualifies leads, and schedules appointments automatically.",
    tiers: ["starter", "professional", "enterprise"],
    icon: "MessageCircle",
  },
  email_notifications: {
    name: "Email Notifications",
    description: "Receive real-time email alerts for new leads, status changes, and important events. Customize notification preferences and quiet hours.",
    tiers: ["starter", "professional", "enterprise"],
    icon: "Mail",
  },
  lead_capture: {
    name: "Lead Capture",
    description: "Capture leads from multiple sources including website forms, WhatsApp, and manual entry. Automatic lead scoring and categorization.",
    tiers: ["starter", "professional", "enterprise"],
    icon: "Users",
  },
  dashboard: {
    name: "Dashboard",
    description: "Comprehensive dashboard with real-time KPIs, lead metrics, and performance analytics. Customizable widgets and reports.",
    tiers: ["starter", "professional", "enterprise"],
    icon: "BarChart3",
  },
  advanced_analytics: {
    name: "Advanced Analytics",
    description: "Deep dive analytics with conversion funnels, lead source analysis, ROI tracking, and predictive insights. Export reports in multiple formats.",
    tiers: ["professional", "enterprise"],
    icon: "TrendingUp",
  },
  lead_prioritization: {
    name: "Lead Prioritization AI",
    description: "AI algorithm that automatically ranks leads by quality and conversion likelihood. Focus your team on high-value opportunities.",
    tiers: ["professional", "enterprise"],
    icon: "Zap",
  },
  inventory_sync: {
    name: "Inventory Sync",
    description: "Automatic synchronization of your vehicle inventory with the platform. Real-time updates from your dealership management system.",
    tiers: ["professional", "enterprise"],
    icon: "Package",
  },
  webhook_support: {
    name: "Webhook Support",
    description: "Send real-time events to your external systems. Integrate with CRMs, accounting software, and custom applications seamlessly.",
    tiers: ["professional", "enterprise"],
    icon: "Zap",
  },
  priority_support: {
    name: "Priority Support",
    description: "Get faster response times from our support team. Email support with 4-hour response time guarantee.",
    tiers: ["professional", "enterprise"],
    icon: "Headphones",
  },
  api_access: {
    name: "Full API Access",
    description: "Complete REST API access for custom integrations. Build custom applications, automate workflows, and extend functionality.",
    tiers: ["enterprise"],
    icon: "Code",
  },
  custom_webhooks: {
    name: "Custom Webhooks",
    description: "Configure custom webhook endpoints for your specific business logic. Unlimited webhook destinations and custom payloads.",
    tiers: ["enterprise"],
    icon: "Workflow",
  },
  crm_integration: {
    name: "CRM Integration",
    description: "Deep integration with popular CRM platforms. Two-way sync of leads, contacts, and deals. Automatic data mapping.",
    tiers: ["enterprise"],
    icon: "Database",
  },
  phone_support: {
    name: "Phone Support",
    description: "Direct phone support from our team. Available during business hours with 1-hour response time.",
    tiers: ["enterprise"],
    icon: "Phone",
  },
  dedicated_account_manager: {
    name: "Dedicated Account Manager",
    description: "Personal account manager assigned to your dealership. Quarterly business reviews and strategic guidance.",
    tiers: ["enterprise"],
    icon: "User",
  },
  bulk_lead_import: {
    name: "Bulk Lead Import",
    description: "Import leads in bulk from CSV files. Automatic deduplication, validation, and quality scoring.",
    tiers: ["professional", "enterprise"],
    icon: "Upload",
  },
  lead_scoring: {
    name: "Lead Scoring",
    description: "Automatic lead scoring based on 10 factors including source, engagement, and vehicle preferences. Identify high-quality leads instantly.",
    tiers: ["starter", "professional", "enterprise"],
    icon: "Star",
  },
  audit_logging: {
    name: "Audit Logging",
    description: "Complete audit trail of all system activities. Track who did what, when, and why. Export audit logs for compliance.",
    tiers: ["professional", "enterprise"],
    icon: "FileText",
  },
  custom_branding: {
    name: "Custom Branding",
    description: "White-label the platform with your dealership's branding. Custom logo, colors, and domain.",
    tiers: ["enterprise"],
    icon: "Palette",
  },
  sso_integration: {
    name: "Single Sign-On (SSO)",
    description: "Integrate with your company's identity provider. SAML 2.0 and OAuth 2.0 support.",
    tiers: ["enterprise"],
    icon: "Lock",
  },
  multi_location: {
    name: "Multi-Location Support",
    description: "Manage multiple dealership locations from a single account. Per-location analytics and reporting.",
    tiers: ["professional", "enterprise"],
    icon: "MapPin",
  },
};

export type FeatureKey = keyof typeof featureDescriptions;

export function getFeatureDescription(featureKey: FeatureKey) {
  return featureDescriptions[featureKey];
}

export function getAllFeatures() {
  return Object.entries(featureDescriptions).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

export function getFeaturesByTier(tier: "starter" | "professional" | "enterprise") {
  return getAllFeatures().filter((feature) => feature.tiers.includes(tier));
}
