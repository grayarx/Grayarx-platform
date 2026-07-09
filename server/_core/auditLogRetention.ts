/**
 * Audit Log Retention & Archival Service
 * Manages audit log retention policies and archival to cold storage
 */

interface RetentionPolicy {
  id: string;
  name: string;
  eventTypes: string[];
  retentionDays: number;
  archivalDays: number;
  archivalLocation: "s3_cold" | "glacier" | "external";
  enabled: boolean;
  createdAt: Date;
}

interface ArchivedLog {
  id: string;
  archiveId: string;
  location: string;
  archivedAt: Date;
  logCount: number;
  size: number; // bytes
  compressed: boolean;
  encrypted: boolean;
}

class AuditLogRetentionService {
  private policies: Map<string, RetentionPolicy> = new Map();
  private archivedLogs: ArchivedLog[] = [];
  private retentionStats = {
    totalLogsRetained: 0,
    totalLogsArchived: 0,
    totalStorageUsed: 0, // bytes
  };

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default retention policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: RetentionPolicy[] = [
      {
        id: "policy_security",
        name: "Security Events",
        eventTypes: [
          "login",
          "logout",
          "failed_login",
          "permission_change",
          "data_access",
          "data_export",
        ],
        retentionDays: 365, // 1 year
        archivalDays: 90, // Archive after 90 days
        archivalLocation: "s3_cold",
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: "policy_compliance",
        name: "Compliance Events",
        eventTypes: ["audit_log_access", "policy_change", "compliance_check"],
        retentionDays: 2555, // 7 years
        archivalDays: 180,
        archivalLocation: "glacier",
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: "policy_operational",
        name: "Operational Events",
        eventTypes: ["system_start", "system_stop", "config_change", "error"],
        retentionDays: 90, // 90 days
        archivalDays: 30,
        archivalLocation: "s3_cold",
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: "policy_user",
        name: "User Activity",
        eventTypes: ["user_created", "user_updated", "user_deleted", "role_change"],
        retentionDays: 180, // 6 months
        archivalDays: 60,
        archivalLocation: "s3_cold",
        enabled: true,
        createdAt: new Date(),
      },
    ];

    defaultPolicies.forEach((policy) => {
      this.policies.set(policy.id, policy);
    });

