/**
 * Cost-of-inaction / money-left-on-table math for dealer sales.
 * Conservative defaults dealers recognise from SA independent yards.
 */

export type ValueInputs = {
  /** Online enquiries per week (AutoTrader + Cars + WhatsApp + web) */
  weeklyEnquiries: number;
  /** Share that arrive after hours / weekends (0–1) */
  afterHoursShare: number;
  /** Share of slow/missed after-hours leads that book elsewhere (0–1) */
  lossRateWithoutReply: number;
  /** Share of booked viewings that become a sale (0–1) */
  viewingToSaleRate: number;
  /** Average gross profit per car sale (ZAR) */
  avgGrossProfitZar: number;
  /** Missed calls per week to the yard line */
  weeklyMissedCalls: number;
  /** Share of missed calls that never call back (0–1) */
  missedCallLossRate: number;
  /** GrayArx Professional monthly fee for comparison */
  grayArxMonthlyZar: number;
};

export const DEFAULT_VALUE_INPUTS: ValueInputs = {
  weeklyEnquiries: 40,
  afterHoursShare: 0.35,
  lossRateWithoutReply: 0.4,
  viewingToSaleRate: 0.25,
  avgGrossProfitZar: 18000,
  weeklyMissedCalls: 12,
  missedCallLossRate: 0.35,
  grayArxMonthlyZar: 11990,
};

export type ValueReport = {
  inputs: ValueInputs;
  weekly: {
    afterHoursLeads: number;
    leadsLostWithoutGrayArx: number;
    missedCallsLost: number;
    totalLeadsAtRisk: number;
    salesLost: number;
    gpLostZar: number;
  };
  monthly: {
    salesLost: number;
    gpLostZar: number;
    grayArxCostZar: number;
    netKeptZar: number;
    roiMultiple: number;
  };
  annual: {
    gpLostZar: number;
    grayArxCostZar: number;
    netKeptZar: number;
  };
  headlines: string[];
  oneLiner: string;
  dealerPitch: string[];
};

export function calculateValue(partial?: Partial<ValueInputs>): ValueReport {
  const inputs: ValueInputs = { ...DEFAULT_VALUE_INPUTS, ...partial };

  const afterHoursLeads = inputs.weeklyEnquiries * inputs.afterHoursShare;
  const leadsLostWithoutGrayArx = afterHoursLeads * inputs.lossRateWithoutReply;
  const missedCallsLost = inputs.weeklyMissedCalls * inputs.missedCallLossRate;
  const totalLeadsAtRisk = leadsLostWithoutGrayArx + missedCallsLost;
  const salesLostWeekly = totalLeadsAtRisk * inputs.viewingToSaleRate;
  const gpLostWeekly = salesLostWeekly * inputs.avgGrossProfitZar;

  const salesLostMonthly = salesLostWeekly * 4.3;
  const gpLostMonthly = gpLostWeekly * 4.3;
  const netKeptMonthly = gpLostMonthly - inputs.grayArxMonthlyZar;
  const roiMultiple =
    inputs.grayArxMonthlyZar > 0 ? gpLostMonthly / inputs.grayArxMonthlyZar : 0;

  const gpLostAnnual = gpLostMonthly * 12;
  const costAnnual = inputs.grayArxMonthlyZar * 12;

  const headlines = [
    `Without GrayArx you risk ~${Math.round(totalLeadsAtRisk)} hot leads a week going cold (after-hours + missed calls).`,
    `That’s about ${salesLostMonthly.toFixed(1)} lost sales / month × R${inputs.avgGrossProfitZar.toLocaleString("en-ZA")} GP ≈ R${Math.round(gpLostMonthly).toLocaleString("en-ZA")} left on the table.`,
    `GrayArx Professional is R${inputs.grayArxMonthlyZar.toLocaleString("en-ZA")}/mo — roughly ${roiMultiple.toFixed(1)}× return if you only recover that leakage.`,
  ];

  return {
    inputs,
    weekly: {
      afterHoursLeads: round1(afterHoursLeads),
      leadsLostWithoutGrayArx: round1(leadsLostWithoutGrayArx),
      missedCallsLost: round1(missedCallsLost),
      totalLeadsAtRisk: round1(totalLeadsAtRisk),
      salesLost: round1(salesLostWeekly),
      gpLostZar: Math.round(gpLostWeekly),
    },
    monthly: {
      salesLost: round1(salesLostMonthly),
      gpLostZar: Math.round(gpLostMonthly),
      grayArxCostZar: inputs.grayArxMonthlyZar,
      netKeptZar: Math.round(netKeptMonthly),
      roiMultiple: round1(roiMultiple),
    },
    annual: {
      gpLostZar: Math.round(gpLostAnnual),
      grayArxCostZar: costAnnual,
      netKeptZar: Math.round(gpLostAnnual - costAnnual),
    },
    headlines,
    oneLiner: `Not using GrayArx costs this yard about R${Math.round(gpLostMonthly).toLocaleString("en-ZA")}/mo in leaked after-hours and missed-call deals — GrayArx is R${inputs.grayArxMonthlyZar.toLocaleString("en-ZA")}/mo.`,
    dealerPitch: [
      "You already pay AutoTrader for traffic. GrayArx stops that traffic dying overnight.",
      "Free 14-day pilot on YOUR stock — Monday numbers decide, not a sales deck.",
      "One OS: sales + parts (optional) + service + trade-in + finance link + missed calls.",
      "Your prices, your SKUs, your CRM kept — we add the AI that answers first.",
      `If even one extra car a month closes, GP (~R${inputs.avgGrossProfitZar.toLocaleString("en-ZA")}) already beats the subscription.`,
    ],
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Blend live pilot ROI counts into a money story when we have real bookings */
export function moneyFromPilot(input: {
  viewingsBooked: number;
  afterHoursRecovered: number;
  avgGrossProfitZar?: number;
  viewingToSaleRate?: number;
  grayArxMonthlyZar?: number;
}): {
  estimatedGpFromViewingsZar: number;
  afterHoursRecovered: number;
  viewingsBooked: number;
  vsSubscription: string;
} {
  const gp = input.avgGrossProfitZar ?? DEFAULT_VALUE_INPUTS.avgGrossProfitZar;
  const rate = input.viewingToSaleRate ?? DEFAULT_VALUE_INPUTS.viewingToSaleRate;
  const fee = input.grayArxMonthlyZar ?? DEFAULT_VALUE_INPUTS.grayArxMonthlyZar;
  const estimatedSales = input.viewingsBooked * rate;
  const estimatedGp = Math.round(estimatedSales * gp);
  return {
    estimatedGpFromViewingsZar: estimatedGp,
    afterHoursRecovered: input.afterHoursRecovered,
    viewingsBooked: input.viewingsBooked,
    vsSubscription:
      estimatedGp >= fee
        ? `Pilot viewings alone imply ~R${estimatedGp.toLocaleString("en-ZA")} GP potential vs R${fee.toLocaleString("en-ZA")}/mo fee — already a no-brainer.`
        : `Keep the pilot running — one more recovered weekend deal usually clears the monthly fee.`,
  };
}
