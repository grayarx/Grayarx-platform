import { useState } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { getLoginUrl } from "../const";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function LoginEnhanced() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();
  const validateTokenQuery = trpc.auth.validateResetToken.useQuery(
    { token: resetToken },
    { enabled: !!resetToken && showResetForm }
  );

  // Redirect if already logged in
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await forgotPasswordMutation.mutateAsync({ email: forgotEmail });
      setMessage("Check your email for password reset instructions");
      setForgotEmail("");
      setTimeout(() => setShowForgotPassword(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await resetPasswordMutation.mutateAsync({
        token: resetToken,
        newPassword,
      });
      setMessage("Password reset successful! Please sign in with your new password.");
      setNewPassword("");
      setResetToken("");
      setShowResetForm(false);
      setTimeout(() => setShowForgotPassword(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleManualsSignIn = () => {
    // In a real app, this would authenticate with email/password
    // For now, redirect to OAuth
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        {!showForgotPassword ? (
          <Card className="p-8 border-border">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Sign in to GrayArx</h1>
              <p className="text-muted-foreground">Access your dealership dashboard</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                {message}
              </div>
            )}

            {/* OAuth Sign In */}
            <div className="space-y-4 mb-6">
              <Button
                onClick={handleManualsSignIn}
                className="w-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1a1a1a] font-semibold"
                size="lg"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue with GrayArx
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Alternative Sign In Methods */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full border-border"
                size="lg"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                className="w-full border-border"
                size="lg"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.12-.38C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.905-.07 1.75-.76 2.95-.68 1.78.12 3.12.72 3.52 2.14-3.55 2.16-2.84 6.7.385 7.82-.5 1.42-1.28 1.91-2.88 2.59l-.86.08z" />
                </svg>
                Apple
              </Button>

              <Button
                variant="outline"
                className="w-full border-border"
                size="lg"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77 4.25 4.85 4.85 0 0 1-5.45-2.16v2.44H9.4a7.686 7.686 0 0 0 .001-4.34h1.7v2.16a4.84 4.84 0 0 1 5.45-2.16c1.54.64 2.77 2.04 3.77 4.25z" />
                </svg>
                WhatsApp
              </Button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[#d4af37] hover:text-[#c9a227] font-medium"
              >
                Forgot your password?
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a href="/onboarding" className="text-[#d4af37] hover:text-[#c9a227] font-medium">
                Start free trial
              </a>
            </div>
          </Card>
        ) : !showResetForm ? (
          /* Forgot Password Form */
          <Card className="p-8 border-border">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
              <p className="text-muted-foreground">Enter your email to receive reset instructions</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !forgotEmail}
                className="w-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1a1a1a] font-semibold"
                size="lg"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </button>
            </div>
          </Card>
        ) : (
          /* Reset Password Form */
          <Card className="p-8 border-border">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Set New Password</h2>
              <p className="text-muted-foreground">Enter your reset token and new password</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                {message}
              </div>
            )}

            {validateTokenQuery.data?.valid === false && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                {validateTokenQuery.data.message}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Reset Token</label>
                <Input
                  type="text"
                  placeholder="Paste token from email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !resetToken || !newPassword || validateTokenQuery.data?.valid === false}
                className="w-full bg-[#d4af37] hover:bg-[#c9a227] text-[#1a1a1a] font-semibold"
                size="lg"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowResetForm(false);
                  setResetToken("");
                  setNewPassword("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to forgot password
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
