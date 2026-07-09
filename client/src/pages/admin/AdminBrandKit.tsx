import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Palette, Upload, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const DEFAULT_ACCENT = "#C9A24A";

type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
interface HoursDay {
  open: string;
  close: string;
  closed: boolean;
}
type HoursWeek = Record<WeekdayKey, HoursDay>;

const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_HOURS: HoursWeek = {
  mon: { open: "08:00", close: "18:00", closed: false },
  tue: { open: "08:00", close: "18:00", closed: false },
  wed: { open: "08:00", close: "18:00", closed: false },
  thu: { open: "08:00", close: "18:00", closed: false },
  fri: { open: "08:00", close: "18:00", closed: false },
  sat: { open: "08:00", close: "13:00", closed: false },
  sun: { open: "08:00", close: "13:00", closed: true },
};

function normaliseHours(
  raw: Record<string, unknown> | null | undefined,
): HoursWeek {
  const out: HoursWeek = JSON.parse(JSON.stringify(DEFAULT_HOURS));
  if (!raw || typeof raw !== "object") return out;
  for (const { key } of WEEKDAYS) {
    const day = (raw as Record<string, unknown>)[key];
    if (!day || typeof day !== "object") continue;
    const d = day as { open?: string; close?: string; closed?: boolean };
    if (typeof d.open === "string" && /^\d{1,2}:\d{2}$/.test(d.open)) out[key].open = d.open;
    if (typeof d.close === "string" && /^\d{1,2}:\d{2}$/.test(d.close)) out[key].close = d.close;
    if (typeof d.closed === "boolean") out[key].closed = d.closed;
  }
  return out;
}

function hoursWeekToPayload(week: HoursWeek): Record<WeekdayKey, { open?: string; close?: string; closed?: boolean }> {
  const out: Record<string, { open?: string; close?: string; closed?: boolean }> = {};
  for (const { key } of WEEKDAYS) {
    const d = week[key];
    if (d.closed) {
      out[key] = { closed: true };
    } else {
      out[key] = { open: d.open, close: d.close };
    }
  }
  return out as Record<WeekdayKey, { open?: string; close?: string; closed?: boolean }>;
}

