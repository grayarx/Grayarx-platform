import { cn } from "@/lib/utils";
import { LOGO_URL } from "./Logo";

interface LogoEmblemProps {
  size?: number;
  className?: string;
}

/** Official GrayArx circular crest — /logo-crest.png (from full lockup) */
export default function LogoEmblem({ size = 40, className }: LogoEmblemProps) {
  return (
    <img
      src={LOGO_URL}
      alt="GrayArx"
      width={size}
      height={size}
      className={cn("h-10 w-auto shrink-0 object-contain block select-none", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}
