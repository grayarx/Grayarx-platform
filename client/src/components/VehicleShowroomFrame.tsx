import type { ReactNode } from "react";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import OptimizedImage from "@/components/OptimizedImage";
import { PLACEHOLDER_SVG } from "@shared/imagePipeline";

export interface VehicleShowroomFrameProps {
  src?: string | null;
  alt: string;
  /** Tailwind aspect ratio class, e.g. aspect-[16/10] */
  aspectClass?: string;
  className?: string;
  sizes?: string;
  staticAsset?: boolean;
  priority?: boolean;
  emptyLabel?: string;
  /** Badges, buttons, gradients layered on top */
  children?: ReactNode;
  /** Slight zoom on card hover (parent needs `group`) */
  hoverZoom?: boolean;
}

/**
 * Premium dark-studio frame for vehicle photos.
 * Any uploaded image is composited on a consistent showroom background
 * so listings look uniform — cutouts, DMS exports, and API renders alike.
 */
export default function VehicleShowroomFrame({
  src,
  alt,
  aspectClass = "aspect-[16/10]",
  className,
  sizes,
  staticAsset,
  priority,
  emptyLabel = "No photo yet",
  children,
  hoverZoom = true,
}: VehicleShowroomFrameProps) {
  const hasPhoto = Boolean(src?.trim());

  return (
    <div
      className={cn(
        "relative overflow-hidden vehicle-studio-bg",
        aspectClass,
        className,
      )}
    >
      {/* Ambient spotlight on studio floor */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_95%,rgba(212,175,55,0.14)_0%,transparent_58%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_55%_35%_at_50%_88%,rgba(255,255,255,0.07)_0%,transparent_50%)]"
        aria-hidden
      />
      {/* Floor horizon line */}
      <div className="vehicle-studio-floor" aria-hidden />

      {!hasPhoto ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/55 z-[1]">
          <Car className="h-10 w-10 mb-2 opacity-70" />
          <span className="text-xs">{emptyLabel}</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-end justify-center px-[5%] pt-[4%] pb-[9%] z-[1]">
          <OptimizedImage
            src={src!}
            alt={alt}
            sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            staticAsset={staticAsset}
            priority={priority}
            fit="contain"
            objectPosition="center bottom"
            className={cn(
              "h-full w-full max-h-full drop-shadow-[0_18px_36px_rgba(0,0,0,0.55)] img-premium",
              hoverZoom &&
                "transition-transform duration-700 ease-out group-hover:scale-[1.04]",
            )}
            fallbackSrc={PLACEHOLDER_SVG}
          />
        </div>
      )}

      {/* Edge vignette for depth */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-background/15 pointer-events-none z-[2]"
        aria-hidden
      />

      {children}
    </div>
  );
}
