import { listBookings, listLeads } from "@/lib/conversion/leads";
import { getStock, listAvailable } from "@/lib/conversion/stock";

export type RoiReport = {
  generatedAt: string;
  periodLabel: string;
  totals: {
    leadsReceived: number;
    answeredUnder60s: number;
    afterHoursRecovered: number;
    viewingsBooked: number;
    handedOff: number;
    availableStock: number;
    soldStock: number;
  };
  bySource: Record<string, number>;
  conversionRate: number;
  afterHoursShare: number;
  headline: string;
  proofLines: string[];
};

export function buildMondayRoiReport(): RoiReport {
  const leads = listLeads();
  const bookings = listBookings();
  const stock = getStock();

  const answeredUnder60s = leads.filter((l) => {
    if (!l.answeredAt) return false;
    return (
      new Date(l.answeredAt).getTime() - new Date(l.createdAt).getTime() <=
      60_000
    );
  }).length;

  const afterHoursRecovered = leads.filter((l) => l.recoveredAfterHours).length;
  const viewingsBooked = leads.filter(
    (l) => l.status === "viewing_booked",
  ).length;
  const handedOff = leads.filter((l) => l.status === "handed_off").length;

  const bySource: Record<string, number> = {};
  for (const lead of leads) {
    bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
  }

  const conversionRate =
    leads.length === 0 ? 0 : Math.round((viewingsBooked / leads.length) * 100);
  const afterHoursShare =
    leads.length === 0
      ? 0
      : Math.round((afterHoursRecovered / leads.length) * 100);

  const soldStock = stock.vehicles.filter((v) => v.status === "sold").length;
  const availableStock = listAvailable().length;

  const proofLines = [
    `${answeredUnder60s}/${leads.length || 0} enquiries answered in under 60 seconds`,
    `${afterHoursRecovered} after-hours enquiries recovered (would have waited until next open)`,
    `${viewingsBooked} viewings booked by Nala`,
    `${availableStock} vehicles live on stock · ${soldStock} marked sold (removed from buyer answers)`,
  ];

  const headline =
    leads.length === 0
      ? "No enquiries yet — ingest an AutoTrader/Cars.co.za lead or missed call to start the report."
      : `Nala recovered ${afterHoursRecovered} after-hours leads and booked ${viewingsBooked} viewings (${conversionRate}% lead→viewing).`;

  return {
    generatedAt: new Date().toISOString(),
    periodLabel: "All recorded activity (pilot)",
    totals: {
      leadsReceived: leads.length,
      answeredUnder60s,
      afterHoursRecovered,
      viewingsBooked,
      handedOff,
      availableStock,
      soldStock,
    },
    bySource,
    conversionRate,
    afterHoursShare,
    headline,
    proofLines,
  };
}
