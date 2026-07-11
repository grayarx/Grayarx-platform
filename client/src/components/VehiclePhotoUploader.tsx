import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import VehicleShowroomFrame from "@/components/VehicleShowroomFrame";

export type PendingGalleryPhoto = {
  angleId: string;
  url: string;
};

interface VehiclePhotoUploaderProps {
  vehicleId?: number | null;
  onPrimaryUrlChange: (url: string) => void;
  onPendingPhotosChange?: (photos: PendingGalleryPhoto[]) => void;
  className?: string;
}

const MAX_PHOTOS = 8;

/** Resize + compress via canvas. Targets ≤60 KB so data URLs stay within all limits. */
function compressImage(file: File, maxPx = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      // Return raw base64 (no data: prefix) — server reconstructs the full data URL
      resolve(canvas.toDataURL("image/jpeg", quality).replace(/^data:[^;]+;base64,/, ""));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

type PhotoSlot =
  | { state: "uploading" }
  | { state: "filled"; url: string; photoId?: number };

export default function VehiclePhotoUploader({
  vehicleId,
  onPrimaryUrlChange,
  onPendingPhotosChange,
  className,
}: VehiclePhotoUploaderProps) {
  const [slots, setSlots] = useState<PhotoSlot[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onPrimaryRef = useRef(onPrimaryUrlChange);
  onPrimaryRef.current = onPrimaryUrlChange;
  const onPendingRef = useRef(onPendingPhotosChange);
  onPendingRef.current = onPendingPhotosChange;

  const uploadPhoto = trpc.dealer.uploadVehiclePhoto.useMutation();
  const attachUrl = trpc.dealer.attachPhotoFromUrl.useMutation();
  const deletePhoto = trpc.dealer.deletePhoto.useMutation();
  const deleteAllPhotos = trpc.dealer.deleteAllPhotos.useMutation();

  const { data: existing, refetch } = trpc.dealer.listPhotos.useQuery(
    { vehicleId: vehicleId! },
    { enabled: !!vehicleId },
  );

  // Load existing photos from DB
  useEffect(() => {
    if (!existing) return;
    const loaded: PhotoSlot[] = existing.map((p) => ({
      state: "filled" as const,
      url: p.url,
      photoId: p.id,
    }));
    setSlots(loaded);
    const primary = loaded.find((s) => s.state === "filled")?.url ?? "";
    if (primary) onPrimaryRef.current(primary);
  }, [existing]);

  // Reset when vehicle changes
  useEffect(() => {
    setSlots([]);
  }, [vehicleId]);

  // Notify parent of pending photos (new vehicle only)
  const notifyPending = useCallback(
    (current: PhotoSlot[]) => {
      if (vehicleId || !onPendingRef.current) return;
      const filled = current.filter(
        (s): s is Extract<PhotoSlot, { state: "filled" }> => s.state === "filled",
      );
      onPendingRef.current(filled.map((s, i) => ({ angleId: `photo_${i + 1}`, url: s.url })));
      const primary = filled[0]?.url ?? "";
      onPrimaryRef.current(primary);
    },
    [vehicleId],
  );

  const filledCount = slots.filter((s) => s.state === "filled").length;
  const uploadingCount = slots.filter((s) => s.state === "uploading").length;

  const uploadOne = useCallback(
    async (file: File): Promise<string | null> => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Photo too large (max 20 MB)");
        return null;
      }
      const base64 = await compressImage(file);
      const { url } = await uploadPhoto.mutateAsync({
        dataBase64: base64,
        mimeType: "image/jpeg",
        filename: file.name.replace(/\.[^.]+$/, ""),
      });
      return url;
    },
    [uploadPhoto],
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;

      const currentFilled = slots.filter((s) => s.state === "filled").length;
      const available = MAX_PHOTOS - currentFilled;
      const toUpload = list.slice(0, available);

      if (!toUpload.length) {
        toast.message("All 8 photo slots are full — delete one first");
        return;
      }

      // Optimistically add uploading placeholders
      setSlots((prev) => [...prev, ...toUpload.map((): PhotoSlot => ({ state: "uploading" }))]);

      for (let i = 0; i < toUpload.length; i++) {
        try {
          const url = await uploadOne(toUpload[i]);
          if (!url) throw new Error("No URL returned");

          if (vehicleId) {
            // Always mark as primary so the newly uploaded photo wins over
            // any stale/broken Unsplash URLs already in the DB
            await attachUrl.mutateAsync({
              vehicleId,
              url,
              setPrimary: true,
            });
            // Refetch to get the DB-assigned photoId
            const result = await refetch();
            const freshPhotos = result.data ?? [];
            setSlots(
              freshPhotos.map((p) => ({ state: "filled" as const, url: p.url, photoId: p.id })),
            );
            // Use the uploaded URL directly — not freshPhotos[0] which
            // might be an old broken Unsplash URL at position 0
            onPrimaryRef.current(url);
          } else {
            // New vehicle — hold in local state
            setSlots((prev) => {
              const next = [...prev];
              const idx = next.findIndex((s) => s.state === "uploading");
              if (idx !== -1) next[idx] = { state: "filled", url };
              else next.push({ state: "filled", url });
              notifyPending(next);
              return next;
            });
          }
        } catch (err) {
          console.error("[PhotoUploader] Upload failed", err);
          // Remove one uploading placeholder
          setSlots((prev) => {
            const next = [...prev];
            const idx = next.findIndex((s) => s.state === "uploading");
            if (idx !== -1) next.splice(idx, 1);
            return next;
          });
          toast.error("Could not upload photo — try again");
        }
      }
    },
    [slots, uploadOne, vehicleId, attachUrl, refetch, notifyPending],
  );

  const removePhoto = useCallback(
    async (index: number) => {
      const slot = slots[index];
      if (slot?.state !== "filled") return;

      if (slot.photoId && vehicleId) {
        try {
          await deletePhoto.mutateAsync({ photoId: slot.photoId });
          const result = await refetch();
          const freshPhotos = result.data ?? [];
          setSlots(
            freshPhotos.map((p) => ({ state: "filled" as const, url: p.url, photoId: p.id })),
          );
          const primary = freshPhotos[0]?.url ?? "";
          onPrimaryRef.current(primary);
        } catch {
          toast.error("Could not delete photo — try again");
        }
      } else {
        setSlots((prev) => {
          const next = prev.filter((_, i) => i !== index);
          notifyPending(next);
          const primary = next.find((s) => s.state === "filled")?.url ?? "";
          onPrimaryRef.current(primary);
          return next;
        });
      }
    },
    [slots, vehicleId, deletePhoto, refetch, notifyPending],
  );

  const clearAll = useCallback(async () => {
    if (!vehicleId) {
      setSlots([]);
      onPrimaryRef.current("");
      notifyPending([]);
      return;
    }
    try {
      await deleteAllPhotos.mutateAsync({ vehicleId });
      setSlots([]);
      onPrimaryRef.current("");
      await refetch();
      toast.success("All photos deleted");
    } catch {
      toast.error("Could not delete photos — try again");
    }
  }, [vehicleId, deleteAllPhotos, refetch, notifyPending]);

  // Build the 8-slot display grid: filled + uploading + empty up to MAX_PHOTOS
  const displaySlots: Array<
    | { kind: "filled"; url: string; photoId?: number; index: number }
    | { kind: "uploading"; index: number }
    | { kind: "empty" }
  > = [
    ...slots.map((s, i) =>
      s.state === "filled"
        ? ({ kind: "filled", url: s.url, photoId: s.photoId, index: i } as const)
        : ({ kind: "uploading", index: i } as const),
    ),
    // Fill remainder with empty slots up to MAX_PHOTOS
    ...Array.from({ length: Math.max(0, MAX_PHOTOS - slots.length) }, () => ({ kind: "empty" } as const)),
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Showroom photos</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Up to 8 photos — first photo is the hero shown in listings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filledCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 gap-1.5"
              onClick={clearAll}
              disabled={deleteAllPhotos.isPending}
            >
              {deleteAllPhotos.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete all
            </Button>
          )}
          <span className="text-2xl font-bold tabular-nums font-display">
            {filledCount}/{MAX_PHOTOS}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed p-5 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-primary/25 bg-muted/20 hover:border-primary/40",
        )}
      >
        <Upload className="h-7 w-7 mx-auto mb-2 text-primary/80" />
        <p className="text-sm font-medium mb-1">Drop photos here or click below</p>
        <p className="text-xs text-muted-foreground mb-3">
          Select multiple photos at once — they fill slots in order
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploadingCount > 0 || filledCount >= MAX_PHOTOS}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Choose photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Photo grid — 8 slots */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {displaySlots.map((slot, i) => (
          <div
            key={i}
            className={cn(
              "relative rounded-lg border overflow-hidden aspect-[4/3] group",
              slot.kind === "filled"
                ? "border-primary/30 cursor-pointer"
                : slot.kind === "uploading"
                  ? "border-dashed border-primary/40"
                  : "border-dashed border-muted-foreground/25 hover:border-primary/40 cursor-pointer",
            )}
            onClick={() => {
              if (slot.kind === "empty") fileInputRef.current?.click();
            }}
          >
            {slot.kind === "uploading" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/40">
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-1" />
                <span className="text-[10px] text-muted-foreground">Uploading…</span>
              </div>
            ) : slot.kind === "filled" ? (
              <>
                <VehicleShowroomFrame
                  src={slot.url}
                  alt={`Photo ${i + 1}`}
                  aspectClass="aspect-[4/3] h-full w-full"
                  sizes="25vw"
                  hoverZoom={false}
                  className="rounded-none border-0"
                />
                {/* Hero badge on first photo */}
                {i === 0 && (
                  <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-primary/90 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded text-primary-foreground font-bold pointer-events-none z-10">
                    <Star className="h-2.5 w-2.5" />
                    Hero
                  </span>
                )}
                {/* Delete bar — always visible */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void removePhoto(slot.index); }}
                  disabled={deletePhoto.isPending}
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1.5 bg-red-600/85 text-white hover:bg-red-600 text-[9px] font-semibold transition-colors z-10"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Delete
                </button>
              </>
            ) : (
              /* Empty slot */
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <ImagePlus className="h-5 w-5 mb-1" />
                <span className="text-[10px]">Add photo</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filledCount === 0 && uploadingCount === 0 && (
        <p className="text-xs text-amber-500/90 text-center">
          Add at least one photo — listings with photos get 3× more enquiries.
        </p>
      )}
    </div>
  );
}
