import { describe, expect, it } from "vitest";
import { isAmbiguous, type WikiCandidate } from "./research";

function hit(title: string, snippet: string, score: number): WikiCandidate {
  return { title, snippet, score, url: `https://en.wikipedia.org/wiki/${title}` };
}

describe("architect name collisions", () => {
  it("asks when Wikipedia has two parenthetical people, even if one scores as an author", () => {
    const hits = [
      hit("John Smith (explorer)", "English writer and explorer", 11),
      hit("John Smith (artist)", "British artist", 3),
      hit("John Smith (politician)", "Scottish politician", 3),
    ];
    expect(isAmbiguous(hits, "John Smith")).toBe(true);
  });

  it("does not ask when the query is already disambiguated", () => {
    const hits = [
      hit("John Smith (explorer)", "English writer and explorer", 11),
      hit("John Smith (artist)", "British artist", 3),
    ];
    expect(isAmbiguous(hits, "John Smith (explorer)")).toBe(false);
  });

  it("does not ask for a known writer even if other Wikipedia hits exist", () => {
    const hits = [
      hit("Patrick McKenzie", "patio11, Kalzumeus, Bits about Money", 21),
      hit("Patrick McKenzie (footballer)", "Scottish footballer", 0),
    ];
    expect(isAmbiguous(hits, "Patrick McKenzie")).toBe(false);
    expect(isAmbiguous(hits, "patio11")).toBe(false);
  });

  it("does not ask for a unique high-scoring hit", () => {
    const hits = [
      hit("Zelda Wainwright", "Entrepreneur and essayist on founder-led sales", 11),
      hit("Wainwright (album)", "Unrelated discography stub", 0),
    ];
    expect(isAmbiguous(hits, "Zelda Wainwright")).toBe(false);
  });

  it("asks when two hits are close and neither is a known site", () => {
    const hits = [
      hit("Alex Rivera", "American writer", 7),
      hit("Alexander Rivera", "American politician", 6),
    ];
    expect(isAmbiguous(hits, "Alex Rivera")).toBe(true);
  });
});
