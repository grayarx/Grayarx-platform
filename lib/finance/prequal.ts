import { newId, readJsonFile, writeJsonFile } from "@/lib/conversion/store";

export type FinanceApplication = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  vehicleId?: string;
  vehicleLabel?: string;
  monthlyBudget?: number;
  deposit?: number;
  partnerUrl: string;
  status: "started" | "docs_pending" | "submitted" | "closed";
  checklist: Array<{ id: string; label: string; done: boolean }>;
  nalaReply: string;
  createdAt: string;
  dealershipId: string;
};

type State = { applications: FinanceApplication[] };

const FILE = "finance.json";

function load(): State {
  return readJsonFile(FILE, { applications: [] });
}

function save(state: State) {
  writeJsonFile(FILE, state);
}

const PARTNER_BASE =
  process.env.FINANCE_PARTNER_URL?.trim() ||
  "https://finance.partner.example/prequal";

export function startFinancePrequal(input: {
  buyerName: string;
  buyerPhone: string;
  vehicleId?: string;
  vehicleLabel?: string;
  monthlyBudget?: number;
  deposit?: number;
  dealershipId?: string;
}): FinanceApplication {
  const id = newId("fin");
  const partnerUrl = `${PARTNER_BASE}?ref=${id}&dealer=${encodeURIComponent(input.dealershipId ?? "demo-yard")}`;
  const name = input.buyerName.split(" ")[0] || "there";

  const app: FinanceApplication = {
    id,
    buyerName: input.buyerName.trim(),
    buyerPhone: input.buyerPhone.trim(),
    vehicleId: input.vehicleId,
    vehicleLabel: input.vehicleLabel,
    monthlyBudget: input.monthlyBudget,
    deposit: input.deposit,
    partnerUrl,
    status: "docs_pending",
    checklist: [
      { id: "id", label: "SA ID / passport photo", done: false },
      { id: "payslip", label: "Latest payslip", done: false },
      { id: "bank", label: "3-month bank statement", done: false },
      { id: "proof", label: "Proof of address", done: false },
    ],
    nalaReply: `Hi ${name} — I'm Nala. I've started a finance pre-qual${input.vehicleLabel ? ` for the ${input.vehicleLabel}` : ""}. Open this secure link to continue: ${partnerUrl}\n\nYou'll need: ID, payslip, bank statement, proof of address. Reply here when you've uploaded — I'll nudge the finance desk.`,
    createdAt: new Date().toISOString(),
    dealershipId: input.dealershipId ?? "demo-yard",
  };

  const state = load();
  state.applications.unshift(app);
  save(state);
  return app;
}

export function markFinanceDoc(
  applicationId: string,
  checklistId: string,
  done: boolean,
): FinanceApplication | { error: string } {
  const state = load();
  const app = state.applications.find((a) => a.id === applicationId);
  if (!app) return { error: "Application not found." };
  const item = app.checklist.find((c) => c.id === checklistId);
  if (!item) return { error: "Checklist item not found." };
  item.done = done;
  if (app.checklist.every((c) => c.done)) app.status = "submitted";
  save(state);
  return app;
}

export function listFinanceApplications(): FinanceApplication[] {
  return load().applications;
}
