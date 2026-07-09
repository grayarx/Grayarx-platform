import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export interface AuthUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  passwordHash: string | null;
  loginMethod: string | null;
  role: "user" | "admin" | "founder" | "dealer_owner" | "dealer_consultant";
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedInAt: Date | null;
  emailVerifiedAt: Date | null;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  return {
    user: (user as AuthUser | null) || null,
    isLoading,
    isAuthenticated: !!user,
    error: error as Error | null,
  };
}

export function getLoginUrl(returnPath?: string): string {
  const params = new URLSearchParams();
  params.set("origin", window.location.origin);
  if (returnPath) {
    params.set("returnPath", returnPath);
  }
  return `/login?${params.toString()}`;
}
