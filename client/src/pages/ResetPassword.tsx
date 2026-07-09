import { useState, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Password updated — you can sign in now.");
    },
    onError: (e) => toast.error(e.message ?? "Could not reset password"),
  });

  useEffect(() => {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    setToken(params.get("token"));
  }, [search]);

  const passwordErrors: string[] = [];
  if (password.length > 0 && password.length < 8) passwordErrors.push("At least 8 characters");
  if (password.length > 0 && !/[A-Z]/.test(password)) passwordErrors.push("One uppercase letter");
  if (password.length > 0 && !/[0-9]/.test(password)) passwordErrors.push("One number");

  const inputClass =
    "w-full h-12 pl-11 pr-11 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition text-sm";

  if (success) {
    return (
      <AuthShell title="Password updated" subtitle="Your account is ready — sign in with your new password.">
        <div className="text-center py-4 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <Button className="w-full h-12 btn-gold" onClick={() => setLocation("/login")}>
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing or expired.">
        <div className="text-center py-4 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <Button asChild className="w-full h-12 btn-gold">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose new password"
      subtitle="Use at least 8 characters with one uppercase letter and one number."
      footer={
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (password !== confirmPassword || passwordErrors.length) return;
          resetMutation.mutate({ token, newPassword: password });
        }}
        className="space-y-4"
      >
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className={inputClass}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordErrors.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-1">
            {passwordErrors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        )}

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className={inputClass}
            autoComplete="new-password"
          />
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}

        <Button
          type="submit"
          disabled={
            resetMutation.isPending ||
            passwordErrors.length > 0 ||
            password !== confirmPassword
          }
          className="w-full h-12 btn-gold font-semibold"
        >
          {resetMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
