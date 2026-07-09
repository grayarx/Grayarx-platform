import React from "react";
import { useFeatureAccess } from "../hooks/useFeatureAccess";
import { Card } from "./ui/card";
import { AlertCircle, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { useUpgradeModal } from "../contexts/UpgradeModalContext";

interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
  featureName?: string;
  featureDescription?: string;
  requiredTier?: "starter" | "professional" | "enterprise";
}

/**
 * Component to gate features based on subscription tier
 * Usage: <FeatureGate featureId="api_access">Your feature here</FeatureGate>
 */
export function FeatureGate({
  featureId,
  children,
  fallback,
  showUpgradeButton = true,
  featureName,
  featureDescription,
  requiredTier = "professional",
}: FeatureGateProps) {
  const { hasAccess, tier, reason, isLoading } = useFeatureAccess(featureId);
  const { openUpgradeModal } = useUpgradeModal();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-12 rounded" />;
  }

  if (!hasAccess) {
    const handleUpgradeClick = () => {
      openUpgradeModal({
        id: featureId,
        name: featureName || featureId.replace(/_/g, " ").toUpperCase(),
        description: featureDescription || reason || "Upgrade to access this feature",
        requiredTier,
      });
    };

    return (
      fallback || (
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Feature Locked</h3>
              <p className="text-sm text-amber-800 mt-1">{reason}</p>
              {tier && (
                <p className="text-xs text-amber-700 mt-2">
                  Current tier: <span className="font-medium capitalize">{tier}</span>
                </p>
              )}
              {showUpgradeButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-amber-300 text-amber-900 hover:bg-amber-100"
                  onClick={handleUpgradeClick}
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </Card>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Component to show upgrade prompt for locked features
 */
export function FeatureLockedPrompt({
  featureId,
  featureName,
  requiredTier = "professional",
}: {
  featureId: string;
  featureName: string;
  requiredTier?: "starter" | "professional" | "enterprise";
}) {
  const { hasAccess, tier } = useFeatureAccess(featureId);
  const { openUpgradeModal } = useUpgradeModal();

  if (hasAccess) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-900">
          {featureName} is not available on your {tier} plan
        </p>
        <Button
          variant="link"
          className="text-blue-600 p-0 h-auto mt-2"
          onClick={() =>
            openUpgradeModal({
              id: featureId,
              name: featureName,
              description: `Upgrade to ${requiredTier} to access ${featureName}`,
              requiredTier,
            })
          }
        >
          Upgrade to unlock →
        </Button>
      </div>
    </div>
  );
}

/**
 * Component to disable a button if feature is not accessible
 */
export function FeatureLockedButton({
  featureId,
  featureName,
  requiredTier = "professional",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  featureId: string;
  featureName?: string;
  requiredTier?: "starter" | "professional" | "enterprise";
}) {
  const { hasAccess, reason } = useFeatureAccess(featureId);
  const { openUpgradeModal } = useUpgradeModal();

  if (!hasAccess) {
    return (
      <Button
        title={reason}
        onClick={() =>
          openUpgradeModal({
            id: featureId,
            name: featureName || featureId.replace(/_/g, " "),
            description: reason || "Upgrade to access this feature",
            requiredTier,
          })
        }
        {...(props as any)}
      >
        {children} 🔒
      </Button>
    );
  }

  return <Button {...(props as any)}>{children}</Button>;
}
