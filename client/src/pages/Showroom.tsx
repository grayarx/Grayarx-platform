import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Share2,
  Eye,
  TrendingUp,
  Fuel,
  Gauge,
  Calendar,
  Sparkles,
  Heart,
  Mail,
  MessageCircle,
  Banknote,
  GitCompare,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingPilotCTA from "@/components/FloatingPilotCTA";
import HomeFeaturedDeals from "@/components/HomeFeaturedDeals";
import { Link, useSearch } from "wouter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  buildShowroomQuery,
  parseShowroomQuery,
} from "@shared/showroomUrl";
import { SEO_PAGES } from "@shared/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShowroomEnquiryModal } from "@/components/ShowroomEnquiryModal";
import { ShowroomChatAgent } from "@/components/ShowroomChatAgent";
import { SkeletonLoader } from "@/components/LoadingAnimations";
import { formatVehiclePrice, isSuspiciousPrice } from "@/lib/formatPrice";
import DealScoreBadge from "@/components/DealScoreBadge";
import VehicleShowroomFrame from "@/components/VehicleShowroomFrame";
import { scoreListingDeal } from "@shared/priceIntelligence";
import { PLACEHOLDER_SVG } from "@shared/imagePipeline";

const DEV_SAMPLE_VEHICLES = import.meta.env.DEV
  ? [
  {
    id: "1",
    title: "BMW 3 Series 320i M Sport",
    year: 2023,
    price: 745000,
    km: 15400,
    fuel: "Petrol",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    leads: 14,
    views: 248,
    location: "Sandton",
    badge: "Hot",
  },
  {
    id: "2",
    title: "Mercedes-Benz C200 AMG Line",
    year: 2024,
    price: 925000,
    km: 4200,
    fuel: "Petrol",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    leads: 22,
    views: 411,
    location: "Pretoria",
    badge: "New Arrival",
  },
  {
    id: "3",
    title: "Toyota Hilux 2.8 GD-6 Legend",
    year: 2023,
    price: 685000,
    km: 32100,
    fuel: "Diesel",
    transmission: "Manual",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    leads: 9,
    views: 187,
    location: "Cape Town",
  },
  {
    id: "4",
    title: "Volkswagen Golf 8 GTI",
    year: 2024,
    price: 815000,
    km: 8900,
    fuel: "Petrol",
    transmission: "DSG",
    image: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=800&q=80",
    leads: 18,
    views: 332,
    location: "Johannesburg",
    badge: "Hot",
  },
  {
    id: "5",
    title: "Audi Q5 40 TDI Quattro",
    year: 2023,
    price: 895000,
    km: 21500,
    fuel: "Diesel",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    leads: 11,
    views: 209,
    location: "Durban",
  },
  {
    id: "6",
    title: "Ford Ranger Raptor 3.0 V6",
    year: 2024,
    price: 1245000,
    km: 6700,
    fuel: "Petrol",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=800&q=80",
    leads: 28,
    views: 524,
    location: "Sandton",
    badge: "Most Viewed",
  },
  {
    id: "7",
    title: "Chevrolet Corvette C8 Stingray",
    year: 2023,
    price: 1895000,
    km: 8200,
    fuel: "Petrol",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1611651338412-8403fa6e3599?w=800&q=80",
    make: "Chevrolet",
    model: "Corvette",
    bodyType: "Coupe",
    leads: 31,
    views: 612,
    location: "Johannesburg",
    badge: "Hot",
  },
]
  : [];

const PLACEHOLDER_IMAGE = PLACEHOLDER_SVG;

type ShowroomVehicle = {
  id: string;
  title: string;
  year: number;
  price: number;
  km: number;
  fuel: string;
  transmission: string;
  image: string;
  images?: string[];
  leads: number;
  views: number;
  location: string;
  badge?: string;
  make?: string;
  model?: string;
  bodyType?: string;
  description?: string;
  color?: string;
};

