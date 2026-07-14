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
import { Check, X, Zap, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIER_ORDER,
  TIER_DISPLAY_NAMES,
  TIER_FEATURE_ROWS,
  TIER_LIMITS,
  TIER_MARKETING_BLURBS,
  formatPriceDisplay,
  PILOT_PRICING_HIDDEN,
  PILOT_PARTNER,
  type SubscriptionTierId,
} from "@shared/subscriptionTiers";
import { Link } from "wouter";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTierId | null;
  lockedFeature: {
    id: string;
    name: string;
    description: string;
    requiredTier: SubscriptionTierId;
  };
  onUpgrade: (tier: SubscriptionTierId) => Promise<void>;
}

const TIER_HIGHLIGHTS: Record<SubscriptionTierId, string[]> = {
  starter: [
    "150 vehicles · 3 users",
    "Web chat Nala — 400 AI sessions/mo",
    "Click-to-chat WhatsApp (no Cloud API bot)",
    "300 emails/mo · no SMS",
  ],
  professional: [
    "500 vehicles · 10 users",
    "1,200 AI sessions · 2,000 WhatsApp msgs/mo",
    "WhatsApp Nala Cloud API + deal scores",
    "1,500 emails/mo · SMS allowed",
  ],
  enterprise: [
    "Unlimited vehicles* · unlimited users",
    "3,500 AI sessions · 8,000 WhatsApp msgs/mo",
    "5,000 emails/mo · dedicated onboarding",
    "Phone + named contact",
  ],
};

/**
 * Upgrade modal — shows tier comparison. Prices hidden during pilot.
 */
export function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  lockedFeature,
  onUpgrade,
}: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const requiredTierIndex = TIER_ORDER.indexOf(lockedFeature.requiredTier);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0c] border-primary/20 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Zap className="w-5 h-5 text-primary" />
            Unlock {lockedFeature.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {lockedFeature.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {PILOT_PRICING_HIDDEN && (
            <Card className="p-4 border-primary/25 bg-primary/5 holo-card">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-primary">{PILOT_PARTNER.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pilot dealerships get <strong className="text-foreground">Growth</strong> features
                    while we polish WhatsApp and inventory. Pricing is tailored —{" "}
                    <Link href="/#lead-capture" className="text-primary hover:underline">
                      join the pilot
                    </Link>{" "}
                    to discuss terms.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 border-primary/20 bg-primary/[0.04]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{lockedFeature.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{lockedFeature.description}</p>
                <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
                  Requires {TIER_DISPLAY_NAMES[lockedFeature.requiredTier]}
                </Badge>
              </div>
              <ArrowRight className="w-5 h-5 text-primary mt-1 shrink-0" />
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">Choose your plan</h3>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/20"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? "Hide" : "Show"} comparison
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TIER_ORDER.map((tierId) => {
                const isCurrentTier = tierId === currentTier;
                const isRequiredTier = tierId === lockedFeature.requiredTier;
                const isSelected = tierId === selectedTier;
                const tierIdx = TIER_ORDER.indexOf(tierId);
                const isBelowRequired = tierIdx < requiredTierIndex;

                return (
                  <Card
                    key={tierId}
                    className={cn(
                      "p-6 cursor-pointer transition-all duration-200 relative holo-card border-primary/10",
                      isCurrentTier && "ring-2 ring-green-500/60 bg-green-500/5",
                      isRequiredTier && "ring-2 ring-primary/60 bg-primary/5",
                      isSelected && !isCurrentTier && "ring-2 ring-primary",
                      isBelowRequired && "opacity-60",
                    )}
                    onClick={() => !isCurrentTier && !isBelowRequired && setSelectedTier(tierId)}
                  >
                    {isCurrentTier && (
                      <Badge className="absolute top-3 right-3 bg-green-600/90">Current</Badge>
                    )}
                    {isRequiredTier && !isCurrentTier && (
                      <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                        Unlocks feature
                      </Badge>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-display font-bold text-lg">{TIER_DISPLAY_NAMES[tierId]}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{TIER_MARKETING_BLURBS[tierId]}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-cyber-gradient tabular-nums">
                          {formatPriceDisplay(tierId)}
                        </div>
                        {!PILOT_PRICING_HIDDEN && (
                          <p className="text-xs text-muted-foreground">/month</p>
                        )}
                      </div>

                      {!showComparison && (
                        <ul className="space-y-2">
                          {TIER_HIGHLIGHTS[tierId].map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {!isCurrentTier && (
                        <Button
                          className={cn("w-full mt-4", isSelected && "btn-gold")}
                          variant={isSelected ? "default" : "outline"}
                          disabled={isBelowRequired}
                        >
                          {isBelowRequired ? "Below required" : isSelected ? "Selected" : "Select"}
                        </Button>
                      )}
                      {isCurrentTier && (
                        <Button className="w-full mt-4" disabled variant="outline">
                          Current plan
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {showComparison && (
            <Card className="p-6 overflow-x-auto border-primary/10 bg-black/20">
              <h4 className="font-semibold mb-4">Feature comparison</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/10">
                    <th className="text-left py-2 px-2">Feature</th>
                    {TIER_ORDER.map((tierId) => (
                      <th key={tierId} className="text-center py-2 px-2 font-display">
                        {TIER_DISPLAY_NAMES[tierId]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIER_FEATURE_ROWS.map((feature) => (
                    <tr key={feature.key} className="border-b border-primary/5 hover:bg-primary/[0.03]">
                      <td className="py-2 px-2">{feature.label}</td>
                      {TIER_ORDER.map((tierId) => (
                        <td key={tierId} className="text-center py-2 px-2">
                          {feature.tiers.includes(tierId) ? (
                            <Check className="w-4 h-4 text-primary mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-primary/5">
                    <td className="py-2 px-2 font-medium">Vehicle cap</td>
                    {TIER_ORDER.map((tierId) => (
                      <td key={tierId} className="text-center py-2 px-2 text-xs text-muted-foreground">
                        {TIER_LIMITS[tierId].vehicles}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-primary/5">
                    <td className="py-2 px-2 font-medium">AI sessions / mo</td>
                    {TIER_ORDER.map((tierId) => (
                      <td key={tierId} className="text-center py-2 px-2 text-xs text-muted-foreground">
                        {TIER_LIMITS[tierId].aiSessions}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-primary/5">
                    <td className="py-2 px-2 font-medium">WhatsApp</td>
                    {TIER_ORDER.map((tierId) => (
                      <td key={tierId} className="text-center py-2 px-2 text-xs text-muted-foreground">
                        {TIER_LIMITS[tierId].whatsapp}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-primary/5">
                    <td className="py-2 px-2 font-medium">Emails / mo</td>
                    {TIER_ORDER.map((tierId) => (
                      <td key={tierId} className="text-center py-2 px-2 text-xs text-muted-foreground">
                        {TIER_LIMITS[tierId].emails}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Card>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-primary/10">
            <Button variant="outline" onClick={onClose} className="border-primary/20">
              Cancel
            </Button>
            {PILOT_PRICING_HIDDEN ? (
              <Button asChild className="btn-gold gap-2">
                <Link href="/#lead-capture">
                  Join pilot <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={!selectedTier || isLoading || selectedTier === currentTier}
                className="btn-gold gap-2"
              >
                {isLoading ? "Processing..." : "Upgrade now"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {PILOT_PRICING_HIDDEN
              ? "Pilot partners receive Growth features. Final tier pricing is confirmed before billing goes live."
              : "Your billing cycle will be adjusted accordingly. Immediate access to all features in your new tier."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
