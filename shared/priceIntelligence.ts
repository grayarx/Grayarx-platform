import { scoreListingDeal, type DealScore } from "@shared/saMarketGuides";

export type { DealScore };
export { scoreListingDeal, estimateRetailMarketMid, calcUpgradeGap } from "@shared/saMarketGuides";

export const DEAL_RATING_STYLES: Record<
  DealScore["rating"],
  { className: string; description: string }
> = {
  great: {
    className: "bg-green-500/15 text-green-300 border-green-500/35",
    description: "Priced below our SA market guide",
  },
  fair: {
    className: "bg-primary/15 text-primary border-primary/35",
    description: "In line with typical asking prices",
  },
  above: {
    className: "bg-amber-500/15 text-amber-300 border-amber-500/35",
    description: "Above typical market — negotiate or compare",
  },
  premium: {
    className: "bg-red-500/15 text-red-300 border-red-500/35",
    description: "Well above market — shop around",
  },
  unknown: {
    className: "bg-muted text-muted-foreground border-border",
    description: "Insufficient data for a guide price",
  },
  speciality: {
    className: "bg-purple-500/15 text-purple-300 border-purple-500/35",
    description: "Speciality or exotic vehicle — standard market guides do not apply",
  },
};
