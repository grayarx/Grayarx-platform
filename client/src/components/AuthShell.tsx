import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#060608] text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="orb-gold -top-32 -right-32 h-[28rem] w-[28rem]" />
        <div className="orb-cyan -bottom-32 -left-32 h-[24rem] w-[24rem]" />
        <div className="absolute inset-0 cyber-grid opacity-70" />
        <div className="absolute inset-0 gradient-mesh opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="font-tech inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        <div className="holo-card rounded-2xl md:rounded-3xl p-8 md:p-10 scan-line border border-primary/20">
          <div className="flex flex-col items-center mb-8">
            <Logo size={48} />
            <p className="font-tech text-[9px] uppercase tracking-[0.28em] text-primary/70 mt-4 mb-2">
              GrayArx
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-center">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs leading-relaxed">
              {subtitle}
            </p>
          </div>

          {children}

          {footer && (
            <div className="mt-8 pt-6 border-t border-primary/15 text-center">{footer}</div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-tech text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="status-dot scale-75" />
            Secure login
          </span>
          <span className="flex items-center gap-2">
            <span className="status-dot scale-75" />
            POPIA ready
          </span>
        </div>
      </div>
    </div>
  );
}
