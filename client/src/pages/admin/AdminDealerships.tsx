import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Settings2, Plug, Network, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
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
import { Link } from "wouter";
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
  const [groupDealershipId, setGroupDealershipId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const groupKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const d of data ?? []) {
      if (d.groupKey) keys.add(d.groupKey);
    }
    return Array.from(keys).sort();
  }, [data]);

  return (
    <AdminShell
      title="Dealerships"
      subtitle="Every dealership currently on GrayArx. Manage modules, WhatsApp phone_number_id, LLM tier, and multi-branch groups."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateGroupOpen(true)}>
            <Network className="h-3.5 w-3.5 mr-2" />
            Create group
          </Button>
          <Button className="btn-gold" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-2" />
            New dealership
          </Button>
        </div>
      }
    >
      <div className="mb-6 max-w-3xl rounded-xl border border-primary/20 bg-muted/20 p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Multi-branch: one dealership per branch, same <code className="text-primary">groupKey</code>{" "}
          (e.g. <code className="text-primary">acme</code>). Each branch keeps its own stock, WhatsApp
          phone_number_id, and shortcode. Dealers with siblings see a Branch switcher in the console.
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Founder ops — 5 clicks to live
          </p>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
            <li>
              <strong className="text-foreground">Create group</strong> — slug (e.g. acme) via the
              button above.
            </li>
            <li>
              <strong className="text-foreground">Create / open each branch</strong> — one dealership
              row per yard.
            </li>
            <li>
              <strong className="text-foreground">Assign groupKey</strong> — same key on every branch
              (Group key dialog).
            </li>
            <li>
              <strong className="text-foreground">WhatsApp + shortcode</strong> — set each branch’s
              Meta phone_number_id (WhatsApp/LLM) and confirm publicShortcode.
            </li>
            <li>
              <strong className="text-foreground">Smoke-test</strong> — dealer logs in → Branch
              switcher → inventory/leads change per branch.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">
            Requires migration <code className="text-primary">0069_dealer_groups</code> on Railway
            (in apply-pending). Import stock per branch — never mix yards in one CSV.
          </p>
        </div>
      </div>

      {groupKeys.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {groupKeys.map((key) => (
            <Link key={key} href={`/admin/groups/${encodeURIComponent(key)}`}>
              <Badge
                variant="outline"
                className="cursor-pointer hover:border-primary hover:text-primary"
              >
                Group · {key}
              </Badge>
            </Link>
          ))}
        </div>
      )}

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
                  {d.groupKey ? (
                    <Link href={`/admin/groups/${encodeURIComponent(d.groupKey)}`}>
                      <p className="text-xs text-primary mt-1 font-mono hover:underline">
                        group · {d.groupKey}
                      </p>
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">No group (single branch)</p>
                  )}
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
              <div className="mt-4 flex flex-wrap gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setGroupDealershipId(d.id)}
                >
                  <Network className="h-3.5 w-3.5 mr-2" />
                  Group key
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
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
      {groupDealershipId !== null && (
        <GroupKeyDialog
          dealershipId={groupDealershipId}
          currentKey={data?.find((d: any) => d.id === groupDealershipId)?.groupKey ?? null}
          dealershipName={data?.find((d: any) => d.id === groupDealershipId)?.name ?? ""}
          onClose={() => setGroupDealershipId(null)}
        />
      )}
      {createOpen && <CreateDealershipDialog onClose={() => setCreateOpen(false)} />}
      {createGroupOpen && <CreateGroupDialog onClose={() => setCreateGroupOpen(false)} />}
      {deleteTarget && (
        <DeleteDealershipDialog
          dealershipId={deleteTarget.id}
          dealershipName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </AdminShell>
  );
}

