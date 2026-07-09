import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Loader2,
  Plus,
  Trash2,
  Car as CarIcon,
  Camera,
  Image as ImageIcon,
  X,
  Search,
  Eye,
  Star,
  Fuel,
  Cog,
  Gauge,
  MapPin,
  Calendar,
  Upload,
  Pencil,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import SearchableSelect from "@/components/SearchableSelect";
import { MakeSelect, ModelSelect } from "@/components/SmartVehicleSelect";
import { resolveMake, resolveModel } from "@shared/vehicleCatalog";
import { formatVehiclePrice, isSuspiciousPrice, parsePriceInput } from "@/lib/formatPrice";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FUEL_OPTIONS = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;
const TRANSMISSION_OPTIONS = ["Automatic", "Manual", "DCT", "CVT"] as const;
const BODY_OPTIONS = [
  "Sedan",
  "SUV",
  "Bakkie",
  "Hatchback",
  "Coupe",
  "MPV",
  "Wagon",
  "Convertible",
] as const;
const CONDITION_OPTIONS = ["new", "used", "demo", "certified"] as const;
const SERVICE_OPTIONS = ["full", "partial", "none"] as const;

const COMMON_FEATURES = [
  "Leather seats",
  "Sunroof",
  "Reverse camera",
  "Bluetooth",
  "Apple CarPlay",
  "Cruise control",
  "Heated seats",
  "Tow bar",
  "Park distance control",
  "Lane assist",
  "Climate control",
  "Alloy wheels",
];

type FormState = {
  title: string;
  make: string;
  model: string;
  year: string;
  price: string;
  km: string;
  fuel: string;
  transmission: string;
  bodyType: string;
  color: string;
  condition: (typeof CONDITION_OPTIONS)[number];
  vin: string;
  engineCc: string;
  doors: string;
  seats: string;
  features: string[];
  serviceHistory: string;
  previousOwners: string;
  imageUrl: string;
  location: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  make: "",
  model: "",
  year: "",
  price: "",
  km: "",
  fuel: "",
  transmission: "",
  bodyType: "",
  color: "",
  condition: "used",
  vin: "",
  engineCc: "",
  doors: "",
  seats: "",
  features: [],
  serviceHistory: "",
  previousOwners: "",
  imageUrl: "",
  location: "",
  description: "",
};

function statusClass(s: string) {
  const map: Record<string, string> = {
    available: "bg-green-500/15 text-green-300 border-green-500/30",
    reserved: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    sold: "bg-muted text-muted-foreground border-border",
  };
  return map[s] ?? "";
}

function maskVin(vin: string | null | undefined) {
  if (!vin) return null;
  if (vin.length <= 4) return "•".repeat(vin.length);
  return "•".repeat(Math.max(0, vin.length - 4)) + vin.slice(-4);
}

function vehicleToForm(v: {
  title: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  price: string | number;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  bodyType: string | null;
  color: string | null;
  condition: string | null;
  vin: string | null;
  engineCc: number | null;
  doors: number | null;
  seats: number | null;
  features: unknown;
  serviceHistory: string | null;
  previousOwners: number | null;
  primaryPhotoUrl: string | null;
  imageUrl: string | null;
  location: string | null;
  description: string | null;
}): FormState {
  const features = Array.isArray(v.features) ? (v.features as string[]) : [];
  return {
    title: v.title ?? "",
    make: v.make ?? "",
    model: v.model ?? "",
    year: v.year != null ? String(v.year) : "",
    price: v.price ? String(Number(v.price)) : "",
    km: v.km != null ? String(v.km) : "",
    fuel: v.fuel ?? "",
    transmission: v.transmission ?? "",
    bodyType: v.bodyType ?? "",
    color: v.color ?? "",
    condition: (v.condition as FormState["condition"]) ?? "used",
    vin: v.vin ?? "",
    engineCc: v.engineCc != null ? String(v.engineCc) : "",
    doors: v.doors != null ? String(v.doors) : "",
    seats: v.seats != null ? String(v.seats) : "",
    features,
    serviceHistory: v.serviceHistory ?? "",
    previousOwners: v.previousOwners != null ? String(v.previousOwners) : "",
    imageUrl: v.primaryPhotoUrl || v.imageUrl || "",
    location: v.location ?? "",
    description: v.description ?? "",
  };
}

