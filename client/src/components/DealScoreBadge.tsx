import { Badge } from "@/components/ui/badge";
import { TrendingDown, Scale, TrendingUp, AlertTriangle } from "lucide-react";
import { DEAL_RATING_STYLES, type DealScore } from "@shared/priceIntelligence";
import { cn } from "@/lib/utils";

const ICONS = {
  great: TrendingDown,
  fair: Scale,
  above: TrendingUp,
  premium: AlertTriangle,
  unknown: Scale,
};

export default function DealScoreBadge({
  score,
  className,
  showDelta,
}: {
  score: DealScore | null;
  className?: string;
  showDelta?: boolean;
}) {
  if (!score) return null;
  const style = DEAL_RATING_STYLES[score.rating];
  const Icon = ICONS[score.rating];

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] gap-1 font-semibold", style.className, className)}
      title={style.description}
    >
      <Icon className="h-3 w-3" />
      {score.label}
      {showDelta && score.deltaZar > 0 && (
        <span className="opacity-80">· ~{score.deltaPct}% below guide</span>
      )}
    </Badge>
  );
}
