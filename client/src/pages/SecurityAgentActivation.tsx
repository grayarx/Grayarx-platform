import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: "detection" | "action" | "verification" | "unlock";
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  icon: string;
}

interface SecurityLog {
  id: string;
  timestamp: number;
  event: string;
  severity: "low" | "medium" | "high" | "critical";
  details: string;
  ipAddress?: string;
  location?: string;
}

export default function SecurityAgentActivation() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"activating" | "success" | "error">(
    "activating"
  );
  const [message, setMessage] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const activateSecurityAgent = async () => {
      try {
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Invalid security token. Please try again.");
          setLoading(false);
          return;
        }

        // Simulate security agent activation with progress
        const events: SecurityEvent[] = [
          {
            id: "1",
            timestamp: Date.now(),
            type: "detection",
            title: "Threat Detected",
            description: "Brute force attack detected on your account",
            status: "completed",
            icon: "🚨",
          },
          {
            id: "2",
            timestamp: Date.now() + 1000,
            type: "action",
            title: "Account Locked",
            description: "Your account has been automatically locked for protection",
            status: "in-progress",
            icon: "🔒",
          },
          {
            id: "3",
            timestamp: Date.now() + 2000,
            type: "action",
            title: "IP Blocked",
            description: "Attacking IP address has been blocked",
            status: "pending",
            icon: "🛡️",
          },
          {
            id: "4",
            timestamp: Date.now() + 3000,
            type: "verification",
            title: "Verifying Identity",
            description: "Verifying your identity to unlock account",
            status: "pending",
            icon: "✓",
          },
          {
            id: "5",
            timestamp: Date.now() + 4000,
            type: "unlock",
            title: "Account Unlocked",
            description: "Your account has been secured and unlocked",
            status: "pending",
            icon: "🔓",
          },
        ];

        setSecurityEvents(events);

        // Simulate security logs
        const logs: SecurityLog[] = [
          {
            id: "log-1",
            timestamp: Date.now() - 60000,
            event: "Brute Force Attack Detected",
            severity: "critical",
            details: "5 failed login attempts detected within 15 minutes",
            ipAddress: "192.168.1.100",
            location: "Unknown Location",
          },
          {
            id: "log-2",
            timestamp: Date.now() - 45000,
            event: "Account Locked",
            severity: "high",
            details: "Account automatically locked to prevent unauthorized access",
          },
          {
            id: "log-3",
            timestamp: Date.now() - 30000,
            event: "IP Address Blocked",
            severity: "high",
            details: "Source IP 192.168.1.100 has been added to block list",
            ipAddress: "192.168.1.100",
          },
          {
            id: "log-4",
            timestamp: Date.now() - 15000,
            event: "All Sessions Terminated",
            severity: "medium",
            details: "All active sessions have been terminated for security",
          },
          {
            id: "log-5",
            timestamp: Date.now(),
            event: "Security Agent Activated",
            severity: "medium",
            details: "Security agent has been activated to verify and unlock account",
          },
        ];

        setSecurityLogs(logs);

        // Simulate progress
        for (let i = 0; i <= 100; i += 20) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setProgress(i);
        }

        // Simulate activation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Call activation endpoint
        const response = await fetch("/api/security/activate-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message);
          setActions(data.actions || []);
          // Update events to completed
          setSecurityEvents((prev) =>
            prev.map((e) => ({ ...e, status: "completed" as const }))
          );
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to activate security agent");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while activating the security agent");
      } finally {
        setLoading(false);
      }
    };

    activateSecurityAgent();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-900";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-900";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-900";
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-900";
      default:
        return "bg-gray-100 border-gray-300 text-gray-900";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {loading ? (
          <Card className="p-8 bg-white shadow-2xl">
            <div className="text-center">
              {/* Security Loading Animation */}
              <div className="mb-8 flex justify-center">
                <div className="relative w-24 h-24">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400 animate-spin"></div>
                  {/* Middle rotating ring */}
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-600 border-l-purple-400 animate-spin" style={{ animationDirection: "reverse" }}></div>
                  {/* Inner icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl animate-pulse">🔒</div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Activating Security Agent
              </h2>
              <p className="text-gray-600 mb-6">
                Securing your account and verifying your identity...
              </p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
              </div>

              {/* Real-time Security Events */}
              <div className="text-left space-y-3">
                <p className="font-semibold text-gray-800 mb-3">Security Actions:</p>
                {securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-xl mt-1">{event.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                    {event.status === "completed" && (
                      <span className="text-green-600 font-semibold">✓</span>
                    )}
                    {event.status === "in-progress" && (
                      <span className="animate-spin">⟳</span>
                    )}
                    {event.status === "pending" && (
                      <span className="text-gray-400">○</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : status === "success" ? (
          <>
            <Card className="p-8 bg-white shadow-2xl">
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
                    <svg
                      className="w-10 h-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-green-600 mb-2">
                  Account Secured
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>

                {actions && actions.length > 0 && (
                  <div className="mb-6 text-left">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Actions Completed:
                    </h3>
                    <ul className="space-y-2">
                      {actions.map((action, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-600 mr-2 font-bold">✓</span>
                          <span className="text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    Your account is now secured. You can log in with your password
                    or 2FA code.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setLocation("/login")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Login
                  </Button>
                  <Button
                    onClick={() => setLocation("/dashboard")}
                    variant="outline"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </Card>

            {/* Security Logs Tab */}
            <Card className="p-6 bg-white shadow-2xl">
              <Tabs defaultValue="logs" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="logs">Security Logs</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="logs" className="space-y-3 mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    Incident History
                  </p>
                  {securityLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border-l-4 ${getSeverityColor(
                        log.severity
                      )}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">{log.event}</p>
                        <span className="text-xs font-semibold uppercase">
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{log.details}</p>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <div className="space-y-4">
                    {securityLogs.map((log, idx) => (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                          {idx < securityLogs.length - 1 && (
                            <div className="w-1 h-12 bg-gray-300 mt-2"></div>
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-semibold text-gray-900">
                            {log.event}
                          </p>
                          <p className="text-sm text-gray-600">{log.details}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </>
        ) : (
          <Card className="p-8 bg-white shadow-2xl">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                  <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Activation Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>

              <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  If you continue to experience issues, please contact our support
                  team at security@grayarx.com
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setLocation("/login")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() =>
                    (window.location.href = "mailto:security@grayarx.com")
                  }
                  variant="outline"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
