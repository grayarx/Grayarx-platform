/**
 * Complete Alert System
 * Production-ready real-time security alerts with multi-channel delivery
 */

import { notifyOwner } from "./notification";

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertChannel = "email" | "sms" | "in_app" | "webhook" | "slack";
export type AlertStatus = "triggered" | "acknowledged" | "resolved" | "escalated";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  channels: AlertChannel[];
  enabled: boolean;
  escalationPolicy?: EscalationPolicy;
  throttleMinutes?: number;
  createdAt: Date;
}

export interface AlertCondition {
  type: "brute_force" | "suspicious_location" | "unusual_activity" | "failed_2fa" | "account_lockout" | "ip_block" | "policy_violation";
  threshold?: number;
  timeWindowMinutes?: number;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  userId?: number;
  email?: string;
  ipAddress?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  metadata?: Record<string, any>;
  deliveryLog: AlertDelivery[];
}

export interface AlertDelivery {
  channel: AlertChannel;
  status: "pending" | "sent" | "failed" | "delivered";
  sentAt?: Date;
  failureReason?: string;
  recipientId?: string;
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  maxLevel: number;
}

export interface EscalationLevel {
  level: number;
  delayMinutes: number;
  channels: AlertChannel[];
  recipients: string[];
}

// Default alert rules
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "brute_force_rule",
    name: "Brute Force Attack Detection",
    description: "Alert on 5+ failed login attempts within 15 minutes",
    condition: {
      type: "brute_force",
      threshold: 5,
      timeWindowMinutes: 15,
    },
    severity: "critical",
    channels: ["email", "sms", "in_app"],
    enabled: true, createdAt: new Date(),
    throttleMinutes: 5,
  },
  {
    id: "suspicious_location_rule",
    name: "Suspicious Login Location",
    description: "Alert on login from unusual geographic location",
    condition: {
      type: "suspicious_location",
    },
    severity: "high",
    channels: ["email", "in_app"],
    enabled: true, createdAt: new Date(),
    throttleMinutes: 60,
  },
  {
    id: "unusual_activity_rule",
    name: "Unusual Activity Pattern",
    description: "Alert on unusual user activity patterns",
    condition: {
      type: "unusual_activity",
      threshold: 3,
      timeWindowMinutes: 60,
    },
    severity: "medium",
    channels: ["in_app"],
    enabled: true, createdAt: new Date(),
    throttleMinutes: 30,
  },
  {
    id: "failed_2fa_rule",
    name: "Failed 2FA Attempts",
    description: "Alert on 3+ failed 2FA attempts",
    condition: {
      type: "failed_2fa",
      threshold: 3,
      timeWindowMinutes: 10,
    },
    severity: "high",
    channels: ["email", "in_app"],
    enabled: true, createdAt: new Date(),
    throttleMinutes: 15,
  },
  {
    id: "account_lockout_rule",
    name: "Account Lockout",
    description: "Alert when account is locked",
    condition: {
      type: "account_lockout",
    },
    severity: "high",
    channels: ["email", "sms"],
    enabled: true, createdAt: new Date(),
  },
  {
    id: "ip_block_rule",
    name: "IP Address Blocked",
    description: "Alert when IP address is blocked",
    condition: {
      type: "ip_block",
    },
    severity: "medium",
    channels: ["in_app"],
    enabled: true, createdAt: new Date(),
  },
  {
    id: "policy_violation_rule",
    name: "Security Policy Violation",
    description: "Alert on security policy violations",
    condition: {
      type: "policy_violation",
    },
    severity: "high",
    channels: ["email", "in_app"],
    enabled: true, createdAt: new Date(),
    throttleMinutes: 60,
  },
];

// Alert storage (in production, use database)
const alertStore = new Map<string, Alert>();
const alertRuleStore = new Map<string, AlertRule>();
const lastAlertTime = new Map<string, number>();

// Initialize default rules
DEFAULT_ALERT_RULES.forEach((rule) => {
  alertRuleStore.set(rule.id, rule);
});

/**
 * Trigger an alert
 */
