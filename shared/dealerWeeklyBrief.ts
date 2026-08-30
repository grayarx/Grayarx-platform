/**
 * Pure helpers for the weekly DP (dealership principal) brief.
 * Server fills numbers via getDashboardStats; this formats talking points.
 */

export type DealerBriefStats = {
  dealershipName: string;
  leadsLast7Days: number;
  bookingsLast7Days: number;
  afterHoursRepliesLast7Days: number;
  overdueFollowups: number;
  pendingFollowups: number;
  availableVehicles: number;
  soldVehicles: number;
};

export type DealerWeeklyBrief = DealerBriefStats & {
  periodDays: number;
  generatedAt: string;
  talkingPoints: string[];
};

export function buildDealerWeeklyBriefTalkingPoints(
  s: DealerBriefStats,
  periodDays = 7,
): string[] {
  const points: string[] = [];
  if (s.afterHoursRepliesLast7Days > 0) {
    points.push(
      `${s.afterHoursRepliesLast7Days} after-hours replies caught — buyers who would have gone cold overnight.`,
    );
  } else {
    points.push(
      "No after-hours replies logged this week — confirm WhatsApp is linked so Nala can catch night traffic.",
    );
  }
  if (s.leadsLast7Days > 0) {
    points.push(`${s.leadsLast7Days} new leads in the last ${periodDays} days.`);
  }
  if (s.bookingsLast7Days > 0) {
    points.push(`${s.bookingsLast7Days} test-drive bookings created this week.`);
  }
  if (s.overdueFollowups > 0) {
    points.push(
      `${s.overdueFollowups} Mia follow-ups are overdue — clear them before the weekend.`,
    );
  } else if (s.pendingFollowups > 0) {
    points.push(`${s.pendingFollowups} Mia follow-ups still queued.`);
  }
  if (s.availableVehicles > 0) {
    points.push(`${s.availableVehicles} cars live on your showroom right now.`);
  }
  if (points.length < 2) {
    points.push(
      "Push showroom + WhatsApp this week — one recovered lead usually pays for the month.",
    );
  }
  return points;
}

export function buildDealerWeeklyBrief(
  s: DealerBriefStats,
  periodDays = 7,
): DealerWeeklyBrief {
  return {
    ...s,
    periodDays,
    generatedAt: new Date().toISOString(),
    talkingPoints: buildDealerWeeklyBriefTalkingPoints(s, periodDays),
  };
}

export function formatDealerWeeklyBriefText(b: DealerWeeklyBrief): string {
  return [
    `This week's numbers — ${b.dealershipName}`,
    `Last ${b.periodDays} days`,
    ``,
    `After-hours replies: ${b.afterHoursRepliesLast7Days}`,
    `New leads: ${b.leadsLast7Days}`,
    `Test drives booked: ${b.bookingsLast7Days}`,
    `Mia overdue / pending: ${b.overdueFollowups} / ${b.pendingFollowups}`,
    `Live stock: ${b.availableVehicles} · Sold (all time): ${b.soldVehicles}`,
    ``,
    `What to act on:`,
    ...b.talkingPoints.map((t) => `• ${t}`),
    ``,
    `Open desk: https://www.grayarx.com/dashboard`,
    `Generated ${b.generatedAt}`,
  ].join("\n");
}

/** WhatsApp / SMS draft asking for a Google review after a sale. */
export function buildReviewAskDraft(opts: {
  dealershipName: string;
  googleReviewUrl: string | null;
  customerFirstName?: string;
}): string {
  const name = opts.customerFirstName?.trim() || "there";
  const link = opts.googleReviewUrl?.trim();
  if (link) {
    return `Hi ${name}, thanks again for choosing ${opts.dealershipName}. If we looked after you, a quick Google review helps other buyers trust us: ${link}`;
  }
  return `Hi ${name}, thanks again for choosing ${opts.dealershipName}. If we looked after you, a quick Google review would mean a lot — search us on Google Maps and tap five stars.`;
}

/** Day-30 aftercare check-in draft. */
export function buildAftercareCheckInDraft(opts: {
  dealershipName: string;
  vehicleLabel: string;
  customerFirstName?: string;
}): string {
  const name = opts.customerFirstName?.trim() || "there";
  return `Hi ${name}, ${opts.dealershipName} here — how is the ${opts.vehicleLabel} treating you? Anything we can help with (service booking, accessories, trade-up)? Reply here anytime.`;
}
