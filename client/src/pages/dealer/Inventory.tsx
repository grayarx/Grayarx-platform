import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "wouter";
import {
  Loader2,
  Plus,
  Trash2,
  Car as CarIcon,
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
  ShoppingBag,
} from "lucide-react";
import DealerShell from "@/components/DealerShell";
import SearchableSelect from "@/components/SearchableSelect";
import { MakeSelect, ModelSelect } from "@/components/SmartVehicleSelect";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_COLORS,
  resolveMake,
  resolveModel,
} from "@shared/vehicleCatalog";
import { validateVin } from "@shared/validateVin";
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
  DialogFooter,
} from "@/components/ui/dialog";
import VehiclePhotoUploader, {
  type PendingGalleryPhoto,
} from "@/components/VehiclePhotoUploader";
import VehicleShowroomFrame from "@/components/VehicleShowroomFrame";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FUEL_OPTIONS = FUEL_TYPES;
const TRANSMISSION_OPTIONS = TRANSMISSION_TYPES;
const BODY_OPTIONS = BODY_TYPES;
const COLOR_OPTIONS = VEHICLE_COLORS;
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

const SERVICE_SELECT_OPTIONS = ["Not specified", "Full", "Partial", "None"] as const;

function normalizeCondition(value: string | null | undefined): FormState["condition"] {
  const lower = (value ?? "used").toLowerCase();
  return CONDITION_OPTIONS.includes(lower as FormState["condition"]) ? (lower as FormState["condition"]) : "used";
}

function normalizeServiceHistory(value: string | null | undefined): string {
  const lower = (value ?? "").trim().toLowerCase();
  if (!lower) return "";
  return SERVICE_OPTIONS.includes(lower as (typeof SERVICE_OPTIONS)[number]) ? lower : "";
}

function serviceHistoryLabel(value: string): string {
  if (!value) return "Not specified";
  return value.charAt(0).toUpperCase() + value.slice(1);
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
    km: v.km != null && v.km > 0 ? String(v.km) : "",
    fuel: v.fuel ?? "",
    transmission: v.transmission ?? "",
    bodyType: v.bodyType ?? "",
    color: v.color ?? "",
    condition: normalizeCondition(v.condition),
    vin: v.vin ?? "",
    engineCc: v.engineCc != null && v.engineCc > 0 ? String(v.engineCc) : "",
    doors: v.doors != null && v.doors > 0 ? String(v.doors) : "",
    seats: v.seats != null && v.seats > 0 ? String(v.seats) : "",
    features,
    serviceHistory: normalizeServiceHistory(v.serviceHistory),
    previousOwners: v.previousOwners != null && v.previousOwners > 0 ? String(v.previousOwners) : "",
    imageUrl: v.primaryPhotoUrl || v.imageUrl || "",
    location: v.location ?? "",
    description: v.description ?? "",
  };
}

function blockNegativeKey(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
    e.preventDefault();
  }
}

function digitsOnlyInput(raw: string): string {
  if (raw === "") return "";
  return raw.replace(/[^\d]/g, "");
}

function parseOptionalInt(
  raw: string,
  opts: { min?: number; max?: number } = {},
): number | undefined {
  if (!raw.trim()) return undefined;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return undefined;
  if (opts.min != null && n < opts.min) return undefined;
  if (opts.max != null && n > opts.max) return undefined;
  return n;
}

