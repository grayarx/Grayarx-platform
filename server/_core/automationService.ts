/**
 * Automation Service
 * Handles automated responses to security events (lockouts, alerts, incident reports)
 */

import { notifyOwner } from "./notification";

export interface AutomationAction {
  id: string;
  type: "account_lockout" | "email_alert" | "sms_alert" | "incident_report" | "ip_block";
  userId?: number;
  ipAddress?: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  status: "pending" | "executing" | "completed" | "failed";
  metadata?: Record<string, any>;
}

export interface AutomationTrigger {
  type: "failed_logins" | "suspicious_activity" | "email_verification_timeout" | "ip_threshold";
  threshold: number;
  window: number; // in minutes
  action: AutomationAction["type"];
  enabled: boolean;
}

// Default automation triggers
export const DEFAULT_TRIGGERS: AutomationTrigger[] = [
  {
    type: "failed_logins",
    threshold: 5,
    window: 15,
    action: "account_lockout",
    enabled: true,
  },
  {
    type: "suspicious_activity",
    threshold: 3,
    window: 60,
    action: "email_alert",
    enabled: true,
  },
  {
    type: "ip_threshold",
    threshold: 10,
    window: 60,
    action: "ip_block",
    enabled: true,
  },
];

/**
 * Execute account lockout automation
 */
export async function executeAccountLockout(
  userId: number,
  email: string,
  reason: string,
  durationMinutes: number = 15
): Promise<AutomationAction> {
  const action: AutomationAction = {
    id: `lockout_${userId}_${Date.now()}`,
    type: "account_lockout",
    userId,
    reason,
    severity: "high",
    timestamp: new Date(),
    status: "pending",
    metadata: {
      email,
      durationMinutes,
      unlockAt: new Date(Date.now() + durationMinutes * 60 * 1000),
    },
  };

  try {
    // In production, update database to lock account
    // await db.update(users).set({ isLocked: true, lockedUntil: unlockAt }).where(eq(users.id, userId));

    // Send notification to user
    await notifyOwner({
      title: `Account Locked: ${email}`,
      content: `Account has been locked due to ${reason}. It will be automatically unlocked in ${durationMinutes} minutes.`,
    });

    action.status = "completed";
  } catch (error) {
    action.status = "failed";
    console.error("Failed to execute account lockout:", error);
  }

  return action;
}

/**
 * Execute email alert automation
 */
export async function executeEmailAlert(
  recipientEmail: string,
  subject: string,
  content: string,
  severity: "low" | "medium" | "high" | "critical"
): Promise<AutomationAction> {
  const action: AutomationAction = {
    id: `email_${Date.now()}`,
    type: "email_alert",
    reason: subject,
    severity,
    timestamp: new Date(),
    status: "pending",
    metadata: {
      recipientEmail,
      subject,
      content,
    },
  };

  try {
    // In production, send email via SendGrid/Resend
    // await sendEmail({
    //   to: recipientEmail,
    //   subject,
    //   html: content,
    // });

    action.status = "completed";
  } catch (error) {
    action.status = "failed";
    console.error("Failed to send email alert:", error);
  }

  return action;
}

/**
 * Execute SMS alert automation
 */
export async function executeSMSAlert(
  phoneNumber: string,
  message: string,
  severity: "low" | "medium" | "high" | "critical"
): Promise<AutomationAction> {
  const action: AutomationAction = {
    id: `sms_${Date.now()}`,
    type: "sms_alert",
    reason: message,
    severity,
    timestamp: new Date(),
    status: "pending",
    metadata: {
      phoneNumber,
      message,
    },
  };

  try {
    // In production, send SMS via Twilio
    // await twilioClient.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    action.status = "completed";
  } catch (error) {
    action.status = "failed";
    console.error("Failed to send SMS alert:", error);
  }

  return action;
}

/**
 * Generate incident report
 */
