import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";

export type PilotStatus = "not_started" | "active" | "completed";

export type Pilot = {
  id: string;
  dealershipName: string;
  startedAt: string;
  endsAt: string;
  status: PilotStatus;
  goals: string[];
  checklist: Array<{ id: string; label: string; done: boolean }>;
};

const FILE = "pilot.json";

const DEFAULT_CHECKLIST = [
  { id: "stock", label: "Load live stock (CSV or manual)", done: false },
  {
    id: "sources",
    label: "Connect AutoTrader / Cars.co.za / website / missed-call",
    done: false,
  },
  { id: "nala", label: "Nala answering under 60 seconds", done: false },
  { id: "booking", label: "At least one viewing booked", done: false },
  { id: "roi", label: "Monday ROI report reviewed with dealer", done: false },
];

export function getPilot(): Pilot | null {
  const data = readJsonFile<{ pilot: Pilot | null }>(FILE, { pilot: null });
  return data.pilot;
}

export function startPilot(dealershipName: string): Pilot {
  const started = new Date();
  const ends = new Date(started.getTime() + 14 * 24 * 60 * 60 * 1000);
  const pilot: Pilot = {
    id: newId("pilot"),
    dealershipName: dealershipName.trim() || "Demo Yard",
    startedAt: started.toISOString(),
    endsAt: ends.toISOString(),
    status: "active",
    goals: [
      "Answer every after-hours enquiry under 60 seconds",
      "Book viewings from AutoTrader / website leads",
      "Prove ROI on Monday report — no cancel needed",
    ],
    checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
  };
  writeJsonFile(FILE, { pilot });
  return pilot;
}

export function updatePilotChecklist(
  itemId: string,
  done: boolean,
): Pilot | null {
  const pilot = getPilot();
  if (!pilot) return null;
  const item = pilot.checklist.find((c) => c.id === itemId);
  if (!item) return null;
  item.done = done;
  if (pilot.checklist.every((c) => c.done)) pilot.status = "completed";
  writeJsonFile(FILE, { pilot });
  return pilot;
}
