import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Download, RefreshCw, TrendingUp, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface SecurityMetric {
  label: string;
  value: number;
  max: number;
  status: "good" | "warning" | "critical";
  description: string;
}

interface SecurityFinding {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  affectedArea: string;
}

export function DealershipSecurityReport() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [isExporting, setIsExporting] = useState(false);

  // Mock security metrics for dealership
  const securityMetrics: SecurityMetric[] = useMemo(() => [
    {
      label: "Email Verification",
      value: 98,
      max: 100,
      status: "good",
      description: "Percentage of users with verified emails",
    },
    {
      label: "Password Strength",
      value: 92,
      max: 100,
      status: "good",
      description: "Percentage of users with strong passwords",
    },
    {
      label: "2FA Adoption",
      value: 45,
      max: 100,
      status: "warning",
      description: "Percentage of users with 2FA enabled",
    },
    {
      label: "Failed Login Attempts",
      value: 12,
      max: 100,
      status: "good",
      description: "Failed login attempts in last 30 days (lower is better)",
    },
  ], []);

  // Mock security findings
  const securityFindings: SecurityFinding[] = useMemo(() => [
    {
      id: "1",
      severity: "low",
      title: "Enable 2FA for All Team Members",
      description: "Only 45% of team members have 2FA enabled. This is a critical security layer.",
      recommendation: "Encourage all team members to enable 2FA in their account settings.",
      affectedArea: "Authentication",
    },
    {
      id: "2",
      severity: "medium",
      title: "Update Security Policies",
      description: "Password reset policy should be reviewed and updated.",
      recommendation: "Review and update password reset policies to align with industry standards.",
      affectedArea: "Password Management",
    },
    {
      id: "3",
      severity: "low",
      title: "Session Timeout Configuration",
      description: "Consider implementing automatic session timeout for inactive users.",
      recommendation: "Set session timeout to 30 minutes of inactivity for enhanced security.",
      affectedArea: "Session Management",
    },
  ], []);

  const overallSecurityScore = Math.round(
    securityMetrics.reduce((sum, m) => sum + (m.value / m.max) * 100, 0) / securityMetrics.length
  );

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Simulate PDF export
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("PDF export started");
    } finally {
      setIsExporting(false);
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
      case "low":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Report</h1>
          <p className="text-gray-600 mt-1">Your dealership security assessment and recommendations</p>
        </div>
        <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
      </div>

      {/* Overall Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Security Score</CardTitle>
          <CardDescription>Based on your current security configuration and user behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(overallSecurityScore)}`}>
                {overallSecurityScore}
              </div>
              <p className="text-gray-600 mt-2">out of 100</p>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Score Interpretation</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">80-100: Excellent security posture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">60-79: Good, but improvements recommended</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Below 60: Critical improvements needed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{metric.label}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    metric.status === "good"
                      ? "bg-green-50 text-green-700"
                      : metric.status === "warning"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                  }
                >
                  {metric.status === "good" ? "✓" : "⚠"} {metric.value}%
                </Badge>
              </div>
              <CardDescription className="text-xs">{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    metric.status === "good"
                      ? "bg-green-500"
                      : metric.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Security Findings & Recommendations
          </CardTitle>
          <CardDescription>
            {securityFindings.length} findings from your latest security assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityFindings.map((finding) => (
              <div key={finding.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getSeverityIcon(finding.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{finding.title}</h3>
                      <Badge className={getSeverityColor(finding.severity)}>
                        {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{finding.description}</p>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                      <p className="text-sm font-medium text-blue-900 mb-1">Recommendation:</p>
                      <p className="text-sm text-blue-800">{finding.recommendation}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      <Lock className="w-3 h-3 inline mr-1" />
                      Affected Area: {finding.affectedArea}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardDescription>Select the time period for this security report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period)}
              >
                {period === "7d" ? "Last 7 Days" : period === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </Button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Current report period: <strong>{selectedPeriod === "7d" ? "Last 7 Days" : selectedPeriod === "30d" ? "Last 30 Days" : "Last 90 Days"}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>✓ Review the findings and recommendations above</p>
          <p>✓ Implement the recommended security improvements</p>
          <p>✓ Share this report with your team</p>
          <p>✓ Schedule a follow-up assessment in 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default DealershipSecurityReport;
