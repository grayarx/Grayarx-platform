import { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEALER_ROLES = new Set([
  "dealer_owner",
  "dealer_consultant",
  "admin",
  "founder",
]);

interface DealerRouteGuardProps {
  children: ReactNode;
}

export function DealerRouteGuard({ children }: DealerRouteGuardProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) return null;

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (!DEALER_ROLES.has(user.role)) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertDescription>
            <h2 className="font-semibold mb-2">Access Denied</h2>
            <p>You need a dealership account to access this page.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