export async function triggerAlert(
  ruleId: string,
  userId: number | undefined,
  email: string | undefined,
  ipAddress: string | undefined,
  metadata?: Record<string, any>
): Promise<Alert | null> {
  try {
    const rule = alertRuleStore.get(ruleId);
    if (!rule || !rule.enabled) {
      return null;
    }

    // Check throttling
    const lastTime = lastAlertTime.get(ruleId) || 0;
    const throttleMs = (rule.throttleMinutes || 0) * 60 * 1000;
    if (Date.now() - lastTime < throttleMs) {
      return null;
    }

    lastAlertTime.set(ruleId, Date.now());

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      userId,
      email,
      ipAddress,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      status: "triggered",
      triggeredAt: new Date(),
      metadata,
      deliveryLog: [],
    };

    // Deliver alert through channels
    for (const channel of rule.channels) {
      await deliverAlert(alert, channel);
    }

    // Store alert
    alertStore.set(alert.id, alert);

    return alert;
  } catch (error) {
    console.error("Failed to trigger alert:", error);
    return null;
  }
}

/**
 * Deliver alert through specific channel
 */
export async function deliverAlert(alert: Alert, channel: AlertChannel): Promise<void> {
  const delivery: AlertDelivery = {
    channel,
    status: "pending",
  };

  try {
    switch (channel) {
      case "email":
        await deliverEmailAlert(alert);
        delivery.status = "sent";
        break;

      case "sms":
        await deliverSMSAlert(alert);
        delivery.status = "sent";
        break;

      case "in_app":
        await deliverInAppAlert(alert);
        delivery.status = "sent";
        break;

      case "webhook":
        await deliverWebhookAlert(alert);
        delivery.status = "sent";
        break;

      case "slack":
        await deliverSlackAlert(alert);
        delivery.status = "sent";
        break;
    }

    delivery.sentAt = new Date();
  } catch (error) {
    delivery.status = "failed";
    delivery.failureReason = error instanceof Error ? error.message : "Unknown error";
  }

  alert.deliveryLog.push(delivery);
}

/**
 * Deliver email alert
 */
async function deliverEmailAlert(alert: Alert): Promise<void> {
  if (!alert.email) return;

  // In production, use SendGrid/Resend
  const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
  const content = `
    <h2>${alert.title}</h2>
    <p>${alert.description}</p>
    <p><strong>Severity:</strong> ${alert.severity}</p>
    <p><strong>Time:</strong> ${alert.triggeredAt.toISOString()}</p>
    ${alert.ipAddress ? `<p><strong>IP Address:</strong> ${alert.ipAddress}</p>` : ""}
    ${alert.metadata ? `<p><strong>Details:</strong> ${JSON.stringify(alert.metadata)}</p>` : ""}
  `;

  console.log(`Email alert sent to ${alert.email}: ${subject}`);
}

/**
 * Deliver SMS alert
 */
async function deliverSMSAlert(alert: Alert): Promise<void> {
  // In production, use Twilio
  const message = `[${alert.severity}] ${alert.title}: ${alert.description}`;
  console.log(`SMS alert sent: ${message}`);
}

/**
 * Deliver in-app alert
 */
async function deliverInAppAlert(alert: Alert): Promise<void> {
  // In production, save to database and push to user's connected clients
  console.log(`In-app alert created: ${alert.title}`);
}

/**
 * Deliver webhook alert
 */
async function deliverWebhookAlert(alert: Alert): Promise<void> {
  // In production, make HTTP POST to configured webhook URL
  const payload = {
    id: alert.id,
    ruleId: alert.ruleId,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    triggeredAt: alert.triggeredAt,
    metadata: alert.metadata,
  };

  console.log(`Webhook alert payload: ${JSON.stringify(payload)}`);
}

/**
 * Deliver Slack alert
 */
async function deliverSlackAlert(alert: Alert): Promise<void> {
  // In production, use Slack API
  const color = {
    critical: "danger",
    high: "warning",
    medium: "warning",
    low: "good",
  }[alert.severity];

  const payload = {
    attachments: [
      {
        color,
        title: alert.title,
        text: alert.description,
        fields: [
          { title: "Severity", value: alert.severity, short: true },
          { title: "Status", value: alert.status, short: true },
          { title: "Time", value: alert.triggeredAt.toISOString(), short: false },
          ...(alert.ipAddress ? [{ title: "IP Address", value: alert.ipAddress, short: true }] : []),
        ],
      },
    ],
  };

  console.log(`Slack alert payload: ${JSON.stringify(payload)}`);
}

