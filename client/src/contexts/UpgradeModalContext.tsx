import React, { createContext, useContext, useState } from "react";
import { UpgradeModal } from "../components/UpgradeModal";
import { useSubscriptionDetails } from "../hooks/useFeatureAccess";
import { trpc } from "../lib/trpc";

interface LockedFeature {
  id: string;
  name: string;
  description: string;
  requiredTier: "starter" | "professional" | "enterprise";
}

interface UpgradeModalContextType {
  openUpgradeModal: (feature: LockedFeature) => void;
  closeUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(undefined);

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null);
  const { subscription } = useSubscriptionDetails();
  const upgradeMutation = trpc.featureAccess.updateSubscriptionTier.useMutation();

  const openUpgradeModal = (feature: LockedFeature) => {
    setLockedFeature(feature);
    setIsOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsOpen(false);
    setLockedFeature(null);
  };

  const handleUpgrade = async (tier: "starter" | "professional" | "enterprise") => {
    try {
      // Get dealership ID from user context or localStorage
      const dealershipId = localStorage.getItem('dealershipId') || '0';
      await upgradeMutation.mutateAsync({
        dealershipId: parseInt(dealershipId),
        tier,
      });
      closeUpgradeModal();
      // Trigger a refresh of subscription data
      window.location.reload();
    } catch (error) {
      console.error("Upgrade failed:", error);
      throw error;
    }
  };

  return (
    <UpgradeModalContext.Provider value={{ openUpgradeModal, closeUpgradeModal }}>
      {children}
      {lockedFeature && (
        <UpgradeModal
          isOpen={isOpen}
          onClose={closeUpgradeModal}
          currentTier={subscription?.tier as any}
          lockedFeature={lockedFeature}
          onUpgrade={handleUpgrade}
        />
      )}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (!context) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  }
  return context;
}
