/**
 * Email Verification Guard
 * Redirects unverified users to email verification page
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  requiredFor?: "dashboard" | "admin" | "all";
}

export function EmailVerificationGuard({
  children,
  requiredFor = "dashboard",
}: EmailVerificationGuardProps) {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // If user is not authenticated, let them pass (will be redirected to login elsewhere)
    if (!user) return;

    // Check if email verification is required
    const shouldRequireVerification =
      requiredFor === "all" ||
      (requiredFor === "admin" && user.role === "admin") ||
      (requiredFor === "dashboard" && user.role !== "admin");

    // If email is not verified and verification is required, redirect
    if (shouldRequireVerification && !user.emailVerifiedAt) {
      navigate("/verify-email-required");
    }
  }, [user, isLoading, requiredFor, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Spinner className="h-8 w-8 text-amber-400" />
      </div>
    );
  }

  // If user is not verified and verification is required, don't render children
  if (user && !user.emailVerifiedAt) {
    return null;
  }

  return <>{children}</>;
}
