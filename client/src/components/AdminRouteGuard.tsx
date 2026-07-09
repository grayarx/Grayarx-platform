import { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "admin" && user.role !== "founder") {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertDescription>
            <h2 className="font-semibold mb-2">Access Denied</h2>
            <p>You do not have permission to access this page. Admin access is required.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === "admin" || false;
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(requiredRole: string): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const roleHierarchy: Record<string, number> = {
    admin: 100,
    dealer: 50,
    consultant: 25,
    user: 10,
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}
