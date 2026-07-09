import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { scoreListingDeal } from "@shared/priceIntelligence";
import DealScoreBadge from "@/components/DealScoreBadge";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/OptimizedImage";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { vehiclePrimaryUrl, PLACEHOLDER_SVG } from "@shared/imagePipeline";

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
    .filter((x) => x.score && x.score.rating === "great")
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
          {topDeals.map(({ v, score }, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <Link
                href={`/showroom/${v.id}`}
                className="group editorial-panel block h-full min-h-[280px] rounded-xl md:rounded-2xl border border-white/5 holo-card overflow-hidden"
              >
                <OptimizedImage
                  src={vehiclePrimaryUrl(v) ?? PLACEHOLDER_SVG}
                  alt={v.title}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  staticAsset={!vehiclePrimaryUrl(v)}
                  className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-end p-5 md:p-6 bg-gradient-to-t from-black/85 via-black/35 to-transparent">
                  {score && (
                    <div className="mb-3">
                      <DealScoreBadge score={score} />
                    </div>
                  )}
                  <h3 className="font-display text-lg md:text-xl font-bold text-white leading-tight mb-1 group-hover:text-primary transition-colors">
                    {v.title}
                  </h3>
                  <p className="text-gold-gradient font-display text-xl font-bold mb-3">
                    {formatVehiclePrice(v.price)}
                  </p>
                  <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-[0.2em] text-white/60 group-hover:text-primary">
                    View listing <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
