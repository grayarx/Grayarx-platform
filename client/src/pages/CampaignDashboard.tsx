import AdminShell from "@/components/AdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Megaphone, Plus, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Spring Sale Campaign",
      painPointGroup: "Price-Sensitive Buyers",
      status: "active",
      startDate: "2026-05-20",
      endDate: "2026-06-20",
      emailsSent: 1250,
      openRate: 34.2,
      clickRate: 8.5,
      conversions: 42,
    },
    {
      id: 2,
      name: "Trade-In Promotion",
      painPointGroup: "Trade-In Seekers",
      status: "active",
      startDate: "2026-05-15",
      endDate: "2026-06-15",
      emailsSent: 890,
      openRate: 41.8,
      clickRate: 12.3,
      conversions: 67,
    },
    {
      id: 3,
      name: "Finance Options",
      painPointGroup: "Finance-Conscious Buyers",
      status: "scheduled",
      startDate: "2026-06-01",
      endDate: "2026-07-01",
      emailsSent: 0,
      openRate: 0,
      clickRate: 0,
      conversions: 0,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
    }
  };

  return (
    <AdminShell
      title="Campaign Management"
      subtitle="Manage email campaigns for different pain point groups"
      actions={
        <Button className="btn-gold">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Emails Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,140</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Open Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">38.0%</div>
              <p className="text-xs text-muted-foreground mt-1">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">109</div>
              <p className="text-xs text-muted-foreground mt-1">Leads generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Campaigns</h3>
          </div>

          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="glass-gold border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>{campaign.painPointGroup}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                    <p className="font-semibold text-sm">{campaign.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End Date</p>
                    <p className="font-semibold text-sm">{campaign.endDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Emails Sent</p>
                    <p className="font-semibold text-sm">{campaign.emailsSent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Open Rate</p>
                    <p className="font-semibold text-sm text-green-400">{campaign.openRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Click Rate</p>
                    <p className="font-semibold text-sm text-blue-400">{campaign.clickRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Conversions</p>
                    <p className="font-semibold text-sm text-primary">{campaign.conversions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Text */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              About Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Campaigns are targeted email sequences sent to dealerships based on their pain point groups.
            </p>
            <p>
              Each campaign includes email preview functionality so you can review and approve emails before they're sent to dealerships.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
