import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Camera, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadPhotoGuideState,
  savePhotoGuideState,
  resetPhotoGuideState,
  PHOTO_GUIDE_STEPS,
} from "@/lib/photoGuidePrefs";

function usePhotoGuideState() {
  const [state, setState] = useState(loadPhotoGuideState);
  useEffect(() => {
    const sync = () => setState(loadPhotoGuideState());
    window.addEventListener("grayarx-photo-guide-change", sync);
    return () => window.removeEventListener("grayarx-photo-guide-change", sync);
  }, []);
  return [state, setState] as const;
}

/** Dashboard card — sits in page flow, not a popup. Dismiss or collapse once. */
export function PhotoGuideCard({ className }: { className?: string }) {
  const [state, setState] = usePhotoGuideState();

  if (state.dismissed) return null;

  const toggleCollapsed = () => {
    const next = savePhotoGuideState({ collapsed: !state.collapsed });
    setState(next);
  };

  const dismiss = () => {
    const next = savePhotoGuideState({ dismissed: true, collapsed: true });
    setState(next);
  };

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border border-primary/15 bg-card/50 overflow-hidden",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-primary/10">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Camera className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Showroom photos — about 60 seconds
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              No technical setup. Follow these four steps once — your stock will look like a top
              luxury dealer.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={state.collapsed ? "Expand photo guide" : "Collapse photo guide"}
          >
            {state.collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Dismiss photo guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!state.collapsed && (
        <div className="px-4 py-4 sm:px-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PHOTO_GUIDE_STEPS.map((s) => (
            <Link
              key={s.step}
              href={s.href}
              className="group rounded-lg border border-primary/10 bg-background/40 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Step {s.step}
                </span>
                <span className="text-[10px] text-muted-foreground">{s.time}</span>
              </div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                {s.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
            </Link>
          ))}
        </div>
      )}

      {state.collapsed && (
        <div className="px-4 py-2.5 sm:px-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {PHOTO_GUIDE_STEPS.map((s) => (
            <Link key={s.step} href={s.href} className="hover:text-primary transition-colors">
              {s.step}. {s.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** One-line contextual hint on inventory / import / photo pages — expand on click only. */
export function PhotoGuideHint({ className }: { className?: string }) {
  const [state, setState] = usePhotoGuideState();
  const [expanded, setExpanded] = useState(false);

  if (state.hintsHidden || state.dismissed) return null;

  const hideHints = () => {
    const next = savePhotoGuideState({ hintsHidden: true });
    setState(next);
  };

  return (
    <div
      className={cn(
        "mb-6 rounded-lg border border-primary/10 bg-muted/15 text-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <Camera className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">
          <span className="text-foreground font-medium">Photo tip:</span> CSV import with save
          photos ON → drop images on the 8-angle grid → preview showroom.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline font-medium"
          >
            {expanded ? "Hide steps" : "Show 4 steps"}
          </button>
          <button
            type="button"
            onClick={hideHints}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Hide tips
          </button>
        </div>
      </div>

      {expanded && (
        <ol className="border-t border-primary/10 px-3 py-3 sm:px-4 grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          {PHOTO_GUIDE_STEPS.map((s) => (
            <li key={s.step} className="flex gap-2">
              <span className="font-semibold text-primary shrink-0">{s.step}.</span>
              <span>
                <Link href={s.href} className="text-foreground font-medium hover:text-primary">
                  {s.title}
                </Link>
                {" — "}
                {s.body}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Footer link to re-open guide if dismissed — subtle, in dealer shell */
export function PhotoGuideRestoreLink() {
  const [state, setState] = usePhotoGuideState();
  if (!state.dismissed && !state.hintsHidden) return null;

  return (
    <button
      type="button"
      className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
      onClick={() => {
        const next = resetPhotoGuideState();
        setState(next);
      }}
    >
      Show photo setup guide
    </button>
  );
}
