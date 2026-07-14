import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Settings2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DEALERSHIP_MODULES,
  type DealershipModuleId,
} from "@shared/dealershipModules";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  onboarding: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  suspended: "bg-destructive/10 text-destructive border-destructive/30",
  churned: "bg-muted text-muted-foreground border-muted-foreground/30",
};

export default function AdminDealerships() {
  const { data, isLoading } = trpc.adminDealerships.list.useQuery();
  const [modulesDealershipId, setModulesDealershipId] = useState<number | null>(null);
  const [integrationsDealershipId, setIntegrationsDealershipId] = useState<number | null>(null);

  return (
    <AdminShell
      title="Dealerships"
      subtitle="Every dealership currently on GrayArx. Manage modules, WhatsApp phone_number_id, and LLM tier."
    >
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No dealerships provisioned yet.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((d: any) => (
          <Card key={d.id} className="card-premium">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold truncate">{d.name}</h3>
                  <p className="text-sm text-muted-foreground">{d.region}</p>
                </div>
                <Badge className={`text-xs ${STATUS_COLORS[d.status] ?? ""}`}>
                  {d.status}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-display text-xl font-bold">{d.leadsCount ?? 0}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Leads</div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold">{d.vehiclesCount ?? 0}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Stock</div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold capitalize">{d.plan ?? "starter"}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Plan</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setModulesDealershipId(d.id)}
                >
                  <Settings2 className="h-3.5 w-3.5 mr-2" />
                  Modules
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIntegrationsDealershipId(d.id)}
                >
                  <Plug className="h-3.5 w-3.5 mr-2" />
                  WhatsApp / LLM
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {modulesDealershipId !== null && (
        <ModuleTogglesDialog
          dealershipId={modulesDealershipId}
          onClose={() => setModulesDealershipId(null)}
        />
      )}
      {integrationsDealershipId !== null && (
        <IntegrationsDialog
          dealershipId={integrationsDealershipId}
          onClose={() => setIntegrationsDealershipId(null)}
        />
      )}
    </AdminShell>
  );
}

function IntegrationsDialog({
  dealershipId,
  onClose,
}: {
  dealershipId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminDealerships.getIntegrations.useQuery({ dealershipId });
  const [phoneId, setPhoneId] = useState("");
  const [llmModel, setLlmModel] = useState("");

  useEffect(() => {
    if (!data) return;
    setPhoneId(data.whatsappPhoneNumberId ?? "");
    setLlmModel(data.llmModel ?? "");
  }, [data]);

  const update = trpc.adminDealerships.updateIntegrations.useMutation({
    onSuccess: () => {
      toast.success("Integrations saved");
      utils.adminDealerships.getIntegrations.invalidate({ dealershipId });
      utils.adminDealerships.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            WhatsApp & LLM · {data?.dealershipName ?? "…"}
          </DialogTitle>
          <DialogDescription>
            Meta phone_number_id routes inbound WhatsApp to this dealer. LLM follows
            plan (starter→mini, Growth→gpt-4o, enterprise→premium) unless overridden.
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-muted-foreground py-4">Loading…</p>}
        {!isLoading && data && (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="wa-phone-id">WhatsApp phone_number_id</Label>
              <Input
                id="wa-phone-id"
                className="font-mono mt-1"
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                placeholder="e.g. 1245737138612982"
              />
              <p className="text-xs text-muted-foreground mt-1">
                From Meta Developer → WhatsApp → API Setup.
              </p>
            </div>
            <div>
              <Label htmlFor="llm-model">LLM model override (optional)</Label>
              <Input
                id="llm-model"
                className="font-mono mt-1"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                placeholder="Leave blank to use plan default"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Plan <span className="capitalize font-medium">{data.plan}</span> resolves to{" "}
                <code>{data.resolvedLlmModel}</code>
                {data.llmModel ? " (override active)" : ""}.
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            className="btn-gold"
            disabled={update.isPending || isLoading}
            onClick={() =>
              update.mutate({
                dealershipId,
                whatsappPhoneNumberId: phoneId.trim() || null,
                llmModel: llmModel.trim() || null,
              })
            }
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModuleTogglesDialog({
  dealershipId,
  onClose,
}: {
  dealershipId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminDealerships.getModules.useQuery({ dealershipId });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const update = trpc.adminDealerships.updateModules.useMutation({
    onSuccess: () => {
      toast.success("Module toggles updated.");
      utils.adminDealerships.getModules.invalidate({ dealershipId });
      setPending({});
    },
    onError: (e) => toast.error(e.message),
  });

  const stored = data?.modulesEnabled ?? {};
  const effective = (id: DealershipModuleId): boolean => {
    if (id in pending) return pending[id];
    if (id in stored) return Boolean(stored[id]);
    return true;
  };

  const dirty = Object.keys(pending).length > 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Modules · {data?.dealershipName ?? "Loading…"}
          </DialogTitle>
          <DialogDescription>
            Flip individual GrayArx features on or off for this dealership. New
            modules default to enabled.
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-muted-foreground py-6">Loading…</p>}
        {!isLoading && (
          <div className="space-y-6 py-2">
            {(["buyer-facing", "operations", "agents"] as const).map((cat) => (
              <div key={cat}>
                <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  {cat.replace("-", " ")}
                </h3>
                <div className="space-y-2">
                  {DEALERSHIP_MODULES.filter((m) => m.category === cat).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start justify-between gap-4 p-3 rounded-md border border-border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{m.title}</div>
                        <div className="text-sm text-muted-foreground">{m.description}</div>
                      </div>
                      <Switch
                        checked={effective(m.id)}
                        onCheckedChange={(v) =>
                          setPending((prev) => ({ ...prev, [m.id]: v }))
                        }
                        disabled={!m.toggleable}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            className="btn-gold"
            disabled={!dirty || update.isPending}
            onClick={() =>
              update.mutate({ dealershipId, patch: pending as Record<string, boolean> })
            }
          >
            {update.isPending ? "Saving…" : `Save ${Object.keys(pending).length} change(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
