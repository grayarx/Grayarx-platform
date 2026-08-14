/**
 * Go-live checklist — pure scoring for dealer time-to-live.
 * Used by dealer Overview to show "live this week" progress.
 */

export type GoLiveStepId =
  | "stock"
  | "showroom"
  | "whatsapp"
  | "drip"
  | "stock_sync";

export type GoLiveStep = {
  id: GoLiveStepId;
  label: string;
  hint: string;
  href: string;
  done: boolean;
  optional?: boolean;
};

export type GoLiveInput = {
  availableVehicles: number;
  publicShortcode: string | null | undefined;
  whatsappPhoneNumberId: string | null | undefined;
  /** lead_drip module on (default true when unset) */
  leadDripEnabled: boolean;
  stockSyncEnabled: boolean;
  stockSyncFeedUrl: string | null | undefined;
  stockSyncLastAt: Date | string | null | undefined;
  /** Hours since last successful sync considered "healthy" */
  stockSyncFreshHours?: number;
};

export type GoLiveStatus = {
  steps: GoLiveStep[];
  completedRequired: number;
  requiredTotal: number;
  percent: number;
  isLive: boolean;
  nextStep: GoLiveStep | null;
};

function isFreshSync(
  lastAt: Date | string | null | undefined,
  freshHours: number,
): boolean {
  if (!lastAt) return false;
  const t = lastAt instanceof Date ? lastAt.getTime() : new Date(lastAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= freshHours * 60 * 60 * 1000;
}

/** Build go-live checklist from dealership facts (no I/O). */
export function buildGoLiveStatus(input: GoLiveInput): GoLiveStatus {
  const freshHours = input.stockSyncFreshHours ?? 48;
  const hasStock = input.availableVehicles > 0;
  const hasShortcode = Boolean(input.publicShortcode?.trim());
  const showroomReady = hasStock && hasShortcode;
  const waLinked = Boolean(input.whatsappPhoneNumberId?.trim());
  const syncConfigured =
    input.stockSyncEnabled && Boolean(input.stockSyncFeedUrl?.trim());
  const syncHealthy =
    syncConfigured && isFreshSync(input.stockSyncLastAt, freshHours);

  const steps: GoLiveStep[] = [
    {
      id: "stock",
      label: "Upload stock",
      hint: hasStock
        ? `${input.availableVehicles} vehicle${input.availableVehicles === 1 ? "" : "s"} available`
        : "Import a CSV so buyers see your cars",
      href: "/dealer/inventory/import",
      done: hasStock,
    },
    {
      id: "showroom",
      label: "Showroom live",
      hint: showroomReady
        ? `Public page ready (?shortcode=${input.publicShortcode})`
        : hasStock
          ? "Open your public showroom link from Overview"
          : "Needs stock first",
      href: hasShortcode
        ? `/showroom?shortcode=${encodeURIComponent(input.publicShortcode!.trim())}`
        : "/showroom",
      done: showroomReady,
    },
    {
      id: "whatsapp",
      label: "WhatsApp connected",
      hint: waLinked
        ? "Meta phone linked — Nala can answer after hours"
        : "Link your WhatsApp Business number in Settings",
      href: "/dealer/settings",
      done: waLinked,
    },
    {
      id: "drip",
      label: "Mia follow-ups on",
      hint: input.leadDripEnabled
        ? "Day 1 / 3 / 7 drip armed for new leads"
        : "Lead drip is off for this dealership",
      href: "/dealer/leads",
      done: input.leadDripEnabled,
    },
    {
      id: "stock_sync",
      label: "Live stock sync",
      hint: syncHealthy
        ? "Feed synced recently — stock stays fresh"
        : syncConfigured
          ? "Feed configured but last sync is stale — run Sync now"
          : "Optional: paste a Cars.co.za / DMS CSV feed URL",
      href: "/dealer/inventory/import",
      done: syncHealthy,
      optional: true,
    },
  ];

  const required = steps.filter((s) => !s.optional);
  const completedRequired = required.filter((s) => s.done).length;
  const requiredTotal = required.length;
  const percent =
    requiredTotal === 0
      ? 100
      : Math.round((completedRequired / requiredTotal) * 100);
  const nextStep = steps.find((s) => !s.done) ?? null;
  // "Live" = stock + showroom + (WhatsApp or at least drip) — WA is critical for wedge
  const isLive = hasStock && showroomReady && waLinked;

  return {
    steps,
    completedRequired,
    requiredTotal,
    percent,
    isLive,
    nextStep,
  };
}
