import { describe, it, expect } from "vitest";
import { resolveMailboxFromAddress } from "./_core/complianceMailbox";

describe("resolveMailboxFromAddress", () => {
  it("maps privacy@ addresses", () => {
    expect(resolveMailboxFromAddress("privacy@grayarx.com")).toBe("privacy");
    expect(resolveMailboxFromAddress(["Team <privacy@grayarx.com>"])).toBe("privacy");
  });

  it("maps legal@ addresses", () => {
    expect(resolveMailboxFromAddress("legal@grayarx.com")).toBe("legal");
  });

  it("defaults to other", () => {
    expect(resolveMailboxFromAddress("unknown@test.com")).toBe("other");
  });
});
