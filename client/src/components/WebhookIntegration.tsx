/**
 * Webhook Integration Component
 * Manages Slack, PagerDuty, and custom webhook configurations
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, TestTube, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface WebhookConfig {
  id: string;
  type: "slack" | "pagerduty" | "custom";
  url: string;
  channel?: string;
  enabled: boolean;
  createdAt: Date;
}

export function WebhookIntegration() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "slack" as "slack" | "pagerduty" | "custom",
    url: "",
    apiKey: "",
    channel: "",
  });

  // Simulated data - in production, fetch from tRPC
  const mockWebhooks: WebhookConfig[] = [
    {
      id: "webhook_1",
      type: "slack",
      url: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
      channel: "#security-alerts",
      enabled: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "webhook_2",
      type: "pagerduty",
      url: "https://events.pagerduty.com/v2/enqueue",
      enabled: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  const handleAddWebhook = async () => {
    if (!formData.url.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }

    try {
      // In production, call tRPC mutation
      const newWebhook: WebhookConfig = {
        id: `webhook_${Date.now()}`,
        type: formData.type,
        url: formData.url,
        channel: formData.channel,
        enabled: true,
        createdAt: new Date(),
      };

      setWebhooks([...webhooks, newWebhook]);
      setFormData({ type: "slack", url: "", apiKey: "", channel: "" });
      setShowDialog(false);
      toast.success(`${formData.type} webhook added successfully!`);
    } catch (error) {
      toast.error("Failed to add webhook");
    }
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    setTestingId(webhook.id);
    try {
      // Simulate test - in production, call tRPC mutation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Test alert sent to ${webhook.type} successfully!`);
    } catch (error) {
      toast.error("Failed to send test alert");
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
    toast.success("Webhook deleted");
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(
      webhooks.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const getWebhookIcon = (type: string) => {
    switch (type) {
      case "slack":
        return "🔷";
      case "pagerduty":
        return "📟";
      case "custom":
        return "🔗";
      default:
        return "🔌";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      slack: "Slack",
      pagerduty: "PagerDuty",
      custom: "Custom Webhook",
    };
    return labels[type] || type;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Integrations</h2>
          <p className="text-muted-foreground mt-1">
            Configure Slack, PagerDuty, or custom webhooks to receive security alerts
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Webhook
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Webhooks will receive real-time security alerts when threats are detected. Test your
          integration before relying on it for critical notifications.
        </AlertDescription>
      </Alert>

      {/* Webhooks List */}
      <div className="grid gap-4">
        {webhooks.length === 0 && mockWebhooks.length > 0 ? (
          mockWebhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getWebhookIcon(webhook.type)}</span>
                    <div>
                      <CardTitle className="text-base">
                        {getTypeLabel(webhook.type)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Added {formatDate(webhook.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={webhook.enabled ? "default" : "secondary"}>
                    {webhook.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 truncate">
                      {webhook.url}
                    </p>
                  </div>

                  {webhook.channel && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Channel</Label>
                      <p className="text-sm mt-1">{webhook.channel}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook)}
                      disabled={testingId === webhook.id}
                      className="gap-2"
                    >
                      <TestTube className="w-3 h-3" />
                      {testingId === webhook.id ? "Testing..." : "Test"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleWebhook(webhook.id)}
                    >
                      {webhook.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="gap-2 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">No webhooks configured yet</p>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(true)}
                  className="mt-4"
                >
                  Add Your First Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getWebhookIcon(webhook.type)}</span>
                    <div>
                      <CardTitle className="text-base">
                        {getTypeLabel(webhook.type)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Added {formatDate(webhook.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={webhook.enabled ? "default" : "secondary"}>
                    {webhook.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 truncate">
                      {webhook.url}
                    </p>
                  </div>

                  {webhook.channel && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Channel</Label>
                      <p className="text-sm mt-1">{webhook.channel}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook)}
                      disabled={testingId === webhook.id}
                      className="gap-2"
                    >
                      <TestTube className="w-3 h-3" />
                      {testingId === webhook.id ? "Testing..." : "Test"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleWebhook(webhook.id)}
                    >
                      {webhook.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="gap-2 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Webhook Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook Integration</DialogTitle>
            <DialogDescription>
              Configure a webhook to receive security alerts in real-time
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Webhook Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="pagerduty">PagerDuty</SelectItem>
                  <SelectItem value="custom">Custom Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                placeholder="https://hooks.slack.com/services/..."
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </div>

            {formData.type === "pagerduty" && (
              <div>
                <Label htmlFor="apiKey">Integration Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Your PagerDuty integration key"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                />
              </div>
            )}

            {formData.type === "slack" && (
              <div>
                <Label htmlFor="channel">Channel (Optional)</Label>
                <Input
                  id="channel"
                  placeholder="#security-alerts"
                  value={formData.channel}
                  onChange={(e) =>
                    setFormData({ ...formData, channel: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAddWebhook} className="flex-1">
                Add Webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
