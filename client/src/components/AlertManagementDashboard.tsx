import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Alert {
  id: string;
  ruleId: string;
  userId: number;
  email: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  status: "triggered" | "acknowledged" | "resolved" | "escalated";
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  deliveryLog: Array<{
    channel: string;
    status: string;
    sentAt: Date;
  }>;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    type: string;
    threshold: number;
  };
  severity: "critical" | "high" | "medium" | "low";
  channels: string[];
  enabled: boolean;
  throttleMinutes: number;
}

interface AlertManagementDashboardProps {
  alerts?: Alert[];
  rules?: AlertRule[];
  stats?: {
    totalAlerts: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byRule: Record<string, number>;
  };
  isLoading?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onUpdateRule?: (ruleId: string, updates: Partial<AlertRule>) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "triggered":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "acknowledged":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "resolved":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "escalated":
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "triggered":
      return "bg-red-100 text-red-800";
    case "acknowledged":
      return "bg-yellow-100 text-yellow-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "escalated":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function AlertManagementDashboard({
  alerts = [],
  rules = [],
  stats = {
    totalAlerts: 0,
    byStatus: {},
    bySeverity: {},
    byRule: {},
  },
  isLoading = false,
  onAcknowledge,
  onResolve,
  onUpdateRule,
}: AlertManagementDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showAlertDetail, setShowAlertDetail] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [showRuleDetail, setShowRuleDetail] = useState(false);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (statusFilter && alert.status !== statusFilter) return false;
      if (severityFilter && alert.severity !== severityFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, severityFilter]);

  // Group alerts by status
  const alertsByStatus = useMemo(() => {
    const grouped: Record<string, Alert[]> = {
      triggered: [],
      acknowledged: [],
      resolved: [],
      escalated: [],
    };
    filteredAlerts.forEach((alert) => {
      grouped[alert.status].push(alert);
    });
    return grouped;
  }, [filteredAlerts]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.bySeverity?.critical || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {rules.filter((r) => r.enabled).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              of {rules.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unresolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {(stats.byStatus?.triggered || 0) + (stats.byStatus?.acknowledged || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            <Bell className="w-4 h-4 mr-2" />
            Alerts ({filteredAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="w-4 h-4 mr-2" />
            Rules ({rules.length})
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>
                View and manage all security alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="triggered">Triggered</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alert List */}
              <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No alerts found</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(alert.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{alert.title}</h4>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <Badge className={getStatusColor(alert.status)}>
                                {alert.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {alert.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              User: {alert.email} • Triggered:{" "}
                              {format(new Date(alert.triggeredAt), "MMM dd, HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={showAlertDetail && selectedAlert?.id === alert.id} onOpenChange={setShowAlertDetail}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAlert(alert)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Alert Details</DialogTitle>
                              </DialogHeader>
                              {selectedAlert && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-semibold">
                                        Title
                                      </label>
                                      <p>{selectedAlert.title}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-semibold">
                                        Severity
                                      </label>
                                      <Badge
                                        className={getSeverityColor(
                                          selectedAlert.severity
                                        )}
                                      >
                                        {selectedAlert.severity}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-semibold">
                                        Status
                                      </label>
                                      <Badge
                                        className={getStatusColor(selectedAlert.status)}
                                      >
                                        {selectedAlert.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-semibold">
                                        User
                                      </label>
                                      <p>{selectedAlert.email}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold">
                                      Description
                                    </label>
                                    <p className="text-sm">
                                      {selectedAlert.description}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold">
                                      Delivery Log
                                    </label>
                                    <div className="space-y-2">
                                      {selectedAlert.deliveryLog.map((log, idx) => (
                                        <div
                                          key={idx}
                                          className="text-sm bg-gray-50 p-2 rounded"
                                        >
                                          <p>
                                            <span className="font-semibold">
                                              {log.channel}
                                            </span>
                                            : {log.status} at{" "}
                                            {format(
                                              new Date(log.sentAt),
                                              "HH:mm:ss"
                                            )}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {alert.status === "triggered" && (
                                      <Button
                                        onClick={() => onAcknowledge?.(alert.id)}
                                      >
                                        Acknowledge
                                      </Button>
                                    )}
                                    {alert.status !== "resolved" && (
                                      <Button
                                        variant="outline"
                                        onClick={() => onResolve?.(alert.id)}
                                      >
                                        Resolve
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {alert.status === "triggered" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAcknowledge?.(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {alert.status !== "resolved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResolve?.(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>
                Manage alert rules and triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No alert rules configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{rule.name}</h4>
                            <Badge className={getSeverityColor(rule.severity)}>
                              {rule.severity}
                            </Badge>
                            <Badge variant={rule.enabled ? "default" : "outline"}>
                              {rule.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {rule.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>Threshold: {rule.condition.threshold}</span>
                            <span>Throttle: {rule.throttleMinutes}min</span>
                            <span>Channels: {rule.channels.join(", ")}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={showRuleDetail && selectedRule?.id === rule.id} onOpenChange={setShowRuleDetail}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRule(rule)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Alert Rule</DialogTitle>
                              </DialogHeader>
                              {selectedRule && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-semibold">
                                        Name
                                      </label>
                                      <p>{selectedRule.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-semibold">
                                        Severity
                                      </label>
                                      <Badge
                                        className={getSeverityColor(
                                          selectedRule.severity
                                        )}
                                      >
                                        {selectedRule.severity}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-semibold">
                                        Threshold
                                      </label>
                                      <Input
                                        type="number"
                                        value={selectedRule.condition.threshold}
                                        onChange={(e) =>
                                          onUpdateRule?.(selectedRule.id, {
                                            condition: {
                                              ...selectedRule.condition,
                                              threshold: parseInt(e.target.value),
                                            },
                                          })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-semibold">
                                        Throttle (minutes)
                                      </label>
                                      <Input
                                        type="number"
                                        value={selectedRule.throttleMinutes}
                                        onChange={(e) =>
                                          onUpdateRule?.(selectedRule.id, {
                                            throttleMinutes: parseInt(e.target.value),
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold mb-2 block">
                                      Channels
                                    </label>
                                    <div className="space-y-2">
                                      {["email", "sms", "in_app", "webhook", "slack"].map(
                                        (channel) => (
                                          <div key={channel} className="flex items-center">
                                            <Checkbox
                                              checked={selectedRule.channels.includes(
                                                channel
                                              )}
                                              onCheckedChange={(checked) => {
                                                const newChannels = checked
                                                  ? [...selectedRule.channels, channel]
                                                  : selectedRule.channels.filter(
                                                      (c) => c !== channel
                                                    );
                                                onUpdateRule?.(selectedRule.id, {
                                                  channels: newChannels,
                                                });
                                              }}
                                            />
                                            <label className="ml-2 text-sm capitalize">
                                              {channel}
                                            </label>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() =>
                                        onUpdateRule?.(selectedRule.id, {
                                          enabled: !selectedRule.enabled,
                                        })
                                      }
                                    >
                                      {selectedRule.enabled ? "Disable" : "Enable"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onUpdateRule?.(rule.id, {
                                enabled: !rule.enabled,
                              })
                            }
                          >
                            {rule.enabled ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
