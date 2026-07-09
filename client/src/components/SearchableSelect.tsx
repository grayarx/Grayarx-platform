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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
  /** Resolve aliases on select (e.g. vw → Volkswagen) */
  resolveValue?: (raw: string) => string;
  /** Custom ranked search */
  searchOptions?: (query: string) => string[];
  /** Inline hint e.g. "Did you mean Volkswagen?" */
  matchHint?: (query: string) => string | null;
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  allowCustom = true,
  className,
  resolveValue,
  searchOptions,
  matchHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const resolved = resolveValue && trimmed ? resolveValue(trimmed) : null;
  const hint = matchHint?.(trimmed);

  const filtered = useMemo(() => {
    if (searchOptions) return searchOptions(trimmed);
    if (!trimmed) return [...options];
    const q = trimmed.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, trimmed, searchOptions]);

  const showCustom =
    allowCustom &&
    trimmed.length > 0 &&
    !filtered.some((o) => o.toLowerCase() === trimmed.toLowerCase()) &&
    !(resolved && filtered.some((o) => o.toLowerCase() === resolved.toLowerCase()));

  const pick = (picked: string) => {
    const final = resolveValue ? resolveValue(picked) : picked;
    onChange(final);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type vw, merc, hilux…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {resolved && resolved.toLowerCase() !== trimmed.toLowerCase() && (
                <div className="px-3 py-2 text-xs text-primary border-b border-border/50 bg-primary/5">
                  Matched: <strong>{resolved}</strong>
                </div>
              )}
              <CommandEmpty>
                {showCustom || resolved ? "Select a suggestion below." : "No matches."}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem key={option} value={option} onSelect={() => pick(option)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
                {resolved &&
                  !filtered.some((o) => o.toLowerCase() === resolved.toLowerCase()) && (
                    <CommandItem value={resolved} onSelect={() => pick(resolved)}>
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      {resolved}
                      <span className="ml-auto text-xs text-muted-foreground">
                        &ldquo;{trimmed}&rdquo;
                      </span>
                    </CommandItem>
                  )}
                {showCustom && !resolved && (
                  <CommandItem value={trimmed} onSelect={() => pick(trimmed)}>
                    Use &ldquo;{trimmed}&rdquo;
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {hint && hint !== value && (
        <p className="text-[11px] text-primary/80 px-1">
          Did you mean{" "}
          <button type="button" className="underline font-medium" onClick={() => onChange(hint)}>
            {hint}
          </button>
          ?
        </p>
      )}
    </div>
  );
}
