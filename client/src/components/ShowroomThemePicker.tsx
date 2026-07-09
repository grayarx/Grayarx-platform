import { cn } from "@/lib/utils";
import { SHOWROOM_THEMES, type ShowroomThemeId } from "@shared/showroomThemes";
import { Check } from "lucide-react";

interface ShowroomThemePickerProps {
  value: ShowroomThemeId;
  onChange: (theme: ShowroomThemeId) => void;
  disabled?: boolean;
}

export default function ShowroomThemePicker({ value, onChange, disabled }: ShowroomThemePickerProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {SHOWROOM_THEMES.map((theme) => {
        const selected = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(theme.id)}
            className={cn(
              "relative text-left rounded-xl border p-4 transition-all duration-200",
              "hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selected
                ? "border-primary/60 bg-primary/5 shadow-[0_0_24px_rgba(212,175,55,0.12)]"
                : "border-border/60 bg-card/30",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <div
              className="h-16 rounded-lg mb-3 border border-white/10 flex items-end p-2 gap-1.5"
              style={{ background: theme.preview.background }}
            >
              <span
                className="h-2 w-8 rounded-full"
                style={{ background: theme.preview.accent }}
              />
              <span
                className="h-1.5 flex-1 rounded-full opacity-40"
                style={{ background: theme.preview.text }}
              />
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-sm font-semibold">{theme.name}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {theme.description}
                </p>
              </div>
              {selected && (
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
