import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, MapPin, Smartphone } from "lucide-react";

export default function SecurityDashboard() {
  const loginHistory = [
    {
      id: 1,
      device: "Chrome on macOS",
      location: "San Francisco, CA",
      ip: "192.168.1.1",
      timestamp: "2 hours ago",
      status: "success",
    },
    {
      id: 2,
      device: "Safari on iPhone",
      location: "San Francisco, CA",
      ip: "192.168.1.2",
      timestamp: "1 day ago",
      status: "success",
    },
    {
      id: 3,
      device: "Firefox on Windows",
      location: "Unknown",
      ip: "203.0.113.45",
      timestamp: "3 days ago",
      status: "failed",
    },
  ];

  const securityAlerts = [
    {
      id: 1,
      type: "success",
      title: "Two-Factor Authentication Enabled",
      description: "Your account is now protected with 2FA",
      timestamp: "2 weeks ago",
    },
    {
      id: 2,
      type: "warning",
      title: "New Login from Unknown Location",
      description: "A new device signed in from an unfamiliar location",
      timestamp: "1 week ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor your account security and login activity</p>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
          <CardDescription>Your account security status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">85/100</p>
              <p className="text-sm text-muted-foreground mt-1">Excellent security</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Strong password</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>2FA enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span>No backup codes saved</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login Activity</CardTitle>
          <CardDescription>Your login history from the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loginHistory.map((login) => (
              <div key={login.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{login.device}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{login.location}</span>
                      <span>•</span>
                      <span>{login.ip}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{login.timestamp}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={login.status === "success" ? "default" : "destructive"}>
                  {login.status === "success" ? "Success" : "Failed"}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Activity
          </Button>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
          <CardDescription>Important security events and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border rounded-lg ${
                  alert.type === "success" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{alert.timestamp}</p>
                  </div>
                  {alert.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