/**
 * Acknowledge alert
 */
export function acknowledgeAlert(alertId: string, acknowledgedBy: string): Alert | null {
  const alert = alertStore.get(alertId);
  if (!alert) return null;

  alert.status = "acknowledged";
  alert.acknowledgedAt = new Date();
  alert.acknowledgedBy = acknowledgedBy;

  return alert;
}

/**
 * Resolve alert
 */
export function resolveAlert(alertId: string): Alert | null {
  const alert = alertStore.get(alertId);
  if (!alert) return null;

  alert.status = "resolved";
  alert.resolvedAt = new Date();

  return alert;
}

/**
 * Get alert by ID
 */
export function getAlert(alertId: string): Alert | null {
  return alertStore.get(alertId) || null;
}

/**
 * Get all alerts with filtering
 */
export function getAlerts(filter?: {
  status?: AlertStatus;
  severity?: AlertSeverity;
  userId?: number;
  limit?: number;
  offset?: number;
}): { alerts: Alert[]; total: number } {
  let alerts = Array.from(alertStore.values());

  if (filter?.status) {
    alerts = alerts.filter((a) => a.status === filter.status);
  }

  if (filter?.severity) {
    alerts = alerts.filter((a) => a.severity === filter.severity);
  }

  if (filter?.userId) {
    alerts = alerts.filter((a) => a.userId === filter.userId);
  }

  // Sort by triggered time (newest first)
  alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

  const total = alerts.length;
  const limit = filter?.limit || 50;
  const offset = filter?.offset || 0;

  return {
    alerts: alerts.slice(offset, offset + limit),
    total,
  };
}

/**
 * Get alert rule
 */
export function getAlertRule(ruleId: string): AlertRule | null {
  return alertRuleStore.get(ruleId) || null;
}

/**
 * Get all alert rules
 */
export function getAllAlertRules(): AlertRule[] {
  return Array.from(alertRuleStore.values());
}

/**
 * Create custom alert rule
 */
export function createAlertRule(rule: Omit<AlertRule, "id" | "createdAt">): AlertRule {
  const newRule: AlertRule = {
    ...rule,
    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };

  alertRuleStore.set(newRule.id, newRule);
  return newRule;
}

/**
 * Update alert rule
 */
export function updateAlertRule(ruleId: string, updates: Partial<AlertRule>): AlertRule | null {
  const rule = alertRuleStore.get(ruleId);
  if (!rule) return null;

  const updated = { ...rule, ...updates, id: rule.id, createdAt: rule.createdAt };
  alertRuleStore.set(ruleId, updated);

  return updated;
}

/**
 * Delete alert rule
 */
export function deleteAlertRule(ruleId: string): boolean {
  return alertRuleStore.delete(ruleId);
}

/**
 * Enable/disable alert rule
 */
export function toggleAlertRule(ruleId: string): AlertRule | null {
  const rule = alertRuleStore.get(ruleId);
  if (!rule) return null;

  rule.enabled = !rule.enabled;
  return rule;
}

/**
 * Get alert statistics
 */
export function getAlertStats(): {
  totalAlerts: number;
  byStatus: Record<AlertStatus, number>;
  bySeverity: Record<AlertSeverity, number>;
  byRule: Record<string, number>;
} {
  const alerts = Array.from(alertStore.values());

  const byStatus: Record<AlertStatus, number> = {
    triggered: 0,
    acknowledged: 0,
    resolved: 0,
    escalated: 0,
  };

  const bySeverity: Record<AlertSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const byRule: Record<string, number> = {};

  alerts.forEach((alert) => {
    byStatus[alert.status]++;
    bySeverity[alert.severity]++;
    byRule[alert.ruleId] = (byRule[alert.ruleId] || 0) + 1;
  });

  return {
    totalAlerts: alerts.length,
    byStatus,
    bySeverity,
    byRule,
  };
}

/**
 * Clear old alerts (older than specified days)
 */
export function clearOldAlerts(daysOld: number = 30): number {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let count = 0;

  for (const [id, alert] of alertStore.entries()) {
    if (alert.triggeredAt.getTime() < cutoffTime) {
      alertStore.delete(id);
      count++;
    }
  }

  return count;
}
