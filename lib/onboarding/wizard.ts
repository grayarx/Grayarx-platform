import { readJsonFile, writeJsonFile } from "@/lib/conversion/store";
import {
  getDealershipSettings,
  updateDealershipSettings,
  type DealershipModules,
} from "@/lib/dealership/settings";
import { listAvailable } from "@/lib/conversion/stock";
import { listAllParts } from "@/lib/os/parts";
import { listCrmSubscriptions } from "@/lib/crm/webhooks";

export type OnboardStepId =
  | "yard"
  | "modules"
  | "stock"
  | "parts"
  | "channels"
  | "proof";

export type OnboardState = {
  dealershipId: string;
  dealershipName: string;
  currentStep: OnboardStepId;
  completed: OnboardStepId[];
  startedAt: string;
  finishedAt?: string;
};

const FILE = "onboarding.json";

const STEP_ORDER: OnboardStepId[] = [
  "yard",
  "modules",
  "stock",
  "parts",
  "channels",
  "proof",
];

export function getOnboarding(dealershipId = "demo-yard"): OnboardState {
  const all = readJsonFile<{ byId: Record<string, OnboardState> }>(FILE, {
    byId: {},
  });
  if (all.byId[dealershipId]) return all.byId[dealershipId]!;
  const settings = getDealershipSettings(dealershipId);
  const state: OnboardState = {
    dealershipId,
    dealershipName: settings.name,
    currentStep: "yard",
    completed: [],
    startedAt: new Date().toISOString(),
  };
  all.byId[dealershipId] = state;
  writeJsonFile(FILE, all);
  return state;
}

function save(state: OnboardState) {
  const all = readJsonFile<{ byId: Record<string, OnboardState> }>(FILE, {
    byId: {},
  });
  all.byId[state.dealershipId] = state;
  writeJsonFile(FILE, all);
}

export function advanceOnboarding(
  dealershipId: string,
  step: OnboardStepId,
  data?: {
    name?: string;
    modules?: Partial<DealershipModules>;
  },
): OnboardState {
  const state = getOnboarding(dealershipId);

  if (data?.name) {
    state.dealershipName = data.name;
    updateDealershipSettings(dealershipId, { name: data.name });
  }
  if (data?.modules) {
    updateDealershipSettings(dealershipId, { modules: data.modules });
  }

  if (!state.completed.includes(step)) state.completed.push(step);

  const idx = STEP_ORDER.indexOf(step);
  const next = STEP_ORDER[idx + 1];
  if (next) state.currentStep = next;
  else {
    state.finishedAt = new Date().toISOString();
    state.currentStep = "proof";
  }
  save(state);
  return state;
}

export type StepGuide = {
  id: OnboardStepId;
  title: string;
  dealerDoes: string;
  grayArxDoes: string;
  doneWhen: string;
  isDone: boolean;
};

export function getOnboardingGuides(dealershipId = "demo-yard"): {
  state: OnboardState;
  steps: StepGuide[];
  percentComplete: number;
  readyForPilot: boolean;
} {
  const state = getOnboarding(dealershipId);
  const settings = getDealershipSettings(dealershipId);
  const stockCount = listAvailable(dealershipId).length;
  const partsCount = listAllParts(dealershipId).length;
  const hasCrm = listCrmSubscriptions().length > 0;

  const steps: StepGuide[] = [
    {
      id: "yard",
      title: "Name your yard",
      dealerDoes: "Type the dealership name. One field.",
      grayArxDoes: "Creates your branch, showroom link, and Monday report title.",
      doneWhen: "Name saved",
      isDone: state.completed.includes("yard") || Boolean(settings.name),
    },
    {
      id: "modules",
      title: "Pick your desks",
      dealerDoes: "Toggle Sales / Parts / Service / Trade-in / Finance. Parts off if you don’t sell parts.",
      grayArxDoes: "Nala only offers the desks you switched on — no confusing extras.",
      doneWhen: "Modules chosen",
      isDone: state.completed.includes("modules"),
    },
    {
      id: "stock",
      title: "Load cars (CSV)",
      dealerDoes: "Export stock from your system → paste CSV. Or keep demo stock for the pilot.",
      grayArxDoes: "Nala answers buyers from THIS list only. Sold cars stop being offered.",
      doneWhen: "At least 1 live vehicle",
      isDone: stockCount > 0,
    },
    {
      id: "parts",
      title: "Parts catalog (optional)",
      dealerDoes: "If parts ON: paste your SKU CSV with your prices. If parts OFF: skip.",
      grayArxDoes: "Quotes your retail price / SKU. Never invents prices.",
      doneWhen: settings.modules.parts ? "Parts rows imported" : "Skipped (parts off)",
      isDone: !settings.modules.parts || partsCount > 0 || state.completed.includes("parts"),
    },
    {
      id: "channels",
      title: "Connect lead pipes",
      dealerDoes: "Point AutoTrader/Cars webhook here, or use “Poll demo leads”. Register CRM mock/real URL.",
      grayArxDoes: "Ingest → Nala WhatsApp → CRM event. Missed calls recover automatically.",
      doneWhen: "At least one channel tested",
      isDone: state.completed.includes("channels") || hasCrm,
    },
    {
      id: "proof",
      title: "See Monday money",
      dealerDoes: "Click “Send Monday ROI” and open the value calculator with your numbers.",
      grayArxDoes: "Shows recovered leads, viewings, and Rands left on the table without GrayArx.",
      doneWhen: "Pilot proof reviewed",
      isDone: Boolean(state.finishedAt) || state.completed.includes("proof"),
    },
  ];

  const doneCount = steps.filter((s) => s.isDone).length;
  return {
    state,
    steps,
    percentComplete: Math.round((doneCount / steps.length) * 100),
    readyForPilot: stockCount > 0 && state.completed.includes("yard"),
  };
}
