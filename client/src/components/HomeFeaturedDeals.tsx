import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { scoreListingDeal } from "@shared/priceIntelligence";
import DealScoreBadge from "@/components/DealScoreBadge";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/OptimizedImage";
import { ArrowRight, ArrowUpRight, Gauge, Calendar } from "lucide-react";
import { vehiclePrimaryUrl, PLACEHOLDER_SVG } from "@shared/imagePipeline";

function formatKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  return `${Math.round(km).toLocaleString("en-ZA")} km`;
}

export default function HomeFeaturedDeals() {
  const { data: vehicles } = trpc.showroom.list.useQuery();

  const topDeals = (vehicles ?? [])
    .filter((v) => v.status === "available" && v.price && Number(v.price) > 1)
    .map((v) => ({
      v,
      score: scoreListingDeal(Number(v.price), {
        make: v.make,
        model: v.model,
        year: v.year,
        mileageKm: v.km,
        title: v.title,
      }),
    }))
    .filter((x) => x.score && x.score.rating === "great" && vehiclePrimaryUrl(x.v))
    .sort((a, b) => (b.score?.deltaPct ?? 0) - (a.score?.deltaPct ?? 0))
    .slice(0, 3);

  if (topDeals.length === 0) return null;

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="container">
        <div className="flex items-end justify-between gap-6 mb-10 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-tech text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
              Price intelligence
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Best deals <span className="text-cyber-gradient">right now</span>
            </h2>
          </motion.div>
          <Button
            asChild
            variant="outline"
            className="btn-cyber shrink-0 hidden sm:inline-flex bg-transparent"
          >
            <Link href="/showroom?sort=best_deals">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {topDeals.map(({ v, score }, i) => {
            const photo = vehiclePrimaryUrl(v);
            const kmLabel = formatKm(v.km);
            const savingsPct = score?.deltaPct != null && score.deltaPct > 0
              ? Math.round(score.deltaPct)
              : null;

            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <Link
                  href={`/showroom/${v.id}`}
                  className="group editorial-panel block h-full min-h-[320px] rounded-xl md:rounded-2xl border border-white/5 holo-card overflow-hidden"
                >
                  <OptimizedImage
                    src={photo ?? PLACEHOLDER_SVG}
                    alt={v.title}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    staticAsset={!photo}
                    className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
                  <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between p-5 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      {score && <DealScoreBadge score={score} />}
                      {savingsPct != null && (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          ~{savingsPct}% below market
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-tech text-[9px] uppercase tracking-[0.22em] text-primary/80 mb-3">
                        Live listing
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 mb-3">
                        {v.year && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary/80" />
                            {v.year}
                          </span>
                        )}
                        {kmLabel && (
                          <span className="inline-flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-primary/80" />
                            {kmLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-gold-gradient font-display text-2xl font-bold mb-3">
                        {formatVehiclePrice(v.price)}
                      </p>
                      <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-[0.2em] text-white/60 group-hover:text-primary">
                        View listing <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
