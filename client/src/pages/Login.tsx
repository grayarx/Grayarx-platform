import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { FormErrorBoundary } from "@/components/FormErrorBoundary";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  isRememberMeEnabled,
  loadRememberedEmail,
  persistRememberMe,
} from "@/lib/rememberMe";

export default function Login() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const loginMutation = trpc.auth.loginWithEmail.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    setEmail(loadRememberedEmail());
    setRememberMe(isRememberMeEnabled());
    setHasHydrated(true);
  }, []);

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
      const result = await loginMutation.mutateAsync({ email, password, rememberMe });
      if (result.success) {
        persistRememberMe(email, rememberMe);
        toast.success("Welcome back — redirecting…");
        await utils.auth.me.invalidate();
        setLocation("/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass =
    "w-full h-12 pl-11 pr-4 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition font-sans text-sm";

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your dealer console — leads, inventory, and AI agents."
      footer={
        <p className="text-sm text-muted-foreground">
          No account yet?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/70" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dealership.co.za"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/70" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(v === true)}
              className="border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label
              htmlFor="remember-me"
              className="text-sm text-muted-foreground cursor-pointer font-normal"
            >
              Remember me
            </Label>
          </div>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        <FormErrorBoundary error={error} onDismiss={() => setError(null)} />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold w-full h-12 font-semibold uppercase tracking-wider text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