function buildPayload(form: FormState) {
  let title = form.title.trim();
  if (!title) {
    title = [form.year, form.make, form.model].filter(Boolean).join(" ").trim() || "Untitled vehicle";
  }
  const make = form.make ? resolveMake(form.make) : undefined;
  const model = form.model && make ? resolveModel(make, form.model) : form.model || undefined;
  const priceNum = parsePriceInput(form.price);
  return {
    title,
    make,
    model,
    year: form.year ? Number(form.year) : undefined,
    price: priceNum ?? undefined,
    km: form.km ? Number(form.km) : undefined,
    fuel: form.fuel || undefined,
    transmission: form.transmission || undefined,
    bodyType: form.bodyType || undefined,
    color: form.color || undefined,
    condition: form.condition,
    vin: form.vin || undefined,
    engineCc: form.engineCc ? Number(form.engineCc) : undefined,
    doors: form.doors ? Number(form.doors) : undefined,
    seats: form.seats ? Number(form.seats) : undefined,
    features: form.features.length ? form.features : undefined,
    serviceHistory:
      form.serviceHistory && form.serviceHistory !== "any"
        ? (form.serviceHistory as "full" | "partial" | "none")
        : undefined,
    previousOwners: form.previousOwners ? Number(form.previousOwners) : undefined,
    imageUrl: form.imageUrl || undefined,
    primaryPhotoUrl: form.imageUrl || undefined,
    location: form.location || undefined,
    description: form.description || undefined,
  };
}

