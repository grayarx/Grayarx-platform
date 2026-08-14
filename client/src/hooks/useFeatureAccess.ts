import { trpc } from "../lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Hook to check if current user has access to a feature.
 * Skips the protected query when anonymous so public pages are not kicked to /login.
 */
export function useFeatureAccess(featureId: string) {
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.featureAccess.checkFeatureAccess.useQuery(
    { featureId },
    {
      enabled: Boolean(user),
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  );

  return {
    hasAccess: data?.hasAccess ?? false,
    tier: data?.tier,
    reason: data?.reason,
    isLoading: Boolean(user) && isLoading,
    error,
  };
}

/**
 * Hook to get all accessible features for current dealership
 */
export function useAccessibleFeatures() {
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.featureAccess.getAccessibleFeatures.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    features: data ?? [],
    isLoading: Boolean(user) && isLoading,
    error,
  };
}

/**
 * Hook to get subscription details
 */
export function useSubscriptionDetails() {
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.featureAccess.getSubscriptionDetails.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 60 * 1000,
    retry: false,
  });

  return {
    subscription: data,
    isLoading: Boolean(user) && isLoading,
    error,
  };
}

/**
 * Hook to check if subscription is expiring soon
 * (name keeps historical typo `oon` — callers import this symbol)
 */
export function useSubscriptionExpiringoon() {
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.featureAccess.isSubscriptionExpiringSoon.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 60 * 1000,
    retry: false,
  });

  return {
    isExpiringSoon: data ?? false,
    isLoading: Boolean(user) && isLoading,
    error,
  };
}

/**
 * Hook to get feature definitions
 */
export function useFeatureDefinitions() {
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.featureAccess.getFeatureDefinitions.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  return {
    features: data ?? [],
    isLoading: Boolean(user) && isLoading,
    error,
  };
}
