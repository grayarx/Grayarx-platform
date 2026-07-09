import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    // Extract token from URL query params
    const params = new URLSearchParams(search);
    const resetToken = params.get("token");
    if (!resetToken) {
      setError("Invalid or missing reset token");
    } else {
      setToken(resetToken);
    }
  }, [search]);

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("One uppercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("One number");
    }
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    if (pwd) {
      setPasswordErrors(validatePassword(pwd));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError("Password does not meet requirements");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Password Reset Successful
            </h1>

            <p className="text-slate-400 text-center mb-6">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>

            <Button
              onClick={() => setLocation("/login")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Invalid Link
            </h1>

            <p className="text-slate-400 text-center mb-6">
              The password reset link is invalid or has expired. Please request a new one.
            </p>

            <Button
              onClick={() => setLocation("/forgot-password")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              Request New Link
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-center text-white mb-2">
            Reset Your Password
          </h1>

          <p className="text-slate-400 text-center mb-6 text-sm">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {password && passwordErrors.length > 0 && (
                <div className="mt-2 text-sm text-slate-400">
                  <p className="mb-1">Password must have:</p>
                  <ul className="space-y-1">
                    {passwordErrors.map((error, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-red-500">✗</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {password && passwordErrors.length === 0 && (
                <p className="mt-2 text-sm text-green-500">✓ Password meets requirements</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-500">Passwords do not match</p>
              )}

              {confirmPassword && password === confirmPassword && (
                <p className="mt-2 text-sm text-green-500">✓ Passwords match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                !password ||
                !confirmPassword ||
                password !== confirmPassword ||
                passwordErrors.length > 0
              }
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <div className="border-t border-slate-800 mt-6 pt-6">
            <p className="text-center text-slate-500 text-sm">
              Remember your password?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-amber-500 hover:text-amber-400 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
