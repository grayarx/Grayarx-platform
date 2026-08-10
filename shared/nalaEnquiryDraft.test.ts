import { describe, expect, it } from "vitest";

/**
 * Mirrors the ShowroomChatAgent enquiry draft accumulation: each step must
 * merge into the previous draft so name/email are still present at submit.
 */
function accumulateEnquiry(
  steps: Array<{ field: string; value: string }>,
  initial: Record<string, string> = {},
) {
  let draft = { ...initial };
  for (const s of steps) {
    draft = { ...draft, [s.field]: s.value };
  }
  return draft;
}

describe("Nala enquiry draft persistence", () => {
  it("keeps name + email when phone is captured last (regression)", () => {
    const draft = accumulateEnquiry(
      [
        { field: "notes", value: "can i get a discount" },
        { field: "name", value: "gert" },
        { field: "email", value: "gerttest@gmail.com" },
        { field: "phone", value: "0794915187" },
      ],
      { lang: "en" },
    );
    expect(draft.name).toBe("gert");
    expect(draft.email).toBe("gerttest@gmail.com");
    expect(draft.phone).toBe("0794915187");
    expect(draft.notes).toBe("can i get a discount");
  });

  it("fails the old buggy pattern (overwrite from stale draft)", () => {
    // Bug: each step copied only the initial draft, so earlier fields vanished.
    let stale: Record<string, string> = { notes: "discount?", lang: "en" };
    const step1 = { ...stale, name: "gert" }; // not written back to stale
    const step2 = { ...stale, email: "gerttest@gmail.com" }; // name missing
    const step3 = { ...stale, phone: "0794915187" }; // name+email missing
    expect(step1.name).toBe("gert");
    expect(step2.name).toBeUndefined();
    expect(step3.email).toBeUndefined();
    expect(step3.phone).toBe("0794915187");
  });
});
