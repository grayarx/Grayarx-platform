import { useQuery } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";

/**
 * Hook to check if current user has access to a feature
 */
export function useFeatureAccess(featureId: string) {
  const { data, isLoading, error } = trpc.featureAccess.checkFeatureAccess.useQuery(
    { featureId },
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );

  return {
    hasAccess: data?.hasAccess ?? false,
    tier: data?.tier,
    reason: data?.reason,
    isLoading,
    error,
  };
}

/**
 * Hook to get all accessible features for current dealership
 */
export function useAccessibleFeatures() {
  const { data, isLoading, error } = trpc.featureAccess.getAccessibleFeatures.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  return {
    features: data ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook to get subscription details
 */
export function useSubscriptionDetails() {
  const { data, isLoading, error } = trpc.featureAccess.getSubscriptionDetails.useQuery(undefined, {
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  return {
    subscription: data,
    isLoading,
    error,
  };
}

/**
 * Hook to check if subscription is expiring soon
 */
export function useSubscriptionExpiringoon() {
  const { data, isLoading, error } = trpc.featureAccess.isSubscriptionExpiringoon.useQuery(undefined, {
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  return {
    isExpiringoon: data ?? false,
    isLoading,
    error,
  };
}

/**
 * Hook to get feature definitions
 */
export function useFeatureDefinitions() {
  const { data, isLoading, error } = trpc.featureAccess.getFeatureDefinitions.useQuery(undefined, {
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  return {
    features: data ?? [],
    isLoading,
    error,
  };
}
