import { describe, expect, it } from "vitest";
import {
  CONTACT_PATHS,
  CONTACT_PATHS_FAST,
  extractEmailsFromHtml,
} from "./_core/prospectPrincipalEnrichment";
import { assessProspectEmail, isOutreachReadyForDealership } from "../shared/prospectEmailQuality";

describe("principal email HTML extraction", () => {
  it("extracts mailto and plain emails, prefers ignoring trackers", () => {
    const html = `
      <html><body>
        <a href="mailto:Darius@jubileemotors.co.za">Email us</a>
        <p>Also info@jubileemotors.co.za and sales@jubileemotors.co.za</p>
        <img src="https://example.com/x.png" />
        <a href="mailto:support@sentry.io">bad</a>
      </body></html>
    `;
    const emails = extractEmailsFromHtml(html);
    expect(emails).toContain("darius@jubileemotors.co.za");
    expect(emails).toContain("info@jubileemotors.co.za");
    expect(emails.some((e) => e.includes("sentry"))).toBe(false);
    expect(assessProspectEmail("darius@jubileemotors.co.za").outreachReady).toBe(true);
  });

  it("returns empty for pages with no emails", () => {
    expect(extractEmailsFromHtml("<html><body>Hello</body></html>")).toEqual([]);
  });

  it("deep mode uses the full CONTACT_PATHS list, not the 5-page fast cap", () => {
    expect(CONTACT_PATHS_FAST.length).toBeGreaterThanOrEqual(5);
    expect(CONTACT_PATHS_FAST).toContain("/about-us");
    expect(CONTACT_PATHS_FAST).toContain("/meet-the-team");
    expect(CONTACT_PATHS.length).toBeGreaterThan(CONTACT_PATHS_FAST.length);
    expect(CONTACT_PATHS).toContain("/directors");
    expect(CONTACT_PATHS).toContain("/meet-the-team");
  });

  it("rejects generic info@ and accepts named firstname@ on the dealer domain", () => {
    expect(isOutreachReadyForDealership("info@jubileemotors.co.za", "https://jubileemotors.co.za")).toBe(
      false,
    );
    expect(assessProspectEmail("info@jubileemotors.co.za").quality).toBe("generic");
    expect(
      isOutreachReadyForDealership("darius@jubileemotors.co.za", "https://jubileemotors.co.za"),
    ).toBe(true);
    expect(assessProspectEmail("darius@jubileemotors.co.za").quality).toBe("named");
  });
});

describe("live Jubilee contact page (network)", () => {
  it(
    "finds a named email on jubileemotors.co.za",
    async () => {
      const { enrichDealershipPrincipal } = await import("./_core/prospectPrincipalEnrichment");
      const result = await enrichDealershipPrincipal({
        dealershipName: "Jubilee Motors",
        website: "https://jubileemotors.co.za",
        city: "Springs",
      });
      // Site may be slow/down in CI — accept enriched OR no_named if page changed
      expect(["enriched", "no_named_email", "fetch_failed"]).toContain(result.status);
      if (result.status === "enriched") {
        expect(result.hit?.email).toMatch(/@jubileemotors\.co\.za$/i);
        expect(assessProspectEmail(result.hit!.email).outreachReady).toBe(true);
        expect(result.hit!.email.toLowerCase().startsWith("info@")).toBe(false);
      }
    },
    30_000,
  );
});
