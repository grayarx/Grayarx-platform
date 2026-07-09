import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, LogOut, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function VerifyEmailRequired() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setResendLoading(true);
    try {
      const response = await fetch("/api/auth/resend-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    } finally {
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
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg"></div>
                <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-full">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold text-white">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-slate-300">
              Your email address needs to be verified before you can access the dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info box */}
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <Mail className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                We've sent a verification email to <strong>{user?.email}</strong>. Check your inbox and click the verification link to continue.
              </AlertDescription>
            </Alert>

            {/* Instructions */}
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-slate-200">What to do next:</p>
              <ol className="text-xs text-slate-400 space-y-2">
                <li>1. Check your email inbox for a message from GrayArx</li>
                <li>2. Click the "Verify Email" button in the email</li>
                <li>3. You'll be redirected back to sign in</li>
                <li>4. Sign in with your email and password</li>
              </ol>
            </div>

            {/* Spam folder warning */}
            <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/30">
              <p className="text-xs text-slate-400">
                💡 <strong>Tip:</strong> If you don't see the email, check your spam or junk folder. Sometimes verification emails end up there.
              </p>
            </div>

            {/* Success message */}
            {resendSuccess && (
              <Alert className="bg-emerald-500/10 border-emerald-500/30">
                <Mail className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="text-emerald-300">
                  Verification email sent! Check your inbox.
                </AlertDescription>
              </Alert>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all"
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
                <Mail className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={() => setLocation("/check-email")}
                variant="outline"
                className="w-full border-slate-600 text-slate-200 hover:bg-slate-700/50"
              >
                Go to Check Email Page
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={logout}
                variant="ghost"
                className="w-full text-slate-400 hover:text-slate-300 hover:bg-slate-700/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Support */}
            <div className="pt-4 border-t border-slate-700/50 text-center">
              <p className="text-xs text-slate-400">
                Need help?{" "}
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
      </div>
    </div>
  );
}
