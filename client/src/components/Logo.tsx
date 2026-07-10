import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

/** Original GrayArx emblem — served from /public (no crop/zoom inset). */
export const LOGO_URL = "/logo.svg";

export default function Logo({ size = 48, className }: LogoProps) {
  return (
    <img
      src={LOGO_URL}
      alt="GrayArx"
      width={size}
      height={size}
      className={cn("select-none object-contain shrink-0", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
