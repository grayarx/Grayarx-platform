import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  glow?: boolean;
  className?: string;
}

export const LOGO_URL = "/logo.png";

export default function Logo({ size = 48, glow = false, className }: LogoProps) {
  return (
    <img
      src={LOGO_URL}
      alt="GrayArx"
      width={size}
      height={size}
      className={cn(
        "select-none",
        glow && "logo-glow",
        className,
      )}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
