import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Shield, TrendingUp, Download, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function DealershipSecurityDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dealership audit logs
  const { data: logsData, refetch: refetchLogs } = trpc.auditLog.getDealershipLogs.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!user }
  );

  // Fetch security metrics
  const { data: metricsData } = trpc.auditLog.getSecurityMetrics.useQuery(
    { days: 30 },
    { enabled: !!user }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchLogs();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // In production, call export mutation
    console.log("Exporting security report...");
  };

  // Calculate security score (0-100)
  const calculateSecurityScore = () => {
    if (!metricsData) return 0;

    let score = 100;

    // Deduct points for failed logins
    score -= Math.min(metricsData.failedLogins * 2, 20);

    // Deduct points for suspicious activities
    score -= Math.min(metricsData.suspiciousActivities * 5, 15);

    // Add points for 2FA adoption
    score += Math.min(metricsData.twoFAAdoptionRate / 5, 10);

    // Add points for email verification
    score += Math.min(metricsData.emailVerificationRate / 10, 10);

    return Math.max(0, Math.min(100, score));
  };

  const securityScore = calculateSecurityScore();

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800" };
    if (score >= 60) return { label: "Good", color: "bg-blue-100 text-blue-800" };
    if (score >= 40) return { label: "Fair", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Poor", color: "bg-red-100 text-red-800" };
  };

  const scoreBadge = getScoreBadge(securityScore);

  const recommendations = [
    {
      id: 1,
      severity: "high",
      title: "Enable Two-Factor Authentication",
      description: "Only 45% of users have 2FA enabled. Increase adoption to improve account security.",
      action: "Encourage users",
    },
    {
      id: 2,
      severity: "medium",
      title: "Review Failed Login Attempts",
      description: "12 failed login attempts detected in the last 30 days. Review for suspicious patterns.",
      action: "Review logs",
    },
    {
      id: 3,
      severity: "low",
      title: "Update Security Policies",
      description: "Consider implementing stricter password requirements for better security.",
      action: "Update policies",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your dealership security</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Security Score
            </span>
            <Badge className={scoreBadge.color}>{scoreBadge.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="text-4xl font-bold text-blue-600">{securityScore}</div>
              <p className="text-sm text-gray-600">out of 100</p>
            </div>
            <div className="flex-1">
              <Progress value={securityScore} className="h-3" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Your dealership's security posture is {scoreBadge.label.toLowerCase()}. Review recommendations below to improve.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {metricsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricsData.totalLogins}</div>
              <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metricsData.failedLogins}</div>
              <p className="text-xs text-gray-600 mt-1">
                {((metricsData.failedLogins / metricsData.totalLogins) * 100).toFixed(1)}% failure rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">2FA Adoption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metricsData.twoFAAdoptionRate}%</div>
              <p className="text-xs text-gray-600 mt-1">Users with 2FA enabled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Email Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metricsData.emailVerificationRate}%</div>
              <p className="text-xs text-gray-600 mt-1">Verified email addresses</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Security Recommendations
          </CardTitle>
          <CardDescription>Actions to improve your security posture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50">
                <div className="mt-1">
                  {rec.severity === "high" && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {rec.severity === "medium" && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                  {rec.severity === "low" && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                </div>
                <Button size="sm" variant="outline">
                  {rec.action}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="recent-activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Recent Activity */}
        <TabsContent value="recent-activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Login Activity</CardTitle>
              <CardDescription>Last 20 login events from your dealership</CardDescription>
            </CardHeader>
            <CardContent>
              {logsData && logsData.logs.length > 0 ? (
                <div className="space-y-2">
                  {logsData.logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded text-sm">
                      <div>
                        <p className="font-medium capitalize">{log.eventType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-600">{log.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={log.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {log.status}
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-600">No activity found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Security Trends</CardTitle>
              <CardDescription>30-day security metrics and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metricsData && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-2">Login Success Rate</p>
                      <Progress
                        value={((metricsData.totalLogins - metricsData.failedLogins) / metricsData.totalLogins) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        {((metricsData.totalLogins - metricsData.failedLogins) / metricsData.totalLogins * 100).toFixed(1)}% success rate
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Peak Login Hour</p>
                      <p className="text-lg font-semibold">{metricsData.peakLoginHour}:00 (2 PM)</p>
                      <p className="text-xs text-gray-600">Most active time for logins</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Average Session Duration</p>
                      <p className="text-lg font-semibold">{metricsData.averageSessionDuration} minutes</p>
                      <p className="text-xs text-gray-600">Average user session length</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies for your dealership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Security settings are managed by your administrator. Contact support to request changes.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Password Requirements</p>
                    <p className="text-xs text-gray-600">Minimum 8 characters, uppercase, lowercase, numbers, special chars</p>
                  </div>
                  <Badge>Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-600">Optional for all users</p>
                  </div>
                  <Badge variant="outline">Optional</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Session Timeout</p>
                    <p className="text-xs text-gray-600">30 minutes of inactivity</p>
                  </div>
                  <Badge>30 min</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DealershipSecurityDashboard;
