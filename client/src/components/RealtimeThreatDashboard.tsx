/**
 * Real-Time Threat Dashboard
 * Displays live security threats, incidents, and automated remediation status
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, Clock, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SecurityIncident {
  id: string;
  threatType: "brute_force" | "suspicious_location" | "data_export" | "unusual_activity";
  severity: "critical" | "high" | "medium" | "low";
  userId: string;
  userEmail: string;
  ipAddress: string;
  timestamp: Date;
  status: "open" | "in_progress" | "resolved";
  detectedAt: Date;
  remediationStatus: "pending" | "executing" | "completed" | "failed";
  actionsExecuted: string[];
  description: string;
}

interface IncidentTimeline {
  id: string;
  timestamp: Date;
  action: string;
  status: "pending" | "executing" | "completed" | "failed";
  result?: string;
}

export function RealtimeThreatDashboard() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [timeline, setTimeline] = useState<IncidentTimeline[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulated data - in production, fetch from tRPC
  useEffect(() => {
    if (!autoRefresh) return;

    const mockIncidents: SecurityIncident[] = [
      {
        id: "incident_1",
        threatType: "brute_force",
        severity: "critical",
        userId: "user_123",
        userEmail: "user@example.com",
        ipAddress: "192.168.1.100",
        timestamp: new Date(Date.now() - 5 * 60000),
        status: "in_progress",
        detectedAt: new Date(Date.now() - 5 * 60000),
        remediationStatus: "executing",
        actionsExecuted: ["account_locked", "ip_blocked", "alert_sent"],
        description: "Brute force attack detected - 15 failed login attempts in 5 minutes",
      },
      {
        id: "incident_2",
        threatType: "suspicious_location",
        severity: "high",
        userId: "user_456",
        userEmail: "another@example.com",
        ipAddress: "10.0.0.50",
        timestamp: new Date(Date.now() - 15 * 60000),
        status: "resolved",
        detectedAt: new Date(Date.now() - 15 * 60000),
        remediationStatus: "completed",
        actionsExecuted: ["2fa_required", "alert_sent"],
        description: "Login from unusual geographic location detected",
      },
    ];

    setIncidents(mockIncidents);

    if (selectedIncident) {
      const updated = mockIncidents.find((i) => i.id === selectedIncident.id);
      if (updated) setSelectedIncident(updated);
    }

    const mockTimeline: IncidentTimeline[] = [
      {
        id: "action_1",
        timestamp: new Date(Date.now() - 5 * 60000),
        action: "Threat detected: Brute force attack",
        status: "completed",
      },
      {
        id: "action_2",
        timestamp: new Date(Date.now() - 4 * 60000),
        action: "Account locked for security",
        status: "completed",
      },
      {
        id: "action_3",
        timestamp: new Date(Date.now() - 3 * 60000),
        action: "IP address blocked",
        status: "completed",
      },
      {
        id: "action_4",
        timestamp: new Date(Date.now() - 2 * 60000),
        action: "Security alert email sent",
        status: "completed",
      },
      {
        id: "action_5",
        timestamp: new Date(Date.now() - 1 * 60000),
        action: "Awaiting user verification",
        status: "pending",
      },
    ];

    setTimeline(mockTimeline);
  }, [autoRefresh, selectedIncident?.id]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getThreatTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      brute_force: "Brute Force Attack",
      suspicious_location: "Suspicious Location",
      data_export: "Data Export",
      unusual_activity: "Unusual Activity",
    };
    return labels[type] || type;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const activeIncidents = incidents.filter((i) => i.status !== "resolved").length;
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeIncidents}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently being monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remediation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground mt-1">Automated responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0.3s</div>
            <p className="text-xs text-muted-foreground mt-1">Average detection to action</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Incidents</CardTitle>
                  <CardDescription>Real-time security threats and responses</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? "Pause" : "Resume"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incidents.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">No active threats detected</p>
                </div>
              ) : (
                incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedIncident?.id === incident.id
                        ? "bg-blue-50 border-blue-300"
                        : "hover:bg-gray-50"
                    } ${getSeverityColor(incident.severity)}`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(incident.severity)}
                        <div>
                          <h4 className="font-semibold text-sm">
                            {getThreatTypeLabel(incident.threatType)}
                          </h4>
                          <p className="text-xs opacity-75">{incident.userEmail}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          incident.remediationStatus === "completed"
                            ? "default"
                            : incident.remediationStatus === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {incident.remediationStatus}
                      </Badge>
                    </div>

                    <p className="text-sm mb-3">{incident.description}</p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-75">{incident.ipAddress}</span>
                      <span className="opacity-75">{formatTime(incident.timestamp)}</span>
                    </div>

                    {incident.actionsExecuted.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {incident.actionsExecuted.map((action) => (
                          <Badge key={action} variant="outline" className="text-xs">
                            {action.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident Timeline</CardTitle>
              <CardDescription>
                {selectedIncident ? selectedIncident.description : "Select an incident to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedIncident && timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === "completed"
                              ? "bg-green-100"
                              : event.status === "failed"
                                ? "bg-red-100"
                                : "bg-yellow-100"
                          }`}
                        >
                          {event.status === "completed" && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {event.status === "executing" && (
                            <Zap className="w-4 h-4 text-yellow-600 animate-pulse" />
                          )}
                          {event.status === "pending" && (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        {idx < timeline.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium">{event.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </p>
                        {event.result && (
                          <p className="text-xs mt-1 text-green-600">{event.result}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Select an incident to view its timeline
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Remediation Actions */}
      {selectedIncident && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automated Remediation Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Account Locked</p>
                  <p className="text-xs text-muted-foreground">
                    User account temporarily locked for security
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">IP Address Blocked</p>
                  <p className="text-xs text-muted-foreground">
                    Source IP {selectedIncident.ipAddress} blocked from all services
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Security Alert Sent</p>
                  <p className="text-xs text-muted-foreground">
                    Email notification sent to {selectedIncident.userEmail}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">2FA Verification Required</p>
                  <p className="text-xs text-muted-foreground">
                    User must complete 2FA to regain access
                  </p>
                </div>
                <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
