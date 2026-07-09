/**
 * SLA Management Service
 * Manages SLA timers, escalations, and compliance tracking
 */

interface SLAPolicy {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationLevels: EscalationLevel[];
}

interface EscalationLevel {
  level: number;
  triggerAfterMinutes: number;
  notifyUsers: string[];
  action: string;
}

interface SLATimer {
  alertId: string;
  severity: "critical" | "high" | "medium" | "low";
  createdAt: Date;
  responseDeadline: Date;
  resolutionDeadline: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalationLevel: number;
  breached: boolean;
}

class SLAManagementService {
  private policies: Map<string, SLAPolicy> = new Map();
  private timers: Map<string, SLATimer> = new Map();
  private escalationHistory: Array<{
    alertId: string;
    level: number;
    timestamp: Date;
  }> = [];

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default SLA policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: SLAPolicy[] = [
      {
        id: "policy_critical",
        name: "Critical Incidents",
        severity: "critical",
        responseTimeMinutes: 15,
        resolutionTimeMinutes: 60,
        escalationLevels: [
          {
            level: 1,
            triggerAfterMinutes: 10,
            notifyUsers: ["team_lead"],
            action: "notify_team_lead",
          },
          {
            level: 2,
            triggerAfterMinutes: 30,
            notifyUsers: ["manager"],
            action: "notify_manager",
          },
          {
            level: 3,
            triggerAfterMinutes: 50,
            notifyUsers: ["director"],
            action: "notify_director",
          },
        ],
      },
      {
        id: "policy_high",
        name: "High Priority Incidents",
        severity: "high",
        responseTimeMinutes: 30,
        resolutionTimeMinutes: 120,
        escalationLevels: [
          {
            level: 1,
            triggerAfterMinutes: 25,
            notifyUsers: ["team_lead"],
            action: "notify_team_lead",
          },
          {
            level: 2,
            triggerAfterMinutes: 90,
            notifyUsers: ["manager"],
            action: "notify_manager",
          },
        ],
      },
      {
        id: "policy_medium",
        name: "Medium Priority Incidents",
        severity: "medium",
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 240,
        escalationLevels: [
          {
            level: 1,
            triggerAfterMinutes: 50,
            notifyUsers: ["team_lead"],
            action: "notify_team_lead",
          },
        ],
      },
      {
        id: "policy_low",
        name: "Low Priority Incidents",
        severity: "low",
        responseTimeMinutes: 120,
        resolutionTimeMinutes: 480,
        escalationLevels: [],
      },
    ];

