import { useState, useMemo } from "react";
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
  const [failed, setFailed] = useState(false);

  const displaySrc = failed ? fallbackSrc : src;
  const optimized = useMemo(
    () => (staticAsset || failed ? displaySrc : optimizeImageUrl(displaySrc, 768, 82)),
    [displaySrc, staticAsset, failed],
  );
  const srcSet = useMemo(
    () => (staticAsset || failed ? undefined : buildSrcSet(displaySrc, undefined, 88) || undefined),
    [displaySrc, staticAsset, failed],
  );

  const img = (
    <>
      {!loaded && !failed && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/80 via-muted/40 to-muted/80"
          aria-hidden
        />
      )}
      <img
        {...rest}
        src={optimized}
        srcSet={srcSet}
        sizes={srcSet ? (sizes ?? defaultSizes()) : undefined}
        alt={alt}
        loading={priority ? "eager" : loading ?? "lazy"}
        decoding={priority ? "sync" : decoding ?? "async"}
        fetchPriority={priority ? "high" : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true);
        }}
        className={cn(
          "h-full w-full transition-opacity duration-500",
          fit === "contain" ? "object-contain" : "object-cover",
          loaded || failed ? "opacity-100" : "opacity-0",
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
