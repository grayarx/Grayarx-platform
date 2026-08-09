/**
 * Non-binding affordability hint for human F&I reviewers (Naledi).
 * Never used to auto-approve credit.
 */

export type AffordabilityFlag = "ok" | "tight" | "stretched" | "insufficient_data";

export type AffordabilityHint = {
  monthlyDisposable: number | null;
  debtToIncomeRatio: number | null;
  flag: AffordabilityFlag;
};

export function computeAffordabilityHint(input: {
  netMonthlyIncome?: number | null;
  totalMonthlyExpenses?: number | null;
  existingDebtMonthly?: number | null;
  grossMonthlyIncome?: number | null;
}): AffordabilityHint {
  const net = input.netMonthlyIncome ?? null;
  const exp = input.totalMonthlyExpenses ?? null;
  const debt = input.existingDebtMonthly ?? null;
  const gross = input.grossMonthlyIncome ?? null;

  if (net == null && gross == null) {
    return { monthlyDisposable: null, debtToIncomeRatio: null, flag: "insufficient_data" };
  }
  const incomeForRatio = net ?? gross ?? 0;
  const monthlyDisposable =
    net != null && exp != null ? Number((net - exp - (debt ?? 0)).toFixed(2)) : null;

  let debtRatio: number | null = null;
  if (incomeForRatio > 0 && debt != null) {
    debtRatio = Number(Math.min(1, debt / incomeForRatio).toFixed(2));
  }

  let flag: AffordabilityFlag = "ok";
  if (monthlyDisposable != null) {
    if (monthlyDisposable < 0) flag = "stretched";
    else if (monthlyDisposable < 2000) flag = "tight";
  } else {
    flag = "insufficient_data";
  }
  if (debtRatio != null && debtRatio >= 0.4) flag = "stretched";

  return { monthlyDisposable, debtToIncomeRatio: debtRatio, flag };
}

export const FI_DOCUMENT_CHECKLIST = [
  "3 months payslips (or 6 months business bank statements if self-employed)",
  "3 months bank statements",
  "Copy of SA ID / passport",
  "Proof of residence (not older than 3 months)",
  "Proof of current vehicle finance (if trade-in)",
] as const;

export const FI_BANK_PORTAL_NOTE =
  "Documents go to the dealer F&I manager, then into WesBank / MFC / Absa / Nedbank vehicle finance portals. The bank makes the credit decision — GrayArx never does.";

export function affordabilityLabel(flag: AffordabilityFlag): string {
  switch (flag) {
    case "ok":
      return "Looks manageable (hint only)";
    case "tight":
      return "Tight disposable income (hint only)";
    case "stretched":
      return "Stretched / high debt load (hint only)";
    default:
      return "Insufficient data for hint";
  }
}
