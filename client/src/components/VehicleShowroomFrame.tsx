import { useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import OptimizedImage from "@/components/OptimizedImage";
import { PLACEHOLDER_SVG } from "@shared/imagePipeline";

export interface VehicleShowroomFrameProps {
  src?: string | string[] | null;
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
  /** Auto-rotate through gallery (default true when multiple images) */
  autoRotate?: boolean;
}

/**
 * Premium dark-studio frame for vehicle photos.
 * Only the active slide is mounted so grid cards do not download every angle.
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
  autoRotate = true,
}: VehicleShowroomFrameProps) {
  const images = useMemo(() => {
    if (Array.isArray(src)) {
      return src.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
    if (typeof src === "string" && src.trim()) return [src];
    return [];
  }, [src]);
  const hasPhoto = images.length > 0;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images.length, images[0]]);

  useEffect(() => {
    if (!autoRotate || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRotate, images.length]);

  const activeSrc = hasPhoto ? images[Math.min(currentIndex, images.length - 1)] : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden vehicle-studio-bg",
        aspectClass,
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_95%,rgba(212,175,55,0.14)_0%,transparent_58%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_55%_35%_at_50%_88%,rgba(255,255,255,0.07)_0%,transparent_50%)]"
        aria-hidden
      />
      <div className="vehicle-studio-floor" aria-hidden />

      {!hasPhoto || !activeSrc ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/55 z-[1]">
          <Car className="h-10 w-10 mb-2 opacity-70" />
          <span className="text-xs">{emptyLabel}</span>
        </div>
      ) : (
        <div className="absolute inset-0 z-[1]">
          <OptimizedImage
            key={activeSrc}
            src={activeSrc}
            alt={alt}
            sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            staticAsset={staticAsset}
            priority={priority}
            fit="cover"
            objectPosition="center"
            className={cn(
              "h-full w-full max-h-full img-premium animate-in fade-in duration-500",
              hoverZoom &&
                "transition-transform duration-700 ease-out group-hover:scale-[1.04]",
            )}
            fallbackSrc={PLACEHOLDER_SVG}
          />
        </div>
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-background/15 pointer-events-none z-[2]"
        aria-hidden
      />

      {children}
    </div>
  );
}
