import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowRight, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CheckEmail() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Get email from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    
    if (emailParam) {
      setEmail(emailParam);
      // Store in localStorage for potential resend
      localStorage.setItem("signupEmail", emailParam);
    } else {
      const storedEmail = localStorage.getItem("signupEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // If no email found, redirect back to signup
        setLocation("/signup");
      }
    }
  }, [setLocation]);

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleResendEmail = async () => {
    if (!canResend || !email) return;

    setResendLoading(true);
    setResendError("");
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResendError(data.error || "Failed to resend email");
        setResendLoading(false);
        return;
      }

      setResendSuccess(true);
      setTimeLeft(60);
      setCanResend(false);
      setResendLoading(false);

      // Clear success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setResendError("An error occurred. Please try again.");
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            {/* Email icon with animation */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-full">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold text-white">Check your email</CardTitle>
            <CardDescription className="text-slate-300">
              We've sent a verification link to <span className="font-semibold text-amber-400">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success message */}
            {resendSuccess && (
              <Alert className="bg-emerald-500/10 border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="text-emerald-300">
                  Verification email sent successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Error message */}
            {resendError && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{resendError}</AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold">
                    1
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Check your inbox</p>
                  <p className="text-xs text-slate-400">Look for an email from GrayArx</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold">
                    2
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Click the verification link</p>
                  <p className="text-xs text-slate-400">This will activate your account</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold">
                    3
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">You're all set!</p>
                  <p className="text-xs text-slate-400">Sign in to your account</p>
                </div>
              </div>
            </div>

            {/* Spam warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">Didn't receive the email?</p>
                <p className="text-xs text-amber-100">Check your spam or junk folder</p>
              </div>
            </div>

            {/* Resend button */}
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={!canResend || resendLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {resendLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : canResend ? (
                  <>
                    Resend verification email
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Resend in {timeLeft}s
                  </>
                )}
              </Button>

              {/* Change email link */}
              <div className="text-center">
                <p className="text-sm text-slate-400">
                  Wrong email?{" "}
                  <button
                    onClick={() => {
                      localStorage.removeItem("signupEmail");
                      setLocation("/signup");
                    }}
                    className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
                  >
                    Go back to signup
                  </button>
                </p>
              </div>
            </div>

            {/* Additional help */}
            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 text-center">
                Having trouble?{" "}
                <a
                  href="mailto:support@grayarx.com"
                  className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  Contact support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to login link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Already verified?{" "}
            <a
              href="/login"
              className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
