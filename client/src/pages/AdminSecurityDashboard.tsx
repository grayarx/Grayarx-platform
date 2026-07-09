import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Shield, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function AdminSecurityDashboard() {
  const [selectedDealership, setSelectedDealership] = useState<string | null>(null);
  const [auditInProgress, setAuditInProgress] = useState(false);

  const runSecurityAudit = trpc.securityAudit.runAudit.useMutation();
  const getSecurityScore = trpc.securityAudit.getSecurityScore.useQuery(
    { dealershipId: selectedDealership || undefined },
    { enabled: !!selectedDealership }
  );
  const listAudits = trpc.securityAudit.listAudits.useQuery(
    { dealershipId: selectedDealership || undefined, limit: 10 },
    { enabled: !!selectedDealership }
  );
  const getAlerts = trpc.securityAudit.getAlerts.useQuery(
    { dealershipId: selectedDealership || undefined }
  );

  const handleRunAudit = async () => {
    setAuditInProgress(true);
    try {
      const result = await runSecurityAudit.mutateAsync({
        dealershipId: selectedDealership || undefined,
      });

      if (result.success) {
        toast.success(`Security audit completed - Score: ${result.score}/100`);
      }
    } catch (error) {
      toast.error("Failed to run security audit");
    } finally {
      setAuditInProgress(false);
    }
  };

  const scoreData = [
    { name: "Mon", score: 92 },
    { name: "Tue", score: 93 },
    { name: "Wed", score: 91 },
    { name: "Thu", score: 94 },
    { name: "Fri", score: 95 },
    { name: "Sat", score: 94 },
    { name: "Sun", score: 94 },
  ];

  const checkTypeData = [
    { name: "Auth", score: 95 },
    { name: "AuthZ", score: 93 },
    { name: "Data Iso", score: 96 },
    { name: "Encrypt", score: 94 },
    { name: "Input Val", score: 95 },
    { name: "Rate Limit", score: 92 },
    { name: "Compliance", score: 94 },
    { name: "Token Rot", score: 92 },
    { name: "API Keys", score: 95 },
    { name: "Privilege", score: 91 },
  ];

  const dealerships = [
    { id: "dealership-1", name: "Premium Auto Sales", score: 94, status: "secure" },
    { id: "dealership-2", name: "Elite Motors", score: 87, status: "review_needed" },
    { id: "dealership-3", name: "Quick Sales", score: 92, status: "secure" },
    { id: "dealership-4", name: "Luxury Imports", score: 89, status: "review_needed" },
  ];

  const recentAlerts = [
    {
      id: "alert-1",
      dealership: "Elite Motors",
      type: "high",
      message: "Authorization check failed - review role-based access",
      timestamp: new Date(Date.now() - 3600000),
      status: "open",
    },
    {
      id: "alert-2",
      dealership: "Luxury Imports",
      type: "medium",
      message: "API key rotation overdue - rotate within 7 days",
      timestamp: new Date(Date.now() - 7200000),
      status: "open",
    },
    {
      id: "alert-3",
      dealership: "Premium Auto Sales",
      type: "low",
      message: "Privilege creep detected - review team permissions",
      timestamp: new Date(Date.now() - 86400000),
      status: "resolved",
    },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-900 text-red-200";
      case "high":
        return "bg-orange-900 text-orange-200";
      case "medium":
        return "bg-yellow-900 text-yellow-200";
      case "low":
        return "bg-blue-900 text-blue-200";
      default:
        return "bg-slate-700 text-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "secure" ? (
      <CheckCircle2 className="w-5 h-5 text-green-400" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-yellow-400" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Audit Dashboard</h1>
          <p className="text-slate-400">Monitor platform and dealership security in real-time</p>
        </div>
        <Shield className="w-12 h-12 text-gold" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Platform Score</p>
              <p className="text-3xl font-bold text-white mt-2">94</p>
              <p className="text-green-400 text-sm mt-1">↑ 2 points</p>
            </div>
            <TrendingUp className="w-8 h-8 text-gold" />
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Dealerships</p>
              <p className="text-3xl font-bold text-white mt-2">4</p>
              <p className="text-slate-400 text-sm mt-1">All monitored</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Open Alerts</p>
              <p className="text-3xl font-bold text-white mt-2">2</p>
              <p className="text-orange-400 text-sm mt-1">Require attention</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-400" />
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Last Audit</p>
              <p className="text-3xl font-bold text-white mt-2">2h</p>
              <p className="text-slate-400 text-sm mt-1">ago</p>
            </div>
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
      </div>

      {/* Score Trend */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Security Score Trend (7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[85, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#d4af37"
              strokeWidth={2}
              dot={{ fill: "#d4af37", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Check Types Breakdown */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Security Check Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={checkTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[85, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="score" fill="#d4af37" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Dealership Security Status */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Dealership Security Status</h2>

        <div className="space-y-3">
          {dealerships.map((dealership) => (
            <div
              key={dealership.id}
              onClick={() => setSelectedDealership(dealership.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedDealership === dealership.id
                  ? "border-gold bg-slate-700"
                  : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(dealership.status)}
                  <div>
                    <p className="text-white font-semibold">{dealership.name}</p>
                    <p className="text-slate-400 text-sm">
                      Score: {dealership.score}/100
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    dealership.status === "secure"
                      ? "bg-green-900 text-green-200"
                      : "bg-yellow-900 text-yellow-200"
                  }
                >
                  {dealership.status === "secure" ? "Secure" : "Review"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Dealership Details */}
      {selectedDealership && (
        <>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Audit History</h2>
              <Button
                onClick={handleRunAudit}
                disabled={auditInProgress}
                className="bg-gold text-slate-900 hover:bg-yellow-400"
              >
                {auditInProgress ? "Running..." : "Run Audit Now"}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Audit ID</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Score</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Passed Checks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listAudits.data?.map((audit: any) => (
                    <TableRow key={audit.auditId} className="border-slate-700">
                      <TableCell className="text-white">{audit.auditId}</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(audit.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-white font-semibold">{audit.score}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-900 text-green-200">
                          {audit.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {audit.passedCount}/{audit.checkCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Security Profile</h2>

            {getSecurityScore.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-300 text-sm mb-2">Current Score</p>
                  <p className="text-3xl font-bold text-gold">
                    {getSecurityScore.data.currentScore}
                  </p>
                  <p className="text-green-400 text-sm mt-2">
                    ↑ {getSecurityScore.data.currentScore - getSecurityScore.data.previousScore} from last audit
                  </p>
                </div>

                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-300 text-sm mb-2">Risk Level</p>
                  <p className="text-2xl font-bold text-green-400">
                    {getSecurityScore.data.riskLevel}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Trend: {getSecurityScore.data.trend}
                  </p>
                </div>
              </div>
            )}

            {getSecurityScore.data?.recommendations && (
              <div className="mt-6">
                <p className="text-white font-semibold mb-3">Recommendations</p>
                <ul className="space-y-2">
                  {getSecurityScore.data.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <Zap className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Recent Alerts */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Alerts</h2>

        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <Alert
              key={alert.id}
              className={`${getAlertColor(alert.type)} border-0`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{alert.dealership}</p>
                  <p className="text-sm mt-1">{alert.message}</p>
                  <p className="text-xs mt-2 opacity-75">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
                <Badge
                  className={
                    alert.status === "resolved"
                      ? "bg-green-900 text-green-200"
                      : "bg-red-900 text-red-200"
                  }
                >
                  {alert.status}
                </Badge>
              </div>
            </Alert>
          ))}
        </div>
      </Card>
    </div>
  );
}
