import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  GripVertical,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import OptimizedImage from "@/components/OptimizedImage";
import VehicleShowroomFrame from "@/components/VehicleShowroomFrame";
import {
  PHOTO_ANGLES,
  RECOMMENDED_ANGLE_COUNT,
  type PhotoAngleId,
} from "@shared/photoAngles";
import { photoQualityLabel } from "@shared/photoStandards";

export type PendingGalleryPhoto = {
  angleId: PhotoAngleId;
  url: string;
};

interface VehiclePhotoUploaderProps {
  vehicleId?: number | null;
  /** Called when primary photo URL changes (for form sync). */
  onPrimaryUrlChange: (url: string) => void;
  /** Pending photos when creating a new vehicle (no vehicleId yet). */
  onPendingPhotosChange?: (photos: PendingGalleryPhoto[]) => void;
  className?: string;
}

type SlotState = {
  url: string;
  photoId?: number;
  uploading?: boolean;
};

function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buf) =>
    btoa(new Uint8Array(buf).reduce((acc, b) => acc + String.fromCharCode(b), "")),
  );
}

function mimeFor(file: File) {
  if (file.type === "image/png") return "image/png" as const;
  if (file.type === "image/webp") return "image/webp" as const;
  return "image/jpeg" as const;
}

function slotsEqual(
  a: Partial<Record<PhotoAngleId, SlotState>>,
  b: Partial<Record<PhotoAngleId, SlotState>>,
): boolean {
  return PHOTO_ANGLES.every((angle) => a[angle.id]?.url === b[angle.id]?.url);
}

