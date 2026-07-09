/**
 * Alert Preferences Component
 * Configure which alert types trigger webhooks and notification settings
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AlertRule {
  id: string;
  name: string;
  eventType: string;
  minSeverity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
  webhooks: string[];
  cooldown: number; // minutes
  escalate: boolean;
}

export function AlertPreferences() {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: "rule_1",
      name: "Brute Force Attack",
      eventType: "brute_force",
      minSeverity: "high",
      enabled: true,
      webhooks: ["slack", "pagerduty"],
      cooldown: 5,
      escalate: true,
    },
    {
      id: "rule_2",
      name: "Suspicious Location",
      eventType: "suspicious_location",
      minSeverity: "medium",
      enabled: true,
      webhooks: ["slack"],
      cooldown: 10,
      escalate: false,
    },
    {
      id: "rule_3",
      name: "Data Export",
      eventType: "data_export",
      minSeverity: "critical",
      enabled: true,
      webhooks: ["slack", "pagerduty"],
      cooldown: 1,
      escalate: true,
    },
    {
      id: "rule_4",
      name: "Unusual Activity",
      eventType: "unusual_activity",
      minSeverity: "low",
      enabled: false,
      webhooks: ["slack"],
      cooldown: 15,
      escalate: false,
    },
  ]);

  const [hasChanges, setHasChanges] = useState(false);

  const handleRuleChange = (id: string, updates: Partial<AlertRule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Simulate save - in production, call tRPC mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Alert preferences saved successfully!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save preferences");
    }
  };

  const handleReset = () => {
    // Reset to default
    setRules([
      {
        id: "rule_1",
        name: "Brute Force Attack",
        eventType: "brute_force",
        minSeverity: "high",
        enabled: true,
        webhooks: ["slack", "pagerduty"],
        cooldown: 5,
        escalate: true,
      },
      {
        id: "rule_2",
        name: "Suspicious Location",
        eventType: "suspicious_location",
        minSeverity: "medium",
        enabled: true,
        webhooks: ["slack"],
        cooldown: 10,
        escalate: false,
      },
      {
        id: "rule_3",
        name: "Data Export",
        eventType: "data_export",
        minSeverity: "critical",
        enabled: true,
        webhooks: ["slack", "pagerduty"],
        cooldown: 1,
        escalate: true,
      },
      {
        id: "rule_4",
        name: "Unusual Activity",
        eventType: "unusual_activity",
        minSeverity: "low",
        enabled: false,
        webhooks: ["slack"],
        cooldown: 15,
        escalate: false,
      },
    ]);
    setHasChanges(false);
    toast.success("Reset to default preferences");
  };

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Preferences</h2>
          <p className="text-muted-foreground mt-1">
            Configure which security events trigger alerts and notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {enabledCount} of {rules.length} alert rules are active. Alerts will be sent to configured
          webhooks based on these preferences.
        </AlertDescription>
      </Alert>

      {/* Alert Rules */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={rule.enabled ? "" : "opacity-60"}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={rule.enabled}
                    onCheckedChange={(checked) =>
                      handleRuleChange(rule.id, { enabled: !!checked })
                    }
                  />
                  <div>
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Event type: {rule.eventType}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={rule.escalate ? "destructive" : "secondary"}>
                  {rule.escalate ? "Escalates" : "Standard"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Minimum Severity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Minimum Severity</Label>
                  <Select
                    value={rule.minSeverity}
                    onValueChange={(value: any) =>
                      handleRuleChange(rule.id, { minSeverity: value })
                    }
                    disabled={!rule.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cooldown Period */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Cooldown Period: {rule.cooldown} min
                  </Label>
                  <Slider
                    value={[rule.cooldown]}
                    onValueChange={(value) =>
                      handleRuleChange(rule.id, { cooldown: value[0] })
                    }
                    min={1}
                    max={60}
                    step={1}
                    disabled={!rule.enabled}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Webhook Destinations */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Send to Webhooks</Label>
                <div className="flex flex-wrap gap-2">
                  {["slack", "pagerduty", "custom"].map((webhook) => (
                    <Checkbox
                      key={webhook}
                      checked={rule.webhooks.includes(webhook)}
                      onCheckedChange={(checked) => {
                        const newWebhooks = checked
                          ? [...rule.webhooks, webhook]
                          : rule.webhooks.filter((w) => w !== webhook);
                        handleRuleChange(rule.id, { webhooks: newWebhooks });
                      }}
                      disabled={!rule.enabled}
                      className="mr-2"
                    />
                  ))}
                  <span className="text-sm text-muted-foreground">
                    {rule.webhooks.length > 0
                      ? rule.webhooks.join(", ")
                      : "No webhooks selected"}
                  </span>
                </div>
              </div>

              {/* Escalation */}
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  checked={rule.escalate}
                  onCheckedChange={(checked) =>
                    handleRuleChange(rule.id, { escalate: !!checked })
                  }
                  disabled={!rule.enabled}
                />
                <Label className="text-sm cursor-pointer">
                  Escalate to security team if not resolved within 1 hour
                </Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Alert Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Suppress non-critical alerts during quiet hours
              </p>
            </div>
            <Checkbox defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Alert Deduplication</Label>
              <p className="text-sm text-muted-foreground">
                Group similar alerts within 5 minutes
              </p>
            </div>
            <Checkbox defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Incident Auto-Creation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create incidents for critical alerts
              </p>
            </div>
            <Checkbox defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