/** Map a DB row to the display shape used by cards and enquiry modal. */
function dbToShowroom(v: {
  id: number;
  title: string;
  year: number | null;
  price: string | number;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  primaryPhotoUrl: string | null;
  imageUrl: string | null;
  images?: string[];
  location: string | null;
  make: string | null;
  model: string | null;
  bodyType: string | null;
  description: string | null;
  color: string | null;
  leadCount?: number | null;
  views?: number | null;
}): ShowroomVehicle {
  return {
    id: String(v.id),
    title: v.title,
    year: v.year ?? 0,
    price: Number(v.price),
    km: v.km ?? 0,
    fuel: v.fuel ?? "—",
    transmission: v.transmission ?? "—",
    image: v.primaryPhotoUrl || v.imageUrl || "",
    images: v.images,
    leads: v.leadCount ?? 0,
    views: v.views ?? 0,
    location: v.location ?? "",
    make: v.make ?? undefined,
    model: v.model ?? undefined,
    bodyType: v.bodyType ?? undefined,
    description: v.description ?? undefined,
    color: v.color ?? undefined,
  };
}

/** Local keyword matcher — works even when the LLM API is unavailable. */
function matchesQuery(v: ShowroomVehicle, q: string): boolean {
  const fields = [v.title, v.make, v.model, v.fuel, v.transmission, v.bodyType, v.description, v.location]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((t) => fields.includes(t) || fields.split(/\s+/).some((w) => w.startsWith(t) || t.startsWith(w)));
}

/** Extract smart filters from natural-language AI queries. */
function parseAiFilters(query: string) {
  const q = query.toLowerCase();
  const filters: { maxPrice?: number; fuel?: string; bodyHint?: string; searchTerms: string[] } = {
    searchTerms: [],
  };
  // "under R800k", "below 500000", "budget R1.2m", "max R450 000"
  const priceMatch =
    q.match(/(?:under|below|max|budget|up\s*to)\s*r?\s*([\d,.]+)\s*(k|m)?/i) ||
    q.match(/\br\s*([\d,.]+)\s*(k|m)\b/i);
  if (priceMatch) {
    let n = Number(priceMatch[1].replace(/,/g, ""));
    const unit = (priceMatch[2] || "").toLowerCase();
    if (unit === "m") n *= 1_000_000;
    else if (unit === "k" || n < 1000) n *= 1000;
    if (Number.isFinite(n) && n > 0) filters.maxPrice = n;
  }
  if (/diesel/i.test(q)) filters.fuel = "Diesel";
  else if (/petrol|gasoline/i.test(q)) filters.fuel = "Petrol";
  else if (/electric|ev\b/i.test(q)) filters.fuel = "Electric";
  else if (/hybrid/i.test(q)) filters.fuel = "Hybrid";
  if (/\bsuvs?\b/i.test(q)) filters.bodyHint = "suv";
  else if (/bakkie|bakkies|pickup|truck/i.test(q)) filters.bodyHint = "bakkie";
  else if (/sedan|saloon/i.test(q)) filters.bodyHint = "sedan";
  else if (/hatch/i.test(q)) filters.bodyHint = "hatch";
  else if (/coupe|sport/i.test(q)) filters.bodyHint = "coupe";
  const makes = [
    "bmw", "mercedes", "toyota", "volkswagen", "vw", "ford", "audi", "hilux",
    "corvette", "porsche", "ferrari", "lamborghini", "mclaran", "mclaren",
    "nissan", "hyundai", "kia", "mazda", "honda", "land rover", "range rover",
  ];
  for (const m of makes) {
    if (q.includes(m)) filters.searchTerms.push(m === "vw" ? "volkswagen" : m === "mclaran" ? "mclaren" : m);
  }
  return filters;
}

