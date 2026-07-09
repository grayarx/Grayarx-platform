import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Unlock, Shield, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BruteForceAlert {
  id: number;
  ipAddress: string;
  attemptCount: number;
  severity: "high" | "critical";
  timestamp: Date;
  resolved: boolean;
  userId?: number;
}

export function BruteForceAlertPanel() {
  const [selectedAlert, setSelectedAlert] = useState<BruteForceAlert | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  // Mock brute force alerts
  const alerts: BruteForceAlert[] = [
    {
      id: 1,
      ipAddress: "203.0.113.42",
      attemptCount: 7,
      severity: "critical",
      timestamp: new Date(Date.now() - 300000),
      resolved: false,
    },
    {
      id: 2,
      ipAddress: "198.51.100.89",
      attemptCount: 4,
      severity: "high",
      timestamp: new Date(Date.now() - 3600000),
      resolved: false,
    },
  ];

  const handleLockAccount = async (alert: BruteForceAlert) => {
    setIsLocking(true);
    try {
      // In production, call tRPC mutation
      // await trpc.auditLog.lockAccount.mutate({ userId: alert.userId, reason: "Brute force attempt" });
      console.log("Account locked for IP:", alert.ipAddress);
    } finally {
      setIsLocking(false);
    }
  };

  const handleWhitelistIP = async (ipAddress: string) => {
    try {
      // In production, call tRPC mutation
      // await trpc.auditLog.whitelistIP.mutate({ ipAddress });
      console.log("IP whitelisted:", ipAddress);
    } catch (error) {
      console.error("Failed to whitelist IP:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    return severity === "critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800";
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5" />
            Active Brute Force Alerts
          </CardTitle>
          <CardDescription className="text-red-800">
            {alerts.filter((a) => !a.resolved).length} active threats detected
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`cursor-pointer transition-colors ${
              selectedAlert?.id === alert.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedAlert(alert)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <span className="font-mono font-semibold">{alert.ipAddress}</span>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{alert.attemptCount} failed attempts</span>
                    </div>
                    <span>{formatTimeAgo(alert.timestamp)}</span>
                  </div>

                  {selectedAlert?.id === alert.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">IP Address</p>
                          <p className="font-mono font-semibold">{alert.ipAddress}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Failed Attempts</p>
                          <p className="font-semibold">{alert.attemptCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Severity</p>
                          <p className="font-semibold capitalize">{alert.severity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Detected</p>
                          <p className="font-semibold">{formatTimeAgo(alert.timestamp)}</p>
                        </div>
                      </div>

                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          This IP has been temporarily blocked from login attempts. It will be automatically unlocked after the lockout period expires.
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleLockAccount(alert)}
                          disabled={isLocking}
                          className="gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          {isLocking ? "Locking..." : "Lock Account"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWhitelistIP(alert.ipAddress)}
                          className="gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          Whitelist IP
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* IP Whitelist/Blacklist Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">IP Management</CardTitle>
          <CardDescription>Manage whitelisted and blacklisted IP addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-3 text-sm">Whitelisted IPs</h4>
              <div className="space-y-2">
                <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                  <p className="font-mono">192.168.1.100</p>
                  <p className="text-xs text-gray-600">Office Network</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Blacklisted IPs</h4>
              <div className="space-y-2">
                <div className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                  <p className="font-mono">203.0.113.42</p>
                  <p className="text-xs text-gray-600">Brute force attempt</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BruteForceAlertPanel;
