import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, GitCompare, ArrowRight, Plus, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VehicleComparePicker from "@/components/VehicleComparePicker";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { scoreListingDeal } from "@shared/priceIntelligence";
import DealScoreBadge from "@/components/DealScoreBadge";

/**
 * Buyer-facing comparison tool — up to three vehicles side-by-side.
 *
 * Persists the selected vehicle IDs in `?ids=1,2,3` so the URL itself is
 * shareable. We keep the entire comparison client-side (no extra mutation):
 * a single `showroom.list` query gives us all inventory, and we filter that
 * to whatever IDs are in the URL.
 */
export default function Compare() {
  const [location, setLocation] = useLocation();
  const { data: vehicles } = trpc.showroom.list.useQuery();

  // Parse comma-separated ids from search string.
  const initialIds = useMemo(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    const raw = params.get("ids") ?? "";
    return raw
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .slice(0, 3);
  }, []);

  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const [globalSearch, setGlobalSearch] = useState("");

  const addVehicle = (id: number) => {
    setSelectedIds((ids) => Array.from(new Set([...ids, id])).slice(0, 3));
    setGlobalSearch("");
  };

  // Sync URL ⇆ state.
  useEffect(() => {
    const qs = selectedIds.length > 0 ? `?ids=${selectedIds.join(",")}` : "";
    const target = `/compare${qs}`;
    if (location !== target) setLocation(target, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  const selected = useMemo(() => {
    if (!vehicles) return [];
    return selectedIds
      .map((id) => vehicles.find((v) => v.id === id))
      .filter(Boolean) as NonNullable<typeof vehicles>[number][];
  }, [vehicles, selectedIds]);

  const addable = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter((v) => !selectedIds.includes(v.id));
  }, [vehicles, selectedIds]);

  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    return addable
      .filter((v) => {
        const hay = [v.title, v.make, v.model, v.year, v.fuel, v.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 8);
  }, [addable, globalSearch]);

  const emptySlots = Math.max(0, 3 - selectedIds.length);

  const rows: Array<{
    label: string;
    pick: (v: NonNullable<typeof vehicles>[number]) => string | number | null | undefined;
    fmt?: (val: any) => string;
  }> = [
    { label: "Price", pick: (v) => v.price, fmt: (n: number) => formatVehiclePrice(n) },
    {
      label: "Deal score",
      pick: (v) =>
        scoreListingDeal(Number(v.price), {
          make: v.make,
          model: v.model,
          year: v.year,
          mileageKm: v.km,
          title: v.title,
        })?.label ?? "—",
    },
    { label: "Year", pick: (v) => v.year },
    { label: "Mileage", pick: (v) => v.km, fmt: (n: number) => (n ? `${Number(n).toLocaleString("en-ZA")} km` : "—") },
    { label: "Fuel", pick: (v) => v.fuel },
    { label: "Transmission", pick: (v) => v.transmission },
    { label: "Body", pick: (v) => (v as any).bodyType ?? "—" },
    { label: "Location", pick: (v) => v.location },

  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="container py-12 md:py-16 max-w-7xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-gold border border-primary/30 mb-4">
            <GitCompare className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Compare up to 3 vehicles
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Side-by-side comparison
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick vehicles to compare. Search by make, model, or year — the link in your address bar is shareable.
          </p>
        </div>

        {emptySlots > 0 && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search stock to add — e.g. Ford, Mustang, 2022…"
                className="pl-10 h-11 bg-background/60 border-primary/20"
              />
            </div>
            {globalSearch.trim() && (
              <div className="mt-2 rounded-xl border border-primary/15 bg-card/50 overflow-hidden">
                {globalSearchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No vehicles match &ldquo;{globalSearch}&rdquo;
                  </p>
                ) : (
                  globalSearchResults.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => addVehicle(v.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{v.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {[v.make, v.model].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <span className="text-sm text-primary shrink-0">{formatVehiclePrice(v.price)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((slot) => {
            const v = selected[slot];
            if (v) {
              return (
                <Card key={slot} className="card-premium relative">
                  <button
                    onClick={() =>
                      setSelectedIds((ids) => ids.filter((id) => id !== v.id))
                    }
                    className="absolute top-2 right-2 p-1 rounded-full bg-card hover:bg-muted transition-colors"
                    aria-label={`Remove ${v.title}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <CardContent className="p-5">
                    {(v as any).imageUrl && (
                      <img
                        src={(v as any).imageUrl}
                        alt={v.title}
                        className="w-full h-32 object-cover object-center rounded-md mb-3 img-premium"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                    )}
                    <div className="font-display text-lg font-semibold truncate">{v.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {v.make} · {v.model}
                    </div>
                    {(() => {
                      const ds = scoreListingDeal(Number(v.price), {
                        make: v.make,
                        model: v.model,
                        year: v.year,
                        mileageKm: v.km,
                        title: v.title,
                      });
                      return ds ? (
                        <div className="mt-2">
                          <DealScoreBadge score={ds} showDelta />
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              );
            }
            return (
              <Card key={slot} className="border-dashed border-primary/30 bg-muted/20">
                <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[160px] gap-3 w-full">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <VehicleComparePicker
                    vehicles={addable}
                    onSelect={addVehicle}
                    placeholder="Search & add a vehicle…"
                    className="w-full"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selected.length >= 2 && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Spec
                    </th>
                    {selected.map((v) => (
                      <th key={v.id} className="text-left p-4 font-semibold">
                        {v.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <td className="p-4 text-muted-foreground font-medium">{row.label}</td>
                      {selected.map((v) => {
                        const raw = row.pick(v);
                        const display = row.fmt ? row.fmt(raw) : String(raw ?? "—");
                        return (
                          <td key={v.id} className="p-4 font-mono">
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {selected.length === 0 && (
          <div className="text-center py-8">
            <Badge variant="outline">Add at least 2 vehicles to start comparing</Badge>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/showroom">Browse showroom</Link>
          </Button>
          {selected.length > 0 && (
            <Button asChild className="btn-gold">
              <Link href="/apply/grayarx">
                Apply for finance pre-approval
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
