import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CASH_CTAS,
  CASH_ELEVATOR,
  CASH_EMAIL_SEGMENTS,
  CASH_FOR_YOU_IF,
  CASH_FORM,
  CASH_HOME,
  CASH_PAS,
  CASH_PILOT_DAYS,
  CASH_PILOT_WA_CAP,
  CASH_RISK_REVERSAL,
  CASH_SALES_SUBJECTS,
} from "../shared/cashvertising";
import { PILOT_SEGMENT_SUBJECTS } from "../shared/pilotProspectSegments";
import { generateSegmentPilotEmailHTML, generateSegmentPilotEmailText } from "./_core/pilotEmailTemplate";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function pitchBlob(): string {
  return [
    CASH_FORM.proofBody,
    CASH_HOME.ctaSub,
    CASH_HOME.qualifierSub,
    CASH_ELEVATOR,
    CASH_PAS.solve,
    CASH_PAS.agitate.join(" "),
    CASH_FOR_YOU_IF.join(" "),
    CASH_RISK_REVERSAL.join(" "),
    Object.values(CASH_EMAIL_SEGMENTS)
      .map((s) => `${s.subject} ${s.hook} ${s.bullets.join(" ")}`)
      .join(" "),
  ].join(" ");
}

describe("dealer pitch copy", () => {
  it("keeps the 14-day / 150 WA offer honest and specific", () => {
    expect(CASH_PILOT_DAYS).toBe(14);
    expect(CASH_PILOT_WA_CAP).toBe(150);
    expect(CASH_HOME.sub).toContain("14 days");
    expect(CASH_HOME.sub.toLowerCase()).toContain("no card");
    expect(CASH_RISK_REVERSAL.join(" ")).toContain("R0");
    expect(CASH_RISK_REVERSAL.join(" ")).toContain("150");
  });

  it("speaks to independent WhatsApp-heavy yards without naming competitors", () => {
    expect(CASH_FOR_YOU_IF.length).toBeGreaterThanOrEqual(4);
    expect(CASH_FOR_YOU_IF.join(" ").toLowerCase()).toMatch(/whatsapp/);
    expect(CASH_FOR_YOU_IF.join(" ").toLowerCase()).toMatch(/csv|dms/);
    expect(pitchBlob().toLowerCase()).not.toMatch(/autotrader|salesforce|cars\.co\.za/);
    expect(pitchBlob().toLowerCase()).not.toContain("henrique");
    expect(pitchBlob().toLowerCase()).not.toContain("whitman");
    expect(pitchBlob().toLowerCase()).not.toContain("cashvertising");
  });

  it("uses after-hours leak language, not a feature dump", () => {
    expect(CASH_PAS.problem.toLowerCase()).toContain("whatsapp");
    expect(CASH_PAS.agitate.length).toBeGreaterThanOrEqual(3);
    expect(CASH_HOME.h1Accent.length).toBeGreaterThan(8);
    expect(CASH_ELEVATOR.toLowerCase()).toContain("csv");
    expect(CASH_CTAS.primary.toLowerCase()).toContain("no card");
  });

  it("does not invent testimonials or conversion percentages", () => {
    const blob = pitchBlob();
    expect(blob.toLowerCase()).not.toContain("john mthembu");
    expect(blob).not.toMatch(/\d+%\s+(more|higher|faster|increase)/i);
    expect(blob.toLowerCase()).not.toContain("3-5x");
  });

  it("keeps sipho subject curiosity-first and named", () => {
    const subject = CASH_SALES_SUBJECTS.sipho("Jubilee Motors");
    expect(subject).toContain("Jubilee Motors");
    expect(subject.toLowerCase()).toMatch(/whatsapp|9pm|after-hours|silence/);
    expect(subject).not.toMatch(/40%/);
  });
});

describe("pilot outreach email", () => {
  it("aligns segment subjects with the pitch SOT", () => {
    expect(PILOT_SEGMENT_SUBJECTS.no_website_social_only).toBe(
      CASH_EMAIL_SEGMENTS.no_website_social_only.subject,
    );
    expect(PILOT_SEGMENT_SUBJECTS.after_hours_leak).toBe(CASH_EMAIL_SEGMENTS.after_hours_leak.subject);
    expect(new Set(Object.values(PILOT_SEGMENT_SUBJECTS)).size).toBe(4);
  });

  it("sends 14-day copy, not a 7-day trial, and skips fake stats", () => {
    const html = generateSegmentPilotEmailHTML({
      dealershipName: "Jubilee Motors",
      contactName: "Darius",
      city: "Springs",
      segment: "after_hours_leak",
    });
    const text = generateSegmentPilotEmailText({
      dealershipName: "Jubilee Motors",
      contactName: "Darius",
      city: "Springs",
      segment: "after_hours_leak",
    });
    expect(html).toContain("14-day");
    expect(html).not.toContain("7-day");
    expect(html).toContain("Jubilee Motors");
    expect(html).toContain(CASH_CTAS.applyPilot);
    expect(html.toLowerCase()).not.toContain("3-5x");
    expect(html.toLowerCase()).not.toMatch(/autotrader/);
    expect(text).toContain("14-day");
    expect(text).not.toContain("7-day");
  });
});

describe("marketing surfaces", () => {
  it("lead capture has no fake testimonial", () => {
    const src = readFileSync(join(ROOT, "client/src/components/LeadCaptureFormOptimized.tsx"), "utf8");
    expect(src.toLowerCase()).not.toContain("john mthembu");
    expect(src).not.toMatch(/captured 47 qualified leads/i);
    expect(src).toContain("CASH_CTAS.formSubmit");
  });

  it("home uses the pitch headline and does not show a not-for-you list", () => {
    const src = readFileSync(join(ROOT, "client/src/pages/Home.tsx"), "utf8");
    expect(src).toContain("CASH_HOME.h1Accent");
    expect(src).toContain("CASH_FOR_YOU_IF");
    expect(src).not.toContain("CASH_NOT_FOR_YOU_IF");
    expect(src.toLowerCase()).not.toContain("not for you");
  });
});
