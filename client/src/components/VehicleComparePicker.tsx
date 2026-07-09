import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatVehiclePrice } from "@/lib/formatPrice";

export type CompareVehicleOption = {
  id: number;
  title: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: string | number | null;
};

function vehicleSearchText(v: CompareVehicleOption): string {
  return [v.title, v.make, v.model, v.year != null ? String(v.year) : ""]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesQuery(v: CompareVehicleOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const hay = vehicleSearchText(v);
  return terms.every((t) => hay.includes(t));
}

type Props = {
  vehicles: CompareVehicleOption[];
  onSelect: (id: number) => void;
  placeholder?: string;
  className?: string;
};

export default function VehicleComparePicker({
  vehicles,
  onSelect,
  placeholder = "Search make, model, year…",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => vehicles.filter((v) => matchesQuery(v, query)),
    [vehicles, query],
  );

  const pick = (id: number) => {
    onSelect(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate text-muted-foreground">{placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type Ford, BMW, 2022…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {vehicles.length === 0
                ? "No vehicles left to add."
                : "No matches — try make, model, or year."}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((v) => (
                <CommandItem
                  key={v.id}
                  value={String(v.id)}
                  onSelect={() => pick(v.id)}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <div className="flex w-full items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 opacity-0" />
                    <span className="font-medium truncate flex-1">{v.title}</span>
                    <span className="text-xs text-primary shrink-0">
                      {formatVehiclePrice(v.price)}
                    </span>
                  </div>
                  {(v.make || v.model) && (
                    <span className="pl-6 text-xs text-muted-foreground">
                      {[v.make, v.model].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
