/**
 * Email Analytics Dashboard
 * Real-time monitoring of post-signup email delivery, opens, clicks, and bounces
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RefreshCw, Mail, Eye, MousePointerClick, AlertCircle } from "lucide-react";

interface EmailStats {
  total: number;
  scheduled: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface SequenceStats {
  sequenceType: string;
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

interface RecentEvent {
  id: string;
  dealershipId: number;
  sequenceType: string;
  attemptNumber: number;
  errorMessage?: string;
  createdAt: string;
}

export function EmailAnalytics() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [sequenceStats, setSequenceStats] = useState<SequenceStats[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would be tRPC calls
      // For now, we'll show the structure
      
      // Simulated data - replace with actual tRPC calls
      const mockStats: EmailStats = {
        total: 9,
        scheduled: 3,
        sent: 3,
        opened: 2,
        clicked: 1,
        bounced: 0,
        failed: 0,
        openRate: 66.7,
        clickRate: 33.3,
        bounceRate: 0,
      };

      const mockSequenceStats: SequenceStats[] = [
        {
          sequenceType: "welcome",
          total: 3,
          sent: 3,
          opened: 2,
          clicked: 1,
          bounced: 0,
        },
        {
          sequenceType: "setup_guide",
          total: 3,
          sent: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        },
        {
          sequenceType: "first_lead_tips",
          total: 3,
          sent: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        },
      ];

      setStats(mockStats);
      setSequenceStats(mockSequenceStats);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading email analytics...</p>
        </div>
      </div>
    );
  }

  const statusDistribution = [
    { name: "Scheduled", value: stats.scheduled, color: "#6b7280" },
    { name: "Sent", value: stats.sent, color: "#3b82f6" },
    { name: "Opened", value: stats.opened, color: "#10b981" },
    { name: "Clicked", value: stats.clicked, color: "#f59e0b" },
    { name: "Bounced", value: stats.bounced, color: "#ef4444" },
  ];

  const sequenceChartData = sequenceStats.map((seq) => ({
    name: seq.sequenceType.replace(/_/g, " "),
    sent: seq.sent,
    opened: seq.opened,
    clicked: seq.clicked,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Analytics</h1>
          <p className="text-text-secondary mt-1">
            Real-time monitoring of post-signup email delivery
          </p>
        </div>
        <Button
          onClick={fetchStats}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="text-sm text-text-secondary">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-text-secondary">Total Emails</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">{stats.sent}</div>
              <div className="text-sm text-text-secondary">Sent</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Eye className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">{stats.openRate.toFixed(1)}%</div>
              <div className="text-sm text-text-secondary">Open Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MousePointerClick className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">{stats.clickRate.toFixed(1)}%</div>
              <div className="text-sm text-text-secondary">Click Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">{stats.bounceRate.toFixed(1)}%</div>
              <div className="text-sm text-text-secondary">Bounce Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Status Distribution</TabsTrigger>
          <TabsTrigger value="sequences">By Sequence Type</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Email Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequences">
          <Card>
            <CardHeader>
              <CardTitle>Email Performance by Sequence Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sequenceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" fill="#3b82f6" />
                  <Bar dataKey="opened" fill="#10b981" />
                  <Bar dataKey="clicked" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sequence Details */}
      <Card>
        <CardHeader>
          <CardTitle>Sequence Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sequenceStats.map((seq) => (
              <div key={seq.sequenceType} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground capitalize">
                    {seq.sequenceType.replace(/_/g, " ")}
                  </h3>
                  <Badge variant="outline">{seq.total} emails</Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-text-secondary">Sent</div>
                    <div className="text-lg font-semibold text-foreground">{seq.sent}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Opened</div>
                    <div className="text-lg font-semibold text-green-500">{seq.opened}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Clicked</div>
                    <div className="text-lg font-semibold text-amber-500">{seq.clicked}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Bounced</div>
                    <div className="text-lg font-semibold text-red-500">{seq.bounced}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📊 Email Analytics Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Status Distribution:</strong> Shows the breakdown of emails by current status (scheduled, sent, opened, clicked, bounced).
          </p>
          <p>
            <strong>By Sequence Type:</strong> Compares performance of different email sequences (welcome, setup guide, first-lead tips).
          </p>
          <p>
            <strong>Open Rate:</strong> Percentage of sent emails that were opened by recipients.
          </p>
          <p>
            <strong>Click Rate:</strong> Percentage of sent emails where recipients clicked a link.
          </p>
          <p>
            <strong>Bounce Rate:</strong> Percentage of emails that bounced (hard or soft).
          </p>
          <p className="pt-2">
            💡 <strong>Tip:</strong> Check back in 24 hours for meaningful statistics as emails are delivered and tracked.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
