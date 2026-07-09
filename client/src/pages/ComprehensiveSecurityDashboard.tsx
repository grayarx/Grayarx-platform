import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ThreatAlert {
  id: string;
  type: "brute_force" | "suspicious_location" | "unusual_activity" | "device_change";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: number;
  status: "active" | "resolved" | "investigating";
  actions: string[];
}

interface SecurityMetric {
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  color: string;
}

interface TrustedDevice {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  os: string;
  lastSeen: number;
  trusted: boolean;
  location: string;
}

interface SecurityRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  completed: boolean;
}

export default function ComprehensiveSecurityDashboard() {
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([
    {
      id: "1",
      type: "brute_force",
      severity: "critical",
      title: "Brute Force Attack Detected",
      description: "5 failed login attempts from IP 192.168.1.100",
      timestamp: Date.now() - 300000,
      status: "resolved",
      actions: ["Account Locked", "IP Blocked", "Email Sent"],
    },
    {
      id: "2",
      type: "suspicious_location",
      severity: "high",
      title: "Login from Unusual Location",
      description: "Login attempt from New York, NY (Last seen: Johannesburg, SA)",
      timestamp: Date.now() - 600000,
      status: "investigating",
      actions: ["Verification Required"],
    },
    {
      id: "3",
      type: "device_change",
      severity: "medium",
      title: "New Device Detected",
      description: "New login from iPhone 15 Pro in Johannesburg",
      timestamp: Date.now() - 900000,
      status: "active",
      actions: ["Trust Device", "Deny Access"],
    },
  ]);

  const [metrics, setMetrics] = useState<SecurityMetric[]>([
    {
      label: "Account Security Score",
      value: 92,
      unit: "%",
      trend: "up",
      color: "text-green-600",
    },
    {
      label: "Failed Login Attempts (24h)",
      value: 5,
      unit: "attempts",
      trend: "down",
      color: "text-green-600",
    },
    {
      label: "Active Sessions",
      value: 3,
      unit: "devices",
      trend: "stable",
      color: "text-blue-600",
    },
    {
      label: "Days Since Last Threat",
      value: 2,
      unit: "days",
      trend: "up",
      color: "text-green-600",
    },
  ]);

  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([
    {
      id: "1",
      name: "MacBook Pro",
      type: "desktop",
      os: "macOS 14.2",
      lastSeen: Date.now() - 3600000,
      trusted: true,
      location: "Johannesburg, SA",
    },
    {
      id: "2",
      name: "iPhone 15 Pro",
      type: "mobile",
      os: "iOS 17.2",
      lastSeen: Date.now() - 7200000,
      trusted: true,
      location: "Johannesburg, SA",
    },
    {
      id: "3",
      name: "iPad Air",
      type: "tablet",
      os: "iPadOS 17.2",
      lastSeen: Date.now() - 86400000,
      trusted: false,
      location: "Cape Town, SA",
    },
  ]);

  const [recommendations, setRecommendations] = useState<SecurityRecommendation[]>([
    {
      id: "1",
      priority: "critical",
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      action: "Enable 2FA",
      completed: false,
    },
    {
      id: "2",
      priority: "high",
      title: "Review Active Sessions",
      description: "Check all devices with access to your account",
      action: "Review Sessions",
      completed: false,
    },
    {
      id: "3",
      priority: "high",
      title: "Update Password",
      description: "Your password hasn't been changed in 90 days",
      action: "Update Password",
      completed: false,
    },
    {
      id: "4",
      priority: "medium",
      title: "Enable Security Alerts",
      description: "Get notified of suspicious activity",
      action: "Enable Alerts",
      completed: true,
    },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500";
      case "investigating":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleTrustDevice = (deviceId: string) => {
    setTrustedDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, trusted: true } : d
      )
    );
  };

  const handleRemoveDevice = (deviceId: string) => {
    setTrustedDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  const handleDismissAlert = (alertId: string) => {
    setThreatAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: "resolved" } : a
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Security Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage your account security
          </p>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="p-6 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-gray-600">
                  {metric.label}
                </h3>
                <span className={`text-xs font-semibold ${
                  metric.trend === "up"
                    ? "text-green-600"
                    : metric.trend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}>
                  {metric.trend === "up" && "↑"}
                  {metric.trend === "down" && "↓"}
                  {metric.trend === "stable" && "→"}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </span>
                <span className="text-gray-600 text-sm">{metric.unit}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="threats" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="threats">Threats & Alerts</TabsTrigger>
            <TabsTrigger value="devices">Trusted Devices</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          {/* Threats & Alerts Tab */}
          <TabsContent value="threats" className="space-y-4 mt-6">
            {threatAlerts.length === 0 ? (
              <Card className="p-8 bg-white text-center">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Active Threats
                </h3>
                <p className="text-gray-600">
                  Your account is secure. No suspicious activity detected.
                </p>
              </Card>
            ) : (
              threatAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`p-6 bg-white border-l-4 ${
                    alert.severity === "critical"
                      ? "border-l-red-600"
                      : alert.severity === "high"
                      ? "border-l-orange-600"
                      : alert.severity === "medium"
                      ? "border-l-yellow-600"
                      : "border-l-blue-600"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        <Badge
                          className={`${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            alert.status
                          )}`}
                        ></span>
                      </div>
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {alert.actions.map((action, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-gray-50"
                      >
                        ✓ {action}
                      </Badge>
                    ))}
                  </div>

                  {alert.status !== "resolved" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Review Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismissAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* Trusted Devices Tab */}
          <TabsContent value="devices" className="space-y-4 mt-6">
            {trustedDevices.map((device) => (
              <Card key={device.id} className="p-6 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {device.type === "desktop"
                          ? "🖥️"
                          : device.type === "mobile"
                          ? "📱"
                          : "📱"}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {device.name}
                        </h3>
                        <p className="text-sm text-gray-600">{device.os}</p>
                      </div>
                    </div>
                  </div>
                  {device.trusted && (
                    <Badge className="bg-green-100 text-green-800">
                      Trusted
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">
                      {device.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Seen</p>
                    <p className="font-medium text-gray-900">
                      {new Date(device.lastSeen).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!device.trusted && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleTrustDevice(device.id)}
                    >
                      Trust Device
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveDevice(device.id)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4 mt-6">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className={`p-6 bg-white border-l-4 ${
                  rec.completed
                    ? "border-l-green-600 opacity-75"
                    : rec.priority === "critical"
                    ? "border-l-red-600"
                    : rec.priority === "high"
                    ? "border-l-orange-600"
                    : "border-l-yellow-600"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rec.title}
                      </h3>
                      {rec.completed ? (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Completed
                        </Badge>
                      ) : (
                        <Badge className={getSeverityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">{rec.description}</p>
                  </div>
                </div>

                {!rec.completed && (
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {rec.action}
                  </Button>
                )}
              </Card>
            ))}
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card className="p-6 bg-white">
              <div className="space-y-4">
                <div className="flex gap-4 pb-4 border-b border-gray-200">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Brute Force Attack Detected
                    </p>
                    <p className="text-sm text-gray-600">
                      5 failed login attempts from 192.168.1.100
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(Date.now() - 300000).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pb-4 border-b border-gray-200">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Unusual Login Location
                    </p>
                    <p className="text-sm text-gray-600">
                      Login from New York, NY
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(Date.now() - 600000).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pb-4 border-b border-gray-200">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      New Device Connected
                    </p>
                    <p className="text-sm text-gray-600">
                      iPhone 15 Pro from Johannesburg
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(Date.now() - 900000).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Password Changed
                    </p>
                    <p className="text-sm text-gray-600">
                      Your password was successfully updated
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(Date.now() - 1800000).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