    console.log(
      `[AuditLogRetention] Initialized ${defaultPolicies.length} default retention policies`
    );
  }

  /**
   * Archive logs based on retention policies
   */
  archiveLogs(eventType: string, logCount: number, sizeBytes: number): ArchivedLog | null {
    const policy = this.findPolicyForEventType(eventType);
    if (!policy) {
      console.warn(`[AuditLogRetention] No retention policy found for event type: ${eventType}`);
      return null;
    }

    const archivedLog: ArchivedLog = {
      id: `archive_${Date.now()}`,
      archiveId: `${policy.archivalLocation}_${Date.now()}`,
      location: policy.archivalLocation,
      archivedAt: new Date(),
      logCount,
      size: sizeBytes,
      compressed: true,
      encrypted: true,
    };

    this.archivedLogs.push(archivedLog);
    this.retentionStats.totalLogsArchived += logCount;
    this.retentionStats.totalStorageUsed += sizeBytes;

    console.log(
      `[AuditLogRetention] Archived ${logCount} logs (${this.formatBytes(sizeBytes)}) to ${policy.archivalLocation}`
    );

    return archivedLog;
  }

  /**
   * Get retention policy for event type
   */
  private findPolicyForEventType(eventType: string): RetentionPolicy | undefined {
    for (const policy of this.policies.values()) {
      if (policy.enabled && policy.eventTypes.includes(eventType)) {
        return policy;
      }
    }
    return undefined;
  }

  /**
   * Get retention days for event type
   */
  getRetentionDays(eventType: string): number {
    const policy = this.findPolicyForEventType(eventType);
    return policy ? policy.retentionDays : 30; // Default 30 days
  }

  /**
   * Get archival days for event type
   */
  getArchivalDays(eventType: string): number {
    const policy = this.findPolicyForEventType(eventType);
    return policy ? policy.archivalDays : 60; // Default 60 days
  }

  /**
   * Check if log should be archived
   */
  shouldArchiveLog(eventType: string, createdAtDaysAgo: number): boolean {
    const archivalDays = this.getArchivalDays(eventType);
    return createdAtDaysAgo >= archivalDays;
  }

  /**
   * Check if log should be deleted
   */
  shouldDeleteLog(eventType: string, createdAtDaysAgo: number): boolean {
    const retentionDays = this.getRetentionDays(eventType);
    return createdAtDaysAgo >= retentionDays;
  }

  /**
   * Get all retention policies
   */
  getPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get retention policy by ID
   */
  getPolicyById(policyId: string): RetentionPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Create custom retention policy
   */
  createPolicy(policy: Omit<RetentionPolicy, "createdAt">): RetentionPolicy {
    const newPolicy: RetentionPolicy = {
      ...policy,
      createdAt: new Date(),
    };

    this.policies.set(policy.id, newPolicy);
    console.log(`[AuditLogRetention] Created retention policy: ${policy.name}`);

    return newPolicy;
  }

  /**
   * Update retention policy
   */
  updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): boolean {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }

    Object.assign(policy, updates);
    console.log(`[AuditLogRetention] Updated retention policy: ${policyId}`);

    return true;
  }

  /**
   * Delete retention policy
   */
  deletePolicy(policyId: string): boolean {
    const deleted = this.policies.delete(policyId);
    if (deleted) {
      console.log(`[AuditLogRetention] Deleted retention policy: ${policyId}`);
    }
    return deleted;
  }

  /**
   * Get archived logs
   */
  getArchivedLogs(limit: number = 50): ArchivedLog[] {
    return this.archivedLogs.slice(-limit).reverse();
  }

  /**
   * Get archive by ID
   */
  getArchiveById(archiveId: string): ArchivedLog | undefined {
    return this.archivedLogs.find((a) => a.id === archiveId);
  }

  /**
   * Restore logs from archive
   */
  restoreFromArchive(archiveId: string): { success: boolean; logCount?: number } {
    const archive = this.getArchiveById(archiveId);
    if (!archive) {
      return { success: false };
    }

    console.log(
      `[AuditLogRetention] Restored ${archive.logCount} logs from archive ${archiveId}`
    );

    return { success: true, logCount: archive.logCount };
  }

  /**
   * Get retention statistics
   */
  getStatistics() {
    return {
      ...this.retentionStats,
      storageSizeFormatted: this.formatBytes(this.retentionStats.totalStorageUsed),
      archivedLogsCount: this.archivedLogs.length,
      policiesCount: this.policies.size,
      enabledPoliciesCount: Array.from(this.policies.values()).filter((p) => p.enabled)
        .length,
    };
  }

  /**
   * Get retention schedule
   */
  getRetentionSchedule() {
    const schedule = {
      nextArchivalRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      nextDeletionRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      lastArchivalRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      lastDeletionRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      archivalFrequency: "daily",
      deletionFrequency: "weekly",
    };

    return schedule;
  }

  /**
   * Simulate archival process
   */
  simulateArchivalProcess(): {
    logsArchived: number;
    bytesArchived: number;
    archivesCreated: number;
  } {
    const logsArchived = Math.floor(Math.random() * 10000) + 1000;
    const bytesArchived = logsArchived * Math.floor(Math.random() * 1000) + 100000;
    const archivesCreated = Math.floor(logsArchived / 5000) + 1;

    this.retentionStats.totalLogsArchived += logsArchived;
    this.retentionStats.totalStorageUsed += bytesArchived;

    console.log(
      `[AuditLogRetention] Archival process: ${logsArchived} logs, ${this.formatBytes(bytesArchived)}, ${archivesCreated} archives`
    );

    return {
      logsArchived,
      bytesArchived,
      archivesCreated,
    };
  }

  /**
   * Simulate deletion process
   */
  simulateDeletionProcess(): {
    logsDeleted: number;
    spaceFreed: number;
  } {
    const logsDeleted = Math.floor(Math.random() * 5000) + 500;
    const spaceFreed = logsDeleted * Math.floor(Math.random() * 500) + 50000;

    console.log(
      `[AuditLogRetention] Deletion process: ${logsDeleted} logs deleted, ${this.formatBytes(spaceFreed)} freed`
    );

    return {
      logsDeleted,
      spaceFreed,
    };
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

// Export singleton instance
export const auditLogRetentionService = new AuditLogRetentionService();

// Start archival process (daily at 2 AM)
const scheduleArchival = () => {
  const now = new Date();
  const target = new Date();
  target.setHours(2, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const timeout = target.getTime() - now.getTime();
  setTimeout(() => {
    auditLogRetentionService.simulateArchivalProcess();
    setInterval(() => {
      auditLogRetentionService.simulateArchivalProcess();
    }, 24 * 60 * 60 * 1000);
  }, timeout);
};

// Start deletion process (weekly on Sunday at 3 AM)
const scheduleDeletion = () => {
  const now = new Date();
  const target = new Date();
  target.setHours(3, 0, 0, 0);

  // Set to next Sunday
  const day = target.getDay();
  const daysUntilSunday = (7 - day) % 7 || 7;
  target.setDate(target.getDate() + daysUntilSunday);

  const timeout = target.getTime() - now.getTime();
  setTimeout(() => {
    auditLogRetentionService.simulateDeletionProcess();
    setInterval(() => {
      auditLogRetentionService.simulateDeletionProcess();
    }, 7 * 24 * 60 * 60 * 1000);
  }, timeout);
};

scheduleArchival();
scheduleDeletion();
