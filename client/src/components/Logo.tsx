import { cn } from "@/lib/utils";
import logoIconSrc from "@/assets/logo-icon.png";

interface LogoProps {
  size?: number;
  className?: string;
}

/** Circuit-board GA emblem — bundled PNG so nav is correct even if /logo-icon.png is SPA-routed */
export const LOGO_URL = logoIconSrc;

export default function Logo({ size = 48, className }: LogoProps) {
  const inset = Math.round(size * 0.18);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={LOGO_URL}
        alt="GrayArx"
        width={size - inset * 2}
        height={size - inset * 2}
        className="select-none object-contain"
        style={{ width: size - inset * 2, height: size - inset * 2 }}
        draggable={false}
      />
    </span>
  );
}
