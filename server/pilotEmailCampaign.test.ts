import { describe, it, expect } from "vitest";
import { grayArxLogoUrl, grayArxEmailHeader } from "../shared/emailBranding";
import {
  mailableProspects,
  groupProspectsBySegment,
  PILOT_PROSPECTS,
} from "../shared/pilotProspectSegments";
import {
  generateSegmentPilotEmailHTML,
  generateSegmentPilotEmailText,
  subjectForSegment,
} from "./_core/pilotEmailTemplate";
import { previewPilotCampaign } from "./_core/pilotEmailCampaignService";

describe("pilot email campaign", () => {
  it("logo URL is the circular GA crest PNG", () => {
    const url = grayArxLogoUrl();
    expect(url).toContain("/logo-crest.png");
    expect(url).toContain("v=14");
    expect(url).not.toContain(".svg");
    expect(url).not.toContain("logo-icon-132");
  });

  it("email header matches site layout (icon + wordmark)", () => {
    const header = grayArxEmailHeader();
    expect(header).toContain('role="presentation"');
    expect(header).toContain("logo-crest.png");
    expect(header).not.toContain("cid:grayarx-logo-icon");
    expect(header).toContain("GrayArx");
    expect(header).toContain("AI Platform");
    expect(header).not.toContain("<p ");
  });

  it("groups prospects into four segments", () => {
    const groups = groupProspectsBySegment();
    expect(Object.keys(groups)).toHaveLength(4);
    expect(groups.basic_website_no_showroom.length).toBeGreaterThanOrEqual(3);
  });

  it("dedupes mailable prospects by email", () => {
    const mailable = mailableProspects();
    const emails = mailable.map((p) => p.email!.toLowerCase());
    expect(new Set(emails).size).toBe(emails.length);
    for (const p of mailable) {
      expect(p.emailVerified).toBe(true);
      expect(p.email).toBeTruthy();
      // Generic info@ must not be in the default send list
      expect(p.email!.toLowerCase().startsWith("info@")).toBe(false);
    }
  });

  it("generates segment-specific HTML with dealership name", () => {
    const sample = PILOT_PROSPECTS.find((p) => p.id === "jubilee-springs")!;
    const html = generateSegmentPilotEmailHTML({
      dealershipName: sample.dealershipName,
      contactName: sample.contactName,
      city: sample.city,
      segment: sample.segment,
    });
    expect(html).toContain("Jubilee Motors");
    expect(html).toContain("logo-crest.png");
    expect(html).not.toContain("cid:grayarx-logo-icon");
    expect(html).toContain("Apply for the 14-day Pilot");
    expect(html).not.toContain("Segment:");
    expect(html).not.toContain("manus.space");
    expect(html).not.toContain("position:absolute");
    expect(html).toContain("/privacy-policy");
    expect(html).toContain("unsubscribe");
  });

  it("plain-text pilot email includes legal footer", () => {
    const sample = PILOT_PROSPECTS[0]!;
    const text = generateSegmentPilotEmailText({
      dealershipName: sample.dealershipName,
      contactName: sample.contactName,
      city: sample.city,
      segment: sample.segment,
    });
    expect(text).toContain("privacy-policy");
    expect(text.toLowerCase()).toContain("unsubscribe");
    expect(text).toContain("POPIA");
  });

  it("each segment has a distinct subject line", () => {
    const subjects = new Set([
      subjectForSegment("no_website_social_only"),
      subjectForSegment("basic_website_no_showroom"),
      subjectForSegment("after_hours_leak"),
      subjectForSegment("whatsapp_manual"),
    ]);
    expect(subjects.size).toBe(4);
  });

  it("preview campaign reports mailable counts per segment", async () => {
    const preview = await previewPilotCampaign();
    expect(preview.length).toBe(4);
    const basic = preview.find((p) => p.segment === "basic_website_no_showroom");
    // Only named/principal emails are mailable — Jubilee darius@ remains
    expect(basic?.mailable).toBeGreaterThanOrEqual(1);
    expect(basic?.sampleHtml).toContain("<img");
    const allEmails: string[] = [];
    for (const row of preview) {
      expect(row.needsEnrichment).toBeGreaterThanOrEqual(0);
      for (const p of row.prospects) {
        expect(p.emailVerified).toBe(true);
        expect(p.email).toBeTruthy();
        expect(p.email!.toLowerCase().startsWith("info@")).toBe(false);
        allEmails.push(p.email!.toLowerCase());
      }
    }
    expect(new Set(allEmails).size).toBe(allEmails.length);
    // Most curated rows need principal enrichment after demoting info@
    expect(preview.some((r) => r.enrichmentNeededTotal > 5)).toBe(true);
  });
});
