import { readJsonFile, writeJsonFile } from "@/lib/conversion/store";

export type DealershipModules = {
  sales: boolean;
  parts: boolean;
  service: boolean;
  tradeIn: boolean;
  finance: boolean;
  missedCall: boolean;
};

export type PartsPricingSource =
  | "manual"
  | "csv_import"
  | "dms_feed"
  | "supplier_feed";

export type DealershipSettings = {
  dealershipId: string;
  name: string;
  modules: DealershipModules;
  parts: {
    enabled: boolean;
    pricingSource: PartsPricingSource;
    /** Markup % applied when importing cost-only rows */
    defaultMarkupPercent: number;
    /** Show retail price to buyers on WhatsApp */
    showPriceToBuyer: boolean;
    /** If out of stock, offer to order / book service fitment */
    allowBackorderMessage: boolean;
    lastImportAt?: string;
    lastImportCount?: number;
  };
  showroomSlug: string;
  updatedAt: string;
};

type State = { settings: DealershipSettings[] };

const FILE = "dealership-settings.json";

const DEFAULT_MODULES: DealershipModules = {
  sales: true,
  parts: true,
  service: true,
  tradeIn: true,
  finance: true,
  missedCall: true,
};

function defaultSettings(dealershipId: string, name: string): DealershipSettings {
  return {
    dealershipId,
    name,
    modules: { ...DEFAULT_MODULES },
    parts: {
      enabled: true,
      pricingSource: "csv_import",
      defaultMarkupPercent: 35,
      showPriceToBuyer: true,
      allowBackorderMessage: true,
    },
    showroomSlug: dealershipId,
    updatedAt: new Date().toISOString(),
  };
}

function load(): State {
  return readJsonFile(FILE, {
    settings: [
      defaultSettings("demo-yard", "Sandton Motors"),
      {
        ...defaultSettings("yard-pta", "Pretoria Motors"),
        // Example: PTA sales-only (no parts counter)
        modules: {
          ...DEFAULT_MODULES,
          parts: false,
        },
        parts: {
          enabled: false,
          pricingSource: "manual",
          defaultMarkupPercent: 35,
          showPriceToBuyer: true,
          allowBackorderMessage: false,
        },
      },
    ],
  });
}

function save(state: State) {
  writeJsonFile(FILE, state);
}

export function listDealershipSettings(): DealershipSettings[] {
  return load().settings;
}

export function getDealershipSettings(
  dealershipId = "demo-yard",
): DealershipSettings {
  const state = load();
  const existing = state.settings.find((s) => s.dealershipId === dealershipId);
  if (existing) return existing;
  const created = defaultSettings(dealershipId, dealershipId);
  state.settings.push(created);
  save(state);
  return created;
}

export function updateDealershipSettings(
  dealershipId: string,
  patch: Partial<
    Omit<DealershipSettings, "dealershipId" | "parts" | "modules">
  > & {
    modules?: Partial<DealershipModules>;
    parts?: Partial<DealershipSettings["parts"]>;
  },
): DealershipSettings {
  const state = load();
  let settings = state.settings.find((s) => s.dealershipId === dealershipId);
  if (!settings) {
    settings = defaultSettings(dealershipId, dealershipId);
    state.settings.push(settings);
  }
  if (patch.name) settings.name = patch.name;
  if (patch.showroomSlug) settings.showroomSlug = patch.showroomSlug;
  if (patch.modules) settings.modules = { ...settings.modules, ...patch.modules };
  if (patch.parts) {
    settings.parts = { ...settings.parts, ...patch.parts };
    settings.parts.enabled = settings.modules.parts;
  }
  // Keep parts.enabled in sync with modules.parts
  if (patch.modules?.parts !== undefined) {
    settings.parts.enabled = patch.modules.parts;
  }
  settings.updatedAt = new Date().toISOString();
  save(state);
  return settings;
}

export function isModuleEnabled(
  dealershipId: string,
  module: keyof DealershipModules,
): boolean {
  const s = getDealershipSettings(dealershipId);
  return s.modules[module];
}