export default function AdminBrandKit() {
  const utils = trpc.useUtils();
  const { data: dealerships } = trpc.admin.listDealerships.useQuery();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: brand, isLoading: brandLoading } =
    trpc.adminDealerships.getBrandKit.useQuery(
      { dealershipId: Number(selectedId) },
      { enabled: !!selectedId },
    );

  const [form, setForm] = useState({
    brandLogoUrl: "",
    brandAccentColor: DEFAULT_ACCENT,
    brandSignature: "",
    vatNumber: "",
    bankDetails: "",
  });
  const [hours, setHours] = useState<HoursWeek>(() => normaliseHours(null));
  const [hoursOverrideEnabled, setHoursOverrideEnabled] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setForm({
      brandLogoUrl: brand.raw.brandLogoUrl ?? "",
      brandAccentColor: brand.raw.brandAccentColor ?? DEFAULT_ACCENT,
      brandSignature: brand.raw.brandSignature ?? "",
      vatNumber: brand.raw.vatNumber ?? "",
      bankDetails: brand.raw.bankDetails ?? "",
    });
    const rawHours = (brand.raw as { businessHoursJson?: Record<string, unknown> | null }).businessHoursJson ?? null;
    setHours(normaliseHours(rawHours));
    setHoursOverrideEnabled(!!rawHours);
  }, [brand]);

  const update = trpc.adminDealerships.updateBrandKit.useMutation({
    onSuccess: () => {
      utils.adminDealerships.getBrandKit.invalidate();
      toast.success("Brand kit saved");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const previewAccent = useMemo(() => {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(form.brandAccentColor)
      ? form.brandAccentColor
      : DEFAULT_ACCENT;
  }, [form.brandAccentColor]);

  return (
    <AdminShell
      title="Brand kit"
      subtitle="One source of truth for the visual identity each agent uses on outbound emails, invoices, and WhatsApp messages."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" /> Pick a dealership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select dealership…" />
              </SelectTrigger>
              <SelectContent>
                {(dealerships ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-3">
              Brand fields are optional. If you leave them empty the agent
              outputs default to the GrayArx gold/black look.
            </p>
          </CardContent>
        </Card>

        {!selectedId && (
          <Card className="card-premium">
            <CardContent className="p-10 text-center text-muted-foreground">
              Pick a dealership on the left to edit its brand kit.
            </CardContent>
          </Card>
        )}

        {selectedId && (
          <div className="space-y-5">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Logo URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={form.brandLogoUrl}
                      onChange={(e) =>
                        setForm({ ...form, brandLogoUrl: e.target.value })
                      }
                      placeholder="https://cdn.example.com/logo.png"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        toast.info(
                          "File upload UI coming soon. Paste a public URL for now.",
                        )
                      }
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Accent colour (hex)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={form.brandAccentColor}
                        onChange={(e) =>
                          setForm({ ...form, brandAccentColor: e.target.value })
                        }
                        placeholder="#C9A24A"
                      />
                      <div
                        className="w-10 h-10 rounded-md border border-primary/20"
                        style={{ background: previewAccent }}
                        aria-label="colour preview"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>VAT number</Label>
                    <Input
                      className="mt-1"
                      value={form.vatNumber}
                      onChange={(e) =>
                        setForm({ ...form, vatNumber: e.target.value })
                      }
                      placeholder="4250123456"
                    />
                  </div>
                </div>
                <div>
                  <Label>Email signature line</Label>
                  <Textarea
                    rows={2}
                    value={form.brandSignature}
                    onChange={(e) =>
                      setForm({ ...form, brandSignature: e.target.value })
                    }
                    placeholder="Karoo Motors · Family-owned since 1972"
                  />
                </div>
                <div>
                  <Label>Bank details (free-form, masked to customers)</Label>
                  <Textarea
                    rows={2}
                    value={form.bankDetails}
                    onChange={(e) =>
                      setForm({ ...form, bankDetails: e.target.value })
                    }
                    placeholder="FNB · Branch 250655 · Acc 62012345678"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Business hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-card/40 p-3">
                  <div>
                    <div className="font-medium">Override default hours</div>
                    <div className="text-xs text-muted-foreground">
                      Off → use the GrayArx default (Mon–Fri 08:00–18:00, Sat 08:00–13:00, closed Sun). On → use the schedule below; Bongi (Fallback agent) auto-replies outside these hours.
                    </div>
                  </div>
                  <Switch
                    checked={hoursOverrideEnabled}
                    onCheckedChange={setHoursOverrideEnabled}
                  />
                </div>
                {hoursOverrideEnabled && (
                  <div className="space-y-2">
                    {WEEKDAYS.map(({ key, label }) => {
                      const d = hours[key];
                      return (
                        <div
                          key={key}
                          className="grid grid-cols-[110px_1fr_1fr_auto] items-center gap-3 rounded-md border border-primary/10 bg-card/30 px-3 py-2"
                        >
                          <div className="text-sm font-medium">{label}</div>
                          <Input
                            type="time"
                            value={d.open}
                            disabled={d.closed}
                            onChange={(e) =>
                              setHours({ ...hours, [key]: { ...d, open: e.target.value } })
                            }
                          />
                          <Input
                            type="time"
                            value={d.close}
                            disabled={d.closed}
                            onChange={(e) =>
                              setHours({ ...hours, [key]: { ...d, close: e.target.value } })
                            }
                          />
                          <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                            <input
                              type="checkbox"
                              checked={d.closed}
                              onChange={(e) =>
                                setHours({
                                  ...hours,
                                  [key]: { ...d, closed: e.target.checked },
                                })
                              }
                            />
                            Closed
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base">Live preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg border p-4"
                  style={{ borderTop: `3px solid ${previewAccent}` }}
                >
                  <div className="flex items-center gap-3">
                    {form.brandLogoUrl ? (
                      <img
                        src={form.brandLogoUrl}
                        alt="logo preview"
                        className="h-10 w-10 rounded-md object-contain bg-black/40 p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-xs text-primary">
                        Logo
                      </div>
                    )}
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: previewAccent }}
                      >
                        Mia · {brand?.dealershipName ?? "Your dealership"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {form.brandSignature ||
                          "Powered by GrayArx · The Dealership AI Operating System"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setForm({
                    brandLogoUrl: brand?.raw.brandLogoUrl ?? "",
                    brandAccentColor:
                      brand?.raw.brandAccentColor ?? DEFAULT_ACCENT,
                    brandSignature: brand?.raw.brandSignature ?? "",
                    vatNumber: brand?.raw.vatNumber ?? "",
                    bankDetails: brand?.raw.bankDetails ?? "",
                  })
                }
                disabled={brandLoading}
              >
                Reset
              </Button>
              <Button
                className="btn-gold"
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({
                    dealershipId: Number(selectedId),
                    brandLogoUrl: form.brandLogoUrl || null,
                    brandAccentColor: form.brandAccentColor || null,
                    brandSignature: form.brandSignature || null,
                    vatNumber: form.vatNumber || null,
                    bankDetails: form.bankDetails || null,
                    businessHoursJson: hoursOverrideEnabled
                      ? hoursWeekToPayload(hours)
                      : null,
                  })
                }
              >
                {update.isPending ? "Saving…" : "Save brand kit"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
