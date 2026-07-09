/**
 * Real-Time Service
 * WebSocket-based real-time updates for threat dashboard
 */

import { EventEmitter } from "events";

interface ThreatUpdate {
  id: string;
  type: "threat_detected" | "threat_resolved" | "remediation_started" | "remediation_completed";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  incidentId?: string;
  actionsTaken?: string[];
}

interface IncidentUpdate {
  id: string;
  status: "open" | "in_progress" | "resolved";
  severity: "critical" | "high" | "medium" | "low";
  remediationStatus: "pending" | "executing" | "completed" | "failed";
  timestamp: Date;
}

interface AlertUpdate {
  id: string;
  ruleId: string;
  ruleName: string;
  status: "sent" | "failed" | "pending";
  deliveredTo: string[];
  timestamp: Date;
}

class RealtimeService extends EventEmitter {
  private activeConnections: Map<string, Set<string>> = new Map(); // userId -> Set of connectionIds
  private threatUpdates: ThreatUpdate[] = [];
  private incidentUpdates: IncidentUpdate[] = [];
  private alertUpdates: AlertUpdate[] = [];

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Register a new WebSocket connection for a user
   */
  registerConnection(userId: string, connectionId: string): void {
    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    this.activeConnections.get(userId)!.add(connectionId);
    console.log(`[RealtimeService] User ${userId} connected (${connectionId})`);
  }

  /**
   * Unregister a WebSocket connection
   */
  unregisterConnection(userId: string, connectionId: string): void {
    const connections = this.activeConnections.get(userId);
    if (connections) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.activeConnections.delete(userId);
      }
    }
    console.log(`[RealtimeService] User ${userId} disconnected (${connectionId})`);
  }

  /**
   * Broadcast threat update to all connected users
   */
  broadcastThreatUpdate(update: ThreatUpdate): void {
    this.threatUpdates.push(update);
    // Keep only last 100 updates
    if (this.threatUpdates.length > 100) {
      this.threatUpdates.shift();
    }

    this.emit("threat_update", update);
    console.log(`[RealtimeService] Threat update: ${update.type} - ${update.title}`);
  }

  /**
   * Broadcast incident update to specific user
   */
  broadcastIncidentUpdate(userId: string, update: IncidentUpdate): void {
    this.incidentUpdates.push(update);
    if (this.incidentUpdates.length > 100) {
      this.incidentUpdates.shift();
    }

    this.emit(`incident_update:${userId}`, update);
    console.log(`[RealtimeService] Incident update for ${userId}: ${update.status}`);
  }

  /**
   * Broadcast alert update to specific user
   */
  broadcastAlertUpdate(userId: string, update: AlertUpdate): void {
    this.alertUpdates.push(update);
    if (this.alertUpdates.length > 100) {
      this.alertUpdates.shift();
    }

    this.emit(`alert_update:${userId}`, update);
    console.log(`[RealtimeService] Alert update for ${userId}: ${update.status}`);
  }

  /**
   * Get recent threat updates for dashboard
   */
  getRecentThreats(limit: number = 20): ThreatUpdate[] {
    return this.threatUpdates.slice(-limit).reverse();
  }

  /**
   * Get recent incident updates for user
   */
  getRecentIncidents(userId: string, limit: number = 20): IncidentUpdate[] {
    return this.incidentUpdates.slice(-limit).reverse();
  }

  /**
   * Get recent alert updates for user
   */
  getRecentAlerts(userId: string, limit: number = 20): AlertUpdate[] {
    return this.alertUpdates.slice(-limit).reverse();
  }

  /**
   * Get active connection count
   */
  getActiveConnections(): number {
    return Array.from(this.activeConnections.values()).reduce(
      (sum, connections) => sum + connections.size,
      0
    );
  }

  /**
   * Get active users count
   */
  getActiveUsers(): number {
    return this.activeConnections.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    const connections = this.activeConnections.get(userId);
    return connections !== undefined && connections.size > 0;
  }

  /**
   * Simulate threat detection
   */
  simulateThreatDetection(): void {
    const threatTypes = [
      "brute_force",
      "suspicious_location",
      "data_export",
      "unusual_activity",
    ];
    const severities: Array<"critical" | "high" | "medium" | "low"> = [
      "critical",
      "high",
      "medium",
      "low",
    ];
    const titles = [
      "Brute Force Attack Detected",
      "Login from Unusual Location",
      "Unauthorized Data Export",
      "Suspicious User Activity",
    ];

    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const titleIdx = threatTypes.indexOf(threatType);

    const update: ThreatUpdate = {
      id: `threat_${Date.now()}`,
      type: "threat_detected",
      severity,
      title: titles[titleIdx],
      description: `A ${severity} severity threat has been detected: ${threatType}`,
      timestamp: new Date(),
      actionsTaken: ["alert_sent", "investigation_started"],
    };

    this.broadcastThreatUpdate(update);
  }

  /**
   * Simulate incident update
   */
  simulateIncidentUpdate(userId: string): void {
    const statuses: Array<"open" | "in_progress" | "resolved"> = [
      "open",
      "in_progress",
      "resolved",
    ];
    const remediationStatuses: Array<
      "pending" | "executing" | "completed" | "failed"
    > = ["pending", "executing", "completed", "failed"];
    const severities: Array<"critical" | "high" | "medium" | "low"> = [
      "critical",
      "high",
      "medium",
      "low",
    ];

    const update: IncidentUpdate = {
      id: `incident_${Date.now()}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      remediationStatus:
        remediationStatuses[
          Math.floor(Math.random() * remediationStatuses.length)
        ],
      timestamp: new Date(),
    };

    this.broadcastIncidentUpdate(userId, update);
  }

  /**
   * Simulate alert delivery
   */
  simulateAlertDelivery(userId: string): void {
    const ruleNames = [
      "Brute Force Attack",
      "Suspicious Location",
      "Data Export",
      "Unusual Activity",
    ];
    const ruleName = ruleNames[Math.floor(Math.random() * ruleNames.length)];

    const update: AlertUpdate = {
      id: `alert_${Date.now()}`,
      ruleId: `rule_${Math.floor(Math.random() * 4) + 1}`,
      ruleName,
      status: Math.random() > 0.1 ? "sent" : "failed",
      deliveredTo: Math.random() > 0.5 ? ["slack", "pagerduty"] : ["slack"],
      timestamp: new Date(),
    };

    this.broadcastAlertUpdate(userId, update);
  }

  /**
   * Clear old updates (cleanup)
   */
  clearOldUpdates(olderThanMinutes: number = 60): void {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    this.threatUpdates = this.threatUpdates.filter(
      (u) => u.timestamp > cutoffTime
    );
    this.incidentUpdates = this.incidentUpdates.filter(
      (u) => u.timestamp > cutoffTime
    );
    this.alertUpdates = this.alertUpdates.filter(
      (u) => u.timestamp > cutoffTime
    );

    console.log(
      `[RealtimeService] Cleared updates older than ${olderThanMinutes} minutes`
    );
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      activeConnections: this.getActiveConnections(),
      activeUsers: this.getActiveUsers(),
      threatUpdates: this.threatUpdates.length,
      incidentUpdates: this.incidentUpdates.length,
      alertUpdates: this.alertUpdates.length,
      totalEvents: this.threatUpdates.length + this.incidentUpdates.length + this.alertUpdates.length,
    };
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Start cleanup interval (every 30 minutes)
setInterval(() => {
  realtimeService.clearOldUpdates(60);
}, 30 * 60 * 1000);
