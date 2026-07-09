/**
 * Security Dashboard Page
 * Integrated view with threat monitoring, webhooks, and alert preferences
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealtimeThreatDashboard } from "@/components/RealtimeThreatDashboard";
import { WebhookIntegration } from "@/components/WebhookIntegration";
import { AlertPreferences } from "@/components/AlertPreferences";
import { IncidentPlaybooks } from "@/components/IncidentPlaybooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Bell, Zap, BookOpen } from "lucide-react";

export function SecurityDashboardPage() {
  const [activeTab, setActiveTab] = useState("threats");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Security Center</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor threats, configure alerts, manage webhooks, and automate incident response
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-lg font-semibold">All Systems Operational</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Slack + PagerDuty</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Active policies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Playbooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Automated responses</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="threats" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Threats</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="playbooks" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Playbooks</span>
            </TabsTrigger>
          </TabsList>

          {/* Threats Tab */}
          <TabsContent value="threats" className="space-y-6">
            <RealtimeThreatDashboard />
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <WebhookIntegration />
          </TabsContent>

          {/* Alert Preferences Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <AlertPreferences />
          </TabsContent>

          {/* Incident Playbooks Tab */}
          <TabsContent value="playbooks" className="space-y-6">
            <IncidentPlaybooks />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
