import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Camera,
  LayoutDashboard,
  Users,
  Calendar,
  Car,
  Bot,
  Network,
  Upload,
  ArrowRight,
  Settings2,
  Store,
  Handshake,
  Scale,
} from "lucide-react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { PhotoGuideHint, PhotoGuideRestoreLink } from "@/components/PhotoGuide";
import DashboardChatAgent from "@/components/DashboardChatAgent";

const PHOTO_HINT_ROUTES = [
  "/dealer/inventory",
  "/dealer/inventory/import",
  "/dealer/csv-photo",
];

// Dealer-facing sidebar — minimal by design.
// Prospector, Improvements, Inventory Import, all-dealership lists live under /admin
// and are NOT visible to dealer_owner / dealer_consultant roles.
// Agents command centre (/dealer/agents) is founder/admin only — hidden from dealer nav.
const DEALER_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, tip: "KPIs, recent activity, quick actions" },
  { href: "/dealer/agents", label: "Agents", icon: Bot, tip: "AI teammates and shared activity feed" },
  { href: "/dealer/leads", label: "Leads", icon: Users, tip: "Inbound enquiries from web, email, WhatsApp" },
  { href: "/dealer/bookings", label: "Bookings", icon: Calendar, tip: "Test drives (Lerato) and platform demos" },
  { href: "/dealer/inventory", label: "Inventory", icon: Car, tip: "Add, edit, and publish vehicles" },
  { href: "/dealer/trade-ins", label: "Trade-In Network", icon: Handshake, tip: "Seller listings — invite for inspection" },
  { href: "/dealer/inventory/import", label: "CSV Import", icon: Upload, tip: "Bulk import stock — feeds showroom + chatbots" },
  { href: "/dealer/csv-photo", label: "Photos", icon: Camera, tip: "8-angle uploads, save AutoTrader images, photo health" },
  { href: "/dealer/settings", label: "Settings", icon: Settings2, tip: "Showroom icons, WhatsApp, branding" },
  { href: "/dealer/legal", label: "Legal", icon: Scale, tip: "Policies, dealer agreement, POPIA forms" },
  { href: "/showroom", label: "Showroom", icon: Store, tip: "Your public stock page — what buyers see" },
  { href: "/dealer/network", label: "Dealer Network", icon: Network, tip: "Partner dealerships and referrals" },
];

export default function DealerShell({
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
  const isFounder = user?.role === "founder" || user?.role === "admin";
  const dealerLinks = DEALER_LINKS.filter(
    (l) => l.href !== "/dealer/agents" || isFounder,
  );

  const showPhotoHint = PHOTO_HINT_ROUTES.some(
    (r) => location === r || location.startsWith(`${r}/`),
  );

  const [authSlow, setAuthSlow] = useState(false);
  useEffect(() => {
    if (!loading) {
      setAuthSlow(false);
      return;
    }
    const id = window.setTimeout(() => setAuthSlow(true), 12_000);
    return () => window.clearTimeout(id);
  }, [loading]);

  if (loading && !authSlow) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="flex flex-col items-center justify-center gap-3 pt-36">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container max-w-lg text-center">
            <Logo variant="full" size={72} className="mx-auto" />
            <h1 className="font-display text-3xl font-bold mt-8">
              Sign in to access the dealer console
            </h1>
            <p className="text-muted-foreground mt-3">
              This page is for authenticated dealerships. Sign in with your GrayArx
              account to manage leads, bookings, and inventory.
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="pt-28 md:pt-32 pb-20">
        <div className="container">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
                Dealer Console
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight mt-1">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                {actions}
              </div>
            )}
          </div>

          {/* Tabs (sticky on scroll for quick navigation) */}
          <div className="sticky top-20 z-20 -mx-2 px-2 mb-8 bg-background/85 backdrop-blur-md border-b border-primary/10 overflow-x-auto">
            <nav className="flex gap-1 min-w-max">
              {dealerLinks.map((link) => {
                const Icon = link.icon;
                const active = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.tip}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {showPhotoHint && <PhotoGuideHint />}

          {children}

          <div className="mt-10 pt-4 border-t border-primary/5 flex justify-end">
            <PhotoGuideRestoreLink />
          </div>
        </div>
      </div>

      <Footer />
      <DashboardChatAgent />
    </div>
  );
}
