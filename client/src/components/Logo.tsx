import { cn } from "@/lib/utils";
import logoIconSrc from "@/assets/logo-icon.png";

interface LogoProps {
  size?: number;
  className?: string;
}

/** Circuit-board GA emblem — bundled PNG so nav is correct even if /logo-icon.png is SPA-routed */
export const LOGO_URL = logoIconSrc;

export default function Logo({ size = 48, className }: LogoProps) {
  return (
    <img
      src={LOGO_URL}
      alt="GrayArx"
      width={size}
      height={size}
      className={cn("select-none rounded-[22%]", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
