import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureTooltipProps {
  featureName: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

/**
 * Tooltip component for displaying feature descriptions
 * Used in feature comparison tables and feature gates
 */
export function FeatureTooltip({
  featureName,
  description,
  children,
  className,
  side = "top",
  delayDuration = 200,
}: FeatureTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {children || (
              <>
                <span>{featureName}</span>
                <Info className="w-4 h-4 text-blue-500 opacity-60 hover:opacity-100 transition-opacity" />
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{featureName}</p>
            <p className="text-xs text-gray-200">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Icon-only tooltip for compact displays
 */
export function FeatureTooltipIcon({
  description,
  className,
  side = "top",
}: Omit<FeatureTooltipProps, "featureName" | "children"> & { description: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={cn("w-4 h-4 text-blue-500 cursor-help", className)} />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-xs">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline tooltip for table cells
 */
export function TableCellTooltip({
  featureName,
  description,
  isAvailable,
}: {
  featureName: string;
  description: string;
  isAvailable: boolean;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center cursor-help">
            {isAvailable ? (
              <div className="flex items-center gap-1">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-gray-300">✗</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{featureName}</p>
            <p className="text-xs text-gray-200">{description}</p>
            <p className="text-xs text-gray-400 mt-2">
              {isAvailable ? "✓ Available in this tier" : "✗ Not available in this tier"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
