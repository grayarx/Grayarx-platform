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
  it("logo URL is the hosted emblem PNG", () => {
    const url = grayArxLogoUrl();
    expect(url).toContain("/grayarx-logo-emblem.png");
    expect(url).not.toContain(".svg");
    expect(url).not.toContain("email-logo-grayarx");
  });

  it("email header matches site layout (icon + wordmark)", () => {
    const header = grayArxEmailHeader();
    expect(header).toContain('role="presentation"');
    expect(header).toContain("grayarx-logo-emblem.png");
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
    expect(html).toContain("grayarx-logo-emblem.png");
    expect(html).not.toContain("cid:grayarx-logo-icon");
    expect(html).toContain("Apply for pilot access");
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
    expect(basic?.mailable).toBeGreaterThanOrEqual(3);
    expect(basic?.sampleHtml).toContain("<img");
    // UI list is verified emails only — never "no verified email" rows
    const allEmails: string[] = [];
    for (const row of preview) {
      expect(row.mailable).toBe(3);
      for (const p of row.prospects) {
        expect(p.emailVerified).toBe(true);
        expect(p.email).toBeTruthy();
        allEmails.push(p.email!.toLowerCase());
      }
    }
    expect(new Set(allEmails).size).toBe(allEmails.length);
  });
});
