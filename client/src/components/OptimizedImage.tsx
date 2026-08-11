import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  buildSrcSet,
  defaultSizes,
  optimizeImageUrl,
  PLACEHOLDER_SVG,
} from "@shared/imagePipeline";

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  src: string;
  alt: string;
  /** Responsive sizes attribute for srcset */
  sizes?: string;
  /** Skip srcset generation (local/static assets) */
  staticAsset?: boolean;
  /** LCP / hero — eager + high fetch priority */
  priority?: boolean;
  /** cover = fill crop; contain = fit inside frame (studio compositing) */
  fit?: "cover" | "contain";
  /** Aspect ratio wrapper e.g. "16/10" */
  aspect?: string;
  fallbackSrc?: string;
  objectPosition?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className,
  sizes,
  staticAsset,
  priority,
  fit = "cover",
  aspect,
  fallbackSrc = PLACEHOLDER_SVG,
  objectPosition = "center",
  loading,
  decoding,
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  /** 0 = try optimized, 1 = raw URL, 2 = placeholder */
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    setLoaded(false);
    setStage(0);
  }, [src]);

  const optimized = useMemo(
    () => (staticAsset ? src : optimizeImageUrl(src, 768, 82)),
    [src, staticAsset],
  );
  const srcSet = useMemo(
    () =>
      staticAsset || stage > 0
        ? undefined
        : buildSrcSet(src, undefined, 88) || undefined,
    [src, staticAsset, stage],
  );

  const displaySrc =
    stage === 2 ? fallbackSrc : stage === 1 ? src : optimized;

  const img = (
    <>
      {!loaded && stage < 2 && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/80 via-muted/40 to-muted/80"
          aria-hidden
        />
      )}
      <img
        {...rest}
        key={`${stage}:${displaySrc}`}
        src={displaySrc}
        srcSet={srcSet}
        sizes={srcSet ? (sizes ?? defaultSizes()) : undefined}
        alt={alt}
        loading={priority ? "eager" : loading ?? "lazy"}
        decoding={priority ? "sync" : decoding ?? "async"}
        fetchPriority={priority ? "high" : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (stage === 0 && optimized !== src) {
            setLoaded(false);
            setStage(1);
            return;
          }
          if (stage < 2) {
            setLoaded(true);
            setStage(2);
          }
        }}
        className={cn(
          "h-full w-full transition-opacity duration-500",
          fit === "contain" ? "object-contain" : "object-cover",
          loaded || stage === 2 ? "opacity-100" : "opacity-0",
          className,
        )}
        style={{ objectPosition, ...rest.style }}
      />
    </>
  );

  if (aspect) {
    return (
      <div className="relative overflow-hidden" style={{ aspectRatio: aspect }}>
        {img}
      </div>
    );
  }

  return <div className="relative h-full w-full overflow-hidden">{img}</div>;
}
