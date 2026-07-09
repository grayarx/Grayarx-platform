/**
 * Incident Playbooks Component
 * Manage automated response workflows for security incidents
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Play, Edit2, Trash2, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

interface PlaybookAction {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  severity: "critical" | "high" | "medium" | "low";
  actions: PlaybookAction[];
  enabled: boolean;
  lastExecuted?: Date;
  executionCount: number;
}

const DEFAULT_ACTIONS: PlaybookAction[] = [
  {
    id: "action_1",
    name: "Lock User Account",
    description: "Immediately lock the affected user account",
    enabled: true,
  },
  {
    id: "action_2",
    name: "Reset Password",
    description: "Force password reset on next login",
    enabled: true,
  },
  {
    id: "action_3",
    name: "Block IP Address",
    description: "Add source IP to firewall blocklist",
    enabled: true,
  },
  {
    id: "action_4",
    name: "Require 2FA Verification",
    description: "Force 2FA re-verification",
    enabled: true,
  },
  {
    id: "action_5",
    name: "Revoke Active Sessions",
    description: "Terminate all active user sessions",
    enabled: true,
  },
  {
    id: "action_6",
    name: "Send Alert Email",
    description: "Notify user of suspicious activity",
    enabled: true,
  },
  {
    id: "action_7",
    name: "Create Incident Ticket",
    description: "Open incident in ticketing system",
    enabled: true,
  },
  {
    id: "action_8",
    name: "Escalate to Security Team",
    description: "Notify security team immediately",
    enabled: true,
  },
];

export function IncidentPlaybooks() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([
    {
      id: "playbook_1",
      name: "Brute Force Response",
      description: "Automated response to brute force attacks",
      triggerType: "brute_force",
      severity: "high",
      actions: DEFAULT_ACTIONS.slice(0, 5),
      enabled: true,
      executionCount: 12,
      lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "playbook_2",
      name: "Data Export Alert",
      description: "Immediate response to unauthorized data exports",
      triggerType: "data_export",
      severity: "critical",
      actions: DEFAULT_ACTIONS,
      enabled: true,
      executionCount: 3,
      lastExecuted: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "playbook_3",
      name: "Suspicious Location",
      description: "Response to logins from unusual locations",
      triggerType: "suspicious_location",
      severity: "medium",
      actions: DEFAULT_ACTIONS.slice(0, 4),
      enabled: true,
      executionCount: 8,
      lastExecuted: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ]);

  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [editingPlaybook, setEditingPlaybook] = useState<Partial<Playbook> | null>(null);

  const handleTestPlaybook = async (playbook: Playbook) => {
    try {
      // Simulate playbook execution
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Playbook "${playbook.name}" executed successfully!`);

      // Update execution count
      setPlaybooks(
        playbooks.map((p) =>
          p.id === playbook.id
            ? {
                ...p,
                executionCount: p.executionCount + 1,
                lastExecuted: new Date(),
              }
            : p
        )
      );
    } catch (error) {
      toast.error("Failed to execute playbook");
    }
  };

  const handleTogglePlaybook = (id: string) => {
    setPlaybooks(
      playbooks.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleDeletePlaybook = (id: string) => {
    setPlaybooks(playbooks.filter((p) => p.id !== id));
    toast.success("Playbook deleted");
  };

  const handleEditPlaybook = (playbook: Playbook) => {
    setEditingPlaybook(playbook);
    setSelectedPlaybook(playbook);
    setShowDialog(true);
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Incident Response Playbooks</h2>
          <p className="text-muted-foreground mt-1">
            Automated workflows that execute predefined actions when threats are detected
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Playbook
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Playbooks execute automatically when their trigger conditions are met. Test playbooks
          before enabling them in production.
        </AlertDescription>
      </Alert>

      {/* Playbooks Grid */}
      <div className="grid gap-4">
        {playbooks.map((playbook) => (
          <Card key={playbook.id} className={playbook.enabled ? "" : "opacity-60"}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{playbook.name}</CardTitle>
                    <Badge className={getSeverityColor(playbook.severity)}>
                      {playbook.severity}
                    </Badge>
                    {playbook.enabled ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription>{playbook.description}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Trigger Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Trigger Type</p>
                  <p className="font-medium text-sm">{playbook.triggerType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Executions</p>
                  <p className="font-medium text-sm">{playbook.executionCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Executed</p>
                  <p className="font-medium text-sm">
                    {playbook.lastExecuted ? formatDate(playbook.lastExecuted) : "Never"}
                  </p>
                </div>
              </div>

              {/* Actions List */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Actions ({playbook.actions.filter((a) => a.enabled).length}/{playbook.actions.length})
                </p>
                <div className="space-y-2">
                  {playbook.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{action.name}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestPlaybook(playbook)}
                  disabled={!playbook.enabled}
                  className="gap-2"
                >
                  <Play className="w-3 h-3" />
                  Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPlaybook(playbook)}
                  className="gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePlaybook(playbook.id)}
                >
                  {playbook.enabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePlaybook(playbook.id)}
                  className="gap-2 ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Playbook Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlaybook ? "Edit Playbook" : "Create New Playbook"}
            </DialogTitle>
            <DialogDescription>
              Define automated actions to execute when security incidents are detected
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Playbook Name</Label>
              <Input
                id="name"
                placeholder="e.g., Brute Force Response"
                defaultValue={editingPlaybook?.name || ""}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What does this playbook do?"
                defaultValue={editingPlaybook?.description || ""}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Select Actions</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {DEFAULT_ACTIONS.map((action) => (
                  <div key={action.id} className="flex items-start gap-2">
                    <Checkbox defaultChecked />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingPlaybook(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Playbook saved successfully!");
                  setShowDialog(false);
                  setEditingPlaybook(null);
                }}
                className="flex-1"
              >
                {editingPlaybook ? "Update" : "Create"} Playbook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playbook Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Templates</CardTitle>
          <CardDescription>
            Start with a predefined playbook template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "Account Lockdown", icon: Lock },
              { name: "Incident Creation", icon: AlertTriangle },
              { name: "Team Escalation", icon: AlertTriangle },
            ].map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 py-3"
              >
                <template.icon className="w-5 h-5" />
                <span className="text-sm">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
