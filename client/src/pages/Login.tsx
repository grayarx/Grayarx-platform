import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2, Lock, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";
import { LOGO_URL } from "@/components/Logo";
import { FormErrorBoundary } from "@/components/FormErrorBoundary";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Luxury/Premium Login Page - Dark theme with gold accents
 * High contrast, elegant, professional
 */
export default function Login() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.loginWithEmail.useMutation();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result.success) {
        toast.success("Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          setLocation("/dashboard");
        }, 500);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Login failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          Back to Home
        </button>

        {/* Premium Card */}
        <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-t-2xl" />

          {/* Corner accents */}
          <div className="absolute top-4 right-4 w-1 h-8 bg-gradient-to-b from-amber-400 to-transparent rounded-full opacity-50" />
          <div className="absolute bottom-4 left-4 w-8 h-1 bg-gradient-to-r from-amber-400 to-transparent rounded-full opacity-50" />

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-amber-600/10 rounded-2xl blur-2xl" />
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl bg-slate-800">
                <img src={LOGO_URL} alt="GrayArx" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome to GrayArx</h1>
              <p className="text-slate-300 text-sm md:text-base">The Dealership AI Operating System</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-400 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <FormErrorBoundary error={error} onDismiss={() => setError(null)} />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-lg transition shadow-lg hover:shadow-xl hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="pt-4 border-t border-slate-700/50">
              <button
                onClick={() => setLocation("/forgot-password")}
                className="text-amber-400 hover:text-amber-300 text-sm font-semibold transition"
              >
                Forgot your password?
              </button>
            </div>

            {/* Security Info */}
            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-center gap-2 text-slate-300 text-sm mb-3">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Enterprise-grade security</span>
              </div>
              <p className="text-xs text-slate-400">
                Your data is encrypted and protected with industry-standard authentication
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 text-center">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/signup")}
                className="text-amber-400 hover:text-amber-300 font-semibold transition"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              Secure Login
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              Email Verified
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              Instant Access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
