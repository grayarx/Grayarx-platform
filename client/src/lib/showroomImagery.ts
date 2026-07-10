import {
  vehiclePrimaryUrl,
  isStockPhotoUrl,
  isWatermarkedRenderUrl,
  LUXURY_HERO_FALLBACK,
  LOCAL_EDITORIAL_IMAGES,
} from "@shared/imagePipeline";
import { scoreListingDeal } from "@shared/priceIntelligence";

export type InventoryRow = {
  id: number;
  title: string;
  status?: string | null;
  price?: string | number | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  km?: number | null;
  primaryPhotoUrl?: string | null;
  imageUrl?: string | null;
};

export function pickShowroomPhotos(vehicles: InventoryRow[]): InventoryRow[] {
  return vehicles
    .filter((v) => v.status === "available" || !v.status)
    .filter((v) => {
      const url = vehiclePrimaryUrl(v);
      return url && !isStockPhotoUrl(url) && !isWatermarkedRenderUrl(url);
    })
    .sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
}

export function pickHeroImage(vehicles: InventoryRow[]): string {
  const withPhotos = pickShowroomPhotos(vehicles);
  if (withPhotos[0]) {
    return vehiclePrimaryUrl(withPhotos[0])!;
  }
  const anyPhoto = vehicles.find((v) => vehiclePrimaryUrl(v));
  if (anyPhoto) return vehiclePrimaryUrl(anyPhoto)!;
  return LUXURY_HERO_FALLBACK;
}

export function pickTopDealPhotos(vehicles: InventoryRow[], count = 4): InventoryRow[] {
  return pickShowroomPhotos(vehicles)
    .filter((v) => vehiclePrimaryUrl(v))
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
    .filter((x) => x.score && x.score.rating !== "above" && x.score.rating !== "premium")
    .sort((a, b) => (b.score?.deltaPct ?? 0) - (a.score?.deltaPct ?? 0))
    .slice(0, count)
    .map((x) => x.v);
}

export const EDITORIAL_FALLBACKS = [
  {
    title: "Scored inventory",
    tagline: "Precision. Priced.",
    cta: "View more",
    href: "/showroom?sort=best_deals",
  },
  {
    title: "Digital showroom",
    tagline: "Be bold.",
    cta: "Explore",
    href: "/showroom",
  },
  {
    title: "Trade-in intelligence",
    tagline: "Know your number.",
    cta: "Get valuation",
    href: "/trade-in",
  },
  {
    title: "AI platform",
    tagline: "For the dealers.",
    cta: "Read more",
    href: "/help",
  },
] as const;

export function buildEditorialPanels(vehicles: InventoryRow[]) {
  const top = pickTopDealPhotos(vehicles, 4);
  return EDITORIAL_FALLBACKS.map((panel, i) => {
    const v = top[i];
    const photo = v ? vehiclePrimaryUrl(v) : null;
    return {
      ...panel,
      image: photo ?? LOCAL_EDITORIAL_IMAGES[i % LOCAL_EDITORIAL_IMAGES.length],
      title: v ? v.title : panel.title,
      href: v ? `/showroom/${v.id}` : panel.href,
      subtitle: v && v.price ? undefined : panel.tagline,
      liveListing: !!v,
    };
  });
}
