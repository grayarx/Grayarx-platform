import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Loader2, Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { EmailValidator } from "@/components/EmailValidator";
import { FormErrorBoundary } from "@/components/FormErrorBoundary";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Signup() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signupMutation = trpc.auth.signupWithEmail.useMutation();

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signupMutation.mutateAsync({
        email,
        password,
        name: name || undefined,
      });
      if (result.success) {
        toast.success("Account created — redirecting…");
        setTimeout(() => setLocation("/dashboard"), 400);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass =
    "w-full h-11 pl-11 pr-4 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition font-sans text-sm";

  return (
    <AuthShell
      title="Create account"
      subtitle="Start your dealership pilot — free, no credit card."
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/70" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>
        </div>

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
          {email && <EmailValidator email={email} className="mt-1" />}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
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
          {password && <PasswordStrengthIndicator password={password} className="mt-1" />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/70" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <FormErrorBoundary error={error} onDismiss={() => setError(null)} />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold w-full h-12 font-semibold uppercase tracking-wider text-sm mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
