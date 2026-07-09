import { useState } from "react";
import { Link } from "wouter";
import { Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSent(true);
      toast.success("If that email is registered, we sent a reset link.");
    },
    onError: (e) => toast.error(e.message ?? "Could not send reset email"),
  });

  const inputClass =
    "w-full h-12 pl-11 pr-4 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition text-sm";

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your dealer email — we'll send a secure link valid for 24 hours."
      footer={
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="text-center space-y-4 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Check your inbox for <strong className="text-foreground">{email}</strong>. If you
            don&apos;t see it, check spam or contact support.
          </p>
          <Button asChild variant="outline" className="w-full h-11">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            forgotMutation.mutate({ email });
          }}
          className="space-y-4"
        >
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dealership.co.za"
              className={inputClass}
            />
          </div>
          <Button
            type="submit"
            disabled={forgotMutation.isPending}
            className="w-full h-12 btn-gold font-semibold"
          >
            {forgotMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
