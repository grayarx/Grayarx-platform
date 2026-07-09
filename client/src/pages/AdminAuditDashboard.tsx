/**
 * Admin Audit Dashboard
 * View and manage audit logs, suspicious activity, and security events
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Shield, Activity, TrendingUp, Lock, Eye, EyeOff, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminAuditDashboard() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"24h" | "7d" | "30d">("7d");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have permission to access this page. Only administrators can view audit logs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch real audit logs from tRPC
  const { data: auditData, isLoading: auditLoading } = trpc.auditLog.getDealershipLogs.useQuery(
    {
      limit: 50,
      offset: 0,
    },
    { enabled: !!user }
  );

  // Fetch suspicious activities from tRPC
  const { data: suspiciousData } = trpc.auditLog.getSuspiciousActivity.useQuery(
    { limit: 10 },
    { enabled: !!user }
  );

  // Update local state when data arrives
  useEffect(() => {
    if (auditData?.logs) {
      setAuditLogs(auditData.logs);
    }
    if (suspiciousData?.alerts) {
      setSuspiciousActivity(suspiciousData.alerts);
    }
    setIsLoading(auditLoading);
  }, [auditData, suspiciousData, auditLoading]);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("login_success")) return "✅";
    if (eventType.includes("login_failed")) return "❌";
    if (eventType.includes("signup")) return "✨";
    if (eventType.includes("2fa")) return "🔐";
    if (eventType.includes("password")) return "🔒";
    if (eventType.includes("session")) return "🔑";
    return "📋";
  };

  const getStatusColor = (status: string) => {
    return status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-amber-600" />
            Security & Audit Dashboard
          </h1>
          <p className="text-slate-600 mt-2">Monitor security events, suspicious activity, and user authentication logs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{auditLogs.length}</div>
              <p className="text-xs text-slate-500 mt-1">Last {dateRange}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Failed Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {auditLogs.filter(l => l.eventType === "login_failed").length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Suspicious Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{suspiciousActivity.length}</div>
              <p className="text-xs text-slate-500 mt-1">Alerts detected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-slate-500 mt-1">Across all users</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Date Range</label>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Event Type</label>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="login">Login Events</SelectItem>
                    <SelectItem value="signup">Signup Events</SelectItem>
                    <SelectItem value="2fa">2FA Events</SelectItem>
                    <SelectItem value="password">Password Events</SelectItem>
                    <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">User ID</label>
                <Input
                  placeholder="Search by user ID..."
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="audit-logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audit-logs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="suspicious" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Suspicious Activity
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Active Sessions
            </TabsTrigger>
          </TabsList>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>All authentication and security events</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-6 h-6" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <p>No audit logs found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{getEventIcon(log.eventType)}</span>
                                <span className="text-sm font-medium capitalize">{log.eventType.replace(/_/g, " ")}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{log.email || "Unknown"}</TableCell>
                            <TableCell className="text-sm font-mono text-slate-600">{log.ipAddress}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suspicious Activity Tab */}
          <TabsContent value="suspicious">
            <Card>
              <CardHeader>
                <CardTitle>Suspicious Activity</CardTitle>
                <CardDescription>Potential security threats and anomalies</CardDescription>
              </CardHeader>
              <CardContent>
                {suspiciousActivity.length === 0 ? (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      No suspicious activity detected in the selected period.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {suspiciousActivity.map((activity, idx) => (
                      <Alert key={idx} className="border-amber-200 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <div className="font-medium">{activity.description}</div>
                          <div className="text-sm mt-1">
                            Type: {activity.type} | IP: {activity.ipAddress} | Severity: {activity.severity}
                          </div>
                          <div className="text-sm mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Currently active user sessions across all devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-600">
                  <p>No active sessions to display</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