function DeleteDealershipDialog({
  dealershipId,
  dealershipName,
  onClose,
}: {
  dealershipId: number;
  dealershipName: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [confirmName, setConfirmName] = useState("");
  const remove = trpc.adminDealerships.remove.useMutation({
    onSuccess: (res) => {
      toast.success(
        `Deleted "${dealershipName}" — ${res.vehicles} vehicle(s), ${res.leads} lead(s), ${res.bookings} booking(s) removed; ${res.usersUnlinked} user(s) unlinked.`,
      );
      utils.adminDealerships.list.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const matches = confirmName.trim() === dealershipName.trim();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete dealership
          </DialogTitle>
          <DialogDescription>
            This permanently deletes <strong className="text-foreground">{dealershipName}</strong>{" "}
            and all of its vehicles, photos, leads, and test-drive bookings. Any staff accounts
            linked to it are kept but unlinked. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            Type the dealership name to confirm
          </Label>
          <Input
            id="confirm-name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={dealershipName}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!matches || remove.isPending}
            onClick={() => remove.mutate({ dealershipId, confirmName: confirmName.trim() })}
          >
            {remove.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateGroupDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const create = trpc.adminDealerships.createGroup.useMutation({
    onSuccess: (res) => {
      toast.success(
        res.created
          ? `Group “${res.key}” created — assign it on each branch`
          : `Group “${res.key}” already exists`,
      );
      utils.adminDealerships.listGroups.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create dealer group</DialogTitle>
          <DialogDescription>
            Multi-branch: one dealership per branch, same groupKey. Create the group first, then
            assign the key on each branch (or pass it when creating/approving a dealership).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="group-key">Group key (slug)</Label>
            <Input
              id="group-key"
              className="font-mono mt-1"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="acme"
            />
          </div>
          <div>
            <Label htmlFor="group-name">Display name (optional)</Label>
            <Input
              id="group-name"
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Motors Group"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="btn-gold"
            disabled={key.trim().length < 2 || create.isPending}
            onClick={() =>
              create.mutate({ key: key.trim(), name: name.trim() || undefined })
            }
          >
            {create.isPending ? "Creating…" : "Create group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateDealershipDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [waId, setWaId] = useState("");

  const create = trpc.adminDealerships.create.useMutation({
    onSuccess: (res) => {
      toast.success(`Dealership #${res.id} created · shortcode ${res.publicShortcode}`);
      utils.adminDealerships.list.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New dealership</DialogTitle>
          <DialogDescription>
            Optional groupKey links this branch into a multi-branch group. Leave blank for a
            single-dealer shop.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="d-name">Name</Label>
            <Input
              id="d-name"
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Motors Sandton"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="d-region">Region</Label>
              <Input
                id="d-region"
                className="mt-1"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Gauteng"
              />
            </div>
            <div>
              <Label htmlFor="d-group">Group key (optional)</Label>
              <Input
                id="d-group"
                className="font-mono mt-1"
                value={groupKey}
                onChange={(e) => setGroupKey(e.target.value)}
                placeholder="acme"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="d-email">Contact email</Label>
            <Input
              id="d-email"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@acme.co.za"
            />
          </div>
          <div>
            <Label htmlFor="d-phone">Contact phone</Label>
            <Input
              id="d-phone"
              className="mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27…"
            />
          </div>
          <div>
            <Label htmlFor="d-wa">WhatsApp phone_number_id (optional)</Label>
            <Input
              id="d-wa"
              className="font-mono mt-1"
              value={waId}
              onChange={(e) => setWaId(e.target.value)}
              placeholder="Meta phone_number_id"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="btn-gold"
            disabled={name.trim().length < 2 || create.isPending}
            onClick={() =>
              create.mutate({
                name: name.trim(),
                region: region.trim() || null,
                contactEmail: email.trim() || null,
                contactPhone: phone.trim() || null,
                groupKey: groupKey.trim() || null,
                whatsappPhoneNumberId: waId.trim() || null,
                status: "active",
              })
            }
          >
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupKeyDialog({
  dealershipId,
  currentKey,
  dealershipName,
  onClose,
}: {
  dealershipId: number;
  currentKey: string | null;
  dealershipName: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [groupKey, setGroupKey] = useState(currentKey ?? "");

  useEffect(() => {
    setGroupKey(currentKey ?? "");
  }, [currentKey]);

  const save = trpc.adminDealerships.setGroupKey.useMutation({
    onSuccess: (res) => {
      toast.success(
        res.groupKey
          ? `Assigned to group “${res.groupKey}”`
          : "Cleared group key (single-dealer)",
      );
      utils.adminDealerships.list.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Group key · {dealershipName}
          </DialogTitle>
          <DialogDescription>
            Multi-branch: one dealership per branch, same groupKey. Clear the field to leave this
            dealership as a single-branch shop.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="gk">groupKey</Label>
          <Input
            id="gk"
            className="font-mono mt-1"
            value={groupKey}
            onChange={(e) => setGroupKey(e.target.value)}
            placeholder="acme"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="btn-gold"
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                dealershipId,
                groupKey: groupKey.trim() || null,
              })
            }
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
            Meta phone_number_id routes inbound WhatsApp to this dealer. Usually auto-bound from
            onboarding or the first webhook that matches contact phone — use this dialog only to
            override. LLM follows plan (Showroom+Growth→gpt-4o-mini, Multi-site→gpt-4o) unless
            overridden.
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
                  {DEALERSHIP_MODULES.filter(
                    (m) => m.category === cat && m.id !== "voice_agent",
                  ).map((m) => (
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
