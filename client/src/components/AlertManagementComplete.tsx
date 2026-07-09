import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCircle, AlertCircle, Clock, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: number;
  status: "active" | "acknowledged" | "resolved";
  source: string;
  affectedResource: string;
  actions: string[];
  escalationLevel: number;
  channels: ("email" | "sms" | "webhook" | "inapp")[];
  metadata: Record<string, any>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
  channels: ("email" | "sms" | "webhook" | "inapp")[];
  escalationPolicy: string;
  throttling: number; // minutes
}

const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    type: "BRUTE_FORCE_ATTACK",
    severity: "critical",
    title: "Brute Force Attack Detected",
    description: "Multiple failed login attempts from IP 192.168.1.100",
    timestamp: Date.now() - 5 * 60 * 1000,
    status: "active",
    source: "Security Agent",
    affectedResource: "user-123",
    actions: ["Lock Account", "Block IP", "Notify User"],
    escalationLevel: 1,
    channels: ["email", "sms", "inapp"],
    metadata: { ip: "192.168.1.100", attempts: 7, timeframe: "5 minutes" },
  },
  {
    id: "alert-2",
    type: "SUSPICIOUS_LOGIN",
    severity: "high",
    title: "Suspicious Login from New Location",
    description: "Login from Tokyo, Japan (last login: New York, USA)",
    timestamp: Date.now() - 30 * 60 * 1000,
    status: "acknowledged",
    source: "Behavioral Analysis",
    affectedResource: "user-456",
    actions: ["Request 2FA", "Notify User"],
    escalationLevel: 0,
    channels: ["email", "inapp"],
    metadata: { location: "Tokyo", previousLocation: "New York", distance: "6000 miles", timeframe: "2 hours" },
  },
  {
    id: "alert-3",
    type: "UNUSUAL_ACTIVITY",
    severity: "medium",
    title: "Unusual Activity Pattern",
    description: "User accessing resources at unusual times",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    status: "resolved",
    source: "Anomaly Detection",
    affectedResource: "user-789",
    actions: ["Monitor", "Investigate"],
    escalationLevel: 0,
    channels: ["inapp"],
    metadata: { pattern: "3 AM access", normalTime: "9 AM - 5 PM", confidence: "75%" },
  },
];

const mockRules: AlertRule[] = [
  {
    id: "rule-1",
    name: "Brute Force Detection",
    condition: "5+ failed logins in 15 minutes",
    severity: "critical",
    enabled: true,
    channels: ["email", "sms", "inapp"],
    escalationPolicy: "Immediate escalation to admin",
    throttling: 0,
  },
  {
    id: "rule-2",
    name: "Suspicious Location",
    condition: "Login from new country within 2 hours",
    severity: "high",
    enabled: true,
    channels: ["email", "inapp"],
    escalationPolicy: "Escalate after 30 minutes if unacknowledged",
    throttling: 30,
  },
  {
    id: "rule-3",
    name: "Unusual Activity",
    condition: "Access pattern deviation > 2 sigma",
    severity: "medium",
    enabled: true,
    channels: ["inapp"],
    escalationPolicy: "No escalation",
    throttling: 60,
  },
];

export function AlertManagementComplete() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [rules, setRules] = useState<AlertRule[]>(mockRules);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesStatus = !filterStatus || alert.status === filterStatus;
      const matchesSeverity = !filterSeverity || alert.severity === filterSeverity;
      return matchesStatus && matchesSeverity;
    });
  }, [alerts, filterStatus, filterSeverity]);

  const handleAcknowledge = useCallback((alertId: string) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "acknowledged" } : a));
    toast.success("Alert acknowledged");
  }, [alerts]);

  const handleResolve = useCallback((alertId: string) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "resolved" } : a));
    toast.success("Alert resolved");
  }, [alerts]);

  const handleExecuteAction = useCallback((alertId: string, action: string) => {
    toast.success(`Executed action: ${action}`);
  }, []);

  const handleDeleteAlert = useCallback((alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    toast.success("Alert deleted");
  }, [alerts]);

  const handleToggleRule = useCallback((ruleId: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    toast.success("Rule updated");
  }, [rules]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "acknowledged": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alerts ({filteredAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" />
            Rules ({rules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alerts List */}
              <div className="space-y-2">
                {filteredAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(alert.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">{alert.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>Source: {alert.source}</span>
                            <span>Resource: {alert.affectedResource}</span>
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledge(alert.id);
                              }}
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(alert.id);
                              }}
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlert(alert.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {alert.actions.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {alert.actions.map(action => (
                          <Button
                            key={action}
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteAction(alert.id, action);
                            }}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Alert Detail Modal */}
              {selectedAlert && (
                <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{selectedAlert.title}</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="metadata">Metadata</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                      </TabsList>
                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Type</label>
                            <p>{selectedAlert.type}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Severity</label>
                            <Badge className={getSeverityColor(selectedAlert.severity)}>
                              {selectedAlert.severity}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <Badge variant="outline">{selectedAlert.status}</Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Source</label>
                            <p>{selectedAlert.source}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Affected Resource</label>
                            <p>{selectedAlert.affectedResource}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Timestamp</label>
                            <p>{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-600">Description</label>
                            <p>{selectedAlert.description}</p>
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-600">Channels</label>
                            <div className="flex gap-2 mt-2">
                              {selectedAlert.channels.map(channel => (
                                <Badge key={channel} variant="secondary">{channel}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="metadata">
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                          {JSON.stringify(selectedAlert.metadata, null, 2)}
                        </pre>
                      </TabsContent>
                      <TabsContent value="history">
                        <div className="space-y-2 text-sm">
                          <p>Alert created: {new Date(selectedAlert.timestamp).toLocaleString()}</p>
                          <p>Status: {selectedAlert.status}</p>
                          <p>Escalation Level: {selectedAlert.escalationLevel}</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Alert Rules</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Rule</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Alert Rule</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Rule Name</label>
                      <Input placeholder="e.g., Brute Force Detection" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Condition</label>
                      <Input placeholder="e.g., 5+ failed logins in 15 minutes" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Severity</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Create Rule</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.map(rule => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Condition: {rule.condition}</p>
                        <p className="text-sm text-gray-600">Policy: {rule.escalationPolicy}</p>
                        <div className="flex gap-2 mt-2">
                          {rule.channels.map(channel => (
                            <Badge key={channel} variant="secondary" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleRule(rule.id)}
                        >
                          {rule.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
