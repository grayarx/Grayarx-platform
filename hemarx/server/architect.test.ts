import { describe, expect, it } from "vitest";
import { localOutline } from "./architect";
import { parseWikiquote } from "./research";
import type { ResearchBundle } from "./research";

const wiki = `== Sales ==
* "Do not pitch the feature list. Pitch the struggling moment."
* "The calendar is the strategy."
== Pricing ==
* "Price is a conversation about value, not an apology."
* "If they cannot say the number out loud, they do not have an offer."
* "Charge for the wedge, not the cathedral."
`;

describe("book architect", () => {
  it("parses wikiquote bullets into verified quotes", () => {
    const quotes = parseWikiquote(wiki, "https://en.wikiquote.org/wiki/Test");
    expect(quotes.length).toBeGreaterThanOrEqual(4);
    expect(quotes[0]?.text).toContain("struggling moment");
  });

  it("skips wikiquote source lines that are not quotes", () => {
    const raw = `== Quotes ==
* Architects know that some kinds of design problems are more personal than others.
** [http://www.paulgraham.com/langdes.html "Five Questions about Language Design"], May 2001
* The best thing software can be is easy, but the way to do this is to get the defaults right.
`;
    const quotes = parseWikiquote(raw, "https://en.wikiquote.org/wiki/Paul_Graham");
    expect(quotes.map((q) => q.text).join(" ")).toContain("Architects know");
    expect(quotes.some((q) => q.text.includes("Five Questions"))).toBe(false);
  });

  it("builds 12 chapters + intro with five ideas and five quote slots", () => {
    const quotes = parseWikiquote(wiki, "https://en.wikiquote.org/wiki/Test").map((q) => ({
      ...q,
      verified: true,
    }));
    const research: ResearchBundle = {
      person: "Test Thinker",
      canonicalName: "Test Thinker",
      bio: "Test Thinker left a product job, sat with buyers, and wrote publicly that selling is helping people make progress. The public record is essays and talks, not a myth.",
      docs: [
        {
          title: "Test Thinker",
          url: "https://en.wikipedia.org/wiki/Test_Thinker",
          text: "Test Thinker is known for demand-side sales, founder-led outbound, and refusing feature theatre. They argue that do nothing is the competitor and that willingness to pay must be asked early.",
          kind: "wikipedia",
        },
      ],
      quotes,
    };
    const outline = localOutline(research, quotes, [
      "Selling starts from struggle.",
      "Do nothing is the competitor.",
      "Named owners, not mailboxes.",
      "Charge for the wedge.",
      "The calendar is the strategy.",
      "Help them buy.",
      "Cut theatre.",
      "Ship the offer.",
      "Call the same day.",
      "Protect selling hours.",
      "Cash is a force.",
      "Monday is the test.",
    ]);
    expect(outline.chapters).toHaveLength(12);
    expect(outline.introduction.bigIdeas).toHaveLength(5);
    expect(outline.introduction.quotes).toHaveLength(5);
    for (const chapter of outline.chapters) {
      expect(chapter.bigIdeas).toHaveLength(5);
      expect(chapter.quotes).toHaveLength(5);
    }
    expect(outline.wordCount).toBeGreaterThanOrEqual(2000);
  });
});
