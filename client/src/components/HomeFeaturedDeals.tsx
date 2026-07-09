import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { scoreListingDeal } from "@shared/priceIntelligence";
import DealScoreBadge from "@/components/DealScoreBadge";
import { formatVehiclePrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    <section className="relative py-16 md:py-20">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
              Price intelligence
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              Best deals right now
            </h2>
          </div>
          <Button asChild variant="outline" className="border-primary/25 shrink-0 hidden sm:inline-flex">
            <Link href="/showroom?sort=best_deals">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {topDeals.map(({ v, score }, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <Link
                href={`/showroom/${v.id}`}
                className="group block h-full rounded-2xl border border-primary/15 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-primary/35 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/5"
              >
                <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                  {v.title}
                </h3>
                <p className="text-lg font-bold text-primary mt-1.5">
                  {formatVehiclePrice(Number(v.price))}
                </p>
                {score && (
                  <div className="mt-3">
                    <DealScoreBadge score={score} showDelta />
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <Button asChild variant="outline" className="border-primary/25 w-full mt-6 sm:hidden">
          <Link href="/showroom?sort=best_deals">
            View all deals <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
