import { useState } from "react";
import { Lock, Network, Images, Car as CarIcon } from "lucide-react";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import OptimizedImage from "@/components/OptimizedImage";

/**
 * Peer-network vehicle card. Renders the photo, but if the URL 404s or is
 * empty we fall back to a neutral car-icon placeholder. Without this we get
 * the browser's default broken-image glyph on a yellow ring (founder bug v26).
 */
function PeerVehicleCard({ src }: { src: string }) {
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-primary/10 bg-black/30">
      {showFallback ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/70">
          <CarIcon className="h-9 w-9" />
          <span className="text-[11px] uppercase tracking-wider">No photo yet</span>
        </div>
      ) : (
        <OptimizedImage
          src={src}
          alt="Peer dealer vehicle"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setErrored(true)}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
}

export default function DealerNetwork() {
  const { data, isLoading } = trpc.network.photos.useQuery({ limit: 60 });

  return (
    <DealerShell
      title="Dealer Network"
      subtitle="Visual-only market awareness across the GrayArx network. We deliberately hide prices, contact details and dealer names so this view can never be used for cold outreach."
    >
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-primary mb-1 flex items-center gap-2">
            <Network className="h-3.5 w-3.5" /> Peer dealer network
          </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary border border-primary/20">
          <Lock className="h-3.5 w-3.5" />
          Photos only · no prices · no contact info
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="card-premium rounded-2xl p-12 text-center border border-primary/10">
          <Images className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No peer listings yet. As more dealers join the network, their public
            vehicle photos will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.map((p) => (
            <PeerVehicleCard key={p.id} src={p.imageUrl} />
          ))}
        </div>
      )}
    </DealerShell>
  );
}
