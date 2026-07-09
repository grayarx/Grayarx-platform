import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Compass,
  UserPlus,
  CheckSquare,
  Sparkles,
  Mailbox,
  Building2,
  Wallet,
  Bot,
  Receipt,
  HandCoins,
  ArrowRight,
  ShieldAlert,
  Palette,
  Activity,
  DollarSign,
  Mail,
  Megaphone,
} from "lucide-react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/ops", label: "Ops Live", icon: Activity, founderOnly: true },
  { href: "/admin/prospector", label: "Prospector", icon: Compass },
  { href: "/admin/onboarding", label: "Onboarding", icon: UserPlus },
  { href: "/admin/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/admin/kagiso-roadmap", label: "Kagiso Roadmap", icon: Sparkles, founderOnly: true },
  { href: "/admin/fallback", label: "Fallback Inbox", icon: Mailbox },
  { href: "/admin/preapprovals", label: "Pre-Approvals", icon: HandCoins },
  { href: "/admin/dealerships", label: "Dealerships", icon: Building2 },
  { href: "/admin/agents", label: "Agents", icon: Bot },
  { href: "/admin/invoices", label: "Invoices (Thandi)", icon: Receipt },
  { href: "/admin/brand-kit", label: "Brand Kit", icon: Palette },
  { href: "/admin/billing", label: "Billing", icon: Wallet, founderOnly: true },
  { href: "/admin/tax-dashboard", label: "Tax Dashboard", icon: DollarSign, founderOnly: true },
  { href: "/admin/email-preview", label: "Email Preview", icon: Mail, founderOnly: true },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone, founderOnly: true },
];

export default function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Logo size={64} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container max-w-lg text-center">
            <Logo size={96} className="mx-auto" />
            <h1 className="font-display text-3xl font-bold mt-8">
              Sign in to access the admin console
            </h1>
            <p className="text-muted-foreground mt-3">
              This area is for GrayArx founders and admins only.
            </p>
            <Button asChild className="btn-gold mt-8 h-12 px-6 font-semibold">
              <a href={getLoginUrl()}>
                Sign in <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Role guard: only founder + admin can see /admin/*
  const isAuthorized = user.role === "founder" || user.role === "admin";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container max-w-lg text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="font-display text-3xl font-bold">Access restricted</h1>
            <p className="text-muted-foreground mt-3">
              The admin console is reserved for GrayArx founders and admins. Your
              account ({user.role}) doesn&apos;t have permission to view this area.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/dashboard">Go to dealer dashboard</Link>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const isFounder = user.role === "founder";
  const visibleLinks = ADMIN_LINKS.filter(
    (l) => !l.founderOnly || isFounder,
  );

  // Sidebar badge — polls the count of Kagiso patches awaiting founder review.
  // Only founders see the Kagiso Roadmap entry, so the query is gated on role to
  // avoid an extra FORBIDDEN ping for admin-only users.
  const { data: patchCount } = trpc.adminKagiso.pendingPatchCount.useQuery(
    undefined,
    {
      enabled: isFounder,
      refetchInterval: 60 * 1000, // 1 minute
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000,
    },
  );
  const pendingPatches = patchCount?.count ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="pt-28 md:pt-32 pb-20">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold flex items-center gap-2">
                {isFounder ? "Founder Console" : "Admin Console"}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary border border-primary/20">
                  {user.role}
                </span>
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight mt-1">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          <div className="border-b border-primary/10 mb-8 overflow-x-auto">
            <nav className="flex gap-1 min-w-max">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const active =
                  location === link.href ||
                  (link.href !== "/admin" && location.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                    {link.href === "/admin/kagiso-roadmap" && pendingPatches > 0 && (
                      <span
                        aria-label={`${pendingPatches} Kagiso patches awaiting review`}
                        className={cn(
                          "ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5",
                          "rounded-full text-[10px] font-bold leading-none",
                          "bg-primary text-primary-foreground",
                          "shadow-[0_0_8px_rgba(212,175,55,0.45)]",
                          "animate-pulse",
                        )}
                      >
                        {pendingPatches > 99 ? "99+" : pendingPatches}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}