    defaultPolicies.forEach((policy) => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Create SLA timer for alert
   */
  createSLATimer(
    alertId: string,
    severity: "critical" | "high" | "medium" | "low"
  ): SLATimer {
    const policy = this.getPolicyBySeverity(severity);
    if (!policy) {
      throw new Error(`No SLA policy found for severity: ${severity}`);
    }

    const now = new Date();
    const responseDeadline = new Date(now.getTime() + policy.responseTimeMinutes * 60 * 1000);
    const resolutionDeadline = new Date(
      now.getTime() + policy.resolutionTimeMinutes * 60 * 1000
    );

    const timer: SLATimer = {
      alertId,
      severity,
      createdAt: now,
      responseDeadline,
      resolutionDeadline,
      escalationLevel: 0,
      breached: false,
    };

    this.timers.set(alertId, timer);
    console.log(`[SLAManagement] Created SLA timer for ${alertId} (${severity})`);

    return timer;
  }

  /**
   * Acknowledge alert and update SLA timer
   */
  acknowledgeAlert(alertId: string): { success: boolean; timer?: SLATimer } {
    const timer = this.timers.get(alertId);
    if (!timer) {
      return { success: false };
    }

    timer.acknowledgedAt = new Date();
    const responseTime = timer.acknowledgedAt.getTime() - timer.createdAt.getTime();
    const responseMinutes = Math.floor(responseTime / 60000);

    const policy = this.getPolicyBySeverity(timer.severity);
    if (policy && responseMinutes > policy.responseTimeMinutes) {
      timer.breached = true;
      console.log(`[SLAManagement] Response SLA breached for ${alertId}`);
    }

    return { success: true, timer };
  }

  /**
   * Resolve alert and update SLA timer
   */
  resolveAlert(alertId: string): { success: boolean; timer?: SLATimer; breached: boolean } {
    const timer = this.timers.get(alertId);
    if (!timer) {
      return { success: false, breached: false };
    }

    timer.resolvedAt = new Date();
    const resolutionTime = timer.resolvedAt.getTime() - timer.createdAt.getTime();
    const resolutionMinutes = Math.floor(resolutionTime / 60000);

    const policy = this.getPolicyBySeverity(timer.severity);
    let breached = timer.breached;

    if (policy && resolutionMinutes > policy.resolutionTimeMinutes) {
      breached = true;
      timer.breached = true;
      console.log(`[SLAManagement] Resolution SLA breached for ${alertId}`);
    }

    return { success: true, timer, breached };
  }

  /**
   * Check and process escalations
   */
  checkEscalations(): Array<{ alertId: string; level: number; action: string }> {
    const escalations: Array<{ alertId: string; level: number; action: string }> = [];
    const now = new Date();

    this.timers.forEach((timer, alertId) => {
      if (timer.resolvedAt) return; // Skip resolved alerts

      const policy = this.getPolicyBySeverity(timer.severity);
      if (!policy) return;

      const elapsedMinutes = Math.floor(
        (now.getTime() - timer.createdAt.getTime()) / 60000
      );

      for (const escalationLevel of policy.escalationLevels) {
        if (
          elapsedMinutes >= escalationLevel.triggerAfterMinutes &&
          timer.escalationLevel < escalationLevel.level
        ) {
          timer.escalationLevel = escalationLevel.level;
          escalations.push({
            alertId,
            level: escalationLevel.level,
            action: escalationLevel.action,
          });

          this.escalationHistory.push({
            alertId,
            level: escalationLevel.level,
            timestamp: now,
          });

          console.log(
            `[SLAManagement] Escalated ${alertId} to level ${escalationLevel.level}`
          );
        }
      }
    });

    return escalations;
  }

  /**
   * Get SLA timer for alert
   */
  getSLATimer(alertId: string): SLATimer | undefined {
    return this.timers.get(alertId);
  }

  /**
   * Get SLA status for alert
   */
  getSLAStatus(alertId: string) {
    const timer = this.timers.get(alertId);
    if (!timer) {
      return null;
    }

    const now = new Date();
    const responseTimeRemaining = Math.max(
      0,
      Math.floor((timer.responseDeadline.getTime() - now.getTime()) / 60000)
    );
    const resolutionTimeRemaining = Math.max(
      0,
      Math.floor((timer.resolutionDeadline.getTime() - now.getTime()) / 60000)
    );

    return {
      alertId,
      severity: timer.severity,
      responseStatus:
        timer.acknowledgedAt ? "met" : responseTimeRemaining > 0 ? "on_track" : "breached",
      resolutionStatus: timer.resolvedAt
        ? "met"
        : resolutionTimeRemaining > 0
          ? "on_track"
          : "breached",
      responseTimeRemaining,
      resolutionTimeRemaining,
      escalationLevel: timer.escalationLevel,
      breached: timer.breached,
    };
  }

  /**
   * Get all active SLA timers
   */
  getActiveTimers() {
    const active: SLATimer[] = [];
    this.timers.forEach((timer) => {
      if (!timer.resolvedAt) {
        active.push(timer);
      }
    });
    return active;
  }

  /**
   * Get SLA compliance metrics
   */
  getComplianceMetrics() {
    let totalAlerts = 0;
    let compliantAlerts = 0;
    let breachedAlerts = 0;

    this.timers.forEach((timer) => {
      totalAlerts++;
      if (timer.breached) {
        breachedAlerts++;
      } else {
        compliantAlerts++;
      }
    });

    const compliancePercentage =
      totalAlerts > 0 ? Math.round((compliantAlerts / totalAlerts) * 100) : 100;

    return {
      totalAlerts,
      compliantAlerts,
      breachedAlerts,
      compliancePercentage,
    };
  }

  /**
   * Get escalation history
   */
  getEscalationHistory(alertId?: string) {
    if (alertId) {
      return this.escalationHistory.filter((e) => e.alertId === alertId);
    }
    return this.escalationHistory;
  }

  /**
   * Get policy by severity
   */
  private getPolicyBySeverity(
    severity: "critical" | "high" | "medium" | "low"
  ): SLAPolicy | undefined {
    for (const policy of this.policies.values()) {
      if (policy.severity === severity) {
        return policy;
      }
    }
    return undefined;
  }

  /**
   * Get all policies
   */
  getPolicies() {
    return Array.from(this.policies.values());
  }

  /**
   * Update SLA policy
   */
  updatePolicy(policyId: string, updates: Partial<SLAPolicy>): boolean {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }

    Object.assign(policy, updates);
    console.log(`[SLAManagement] Updated policy ${policyId}`);
    return true;
  }

  /**
   * Clear old timers (cleanup)
   */
  clearOldTimers(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let clearedCount = 0;

    this.timers.forEach((timer, alertId) => {
      if (timer.resolvedAt && timer.resolvedAt < cutoffTime) {
        this.timers.delete(alertId);
        clearedCount++;
      }
    });

    console.log(`[SLAManagement] Cleared ${clearedCount} old timers`);
    return clearedCount;
  }
}

// Export singleton instance
export const slaManagementService = new SLAManagementService();

// Start cleanup interval (every 6 hours)
setInterval(() => {
  slaManagementService.clearOldTimers(24);
}, 6 * 60 * 60 * 1000);

// Start escalation check interval (every minute)
setInterval(() => {
  const escalations = slaManagementService.checkEscalations();
  if (escalations.length > 0) {
    console.log(`[SLAManagement] Processed ${escalations.length} escalations`);
  }
}, 60 * 1000);
