import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, AlertCircle, Mail, ArrowRight, Clock } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("No verification token provided");
          return;
        }

        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setStatus("expired");
            setMessage("Verification link has expired or already used");
          } else {
            setStatus("error");
            setMessage(data.error || "Failed to verify email");
          }
          return;
        }

        setStatus("success");
        setMessage("Email verified successfully!");

        // Countdown and redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setLocation("/login");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                {status === "loading" && (
                  <>
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-full">
                      <Spinner className="w-8 h-8 text-white" />
                    </div>
                  </>
                )}
                {status === "success" && (
                  <>
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-full">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                  </>
                )}
                {(status === "error" || status === "expired") && (
                  <>
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-red-400 to-red-600 p-4 rounded-full">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <CardTitle className="text-2xl font-bold text-white">
              {status === "loading" && "Verifying your email..."}
              {status === "success" && "Email verified!"}
              {(status === "error" || status === "expired") && "Verification failed"}
            </CardTitle>
            <CardDescription className="text-slate-300">{message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {status === "success" && (
              <>
                <Alert className="bg-emerald-500/10 border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-300">
                    Your email has been verified. Your account is now fully activated.
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-200">Redirecting to login in:</p>
                    <div className="flex items-center gap-2 text-amber-400 font-semibold">
                      <Clock className="w-4 h-4" />
                      {countdown}s
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    You'll be redirected to the login page to sign in with your verified email.
                  </p>
                </div>

                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold transition-all"
                >
                  Sign in now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {(status === "error" || status === "expired") && (
              <>
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">{message}</AlertDescription>
                </Alert>

                <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-200">What went wrong?</p>
                  <ul className="text-xs text-slate-400 space-y-2">
                    <li>• The verification link may have expired (links are valid for 24 hours)</li>
                    <li>• The link may have already been used</li>
                    <li>• The link may be invalid or corrupted</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setLocation("/check-email")}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all"
                  >
                    Request new verification email
                    <Mail className="w-4 h-4 ml-2" />
                  </Button>

                  <Button
                    onClick={() => setLocation("/login")}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-200 hover:bg-slate-700/50"
                  >
                    Back to login
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400 text-center">
                    Still having trouble?{" "}
                    <a
                      href="mailto:support@grayarx.com"
                      className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
                    >
                      Contact support
                    </a>
                  </p>
                </div>
              </>
            )}

            {status === "loading" && (
              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-sm text-slate-300 text-center">
                    Please wait while we verify your email address...
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="animate-spin">
                    <Spinner className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Didn't receive a verification email?{" "}
            <a
              href="/check-email"
              className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              Request a new one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
