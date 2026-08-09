import { describe, expect, it } from "vitest";
import { formatPilotProofDigestText, type PilotProofDigest } from "./_core/pilotProofDigest";

describe("formatPilotProofDigestText", () => {
  it("includes key pilot metrics and talking points", () => {
    const digest: PilotProofDigest = {
      periodDays: 7,
      leadsLast7d: 12,
      leadsToday: 2,
      testDrivesPending: 3,
      testDrivesConfirmed: 1,
      testDrivesLast7d: 4,
      preApprovalsPending: 2,
      preApprovalsLast7d: 5,
      afterHoursRepliesLast7d: 7,
      dealershipsActive: 3,
      generatedAt: "2026-08-09T00:00:00.000Z",
      talkingPoints: ["12 leads captured in the last 7 days."],
    };
    const text = formatPilotProofDigestText(digest);
    expect(text).toContain("GrayArx pilot proof");
    expect(text).toContain("Leads: 12");
    expect(text).toContain("After-hours (Bongi): 7");
    expect(text).toContain("• 12 leads captured in the last 7 days.");
  });
});
