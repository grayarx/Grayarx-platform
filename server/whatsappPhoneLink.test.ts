import { describe, expect, it } from "vitest";
import {
  mergeMetaPhoneNumberIdIntoNotes,
  parseMetaPhoneNumberIdFromNotes,
  resolveOnboardingWhatsappPhoneNumberId,
} from "../shared/whatsappPhoneLink";

describe("whatsappPhoneLink helpers", () => {
  it("parses Meta ID from notes", () => {
    expect(parseMetaPhoneNumberIdFromNotes("[metaPhoneNumberId:1245737138612982]")).toBe(
      "1245737138612982",
    );
    expect(
      parseMetaPhoneNumberIdFromNotes("hello\n[metaPhoneNumberId:999888777666]\nbye"),
    ).toBe("999888777666");
    expect(parseMetaPhoneNumberIdFromNotes("no id here")).toBeNull();
  });

  it("merges without duplicating tags", () => {
    const once = mergeMetaPhoneNumberIdIntoNotes("ref: ABC", "111222333444");
    expect(once).toContain("[metaPhoneNumberId:111222333444]");
    const twice = mergeMetaPhoneNumberIdIntoNotes(once, "555666777888");
    expect(twice).toContain("[metaPhoneNumberId:555666777888]");
    expect(twice).not.toContain("111222333444");
  });

  it("prefers column over notes", () => {
    expect(
      resolveOnboardingWhatsappPhoneNumberId({
        whatsappPhoneNumberId: "333444555666",
        notes: "[metaPhoneNumberId:444555666777]",
      }),
    ).toBe("333444555666");
    expect(
      resolveOnboardingWhatsappPhoneNumberId({
        whatsappPhoneNumberId: null,
        notes: "[metaPhoneNumberId:444555666777]",
      }),
    ).toBe("444555666777");
  });
});
