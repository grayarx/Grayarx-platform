/**
 * Security Team Notification Dashboard
 * Centralized view for all incoming alerts with acknowledgment and resolution tracking
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "new" | "acknowledged" | "resolved";
  source: string;
  timestamp: Date;
  deliveredTo: string[];
  slaDeadline: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

export function SecurityTeamNotificationDashboard() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif_1",
      ruleId: "rule_1",
      ruleName: "Brute Force Attack",
      severity: "critical",
      status: "new",
      source: "Slack",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      deliveredTo: ["slack", "pagerduty"],
      slaDeadline: new Date(Date.now() + 55 * 60 * 1000),
    },
    {
      id: "notif_2",
      ruleId: "rule_2",
      ruleName: "Suspicious Location",
      severity: "high",
      status: "acknowledged",
      source: "Email",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      deliveredTo: ["slack"],
      slaDeadline: new Date(Date.now() + 45 * 60 * 1000),
      acknowledgedBy: "john@example.com",
      acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: "notif_3",
      ruleId: "rule_3",
      ruleName: "Data Export",
      severity: "critical",
      status: "resolved",
      source: "Webhook",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      deliveredTo: ["slack", "pagerduty"],
      slaDeadline: new Date(Date.now() - 15 * 60 * 1000),
      acknowledgedBy: "jane@example.com",
      acknowledgedAt: new Date(Date.now() - 40 * 60 * 1000),
      resolvedBy: "jane@example.com",
      resolvedAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const newCount = notifications.filter((n) => n.status === "new").length;
  const acknowledgedCount = notifications.filter((n) => n.status === "acknowledged").length;
  const resolvedCount = notifications.filter((n) => n.status === "resolved").length;

  const filteredNotifications = notifications.filter((n) =>
    n.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAcknowledge = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setShowAcknowledgeDialog(true);
  };

  const confirmAcknowledge = () => {
    if (selectedNotification) {
      setNotifications(
        notifications.map((n) =>
          n.id === selectedNotification.id
            ? {
                ...n,
                status: "acknowledged" as const,
                acknowledgedBy: "current_user@example.com",
                acknowledgedAt: new Date(),
              }
            : n
        )
      );
      toast.success("Alert acknowledged");
      setShowAcknowledgeDialog(false);
    }
  };

  const handleResolve = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setResolutionNotes("");
    setShowResolveDialog(true);
  };

  const confirmResolve = () => {
    if (selectedNotification) {
      setNotifications(
        notifications.map((n) =>
          n.id === selectedNotification.id
            ? {
                ...n,
                status: "resolved" as const,
                resolvedBy: "current_user@example.com",
                resolvedAt: new Date(),
                notes: resolutionNotes,
              }
            : n
        )
      );
      toast.success("Alert resolved");
      setShowResolveDialog(false);
    }
  };

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
      case "new":
        return <Bell className="w-4 h-4" />;
      case "acknowledged":
        return <Eye className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
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

  const calculateSLAStatus = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return { status: "breached", color: "text-red-600" };
    if (minutes < 15) return { status: "critical", color: "text-orange-600" };
    return { status: "ok", color: "text-green-600" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Alerts</h2>
          <p className="text-muted-foreground mt-1">
            Monitor and manage incoming security alerts with SLA tracking
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{newCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{acknowledgedCount}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <p className="text-xs text-muted-foreground">On track</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts by rule name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="new">New ({newCount})</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged ({acknowledgedCount})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
        </TabsList>

        {/* All Alerts */}
        <TabsContent value="all" className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No alerts found</AlertDescription>
            </Alert>
          ) : (
            filteredNotifications.map((notification) => (
              <Card key={notification.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(notification.severity)}>
                          {notification.severity}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getStatusIcon(notification.status)}
                          {notification.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{notification.ruleName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div>
                          <p className="text-xs">Source</p>
                          <p className="font-medium text-foreground">{notification.source}</p>
                        </div>
                        <div>
                          <p className="text-xs">Delivered To</p>
                          <p className="font-medium text-foreground">
                            {notification.deliveredTo.join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs">SLA Deadline</p>
                          <p
                            className={`font-medium ${
                              calculateSLAStatus(notification.slaDeadline).color
                            }`}
                          >
                            {formatTime(notification.slaDeadline)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs">Alert ID</p>
                          <p className="font-medium text-foreground text-xs">{notification.id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDetailDialog(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Details
                      </Button>

                      {notification.status === "new" && (
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(notification)}
                          className="gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Acknowledge
                        </Button>
                      )}

                      {notification.status === "acknowledged" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResolve(notification)}
                          className="gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Resolve
                        </Button>
                      )}

                      {notification.status === "resolved" && (
                        <Button size="sm" variant="ghost" disabled>
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* New Alerts */}
        <TabsContent value="new" className="space-y-3">
          {notifications
            .filter((n) => n.status === "new")
            .map((notification) => (
              <Card key={notification.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{notification.ruleName}</h3>
                      <p className="text-sm text-muted-foreground">{formatTime(notification.timestamp)}</p>
                    </div>
                    <Button size="sm" onClick={() => handleAcknowledge(notification)}>
                      Acknowledge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* Acknowledged Alerts */}
        <TabsContent value="acknowledged" className="space-y-3">
          {notifications
            .filter((n) => n.status === "acknowledged")
            .map((notification) => (
              <Card key={notification.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{notification.ruleName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Acknowledged by {notification.acknowledgedBy}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleResolve(notification)}>
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* Resolved Alerts */}
        <TabsContent value="resolved" className="space-y-3">
          {notifications
            .filter((n) => n.status === "resolved")
            .map((notification) => (
              <Card key={notification.id} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{notification.ruleName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Resolved by {notification.resolvedBy}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Rule Name</Label>
                <p className="font-semibold">{selectedNotification.ruleName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Severity</Label>
                  <Badge className={getSeverityColor(selectedNotification.severity)}>
                    {selectedNotification.severity}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline">{selectedNotification.status}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Delivered To</Label>
                <p className="font-semibold">{selectedNotification.deliveredTo.join(", ")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Timestamp</Label>
                <p className="font-semibold">{selectedNotification.timestamp.toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Acknowledge Dialog */}
      <Dialog open={showAcknowledgeDialog} onOpenChange={setShowAcknowledgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as acknowledged and assign it to yourself
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox defaultChecked />
              <Label>I am investigating this alert</Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAcknowledgeDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={confirmAcknowledge} className="flex-1">
                Acknowledge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved and provide resolution details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                placeholder="Describe the actions taken to resolve this alert..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResolveDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={confirmResolve} className="flex-1">
                Resolve Alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
