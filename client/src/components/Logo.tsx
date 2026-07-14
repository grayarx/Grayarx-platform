import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  /**
   * `icon` — square GA emblem (favicons, compact slots)
   * `nav` — circular emblem crop + GRAYARX wordmark (header/footer)
   * `full` — full logo PNG (auth / onboarding)
   */
  variant?: "icon" | "nav" | "full";
}

/** Full circular crest (gold ring + GA + car) — not a tight letter crop */
export const LOGO_ICON_URL = "/logo-crest.png?v=12";
export const LOGO_NAV_URL = "/logo-crest.png?v=12";
export const LOGO_FULL_URL = "/grayarx-logo-full.png?v=12";
/** Legacy alias used by LogoEmblem and emailBranding */
export const LOGO_URL = LOGO_ICON_URL;

export default function Logo({ size = 40, className, variant = "icon" }: LogoProps) {
  if (variant === "full") {
    return (
      <img
        src={LOGO_FULL_URL}
        alt="GrayArx — AI Platform for Dealerships"
        className={cn("select-none object-contain shrink-0 mx-auto", className)}
        style={{ height: size, width: "auto", maxWidth: "min(100%, 280px)" }}
        height={size}
        draggable={false}
      />
    );
  }

  if (variant === "nav") {
    const px = Math.round(size);
    return (
      <div className={cn("flex items-center gap-3 select-none shrink-0", className)}>
        <img
          src={LOGO_NAV_URL}
          alt="GrayArx emblem"
          draggable={false}
          style={{ width: px, height: px, objectFit: "contain", flexShrink: 0 }}
        />
        <span
          className="font-display font-bold tracking-[0.14em] leading-none text-white select-none"
          style={{ fontSize: Math.round(px * 0.4) }}
        >
          GRAY<span className="text-primary">ARX</span>
        </span>
      </div>
    );
  }

  // icon — square emblem, full logo PNG
  return (
    <img
      src={LOGO_ICON_URL}
      alt="GrayArx"
      className={cn("select-none object-contain shrink-0", className)}
      style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
      width={size}
      height={size}
      draggable={false}
    />
  );
}
