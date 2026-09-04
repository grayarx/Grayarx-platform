import { describe, expect, it } from "vitest";
import {
  buildProvisionedEmailHtml,
  planDealerOwnerLogin,
} from "../server/_core/onboardingProvision";

describe("planDealerOwnerLogin", () => {
  it("creates when email is unused", () => {
    expect(planDealerOwnerLogin(null, 9)).toEqual({ action: "create" });
  });

  it("links an existing user with no yard or the same yard", () => {
    expect(planDealerOwnerLogin({ id: 3, dealershipId: null }, 9)).toEqual({
      action: "link",
      userId: 3,
    });
    expect(planDealerOwnerLogin({ id: 3, dealershipId: 9 }, 9)).toEqual({
      action: "link",
      userId: 3,
    });
  });

  it("refuses to steal a user from another yard", () => {
    expect(planDealerOwnerLogin({ id: 3, dealershipId: 2 }, 9)).toEqual({
      action: "conflict",
      userId: 3,
      otherDealershipId: 2,
    });
  });
});

describe("buildProvisionedEmailHtml", () => {
  it("includes login, showroom, and first-night stock step", () => {
    const html = buildProvisionedEmailHtml({
      ownerName: "Thabo",
      dealershipName: "Acme Motors",
      email: "thabo@acme.test",
      temporaryPassword: "tmp-pass-1",
      shortcode: "acme",
    });
    expect(html).toContain("grayarx.com/login");
    expect(html).toContain("tmp-pass-1");
    expect(html).toContain("showroom?shortcode=acme");
    expect(html).toContain("Inventory → Import");
    expect(html).toContain("Is this still available");
  });
});