function buildPayload(form: FormState) {
  let title = form.title.trim();
  if (!title) {
    title = [form.year, form.make, form.model].filter(Boolean).join(" ").trim() || "Untitled vehicle";
  }
  const make = form.make ? resolveMake(form.make) : undefined;
  const model =
    form.model && make
      ? resolveModel(make, form.model)
      : form.model.trim() || undefined;
  const priceNum = parsePriceInput(form.price);
  return {
    title,
    make,
    model,
    year: parseOptionalInt(form.year, { min: 1980, max: 2030 }),
    price: priceNum ?? undefined,
    km: parseOptionalInt(form.km, { min: 0 }),
    fuel: form.fuel || undefined,
    transmission: form.transmission || undefined,
    bodyType: form.bodyType || undefined,
    color: form.color || undefined,
    condition: form.condition,
    vin: (() => {
      const result = validateVin(form.vin);
      return result.ok && result.normalized ? result.normalized : form.vin.trim() || undefined;
    })(),
    engineCc: parseOptionalInt(form.engineCc, { min: 0, max: 20000 }),
    doors: parseOptionalInt(form.doors, { min: 2, max: 6 }),
    seats: parseOptionalInt(form.seats, { min: 1, max: 20 }),
    features: form.features.length ? form.features : undefined,
    serviceHistory:
      form.serviceHistory && form.serviceHistory !== "any"
        ? (form.serviceHistory as "full" | "partial" | "none")
        : undefined,
    previousOwners: parseOptionalInt(form.previousOwners, { min: 0, max: 20 }),
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

  const [pendingGallery, setPendingGallery] = useState<PendingGalleryPhoto[]>([]);

  const handlePrimaryUrlChange = useCallback((url: string) => {
    setForm((f) => (f.imageUrl === url ? f : { ...f, imageUrl: url }));
  }, []);

  const attachPhoto = trpc.dealer.attachPhotoFromUrl.useMutation();

  const createV = trpc.dealer.createVehicle.useMutation();

  const updateV = trpc.dealer.updateVehicle.useMutation({
    onSuccess: () => {
      utils.dealer.listVehicles.invalidate();
      utils.showroom.list.invalidate();
      setOpen(false);
      resetForm();
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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setPendingGallery([]);
    setEditingId(null);
  };

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

  const handleSave = async () => {
    const priceNum = parsePriceInput(form.price);
    if (priceNum === null || priceNum <= 1) {
      toast.error("Enter a valid price above R1. Use Settings → Fix R1 prices for bulk imports.");
      return;
    }
    if (form.doors.trim() && (Number(form.doors) < 2 || Number(form.doors) > 6)) {
      toast.error("Doors must be between 2 and 6.");
      return;
    }
    if (form.seats.trim() && (Number(form.seats) < 1 || Number(form.seats) > 20)) {
      toast.error("Seats must be between 1 and 20.");
      return;
    }
    const vinCheck = validateVin(form.vin);
    if (!vinCheck.ok) {
      toast.error(vinCheck.reason ?? "VIN is invalid. Leave blank or enter a valid 17-character VIN.");
      return;
    }
    const payload = buildPayload(form);
    if (!payload.price || payload.price <= 1) {
      toast.error("Price must be greater than R1.");
      return;
    }
    try {
      if (editingId != null) {
        await updateV.mutateAsync({ id: editingId, ...payload, price: payload.price });
      } else {
        const result = await createV.mutateAsync({ ...payload, price: payload.price });
        const newId = result.id;
        if (newId && pendingGallery.length > 0) {
          for (const p of pendingGallery) {
            await attachPhoto.mutateAsync({
              vehicleId: newId,
              url: p.url,
              caption: p.angleId,
              setPrimary: p.angleId === "front_3_4",
            });
          }
        }
        utils.dealer.listVehicles.invalidate();
        utils.dealer.stats.invalidate();
        utils.showroom.list.invalidate();
        toast.success("Vehicle added to your showroom");
      }
      setOpen(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save vehicle");
    }
  };

  const openEdit = (v: NonNullable<typeof data>[number]) => {
    setEditingId(v.id);
    setForm(vehicleToForm(v));
    setPendingGallery([]);
    setOpen(true);
  };

  const openAdd = () => {
    resetForm();
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
          <Button
            className="btn-gold font-semibold"
            type="button"
            onClick={openAdd}
          >
            <Plus className="h-4 w-4 mr-2" /> Add vehicle
          </Button>
          {open ? (
          <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) closeDialog();
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <div key={editingId ?? "new"}>
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
                    onChange={(make) =>
                      setForm((f) => ({
                        ...f,
                        make,
                        model: make === f.make ? f.model : "",
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Model</Label>
                <div className="mt-1">
                  <ModelSelect
                    make={form.make}
                    value={form.model}
                    onChange={(model) => setForm((f) => ({ ...f, model }))}
                  />
                </div>
              </div>

              <div>
                <Label>Year</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.year}
                  onKeyDown={blockNegativeKey}
                  onChange={(e) => setForm({ ...form, year: digitsOnlyInput(e.target.value) })}
                  className="mt-1"
                  placeholder="2023"
                />
              </div>
              <div>
                <Label>Price (ZAR)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.price}
                  onKeyDown={blockNegativeKey}
                  onChange={(e) => setForm({ ...form, price: digitsOnlyInput(e.target.value) })}
                  className="mt-1"
                  placeholder="650000"
                />
              </div>

              <div>
                <Label>Mileage (km)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.km}
                  onKeyDown={blockNegativeKey}
                  onChange={(e) => setForm({ ...form, km: digitsOnlyInput(e.target.value) })}
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
                <div className="mt-1">
                  <SearchableSelect
                    value={form.color}
                    onChange={(v) => setForm({ ...form, color: v })}
                    options={COLOR_OPTIONS}
                    placeholder="Red, Black, Silver…"
                    allowCustom
                  />
                </div>
              </div>

              <div>
                <Label>Engine (cc)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.engineCc}
                  onKeyDown={blockNegativeKey}
                  onChange={(e) =>
                    setForm({ ...form, engineCc: digitsOnlyInput(e.target.value) })
                  }
                  className="mt-1"
                  placeholder="1998"
                />
              </div>
              <div>
                <Label>VIN (private — masked publicly)</Label>
                <Input
                  value={form.vin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vin: e.target.value.toUpperCase().replace(/[\s-]+/g, ""),
                    })
                  }
                  onBlur={() => {
                    const result = validateVin(form.vin);
                    if (result.ok && result.normalized) {
                      setForm((f) => (f.vin === result.normalized ? f : { ...f, vin: result.normalized }));
                    }
                  }}
                  className="mt-1 font-mono uppercase"
                  placeholder="WBA8E5G54JNU12345"
                  maxLength={17}
                  autoComplete="off"
                  spellCheck={false}
                />
                {(() => {
                  const vinCheck = validateVin(form.vin);
                  if (vinCheck.ok || !form.vin.trim()) return null;
                  return (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {vinCheck.reason ?? "This VIN looks invalid."}
                    </p>
                  );
                })()}
                <p className="mt-1 text-xs text-muted-foreground">Optional. 17 characters; I, O, and Q not used.</p>
              </div>

              <div>
                <Label>Doors</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.doors}
                  onKeyDown={blockNegativeKey}
                  onChange={(e) => setForm({ ...form, doors: digitsOnlyInput(e.target.value) })}
                  className="mt-1"
                  placeholder="4"
                />
              </div>
              <div>
                <Label>Seats</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.seats}
                  onKeyDown={blockNegativeKey}
                  onChange={(e) => setForm({ ...form, seats: digitsOnlyInput(e.target.value) })}
                  className="mt-1"
                  placeholder="5"
                />
              </div>

              <div>
                <Label>Service history</Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={serviceHistoryLabel(form.serviceHistory)}
                    onChange={(label) => {
                      const lower = label.toLowerCase();
                      setForm((f) => ({
                        ...f,
                        serviceHistory:
                          lower === "not specified" || !SERVICE_OPTIONS.includes(lower as (typeof SERVICE_OPTIONS)[number])
                            ? ""
                            : lower,
                      }));
                    }}
                    options={SERVICE_SELECT_OPTIONS}
                    placeholder="Not specified"
                    allowCustom={false}
                  />
                </div>
              </div>
              <div>
                <Label>Previous owners</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.previousOwners}
                  onKeyDown={blockNegativeKey}
                  onChange={(e) =>
                    setForm({ ...form, previousOwners: digitsOnlyInput(e.target.value) })
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
                <VehiclePhotoUploader
                  vehicleId={editingId}
                  onPrimaryUrlChange={handlePrimaryUrlChange}
                  onPendingPhotosChange={setPendingGallery}
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
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
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
            </div>
          </DialogContent>
        </Dialog>
          ) : null}
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
        data && data.length > 0 ? (
          <div className="card-premium rounded-2xl border border-primary/10 py-20 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto text-primary/40 mb-4" />
            <p className="text-lg mb-1">No vehicles match those filters.</p>
            <p className="text-sm">Try clearing the search or changing the filter.</p>
          </div>
        ) : (
          <div className="card-premium rounded-2xl border border-primary/15 py-16 px-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <CarIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-bold">Let’s fill your showroom</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Add your stock and it goes live on your public showroom instantly. Import your
              whole list from a CSV in seconds, or add a car by hand.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="btn-gold h-11 px-5 font-semibold">
                <Link href="/dealer/inventory/import">
                  <Upload className="h-4 w-4 mr-2" /> Import stock from CSV
                </Link>
              </Button>
              <Button variant="outline" className="h-11 px-5" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add a vehicle
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Tip: aim for <span className="text-foreground font-medium">8 photos</span> per car —
              listings with a full set sell faster.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((v) => {
            const vImages = (v as unknown as { images?: string[] }).images;
            const photo = v.primaryPhotoUrl || v.imageUrl || vImages?.[0];
            const features = Array.isArray(v.features)
              ? (v.features as string[])
              : [];
            return (
              <div
                key={v.id}
                className="relative card-premium rounded-2xl border border-primary/10 overflow-hidden group flex flex-col"
              >
                {/* Photo — studio frame composites any upload onto premium backdrop */}
                <VehicleShowroomFrame
                  src={photo ?? null}
                  alt={v.title ?? "Vehicle"}
                  className="rounded-t-2xl"
                />
                <div className="absolute top-3 left-3 flex gap-2 z-[4] pointer-events-none">
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
                  <div className="absolute top-44 right-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1 z-[4] pointer-events-none">
                    <Eye className="h-3 w-3" />
                    {v.views}
                  </div>
                )}

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
                    {v.engineCc != null && v.engineCc > 0 && (
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
                      {v.status !== "sold" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Mark "${v.title}" as sold?`))
                              updateV.mutate({ id: v.id, status: "sold" });
                          }}
                          className="text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                          aria-label="Mark as sold"
                          title="Mark as sold"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
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
