import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  /** `icon` = GA emblem for nav/favicon areas; `full` = complete logo with wordmark for auth pages */
  variant?: "icon" | "full";
}

export const LOGO_ICON_URL = "/grayarx-logo-emblem.png";
export const LOGO_FULL_URL = "/grayarx-logo-full.png";

export default function Logo({ size = 48, className, variant = "icon" }: LogoProps) {
  if (variant === "full") {
    return (
      <img
        src={LOGO_FULL_URL}
        alt="GrayArx — AI Platform for Dealerships"
        className={cn("select-none object-contain shrink-0 mx-auto", className)}
        style={{ height: size, width: "auto", maxWidth: "min(100%, 280px)" }}
        draggable={false}
      />
    );
  }

  return (
    <img
      src={LOGO_ICON_URL}
      alt="GrayArx"
      width={size}
      height={size}
      className={cn("select-none object-contain shrink-0", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
