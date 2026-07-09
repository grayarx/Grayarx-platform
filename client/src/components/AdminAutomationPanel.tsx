import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Play, Pause, Settings, History, Zap, CheckCircle2, AlertTriangle } from "lucide-react";

interface AutomationTrigger {
  id: string;
  type: "failed_logins" | "suspicious_activity" | "email_verification_timeout" | "ip_threshold";
  threshold: number;
  window: number;
  action: string;
  enabled: boolean;
}

interface AutomationAction {
  id: string;
  type: string;
  status: "pending" | "executing" | "completed" | "failed";
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

export function AdminAutomationPanel() {
  const [triggers, setTriggers] = useState<AutomationTrigger[]>([
    {
      id: "1",
      type: "failed_logins",
      threshold: 5,
      window: 15,
      action: "account_lockout",
      enabled: true,
    },
    {
      id: "2",
      type: "suspicious_activity",
      threshold: 3,
      window: 60,
      action: "email_alert",
      enabled: true,
    },
    {
      id: "3",
      type: "ip_threshold",
      threshold: 10,
      window: 60,
      action: "ip_block",
      enabled: true,
    },
  ]);

  const [queueSize, setQueueSize] = useState(3);
  const [editingTrigger, setEditingTrigger] = useState<AutomationTrigger | null>(null);

  const automationHistory: AutomationAction[] = [
    {
      id: "1",
      type: "account_lockout",
      status: "completed",
      reason: "5 failed login attempts",
      severity: "high",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      type: "email_alert",
      status: "completed",
      reason: "Suspicious activity detected",
      severity: "medium",
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: "3",
      type: "ip_block",
      status: "failed",
      reason: "Failed to block IP",
      severity: "high",
      timestamp: new Date(Date.now() - 10800000),
    },
  ];

  const handleToggleTrigger = (id: string) => {
    setTriggers(
      triggers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleSaveTrigger = (trigger: AutomationTrigger) => {
    setTriggers(
      triggers.map((t) => (t.id === trigger.id ? trigger : t))
    );
    setEditingTrigger(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "executing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Control Panel</h1>
          <p className="text-gray-600 mt-1">Manage automated security responses and triggers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Pause className="w-4 h-4" />
            Pause All
          </Button>
          <Button className="gap-2">
            <Play className="w-4 h-4" />
            Resume All
          </Button>
        </div>
      </div>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Automation Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Pending Actions</p>
              <p className="text-3xl font-bold">{queueSize}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Processing Rate</p>
              <p className="text-3xl font-bold">2.3/min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">98.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="triggers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Triggers Tab */}
        <TabsContent value="triggers">
          <div className="space-y-4">
            {triggers.map((trigger) => (
              <Card key={trigger.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {trigger.type.replace(/_/g, " ")}
                      </CardTitle>
                      <CardDescription>
                        Action: {trigger.action.replace(/_/g, " ")}
                      </CardDescription>
                    </div>
                    <Badge className={trigger.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {trigger.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Threshold</Label>
                      <p className="text-lg font-semibold">{trigger.threshold}</p>
                    </div>
                    <div>
                      <Label className="text-sm">Time Window (minutes)</Label>
                      <p className="text-lg font-semibold">{trigger.window}</p>
                    </div>
                  </div>

                  {editingTrigger?.id === trigger.id ? (
                    <div className="space-y-3 border-t pt-4">
                      <div>
                        <Label htmlFor="threshold">Threshold</Label>
                        <Input
                          id="threshold"
                          type="number"
                          value={editingTrigger.threshold}
                          onChange={(e) =>
                            setEditingTrigger({
                              ...editingTrigger,
                              threshold: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="window">Time Window (minutes)</Label>
                        <Input
                          id="window"
                          type="number"
                          value={editingTrigger.window}
                          onChange={(e) =>
                            setEditingTrigger({
                              ...editingTrigger,
                              window: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveTrigger(editingTrigger)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTrigger(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 border-t pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleTrigger(trigger.id)}
                      >
                        {trigger.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTrigger(trigger)}
                        className="gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Configure
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Automation History</CardTitle>
              <CardDescription>Recent automation actions and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automationHistory.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {action.status === "completed" && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {action.status === "failed" && (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        {action.status === "pending" && (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{action.type.replace(/_/g, " ")}</p>
                        <p className="text-sm text-gray-600">{action.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(action.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityBadge(action.severity)}>
                        {action.severity}
                      </Badge>
                      <Badge className={getStatusBadge(action.status)}>
                        {action.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Configure global automation preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These settings apply to all automation triggers. Changes will take effect immediately.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="max-queue">Maximum Queue Size</Label>
                  <Input id="max-queue" type="number" defaultValue="1000" />
                  <p className="text-xs text-gray-600 mt-1">Maximum number of pending actions</p>
                </div>

                <div>
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input id="retry-attempts" type="number" defaultValue="3" />
                  <p className="text-xs text-gray-600 mt-1">Number of times to retry failed actions</p>
                </div>

                <div>
                  <Label htmlFor="retry-delay">Retry Delay (seconds)</Label>
                  <Input id="retry-delay" type="number" defaultValue="60" />
                  <p className="text-xs text-gray-600 mt-1">Delay between retry attempts</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button>Save Settings</Button>
                  <Button variant="outline">Reset to Defaults</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminAutomationPanel;
