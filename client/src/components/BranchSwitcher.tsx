import { Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Shown only when the dealer's dealership shares a groupKey with siblings.
 * Single-dealer accounts (no groupKey) render nothing.
 */
export default function BranchSwitcher() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.dealer.listBranches.useQuery(undefined, {
    staleTime: 30_000,
  });

  const switchBranch = trpc.dealer.switchBranch.useMutation({
    onSuccess: async (res) => {
      toast.success(`Switched to ${res.name}`);
      await utils.auth.me.invalidate();
      await utils.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !data?.groupKey || data.branches.length < 2) {
    return null;
  }

  const activeId = String(data.activeDealershipId ?? "");

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-primary shrink-0" aria-hidden />
      <Select
        value={activeId}
        disabled={switchBranch.isPending}
        onValueChange={(v) => {
          const id = Number(v);
          if (!id || id === data.activeDealershipId) return;
          switchBranch.mutate({ dealershipId: id });
        }}
      >
        <SelectTrigger size="sm" className="min-w-[10rem] max-w-[16rem]" aria-label="Switch branch">
          <SelectValue placeholder="Branch" />
        </SelectTrigger>
        <SelectContent>
          {data.branches.map((b) => (
            <SelectItem key={b.id} value={String(b.id)}>
              {b.name}
              {b.region ? ` · ${b.region}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
