import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import VehicleShowroomFrame from "@/components/VehicleShowroomFrame";
import OptimizedImage from "@/components/OptimizedImage";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_SVG } from "@shared/imagePipeline";

interface VehicleGalleryProps {
  title: string;
  images: string[];
  className?: string;
}

export default function VehicleGallery({ title, images, className }: VehicleGalleryProps) {
  const photos = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const count = photos.length;
  const current = photos[index] ?? null;

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  if (!current) {
    return (
      <VehicleShowroomFrame
        src={null}
        alt={title}
        className={cn("rounded-2xl border border-primary/10", className)}
      />
    );
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div className="relative group rounded-2xl overflow-hidden border border-primary/10 shadow-2xl">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open full-screen gallery"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0.6, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.6 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <VehicleShowroomFrame
                  src={current}
                  alt={`${title} — photo ${index + 1}`}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority={index === 0}
                  hoverZoom={false}
                />
              </motion.div>
            </AnimatePresence>
          </button>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="rounded-full bg-black/55 backdrop-blur-sm px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90">
              {index + 1} / {count}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/75 transition-colors"
            aria-label="Expand gallery"
          >
            <Expand className="h-4 w-4" />
          </button>
        </div>

        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {photos.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "relative shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden border-2 transition-all",
                  i === index
                    ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === index}
              >
                <OptimizedImage
                  src={url}
                  alt=""
                  sizes="96px"
                  className="img-premium"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col"
            role="dialog"
            aria-modal
            aria-label={`${title} photo gallery`}
          >
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-white/70 truncate pr-4">{title}</p>
              <button
                type="button"
                onClick={() => setLightbox(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                aria-label="Close gallery"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center px-4 pb-6">
              <OptimizedImage
                src={current}
                alt={`${title} — photo ${index + 1}`}
                priority
                sizes="100vw"
                className="max-h-[75vh] w-auto max-w-full object-contain mx-auto !h-auto !w-auto"
              />
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {count > 1 && (
              <div className="flex justify-center gap-2 px-4 pb-6 overflow-x-auto">
                {photos.map((url, i) => (
                  <button
                    key={`lb-${url}-${i}`}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn(
                      "shrink-0 w-16 h-11 rounded-md overflow-hidden border-2",
                      i === index ? "border-primary" : "border-white/20 opacity-60",
                    )}
                  >
                    <OptimizedImage src={url} alt="" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
