import { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SetupDealershipBanner from "@/components/SetupDealershipBanner";

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
      <div className="container py-12 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            <h2 className="font-semibold mb-2">Dealer access needed</h2>
            <p>
              This login isn’t set as a dealer yet — that’s why uploads are blocked.
              Use the button below to create your garage in one click.
            </p>
          </AlertDescription>
        </Alert>
        <SetupDealershipBanner />
      </div>
    );
  }

  return <>{children}</>;
}
