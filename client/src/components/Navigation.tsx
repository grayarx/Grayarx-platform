import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Globe, ChevronDown, LogOut, LayoutDashboard, Users, Calendar, Car, User, Bot, Scale } from "lucide-react";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();
  const [location] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out");
      utils.auth.me.invalidate();
      window.location.href = "/";
    },
  });
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "GA";

  // Pricing is intentionally hidden from navigation during the pilot phase —
  // we want to learn what dealerships actually use and what they'd pay for
  // it before anchoring them to a number. The route itself still resolves
  // (redirects home) so no old link can leak the page.
  const isFounder = user?.role === "founder" || user?.role === "admin";

  const NAV_LINKS = [
    { href: "/", label: t("nav.home"), tip: "Platform overview and lead capture" },
    { href: "/showroom", label: t("nav.showroom"), tip: "Browse inventory — AI search and filters" },
    { href: "/compare", label: "Compare", tip: "Side-by-side comparison of up to 3 vehicles" },
    { href: "/trade-in", label: "Trade-In", tip: "Get an instant trade-in estimate from Tumi" },
    { href: "/finance", label: "Finance", tip: "Calculate monthly instalments on any vehicle" },
    { href: "/help", label: "Help", tip: "FAQs, contact options, and dealer console links" },
    { href: "/legal", label: "Legal", tip: "Terms, privacy, dealer agreement, and POPIA forms" },
    { href: "/dashboard", label: t("nav.dashboard"), tip: "Your dealer console — leads, bookings, inventory" },
  ];

  // On internal console routes (dealer/admin/dashboard) we MUST render the
  // header opaque from the first paint, otherwise the page title sits
  // visually behind the transparent nav until the user scrolls. See the
  // founder-reported overlap bug captured in todo.md (v26).
  const isConsoleRoute =
    location === "/dashboard" ||
    location.startsWith("/dealer/") ||
    location.startsWith("/admin");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-nav"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled || isConsoleRoute
          ? "glass border-b border-[rgba(212,175,55,0.15)] backdrop-blur-xl"
          : "bg-gradient-to-b from-black/60 to-transparent",
      )}
    >
      <div className="container flex h-16 md:h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="GrayArx home">
          <Logo size={36} variant="icon" className="transition-transform group-hover:scale-[1.02]" />
          <span className="hidden sm:block font-display text-[1.05rem] font-bold tracking-[0.18em] text-foreground group-hover:text-primary transition-colors">
            GRAYARX
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {NAV_LINKS.map((link) => (
            <Tooltip key={link.href}>
              <TooltipTrigger asChild>
                <Link
                  href={link.href}
                  className={cn(
                    "font-tech text-[11px] uppercase tracking-[0.12em] transition-colors hover:text-primary relative whitespace-nowrap",
                    location === link.href
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {link.label}
                  {location === link.href && (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-primary" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                {link.tip}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-primary"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs uppercase">{language}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className="cursor-pointer"
                >
                  <span className="uppercase text-xs mr-2 text-muted-foreground">
                    {lang.code}
                  </span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Account menu">
                  <Avatar className="h-9 w-9 border border-primary/30">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">{user.name || "Dealer"}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dealer/leads" className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2" /> Leads
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dealer/bookings" className="cursor-pointer">
                    <Calendar className="h-4 w-4 mr-2" /> Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dealer/inventory" className="cursor-pointer">
                    <Car className="h-4 w-4 mr-2" /> Inventory
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dealer/legal" className="cursor-pointer">
                    <Scale className="h-4 w-4 mr-2" /> Legal & compliance
                  </Link>
                </DropdownMenuItem>
                {isFounder && (
                  <DropdownMenuItem asChild>
                    <Link href="/dealer/agents" className="cursor-pointer">
                      <Bot className="h-4 w-4 mr-2" /> AI agents
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="cursor-pointer text-red-400 focus:text-red-300">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-primary">
                <Link href="/login"><User className="h-4 w-4 mr-1" /> Sign in</Link>
              </Button>
              <Button asChild className="btn-gold hidden sm:inline-flex font-semibold">
                <Link href="/#lead-capture">{t("cta.startTrial")}</Link>
              </Button>
            </>
          )}

          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden glass border-t border-[rgba(212,175,55,0.15)]">
          <div className="container py-4 flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                title={link.tip}
                className="py-3 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dealer/leads" onClick={() => setMobileOpen(false)} className="py-3 text-sm font-medium text-muted-foreground hover:text-primary">Leads</Link>
                <Link href="/dealer/bookings" onClick={() => setMobileOpen(false)} className="py-3 text-sm font-medium text-muted-foreground hover:text-primary">Bookings</Link>
                <Link href="/dealer/inventory" onClick={() => setMobileOpen(false)} className="py-3 text-sm font-medium text-muted-foreground hover:text-primary">Inventory</Link>
                <Button onClick={() => { setMobileOpen(false); logoutMutation.mutate(); }} variant="outline" className="mt-2 w-full">Sign out</Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="py-3 text-sm font-medium text-muted-foreground hover:text-primary">Sign in</Link>
                <Button asChild className="btn-gold mt-2 w-full font-semibold">
                  <Link href="/#lead-capture" onClick={() => setMobileOpen(false)}>
                    {t("cta.startTrial")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