export default function Showroom() {
  const urlSearch = useSearch();
  const parsedUrl = useMemo(() => parseShowroomQuery(urlSearch), [urlSearch]);
  const showroomScope = useMemo(
    () => ({
      dealershipId: parsedUrl.dealershipId,
      shortcode: parsedUrl.shortcode,
    }),
    [parsedUrl.dealershipId, parsedUrl.shortcode],
  );

  // Appearance + stock scoped by ?dealershipId= / ?shortcode= so dealer Settings
  // "Preview showroom" opens THAT yard's theme/accent — not a random primary dealer.
  const { data: appearance } = trpc.showroom.appearance.useQuery({
    dealershipId: showroomScope.dealershipId,
    shortcode: showroomScope.shortcode,
  });
  const scopedDealershipId =
    showroomScope.dealershipId ?? appearance?.dealershipId ?? undefined;
  const needsDealerScope = Boolean(
    showroomScope.dealershipId || showroomScope.shortcode,
  );
  const { data: contactOptions } = trpc.showroom.contactOptions.useQuery({
    dealershipId: scopedDealershipId,
    shortcode: showroomScope.shortcode,
  });

  const theme = appearance?.theme ?? "classic";
  const themeClass = useMemo(() => {
    switch (theme) {
      case "classic":
        return "showroom-theme-classic";
      case "minimal":
        return "showroom-theme-minimal";
      case "bold":
        return "showroom-theme-bold";
      default:
        return "showroom-theme-futuristic";
    }
  }, [theme]);

  const [search, setSearch] = useState(() => parsedUrl.search ?? "");
  const [aiQuery, setAiQuery] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiFilters, setAiFilters] = useState<ReturnType<typeof parseAiFilters> | null>(null);
  const [fuelFilter, setFuelFilter] = useState<string>(() => parsedUrl.fuel ?? "all");
  const [transmissionFilter, setTransmissionFilter] = useState<string>(
    () => parsedUrl.transmission ?? "all",
  );
  const [sortBy, setSortBy] = useState<"default" | "best_deals">(
    () => parsedUrl.sort ?? "default",
  );
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(
    () => parsedUrl.maxPrice ?? null,
  );
  const [pageOffset, setPageOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<ShowroomVehicle[]>([]);
  const syncingFromUrl = useRef(false);

  // External URL changes (shared WhatsApp links) → hydrate filters
  useEffect(() => {
    const next = parseShowroomQuery(urlSearch);
    syncingFromUrl.current = true;
    setSearch(next.search ?? "");
    setFuelFilter(next.fuel ?? "all");
    setTransmissionFilter(next.transmission ?? "all");
    setSortBy(next.sort ?? "default");
    setMaxPriceFilter(next.maxPrice ?? null);
    queueMicrotask(() => {
      syncingFromUrl.current = false;
    });
  }, [urlSearch]);

  // Filters → shareable URL (preserve yard scope)
  useEffect(() => {
    if (syncingFromUrl.current) return;
    if (typeof window === "undefined") return;
    const qs = buildShowroomQuery({
      dealershipId: showroomScope.dealershipId,
      shortcode: showroomScope.shortcode,
      search: search.trim() || undefined,
      fuel: fuelFilter,
      transmission: transmissionFilter,
      sort: sortBy,
      maxPrice: maxPriceFilter ?? undefined,
    });
    const next = qs ? `/showroom?${qs}` : "/showroom";
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [
    search,
    fuelFilter,
    transmissionFilter,
    sortBy,
    maxPriceFilter,
    showroomScope.dealershipId,
    showroomScope.shortcode,
  ]);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<ShowroomVehicle | null>(null);

  const serverSearch = useMemo(() => {
    const parts = [
      search.trim(),
      ...(aiFilters?.searchTerms ?? []),
    ].filter(Boolean);
    return parts.join(" ") || undefined;
  }, [search, aiFilters]);

  const listFilters = useMemo(
    () => ({
      dealershipId: scopedDealershipId,
      limit: 48 as const,
      offset: pageOffset,
      search: serverSearch,
      fuel: fuelFilter !== "all" ? fuelFilter : aiFilters?.fuel || undefined,
      transmission:
        transmissionFilter !== "all" ? transmissionFilter : undefined,
      bodyType: aiFilters?.bodyHint || undefined,
      maxPrice: maxPriceFilter ?? aiFilters?.maxPrice ?? undefined,
    }),
    [
      scopedDealershipId,
      pageOffset,
      serverSearch,
      fuelFilter,
      transmissionFilter,
      aiFilters,
      maxPriceFilter,
    ],
  );

  // Reset accumulated pages when filters change (not when loading more).
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        dealershipId: scopedDealershipId,
        search: serverSearch,
        fuel: listFilters.fuel,
        transmission: listFilters.transmission,
        bodyType: listFilters.bodyType,
        maxPrice: listFilters.maxPrice,
      }),
    [scopedDealershipId, serverSearch, listFilters.fuel, listFilters.transmission, listFilters.bodyType, listFilters.maxPrice],
  );

  useEffect(() => {
    setPageOffset(0);
    setAccumulated([]);
  }, [filterKey]);

  const {
    data: listPage,
    isLoading,
    isFetching,
  } = trpc.showroom.list.useQuery(listFilters, {
    enabled: !needsDealerScope || scopedDealershipId != null,
  });

  useEffect(() => {
    if (!listPage) return;
    const mapped = listPage.items
      .filter((v) => v.title?.trim())
      .map(dbToShowroom);
    setAccumulated((prev) => {
      if (pageOffset === 0) return mapped;
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...mapped.filter((m) => !seen.has(m.id))];
    });
  }, [listPage, pageOffset]);

  const fromDb = accumulated;
  const hasNextPage = Boolean(listPage?.hasMore);
  const isFetchingNextPage = isFetching && pageOffset > 0;

  const allVehicles: ShowroomVehicle[] = useMemo(() => {
    if (fromDb.length > 0) return fromDb;
    if (import.meta.env.DEV && !isLoading) {
      return DEV_SAMPLE_VEHICLES as ShowroomVehicle[];
    }
    return [];
  }, [fromDb, isLoading]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    fuelFilter !== "all" ||
    transmissionFilter !== "all" ||
    aiFilters !== null ||
    maxPriceFilter != null;

  const clearFilters = () => {
    setSearch("");
    setFuelFilter("all");
    setTransmissionFilter("all");
    setAiFilters(null);
    setAiResult(null);
    setAiQuery("");
    setMaxPriceFilter(null);
    setSortBy("default");
  };

  const filtered = useMemo(() => {
    let list = allVehicles;
    if (aiFilters?.searchTerms?.length) {
      list = list.filter((v) =>
        aiFilters.searchTerms.some((t) => matchesQuery(v, t)),
      );
    }
    if (sortBy === "best_deals") {
      return [...list].sort((a, b) => {
        const sa = scoreListingDeal(a.price, {
          make: a.make,
          model: a.model,
          year: a.year,
          mileageKm: a.km,
          title: a.title,
        });
        const sb = scoreListingDeal(b.price, {
          make: b.make,
          model: b.model,
          year: b.year,
          mileageKm: b.km,
          title: b.title,
        });
        return (sb?.deltaPct ?? 0) - (sa?.deltaPct ?? 0);
      });
    }
    return list;
  }, [allVehicles, aiFilters, sortBy]);

  const visibleVehicles = filtered;
  const fetchNextPage = () => {
    if (!listPage?.hasMore) return;
    setPageOffset(listPage.nextOffset);
  };

  const yardName = appearance?.dealershipName?.trim();
  useDocumentMeta({
    title: yardName
      ? `${yardName} showroom | GrayArx`
      : SEO_PAGES.showroom.title,
    description: yardName
      ? `Browse ${visibleVehicles.length || "available"} vehicles at ${yardName} on GrayArx — filters shareable for WhatsApp.`
      : SEO_PAGES.showroom.description,
    keywords: SEO_PAGES.showroom.keywords,
    canonicalPath: "/showroom",
    ogType: "website",
  });

  const aiSearch = trpc.showroom.aiSearch.useMutation({
    onSuccess: (data) => {
      const text = typeof data.summary === "string" ? data.summary : "Showing best matches.";
      setAiResult(text);
      setAiThinking(false);
    },
    onError: () => {
      setAiThinking(false);
    },
  });

  const handleAiSearch = () => {
    if (!aiQuery.trim()) return;
    setAiThinking(true);
    setAiResult(null);
    const parsed = parseAiFilters(aiQuery);
    setAiFilters(parsed);
    // Apply make keywords to the text bar; do NOT also force body type into search
    // (that double-filters and looks "broken" when stock has no SUVs).
    if (parsed.searchTerms.length) setSearch(parsed.searchTerms[0]);
    else setSearch("");
    aiSearch.mutate(
      { query: aiQuery },
      {
        onSettled: () => {
          setAiThinking(false);
          const matches = allVehicles.filter((v) => {
            const matchPrice = !parsed.maxPrice || v.price <= parsed.maxPrice;
            const matchFuel =
              !parsed.fuel || v.fuel.toLowerCase() === parsed.fuel.toLowerCase();
            const matchBody =
              !parsed.bodyHint ||
              (v.bodyType ?? v.title).toLowerCase().includes(parsed.bodyHint);
            const matchTerms =
              !parsed.searchTerms.length ||
              parsed.searchTerms.some((t) => matchesQuery(v, t));
            return matchPrice && matchFuel && matchBody && matchTerms;
          });
          const bits: string[] = [];
          if (parsed.bodyHint) bits.push(parsed.bodyHint.toUpperCase());
          if (parsed.maxPrice)
            bits.push(`under R${(parsed.maxPrice / 1000).toLocaleString("en-ZA")}k`);
          if (parsed.fuel) bits.push(parsed.fuel);
          const filterHint = bits.length ? ` (${bits.join(" · ")})` : "";
          if (matches.length === 0) {
            setAiResult(
              `No matches for "${aiQuery}"${filterHint} in current stock. Clear AI search or try a different budget / body type.`,
            );
          } else {
            setAiResult(
              `Found ${matches.length} vehicle${matches.length === 1 ? "" : "s"}${filterHint}: ${matches
                .slice(0, 2)
                .map((v) => v.title)
                .join(", ")}${matches.length > 2 ? " and more" : ""}.`,
            );
          }
          // Scroll results into view so the filter change is obvious.
          requestAnimationFrame(() => {
            document.getElementById("showroom-results")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        },
      },
    );
  };

  const enquire = trpc.showroom.enquire.useMutation({
    onSuccess: (data) => {
      toast.success("Enquiry sent!", {
        description: data.message || "The dealership will contact you soon.",
      });
    },
    onError: (error) => {
      toast.error("Failed to send enquiry", {
        description: error.message || "Please try again.",
      });
    },
  });

  const handleEnquire = (vehicle: ShowroomVehicle) => {
    setSelectedVehicle(vehicle);
    setEnquiryOpen(true);
  };

  const handleOpenChat = (vehicle: ShowroomVehicle) => {
    setSelectedVehicle(vehicle);
    setChatOpen(true);
  };

  const handleShare = (vehicle: ShowroomVehicle) => {
    const text = `${vehicle.title} — ${formatVehiclePrice(vehicle.price)} · ${vehicle.year} · ${vehicle.km.toLocaleString()} km · grayarx.com/showroom/${vehicle.id}`;
    const copySuccess = () => {
      toast.success("Link copied", {
        description: "Share with your customer via WhatsApp or email.",
      });
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(copySuccess).catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copySuccess();
      });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      copySuccess();
    }
  };

  return (
    <div
      className={cn("min-h-screen bg-background text-foreground", themeClass)}
      data-showroom-theme={theme}
      style={
        appearance?.accentColor
          ? ({ ["--dealer-accent" as string]: appearance.accentColor } as React.CSSProperties)
          : undefined
      }
    >
      <Navigation />

      <section className="pt-32 pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-primary/20 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Premium Showroom
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              Curated <span className="text-gold-gradient">Inventory</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Photography-first listings with live deal scores — every vehicle presented like a luxury showroom.
            </p>
          </motion.div>
        </div>
      </section>

      {/* AI Search Bar */}
      <section className="py-8 border-y border-[rgba(212,175,55,0.1)] glass">
        <div className="container">
          <div className="glass-gold rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                AI-Powered Search
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                placeholder='Ask anything: "Family SUV under R800k with low km"'
                className="h-12 bg-background/40 border-primary/20 text-base"
              />
              <Button
                onClick={handleAiSearch}
                disabled={aiThinking}
                className="btn-gold h-12 px-8 font-semibold"
              >
                {aiThinking ? "Thinking..." : "Search with AI"}
              </Button>
            </div>
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-lg bg-background/40 border border-primary/20 text-sm text-muted-foreground"
              >
                {aiResult}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Top deals — same vehicles Nala highlights in WhatsApp */}
      <HomeFeaturedDeals />

      {/* Filters */}
      <section className="py-6 border-b border-[rgba(212,175,55,0.1)]">
        <div className="container flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground absolute ml-3 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters:
            </div>
            <Select value={fuelFilter} onValueChange={setFuelFilter}>
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue placeholder="Fuel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel</SelectItem>
                <SelectItem value="Petrol">Petrol</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
              </SelectContent>
            </Select>
            <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trans.</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Automatic">Automatic</SelectItem>
                <SelectItem value="DSG">DSG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="best_deals">Best deals first</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline" className="h-9 text-xs">
              <Link href="/compare">
                <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                Compare
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Inventory Grid */}
      <section className="py-12">
        <div className="container">
          <div
            id="showroom-results"
            className="text-sm text-muted-foreground mb-6 flex flex-wrap items-center gap-3 scroll-mt-28"
          >
            <span>
              Showing <span className="text-foreground font-semibold">{filtered.length}</span> vehicles
            </span>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <SkeletonLoader count={6} type="card" className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-2xl border border-primary/15 bg-card/40">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                {fromDb.length === 0 && !import.meta.env.DEV ? (
                  <Sparkles className="h-8 w-8 text-primary" />
                ) : (
                  <Search className="h-8 w-8 text-primary" />
                )}
              </div>
              <p className="text-xl font-display font-bold mb-2">
                {fromDb.length === 0 && !import.meta.env.DEV
                  ? "Fresh stock landing soon"
                  : "No vehicles match your search"}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {fromDb.length === 0 && !import.meta.env.DEV
                  ? "New premium vehicles are being added right now. Check back shortly, or reach out and we’ll help you find the right car."
                  : "Try different keywords or clear your filters — we may also have similar stock arriving soon."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Show all vehicles
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/">Back to home</Link>
                </Button>
              )}
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleVehicles.map((v, i) => {
              const dealScore = !isSuspiciousPrice(v.price)
                ? scoreListingDeal(v.price, {
                    make: v.make,
                    model: v.model,
                    year: v.year,
                    mileageKm: v.km,
                    title: v.title,
                  })
                : null;
              const cardPhoto =
                (v.image && v.image !== PLACEHOLDER_IMAGE ? v.image : null) ||
                v.images?.[0] ||
                null;
              const animateCard = visibleVehicles.length <= 36;
              return (
              <motion.div
                key={v.id}
                initial={animateCard ? { opacity: 0, y: 20 } : false}
                animate={animateCard ? { opacity: 1, y: 0 } : undefined}
                transition={
                  animateCard
                    ? { duration: 0.35, delay: Math.min(i * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }
                    : undefined
                }
                className="card-premium vehicle-card glass rounded-2xl overflow-hidden group flex flex-col"
                style={{ contentVisibility: "auto", containIntrinsicSize: "420px" }}
              >
                <div className="relative">
                  <VehicleShowroomFrame
                    src={cardPhoto}
                    alt={v.title}
                    className="rounded-t-2xl"
                    autoRotate={false}
                    priority={i < 3}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none z-[3]" />
                  {v.badge && (
                    <Badge className="absolute top-3 left-3 btn-gold text-xs font-bold border-0 z-[4]">
                      {v.badge}
                    </Badge>
                  )}
                  {dealScore && (
                    <div className="absolute top-3 left-3 z-[4] flex flex-col gap-1">
                      {!v.badge && <DealScoreBadge score={dealScore} />}
                      {v.badge && (
                        <DealScoreBadge score={dealScore} className="mt-10" />
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 z-[4]">
                    {contactOptions?.whatsappChatbotEnabled && contactOptions.whatsappPhoneNumber && (
                      <a
                        href={`https://wa.me/${contactOptions.whatsappPhoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in the ${v.title} (${formatVehiclePrice(v.price)}) at ${contactOptions.dealershipName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-full bg-[#25D366]/90 backdrop-blur-sm flex items-center justify-center hover:bg-[#25D366] hover:scale-105 transition-all shadow-lg"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4 text-white fill-white" />
                      </a>
                    )}
                    {(contactOptions?.webChatbotEnabled !== false) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenChat(v);
                        }}
                        className="w-9 h-9 rounded-full glass-gold backdrop-blur-sm flex items-center justify-center hover:bg-primary/30 hover:scale-105 transition-all shadow-lg ring-1 ring-primary/30"
                        title="Chat with Nala about this car"
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </button>
                    )}
                  </div>
                  <button className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-colors z-[4]">
                    <Heart className="h-4 w-4 text-primary" />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-display text-lg font-bold leading-tight">
                      {v.title}
                    </h3>
                  </div>

                  <div className="text-2xl font-display font-bold text-gold-gradient mb-2">
                    {formatVehiclePrice(v.price)}
                  </div>
                  {dealScore && (
                    <div className="mb-3">
                      <DealScoreBadge score={dealScore} showDelta />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      {v.year}
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-primary" />
                      {(v.km / 1000).toFixed(0)}k km
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="h-3 w-3 text-primary" />
                      {v.fuel}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,175,55,0.1)]">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        {v.leads} leads
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-primary" />
                        {v.views} views
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/showroom/${v.id}`}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                      <Link
                        href={`/compare?ids=${v.id}`}
                        className="inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        title="Add to compare"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenChat(v)}
                        className="h-8 text-primary hover:bg-primary/10"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Chat
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShare(v)}
                        className="h-8 text-primary hover:bg-primary/10"
                      >
                        <Share2 className="h-3.5 w-3.5 mr-1" />
                        Share
                      </Button>
                      {!isSuspiciousPrice(v.price) && (
                        <Link
                          href={`/finance?price=${Math.round(Number(v.price))}`}
                          className="inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                          title="Estimate monthly instalment"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
            })}
          </div>
          {hasNextPage ? (
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {visibleVehicles.length} vehicles
                {hasActiveFilters ? " matching your filters" : ""}
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-w-[200px]"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? "Loading…" : "Load more vehicles"}
              </Button>
            </div>
          ) : visibleVehicles.length > 48 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Showing all {visibleVehicles.length} vehicles
            </p>
          ) : null}
          </>
          )}
        </div>
      </section>

      <FloatingPilotCTA />
      <Footer />

      <ShowroomChatAgent
        vehicle={selectedVehicle}
        open={chatOpen}
        onOpenChange={setChatOpen}
        dealershipName={contactOptions?.dealershipName ?? "GrayArx Dealership"}
        shortcode={contactOptions?.shortcode}
      />

      {selectedVehicle && (
        <ShowroomEnquiryModal
          open={enquiryOpen}
          onOpenChange={setEnquiryOpen}
          vehicle={selectedVehicle}
          dealershipEmail="hello@grayarx.com"
          dealershipName={contactOptions?.dealershipName ?? "GrayArx Dealership"}
        />
      )}
    </div>
  );
}
