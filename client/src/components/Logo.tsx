import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  /**
   * `icon` — square GA emblem (favicons, compact slots)
   * `nav` — emblem + GRAYARX wordmark (header/footer)
   * `full` — stacked logo + tagline (auth / onboarding)
   */
  variant?: "icon" | "nav" | "full";
}

export const LOGO_ICON_URL = "/grayarx-logo-emblem.png";
export const LOGO_ICON_2X_URL = "/icon-96x96.png";
export const LOGO_NAV_URL = "/grayarx-logo-nav.png";
export const LOGO_FULL_URL = "/grayarx-logo-full.png";

export default function Logo({ size = 40, className, variant = "icon" }: LogoProps) {
  if (variant === "full") {
    return (
      <img
        src={LOGO_FULL_URL}
        alt="GrayArx — AI Platform for Dealerships"
        className={cn("select-none object-contain shrink-0 mx-auto", className)}
        style={{ height: size, width: "auto", maxWidth: "min(100%, 200px)" }}
        width={Math.round(size * 0.85)}
        height={size}
        draggable={false}
      />
    );
  }

  if (variant === "nav") {
    return (
      <img
        src={LOGO_NAV_URL}
        alt="GrayArx"
        className={cn("select-none object-contain object-left shrink-0", className)}
        style={{ height: size, width: "auto", maxWidth: Math.round(size * 3.4) }}
        height={size}
        draggable={false}
      />
    );
  }

  const px = Math.round(size);
  return (
    <img
      src={LOGO_ICON_2X_URL}
      srcSet={`${LOGO_ICON_2X_URL} 1x, ${LOGO_ICON_URL} 2x`}
      alt="GrayArx"
      className={cn("select-none object-contain shrink-0", className)}
      style={{ width: px, height: px, maxWidth: px, maxHeight: px }}
      width={px}
      height={px}
      draggable={false}
    />
  );
}
