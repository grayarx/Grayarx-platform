import { Button } from "@/components/ui/button";
import { AlertTriangle, Scale } from "lucide-react";

interface POPIAReconfirmationBannerProps {
  onReconfirm: () => void;
  isLoading?: boolean;
  daysUntilExpiry?: number;
}

export function POPIAReconfirmationBanner({
  onReconfirm,
  isLoading = false,
  daysUntilExpiry,
}: POPIAReconfirmationBannerProps) {
  return (
    <div
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          <Scale className="h-4 w-4 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="flex items-center gap-2 font-display text-sm font-semibold text-amber-50">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden />
            POPIA consent needs re-confirmation
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-100/75">
            Your acknowledgment has expired. Re-confirm to keep operating GrayArx in line with
            POPIA.
            {daysUntilExpiry !== undefined && daysUntilExpiry < 0 ? (
              <span className="mt-1 block text-amber-200/90">
                Expired {Math.abs(daysUntilExpiry)} day
                {Math.abs(daysUntilExpiry) === 1 ? "" : "s"} ago.
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <Button
        type="button"
        onClick={onReconfirm}
        disabled={isLoading}
        className="btn-gold h-10 shrink-0 px-5 font-semibold uppercase tracking-wider text-xs"
      >
        {isLoading ? "Re-confirming…" : "Re-confirm now"}
      </Button>
    </div>
  );
}
