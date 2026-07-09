import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, X, Zap, ArrowRight } from "lucide-react";
import { TableCellTooltip } from "./FeatureTooltip";
import { featureDescriptions } from "@/lib/featureDescriptions";
import { cn } from "@/lib/utils";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: "starter" | "professional" | "enterprise" | null;
  lockedFeature: {
    id: string;
    name: string;
    description: string;
    requiredTier: "starter" | "professional" | "enterprise";
  };
  onUpgrade: (tier: "starter" | "professional" | "enterprise") => Promise<void>;
}

/**
 * Interactive upgrade modal that shows when user tries to access a locked feature
 * Displays pricing tiers, feature comparisons, and upgrade options
 */
export function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  lockedFeature,
  onUpgrade,
}: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<"starter" | "professional" | "enterprise" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const tiers = [
    {
      id: "starter",
      name: "Starter",
      price: 3999,
      description: "Perfect for getting started",
      features: [
        "WhatsApp chatbot",
        "Email notifications",
        "Basic lead capture",
        "Dashboard",
      ],
      locked: [],
    },
    {
      id: "professional",
      name: "Professional",
      price: 7999,
      description: "For growing dealerships",
      features: [
        "Everything in Starter",
        "Advanced analytics",
        "Lead prioritization AI",
        "Inventory sync",
        "Webhook support",
        "Priority support",
      ],
      locked: ["API access", "Custom integrations"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 11999,
      description: "For large operations",
      features: [
        "Everything in Professional",
        "Full API access",
        "Custom webhooks",
        "CRM integration",
        "Phone support",
        "Dedicated account manager",
      ],
      locked: [],
    },
  ];

  const handleUpgrade = async () => {
    if (!selectedTier) return;

    try {
      setIsLoading(true);
      await onUpgrade(selectedTier);
      onClose();
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTierIndex = tiers.findIndex((t) => t.id === currentTier);
  const requiredTierIndex = tiers.findIndex((t) => t.id === lockedFeature.requiredTier);
  const canUpgrade = currentTierIndex < requiredTierIndex;

  // Feature list with keys for tooltip lookup
  const featureList = [
    { name: "WhatsApp Chatbot", key: "whatsapp_chatbot", tiers: ["starter", "professional", "enterprise"] },
    { name: "Email Notifications", key: "email_notifications", tiers: ["starter", "professional", "enterprise"] },
    { name: "Lead Capture", key: "lead_capture", tiers: ["starter", "professional", "enterprise"] },
    { name: "Lead Scoring", key: "lead_scoring", tiers: ["starter", "professional", "enterprise"] },
    { name: "Advanced Analytics", key: "advanced_analytics", tiers: ["professional", "enterprise"] },
    { name: "Lead Prioritization", key: "lead_prioritization", tiers: ["professional", "enterprise"] },
    { name: "Inventory Sync", key: "inventory_sync", tiers: ["professional", "enterprise"] },
    { name: "Webhook Support", key: "webhook_support", tiers: ["professional", "enterprise"] },
    { name: "Bulk Lead Import", key: "bulk_lead_import", tiers: ["professional", "enterprise"] },
    { name: "API Access", key: "api_access", tiers: ["enterprise"] },
    { name: "Custom Webhooks", key: "custom_webhooks", tiers: ["enterprise"] },
    { name: "CRM Integration", key: "crm_integration", tiers: ["enterprise"] },
    { name: "Phone Support", key: "phone_support", tiers: ["enterprise"] },
    { name: "Dedicated Account Manager", key: "dedicated_account_manager", tiers: ["enterprise"] },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Unlock {lockedFeature.name}
          </DialogTitle>
          <DialogDescription>
            {lockedFeature.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature Highlight */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">{lockedFeature.name}</h3>
                <p className="text-sm text-blue-800 mt-1">{lockedFeature.description}</p>
                <Badge className="mt-2 bg-blue-600">
                  Requires {lockedFeature.requiredTier} tier
                </Badge>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            </div>
          </Card>

          {/* Pricing Tiers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Choose Your Plan</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? "Hide" : "Show"} Comparison
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier) => {
                const isCurrentTier = tier.id === currentTier;
                const isRequiredTier = tier.id === lockedFeature.requiredTier;
                const isSelected = tier.id === selectedTier;
                const isBelowRequired = tiers.findIndex((t) => t.id === tier.id) < requiredTierIndex;

                return (
                  <Card
                    key={tier.id}
                    className={cn(
                      "p-6 cursor-pointer transition-all duration-200 relative",
                      isCurrentTier && "ring-2 ring-green-500 bg-green-50",
                      isRequiredTier && "ring-2 ring-blue-500 bg-blue-50",
                      isSelected && !isCurrentTier && "ring-2 ring-purple-500",
                      isBelowRequired && "opacity-60"
                    )}
                    onClick={() => !isCurrentTier && setSelectedTier(tier.id as any)}
                  >
                    {isCurrentTier && (
                      <Badge className="absolute top-3 right-3 bg-green-600">Current</Badge>
                    )}
                    {isRequiredTier && (
                      <Badge className="absolute top-3 right-3 bg-blue-600">Unlocks Feature</Badge>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-lg">{tier.name}</h4>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-3xl font-bold">
                          R {tier.price.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>

                      {!showComparison && (
                        <ul className="space-y-2">
                          {tier.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {tier.features.length > 3 && (
                            <li className="text-sm text-muted-foreground">
                              +{tier.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      )}

                      {!isCurrentTier && (
                        <Button
                          className="w-full mt-4"
                          variant={isSelected ? "default" : "outline"}
                          disabled={isBelowRequired}
                        >
                          {isBelowRequired ? "Below Required" : isSelected ? "Selected" : "Select"}
                        </Button>
                      )}
                      {isCurrentTier && (
                        <Button className="w-full mt-4" disabled>
                          Current Plan
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Feature Comparison Table */}
          {showComparison && (
            <Card className="p-6 overflow-x-auto">
              <h4 className="font-semibold mb-4">Feature Comparison</h4>
              <p className="text-xs text-muted-foreground mb-4">Hover over feature names or checkmarks for descriptions</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Feature</th>
                    {tiers.map((tier) => (
                      <th key={tier.id} className="text-center py-2 px-2">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureList.map((feature, idx) => {
                    const featureDesc = featureDescriptions[feature.key as keyof typeof featureDescriptions];
                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2 group">
                            <span>{feature.name}</span>
                            {featureDesc && (
                              <div className="text-blue-500 opacity-60 hover:opacity-100 transition-opacity cursor-help relative">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-50 bg-gray-900 text-white text-xs rounded py-2 px-3 max-w-xs whitespace-normal">
                                  <p className="font-semibold mb-1">{featureDesc.name}</p>
                                  <p>{featureDesc.description}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        {tiers.map((tier) => (
                          <td key={tier.id} className="text-center py-2 px-2">
                            {featureDesc ? (
                              <TableCellTooltip
                                featureName={feature.name}
                                description={featureDesc.description}
                                isAvailable={feature.tiers.includes(tier.id)}
                              />
                            ) : feature.tiers.includes(tier.id) ? (
                              <Check className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={!selectedTier || isLoading || selectedTier === currentTier}
              className="gap-2"
            >
              {isLoading ? "Processing..." : "Upgrade Now"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center">
            Your billing cycle will be adjusted accordingly. You'll have immediate access to all features in your new tier.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage upgrade modal state
 */
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<UpgradeModalProps["lockedFeature"] | null>(null);

  const openUpgradeModal = (feature: UpgradeModalProps["lockedFeature"]) => {
    setLockedFeature(feature);
    setIsOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsOpen(false);
    setLockedFeature(null);
  };

  return {
    isOpen,
    lockedFeature,
    openUpgradeModal,
    closeUpgradeModal,
  };
}