export default function VehiclePhotoUploader({
  vehicleId,
  onPrimaryUrlChange,
  onPendingPhotosChange,
  className,
}: VehiclePhotoUploaderProps) {
  const [slots, setSlots] = useState<Partial<Record<PhotoAngleId, SlotState>>>({});
  const [dragOver, setDragOver] = useState(false);
  const [slotOrder, setSlotOrder] = useState<PhotoAngleId[]>(PHOTO_ANGLES.map((a) => a.id));
  const [draggingAngle, setDraggingAngle] = useState<PhotoAngleId | null>(null);
  const [dragOverAngle, setDragOverAngle] = useState<PhotoAngleId | null>(null);
  const bulkRef = useRef<HTMLInputElement>(null);
  const slotRefs = useRef<Partial<Record<PhotoAngleId, HTMLInputElement | null>>>({});

  const uploadPhoto = trpc.dealer.uploadVehiclePhoto.useMutation();
  const addPhoto = trpc.dealer.addPhoto.useMutation();
  const attachUrl = trpc.dealer.attachPhotoFromUrl.useMutation();
  const deletePhoto = trpc.dealer.deletePhoto.useMutation();
  const setPrimary = trpc.dealer.setPrimaryPhoto.useMutation();
  const reorderPhotos = trpc.dealer.reorderPhotos.useMutation();
  const { data: existing, refetch } = trpc.dealer.listPhotos.useQuery(
    { vehicleId: vehicleId! },
    { enabled: !!vehicleId },
  );

  const onPrimaryUrlChangeRef = useRef(onPrimaryUrlChange);
  onPrimaryUrlChangeRef.current = onPrimaryUrlChange;
  const lastPrimaryRef = useRef<string>("");

  useEffect(() => {
    lastPrimaryRef.current = "";
    setSlots({});
    setSlotOrder(PHOTO_ANGLES.map((a) => a.id));
  }, [vehicleId]);

  useEffect(() => {
    if (!existing?.length) return;
    const next: Partial<Record<PhotoAngleId, SlotState>> = {};
    existing.forEach((p, i) => {
      const angleId =
        (PHOTO_ANGLES.find((a) => a.id === p.caption)?.id as PhotoAngleId | undefined) ??
        PHOTO_ANGLES[i % PHOTO_ANGLES.length]?.id;
      if (angleId && !next[angleId]) {
        next[angleId] = { url: p.url, photoId: p.id };
      }
    });
    setSlots((prev) => (slotsEqual(prev, next) ? prev : next));
    const primary = existing.find((p) => p.caption === "front_3_4")?.url ?? existing[0]?.url;
    if (primary && primary !== lastPrimaryRef.current) {
      lastPrimaryRef.current = primary;
      // Editing: form already has primary URL from vehicleToForm — don't bounce parent state.
      if (!vehicleId) {
        onPrimaryUrlChangeRef.current(primary);
      }
    }
  }, [existing]);

  const filledCount = useMemo(
    () => PHOTO_ANGLES.filter((a) => slots[a.id]?.url).length,
    [slots],
  );

  const score = useMemo(() => {
    let s = Math.min(100, filledCount * 12);
    if (slots.front_3_4?.url) s += 4;
    if (slots.interior_front?.url && slots.dashboard?.url) s += 4;
    return Math.min(100, s);
  }, [filledCount, slots]);

  const syncPending = useCallback(
    (next: Partial<Record<PhotoAngleId, SlotState>>) => {
      if (vehicleId || !onPendingPhotosChange) return;
      const pending: PendingGalleryPhoto[] = PHOTO_ANGLES.filter((a) => next[a.id]?.url).map(
        (a) => ({ angleId: a.id, url: next[a.id]!.url }),
      );
      onPendingPhotosChange(pending);
      const primary =
        next.front_3_4?.url ??
        PHOTO_ANGLES.map((a) => next[a.id]?.url).find(Boolean) ??
        "";
      if (primary && primary !== lastPrimaryRef.current) {
        lastPrimaryRef.current = primary;
        onPrimaryUrlChangeRef.current(primary);
      }
    },
    [vehicleId, onPendingPhotosChange],
  );

  const persistUpload = useCallback(
    async (file: File, angleId: PhotoAngleId) => {
      if (file.size > 12 * 1024 * 1024) {
        toast.error("Photo too large (max 12 MB)");
        return null;
      }
      const mt = mimeFor(file);
      const base64 = await fileToBase64(file);
      const { url } = await uploadPhoto.mutateAsync({
        dataBase64: base64,
        mimeType: mt,
        filename: `${angleId}-${file.name.replace(/\.[^.]+$/, "")}`,
      });

      if (vehicleId) {
        await attachUrl.mutateAsync({
          vehicleId,
          url,
          caption: angleId,
          setPrimary: angleId === "front_3_4" || filledCount === 0,
        });
        await refetch();
      }
      return url;
    },
    [uploadPhoto, attachUrl, vehicleId, refetch, filledCount],
  );

  const assignFile = useCallback(
    async (file: File, angleId: PhotoAngleId) => {
      setSlots((s) => ({ ...s, [angleId]: { ...s[angleId], url: "", uploading: true } }));
      try {
        const url = await persistUpload(file, angleId);
        if (!url) throw new Error("Upload failed");
        setSlots((s) => {
          const next = { ...s, [angleId]: { url, uploading: false } };
          syncPending(next);
          return next;
        });
        if (angleId === "front_3_4" || filledCount === 0) {
          if (url !== lastPrimaryRef.current) {
            lastPrimaryRef.current = url;
            onPrimaryUrlChangeRef.current(url);
          }
        }
        toast.success(`${PHOTO_ANGLES.find((a) => a.id === angleId)?.label} added`);
      } catch {
        setSlots((s) => {
          const next = { ...s };
          delete next[angleId];
          return next;
        });
        toast.error("Could not upload photo — try again");
      }
    },
    [persistUpload, syncPending, filledCount],
  );

  const assignBulk = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) {
        toast.error("No image files found");
        return;
      }
      const emptyAngles = PHOTO_ANGLES.filter((a) => !slots[a.id]?.url).map((a) => a.id);
      for (let i = 0; i < list.length && i < emptyAngles.length; i++) {
        await assignFile(list[i], emptyAngles[i]);
      }
      if (list.length > emptyAngles.length) {
        toast.message("Some photos skipped — all 8 slots are full");
      }
    },
    [assignFile, slots],
  );

  const removeSlot = async (angleId: PhotoAngleId) => {
    const slot = slots[angleId];
    if (slot?.photoId && vehicleId) {
      try {
        await deletePhoto.mutateAsync({ photoId: slot.photoId });
        await refetch();
      } catch {
        toast.error("Could not remove photo");
        return;
      }
    }
    setSlots((s) => {
      const next = { ...s };
      delete next[angleId];
      syncPending(next);
      return next;
    });
  };

  const makePrimary = async (angleId: PhotoAngleId) => {
    const url = slots[angleId]?.url;
    if (!url) return;
    // Move this angle to front of order
    setSlotOrder((prev) => {
      const next = [angleId, ...prev.filter((id) => id !== angleId)];
      return next;
    });
    if (vehicleId) {
      await setPrimary.mutateAsync({ vehicleId, photoUrl: url });
    }
    onPrimaryUrlChangeRef.current(url);
    toast.success("Set as main showroom photo");
  };

  const handleSlotDragStart = useCallback((angleId: PhotoAngleId) => {
    setDraggingAngle(angleId);
  }, []);

  const handleSlotDragOver = useCallback(
    (e: React.DragEvent, angleId: PhotoAngleId) => {
      e.preventDefault();
      if (angleId !== draggingAngle) setDragOverAngle(angleId);
    },
    [draggingAngle],
  );

  const handleSlotDrop = useCallback(
    async (targetAngle: PhotoAngleId) => {
      if (!draggingAngle || draggingAngle === targetAngle) {
        setDraggingAngle(null);
        setDragOverAngle(null);
        return;
      }

      // Compute new order (same logic as the state updater, but synchronously)
      const newOrder = (() => {
        const next = [...slotOrder];
        const fromIdx = next.indexOf(draggingAngle);
        const toIdx = next.indexOf(targetAngle);
        if (fromIdx === -1 || toIdx === -1) return slotOrder;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, draggingAngle);
        return next;
      })();

      setSlotOrder(newOrder);
      setDraggingAngle(null);
      setDragOverAngle(null);

      if (vehicleId) {
        const orderedIds = newOrder
          .map((id) => slots[id]?.photoId)
          .filter((id): id is number => id != null);
        if (orderedIds.length > 0) {
          try {
            await reorderPhotos.mutateAsync({ vehicleId, orderedPhotoIds: orderedIds });
            await refetch();
            toast.success("Photos reordered");
          } catch {
            toast.error("Could not save new order");
          }
        }
      }
    },
    [draggingAngle, slotOrder, slots, vehicleId, reorderPhotos, refetch],
  );

  const uploading = uploadPhoto.isPending || addPhoto.isPending || attachUrl.isPending;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Showroom photos</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            8 angles sell faster — tap a slot or drop photos below. No technical skills needed.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold tabular-nums">
            {filledCount}/{RECOMMENDED_ANGLE_COUNT}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Quality: {photoQualityLabel(score)}
          </p>
        </div>
      </div>

      <Progress value={(filledCount / RECOMMENDED_ANGLE_COUNT) * 100} className="h-2" />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void assignBulk(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-primary/25 bg-muted/20 hover:border-primary/40",
        )}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-primary/80" />
        <p className="text-sm font-medium mb-1">Drop photos here</p>
        <p className="text-xs text-muted-foreground mb-3">
          We&apos;ll fill empty angles in order — front 3/4 first
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || filledCount >= RECOMMENDED_ANGLE_COUNT}
            onClick={() => bulkRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Choose photos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => slotRefs.current.front_3_4?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take photo
          </Button>
        </div>
        <input
          ref={bulkRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void assignBulk(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {slotOrder.map((angleId, orderIdx) => {
          const angle = PHOTO_ANGLES.find((a) => a.id === angleId)!;
          if (!angle) return null;
          const slot = slots[angle.id];
          const isHero = orderIdx === 0 && !!slot?.url;
          const isDragSource = draggingAngle === angle.id;
          const isDragTarget = dragOverAngle === angle.id;
          return (
            <div
              key={angle.id}
              draggable={!!slot?.url}
              onDragStart={() => handleSlotDragStart(angle.id)}
              onDragOver={(e) => handleSlotDragOver(e, angle.id)}
              onDragLeave={() => setDragOverAngle(null)}
              onDrop={() => void handleSlotDrop(angle.id)}
              onDragEnd={() => { setDraggingAngle(null); setDragOverAngle(null); }}
              className={cn(
                "relative rounded-lg border overflow-hidden aspect-[4/3] group transition-all",
                slot?.url ? "border-primary/30" : "border-dashed border-muted-foreground/30",
                angle.required && !slot?.url && "ring-1 ring-amber-500/30",
                isDragSource && "opacity-40 scale-95",
                isDragTarget && "ring-2 ring-primary scale-[1.02]",
                slot?.url && "cursor-grab active:cursor-grabbing",
              )}
            >
              <input
                ref={(el) => {
                  slotRefs.current[angle.id] = el;
                }}
                type="file"
                accept="image/*"
                capture={angle.id === "front_3_4" ? "environment" : undefined}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void assignFile(f, angle.id);
                  e.target.value = "";
                }}
              />
              {slot?.uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : slot?.url ? (
                <>
                  <VehicleShowroomFrame
                    src={slot.url}
                    alt={angle.label}
                    aspectClass="aspect-[4/3] h-full w-full"
                    sizes="25vw"
                    hoverZoom={false}
                    className="rounded-none border-0"
                  />
                  {/* Drag handle — always visible on touch, hover on desktop */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white drop-shadow" />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); void makePrimary(angle.id); }}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-primary/80"
                      title="Set as hero photo"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); void removeSlot(angle.id); }}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-destructive/80"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => slotRefs.current[angle.id]?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center hover:bg-muted/30 transition-colors"
                >
                  <ImagePlus className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-[10px] font-semibold leading-tight">{angle.label}</span>
                  {angle.required && (
                    <span className="text-[9px] text-amber-500/90 mt-0.5">Recommended</span>
                  )}
                </button>
              )}
              {isHero && (
                <span className="absolute top-1 left-1 bg-primary/90 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded text-primary-foreground font-bold pointer-events-none">
                  Hero
                </span>
              )}
              {slot?.url && (
                <CheckCircle2 className="absolute bottom-1 right-1 h-4 w-4 text-green-500 drop-shadow pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {filledCount > 1 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 shrink-0" />
          Drag photos to reorder — first slot is the hero image shown in listings.
        </p>
      )}
      {filledCount >= 3 && filledCount < 8 && (
        <p className="text-xs text-amber-500/90 flex items-center gap-2">
          <Star className="h-3.5 w-3.5 shrink-0" />
          Add {RECOMMENDED_ANGLE_COUNT - filledCount} more for luxury showroom parity (like top SA dealers).
        </p>
      )}
    </div>
  );
}