export async function generateIncidentReport(
  incidentType: string,
  severity: "low" | "medium" | "high" | "critical",
  description: string,
  affectedUsers: number[],
  metadata?: Record<string, any>
): Promise<AutomationAction> {
  const action: AutomationAction = {
    id: `incident_${Date.now()}`,
    type: "incident_report",
    reason: incidentType,
    severity,
    timestamp: new Date(),
    status: "pending",
    metadata: {
      description,
      affectedUsers,
      reportedAt: new Date(),
      ...metadata,
    },
  };

  try {
    // In production, save incident report to database
    // await db.insert(incidentReports).values({
    //   type: incidentType,
    //   severity,
    //   description,
    //   affectedUserCount: affectedUsers.length,
    //   metadata: JSON.stringify(metadata),
    //   createdAt: new Date(),
    // });

    // Notify owner of critical incidents
    if (severity === "critical") {
      await notifyOwner({
        title: `CRITICAL INCIDENT: ${incidentType}`,
        content: `A critical security incident has been detected. ${description}. Affected users: ${affectedUsers.length}`,
      });
    }

    action.status = "completed";
  } catch (error) {
    action.status = "failed";
    console.error("Failed to generate incident report:", error);
  }

  return action;
}

/**
 * Execute IP block automation
 */
export async function executeIPBlock(
  ipAddress: string,
  reason: string,
  durationHours: number = 24
): Promise<AutomationAction> {
  const action: AutomationAction = {
    id: `ipblock_${ipAddress}_${Date.now()}`,
    type: "ip_block",
    ipAddress,
    reason,
    severity: "high",
    timestamp: new Date(),
    status: "pending",
    metadata: {
      durationHours,
      unblockAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
    },
  };

  try {
    // In production, add IP to blacklist
    // await db.insert(ipBlacklist).values({
    //   ipAddress,
    //   reason,
    //   blockedAt: new Date(),
    //   unblockAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
    // });

    action.status = "completed";
  } catch (error) {
    action.status = "failed";
    console.error("Failed to block IP:", error);
  }

  return action;
}

/**
 * Check if automation trigger should fire
 */
export function shouldFireTrigger(
  trigger: AutomationTrigger,
  currentCount: number,
  timeWindowMinutes: number
): boolean {
  if (!trigger.enabled) {
    return false;
  }

  // Check if threshold is exceeded
  if (currentCount < trigger.threshold) {
    return false;
  }

  // Check if within time window
  if (timeWindowMinutes > trigger.window) {
    return false;
  }

  return true;
}

/**
 * Get automation action status
 */
export function getActionStatus(action: AutomationAction): {
  label: string;
  color: string;
  icon: string;
} {
  switch (action.status) {
    case "pending":
      return {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: "⏳",
      };
    case "executing":
      return {
        label: "Executing",
        color: "bg-blue-100 text-blue-800",
        icon: "⚙️",
      };
    case "completed":
      return {
        label: "Completed",
        color: "bg-green-100 text-green-800",
        icon: "✓",
      };
    case "failed":
      return {
        label: "Failed",
        color: "bg-red-100 text-red-800",
        icon: "✕",
      };
    default:
      return {
        label: "Unknown",
        color: "bg-gray-100 text-gray-800",
        icon: "?",
      };
  }
}

/**
 * Format automation action for display
 */
export function formatAutomationAction(action: AutomationAction): string {
  const typeLabel = action.type.replace(/_/g, " ").toUpperCase();
  const severityLabel = action.severity.toUpperCase();

  return `[${severityLabel}] ${typeLabel}: ${action.reason}`;
}

/**
 * Create automation action queue
 */
export class AutomationQueue {
  private queue: AutomationAction[] = [];
  private processing = false;

  async enqueue(action: AutomationAction): Promise<void> {
    this.queue.push(action);
    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const action = this.queue.shift();
      if (!action) break;

      try {
        action.status = "executing";

        // Execute based on action type
        switch (action.type) {
          case "account_lockout":
            // Already handled in executeAccountLockout
            break;
          case "email_alert":
            // Already handled in executeEmailAlert
            break;
          case "sms_alert":
            // Already handled in executeSMSAlert
            break;
          case "incident_report":
            // Already handled in generateIncidentReport
            break;
          case "ip_block":
            // Already handled in executeIPBlock
            break;
        }

        action.status = "completed";
      } catch (error) {
        action.status = "failed";
        console.error("Failed to process automation action:", error);
      }
    }

    this.processing = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueue(): AutomationAction[] {
    return [...this.queue];
  }
}

// Export singleton instance
export const automationQueue = new AutomationQueue();
