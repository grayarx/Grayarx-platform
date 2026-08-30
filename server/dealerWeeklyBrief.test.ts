import { describe, expect, it } from "vitest";
import {
  buildAftercareCheckInDraft,
  buildDealerWeeklyBrief,
  buildReviewAskDraft,
  formatDealerWeeklyBriefText,
} from "../shared/dealerWeeklyBrief";

describe("dealer weekly brief", () => {
  it("builds talking points from yard stats", () => {
    const brief = buildDealerWeeklyBrief({
      dealershipName: "Jubilee Motors",
      leadsLast7Days: 4,
      bookingsLast7Days: 2,
      afterHoursRepliesLast7Days: 7,
      overdueFollowups: 1,
      pendingFollowups: 3,
      availableVehicles: 42,
      soldVehicles: 10,
    });
    expect(brief.talkingPoints.some((t) => t.includes("after-hours"))).toBe(true);
    expect(brief.talkingPoints.some((t) => t.includes("4 new leads"))).toBe(true);
    expect(formatDealerWeeklyBriefText(brief)).toContain("Jubilee Motors");
    expect(formatDealerWeeklyBriefText(brief)).toContain("This week's numbers");
  });

  it("review + aftercare drafts include dealership name", () => {
    expect(
      buildReviewAskDraft({
        dealershipName: "AMC",
        googleReviewUrl: "https://g.page/r/test",
        customerFirstName: "Thabo",
      }),
    ).toContain("g.page");
    expect(
      buildAftercareCheckInDraft({
        dealershipName: "AMC",
        vehicleLabel: "2020 Hilux",
        customerFirstName: "Thabo",
      }),
    ).toContain("Hilux");
  });
});