export default function Inventory() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.dealer.listVehicles.useQuery();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "reserved" | "sold">("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [bodyFilter, setBodyFilter] = useState<string>("all");

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const createV = trpc.dealer.createVehicle.useMutation({
    onSuccess: () => {
      utils.dealer.listVehicles.invalidate();
      utils.dealer.stats.invalidate();
      utils.showroom.list.invalidate();
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success("Vehicle added to your showroom");
    },
    onError: (e) =>
      toast.error(e.message ?? "Could not add vehicle. Please review the form."),
  });

  const updateV = trpc.dealer.updateVehicle.useMutation({
    onSuccess: () => {
      utils.dealer.listVehicles.invalidate();
      utils.showroom.list.invalidate();
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success("Vehicle updated");
    },
    onError: (e) => toast.error(e.message ?? "Could not save changes"),
  });

  const deleteV = trpc.dealer.deleteVehicle.useMutation({
    onSuccess: () => {
      utils.dealer.listVehicles.invalidate();
      utils.dealer.stats.invalidate();
      utils.showroom.list.invalidate();
      toast.success("Vehicle removed");
    },
  });

  const uploadPhoto = trpc.dealer.uploadVehiclePhoto.useMutation();

  async function handlePhotoFile(file: File | null | undefined) {
    if (!file) return;
    const mt =
      file.type === "image/png"
        ? "image/png"
        : file.type === "image/webp"
          ? "image/webp"
          : "image/jpeg";
    if (file.size > 12 * 1024 * 1024) {
      toast.error("Photo is too large (max 12 MB)");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce(
          (acc, b) => acc + String.fromCharCode(b),
          "",
        ),
      );
      const { url } = await uploadPhoto.mutateAsync({
        dataBase64: base64,
        mimeType: mt,
        filename: file.name.replace(/\.[^.]+$/, ""),
      });
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Photo uploaded");
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (conditionFilter !== "all" && v.condition !== conditionFilter) return false;
      if (bodyFilter !== "all" && (v.bodyType ?? "").toLowerCase() !== bodyFilter.toLowerCase())
        return false;
      if (!q) return true;
      const hay = [
        v.title,
        v.make,
        v.model,
        v.location,
        v.color,
        v.bodyType,
        v.fuel,
        v.transmission,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, search, statusFilter, conditionFilter, bodyFilter]);

  const handleSave = () => {
    const priceNum = parsePriceInput(form.price);
    if (priceNum === null || priceNum <= 1) {
      toast.error("Enter a valid price above R1. Use Settings → Fix R1 prices for bulk imports.");
      return;
    }
    const payload = buildPayload(form);
    if (!payload.price || payload.price <= 1) {
      toast.error("Price must be greater than R1.");
      return;
    }
    if (editingId != null) {
      updateV.mutate({ id: editingId, ...payload, price: payload.price });
    } else {
      createV.mutate({ ...payload, price: payload.price });
    }
  };

  const openEdit = (v: NonNullable<typeof data>[number]) => {
    setEditingId(v.id);
    setForm(vehicleToForm(v));
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const toggleFeature = (label: string) => {
    setForm((f) =>
      f.features.includes(label)
        ? { ...f, features: f.features.filter((x) => x !== label) }
        : { ...f, features: [...f.features, label] },
    );
  };

  return (
    <DealerShell
      title="Inventory"
      subtitle="Every vehicle on your AI-powered showroom — with the detail your buyers actually ask for."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="font-semibold">
            <Link href="/dealer/inventory/import">
              <Upload className="h-4 w-4 mr-2" /> Import CSV
            </Link>
          </Button>
          <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) closeDialog();
            else setOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="btn-gold font-semibold"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId != null ? "Edit vehicle" : "Add a new vehicle"}</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground -mt-2">
              Only a title (or make + model) is needed — fill in the rest anytime.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="col-span-1 sm:col-span-2">
                <Label>Listing title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="2023 BMW 320i M Sport — full house"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Make</Label>
                <div className="mt-1">
                  <MakeSelect
                    value={form.make}
                    onChange={(make) => setForm({ ...form, make, model: "" })}
                  />
                </div>
              </div>
              <div>
                <Label>Model</Label>
                <div className="mt-1">
                  <ModelSelect
                    make={form.make}
                    value={form.model}
                    onChange={(model) => setForm({ ...form, model })}
                  />
                </div>
              </div>

              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="mt-1"
                  placeholder="2023"
                />
              </div>
              <div>
                <Label>Price (ZAR)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-1"
                  placeholder="650000"
                />
              </div>

              <div>
                <Label>Mileage (km)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.km}
                  onChange={(e) => setForm({ ...form, km: e.target.value })}
                  className="mt-1"
                  placeholder="42000"
                />
              </div>
              <div>
                <Label>Condition</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) =>
                    setForm({ ...form, condition: v as FormState["condition"] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fuel</Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={form.fuel}
                    onChange={(v) => setForm({ ...form, fuel: v })}
                    options={FUEL_OPTIONS}
                    placeholder="Petrol / Diesel / EV…"
                  />
                </div>
              </div>
              <div>
                <Label>Transmission</Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={form.transmission}
                    onChange={(v) => setForm({ ...form, transmission: v })}
                    options={TRANSMISSION_OPTIONS}
                    placeholder="Auto / Manual"
                  />
                </div>
              </div>

              <div>
                <Label>Body type</Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={form.bodyType}
                    onChange={(v) => setForm({ ...form, bodyType: v })}
                    options={BODY_OPTIONS}
                    placeholder="Sedan / SUV / Bakkie…"
                  />
                </div>
              </div>
              <div>
                <Label>Colour</Label>
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="mt-1"
                  placeholder="Mineral Grey"
                />
              </div>

              <div>
                <Label>Engine (cc)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.engineCc}
                  onChange={(e) =>
                    setForm({ ...form, engineCc: e.target.value })
                  }
                  className="mt-1"
                  placeholder="1998"
                />
              </div>
              <div>
                <Label>VIN (private — masked publicly)</Label>
                <Input
                  value={form.vin}
                  onChange={(e) => setForm({ ...form, vin: e.target.value })}
                  className="mt-1 font-mono uppercase"
                  placeholder="WBA8E5G50JNU12345"
                  maxLength={32}
                />
              </div>

              <div>
                <Label>Doors</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.doors}
                  onChange={(e) => setForm({ ...form, doors: e.target.value })}
                  className="mt-1"
                  placeholder="4"
                />
              </div>
              <div>
                <Label>Seats</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: e.target.value })}
                  className="mt-1"
                  placeholder="5"
                />
              </div>

              <div>
                <Label>Service history</Label>
                <Select
                  value={form.serviceHistory || "any"}
                  onValueChange={(v) =>
                    setForm({ ...form, serviceHistory: v === "any" ? "" : v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Not specified</SelectItem>
                    {SERVICE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Previous owners</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.previousOwners}
                  onChange={(e) =>
                    setForm({ ...form, previousOwners: e.target.value })
                  }
                  className="mt-1"
                  placeholder="1"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Sandton, Johannesburg"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label>Features</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COMMON_FEATURES.map((f) => {
                    const active = form.features.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFeature(f)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition ${
                          active
                            ? "bg-primary/15 text-primary border-primary/40"
                            : "bg-transparent text-muted-foreground border-white/10 hover:border-white/30"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label>Vehicle photo</Label>
                {form.imageUrl ? (
                  <div className="mt-1 relative rounded-lg overflow-hidden border border-primary/20">
                    <img
                      src={form.imageUrl}
                      alt="Vehicle preview"
                      className="w-full h-56 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5"
                      aria-label="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => cameraRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 h-11"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      Take photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 h-11"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose from gallery
                    </Button>
                  </div>
                )}
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                />
                <Input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                  className="mt-2"
                  placeholder="Or paste an image URL"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1"
                  rows={3}
                  placeholder="Service plan to 100k, two keys, accident-free, immaculate condition…"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                className="btn-gold"
                onClick={handleSave}
                disabled={createV.isPending || updateV.isPending}
              >
                {createV.isPending || updateV.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId != null ? (
                  "Save changes"
                ) : (
                  "Add vehicle"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      }
    >
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by make, model, colour, location…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="md:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="md:w-[160px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conditions</SelectItem>
            {CONDITION_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={bodyFilter} onValueChange={setBodyFilter}>
          <SelectTrigger className="md:w-[160px]">
            <SelectValue placeholder="Body type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All body types</SelectItem>
            {BODY_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-premium rounded-2xl border border-primary/10 py-20 text-center text-muted-foreground">
          <CarIcon className="h-10 w-10 mx-auto text-primary/40 mb-4" />
          <p className="text-lg mb-1">
            {data && data.length > 0
              ? "No vehicles match those filters."
              : "No vehicles yet."}
          </p>
          <p className="text-sm">
            {data && data.length > 0 ? (
              "Try clearing the search or changing the filter."
            ) : (
              <>
                Click{" "}
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80"
                >
                  Add vehicle
                </button>{" "}
                to publish your first listing, or{" "}
                <Link href="/dealer/inventory/import" className="text-primary font-semibold underline underline-offset-2">
                  import from CSV
                </Link>.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((v) => {
            const photo = v.primaryPhotoUrl || v.imageUrl;
            const features = Array.isArray(v.features)
              ? (v.features as string[])
              : [];
            return (
              <div
                key={v.id}
                className="card-premium rounded-2xl border border-primary/10 overflow-hidden group flex flex-col"
              >
                {/* Photo */}
                <div className="relative aspect-[16/10] bg-muted/30 overflow-hidden">
                  {/* Always render the placeholder beneath the img so a
                      broken/missing photo gracefully reveals a neutral
                      car-icon empty state instead of the browser's yellow
                      broken-image glyph. */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60">
                    <CarIcon className="h-10 w-10 mb-2" />
                    <span className="text-xs">No photo yet</span>
                  </div>
                  {photo && (
                    <img
                      src={photo}
                      alt={v.title}
                      loading="lazy"
                      decoding="async"
                      className="relative w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04] img-premium"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge
                      className={`text-[10px] uppercase tracking-wider ${statusClass(v.status)}`}
                    >
                      {v.status}
                    </Badge>
                    {v.condition && (
                      <Badge className="text-[10px] uppercase tracking-wider bg-black/60 text-white border-white/20">
                        {v.condition}
                      </Badge>
                    )}
                  </div>
                  {(v.views ?? 0) > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {v.views}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-tight truncate">
                        {v.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[v.year, v.make, v.model].filter(Boolean).join(" · ") ||
                          "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-lg font-bold ${isSuspiciousPrice(v.price) ? "text-amber-400" : "text-primary"}`}
                      >
                        {formatVehiclePrice(v.price)}
                      </div>
                      {isSuspiciousPrice(v.price) && (
                        <Link
                          href="/dealer/settings"
                          className="text-[10px] text-amber-400/80 hover:underline"
                        >
                          Fix price
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Quick specs */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5" />
                      {v.km ? `${v.km.toLocaleString("en-ZA")} km` : "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Fuel className="h-3.5 w-3.5" />
                      {v.fuel ?? "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Cog className="h-3.5 w-3.5" />
                      {v.transmission ?? "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CarIcon className="h-3.5 w-3.5" />
                      {v.bodyType ?? "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {v.location ?? "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {v.createdAt
                        ? new Date(v.createdAt).toLocaleDateString("en-ZA", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>

                  {/* Extra row */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {v.color && (
                      <span className="text-muted-foreground">
                        Colour:{" "}
                        <span className="text-foreground">{v.color}</span>
                      </span>
                    )}
                    {v.engineCc && (
                      <span className="text-muted-foreground">
                        Engine:{" "}
                        <span className="text-foreground">{v.engineCc} cc</span>
                      </span>
                    )}
                    {v.previousOwners != null && (
                      <span className="text-muted-foreground">
                        Owners:{" "}
                        <span className="text-foreground">{v.previousOwners}</span>
                      </span>
                    )}
                    {v.serviceHistory && (
                      <span className="text-muted-foreground">
                        Service:{" "}
                        <span className="text-foreground capitalize">
                          {v.serviceHistory}
                        </span>
                      </span>
                    )}
                    {v.vin && (
                      <span className="col-span-2 text-muted-foreground font-mono">
                        VIN: <span className="text-foreground">{maskVin(v.vin)}</span>
                      </span>
                    )}
                  </div>

                  {features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {features.slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/20"
                        >
                          {f}
                        </span>
                      ))}
                      {features.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          +{features.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                    <Select
                      value={v.status}
                      onValueChange={(s) =>
                        updateV.mutate({
                          id: v.id,
                          status: s as "available" | "reserved" | "sold",
                        })
                      }
                    >
                      <SelectTrigger
                        className={`h-8 text-xs border w-[120px] ${statusClass(v.status)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      {(v.leadCount ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                          <Star className="h-3 w-3 text-primary" />
                          {v.leadCount} lead{v.leadCount === 1 ? "" : "s"}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(v)}
                        className="text-primary hover:bg-primary/10"
                        aria-label="Edit vehicle"
                        title="Edit listing"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            confirm(
                              `Remove "${v.title}" from your inventory? This cannot be undone.`,
                            )
                          )
                            deleteV.mutate({ id: v.id });
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        aria-label="Delete vehicle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DealerShell>
  );
}
