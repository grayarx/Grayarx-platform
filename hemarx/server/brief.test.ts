import { describe, expect, it } from "vitest";
import { keepItem, normalizeUrl } from "./brief";
import { parseRss } from "./scrape";
import type { Source } from "./types";

const source: Source = {
  id: "t",
  name: "Test",
  kind: "news",
  url: "https://example.com",
  rss: "https://example.com/feed",
  why: "test",
  struggles: ["sa_b2b", "founder_outbound"],
};

describe("brief filters", () => {
  it("drops clickbait and repeats", () => {
    const seen = new Set<string>([normalizeUrl("https://www.example.com/a")]);
    expect(
      keepItem(
        { title: "You won't believe this outbound trick", url: "https://example.com/b", summary: "shocking" },
        source,
        ["founder_outbound"],
        seen,
      ),
    ).toEqual(expect.stringMatching(/clickbait/i));
    expect(
      keepItem(
        { title: "Cold email deliverability for SA SMEs", url: "https://www.example.com/a", summary: "spf dkim" },
        source,
        ["founder_outbound"],
        seen,
      ),
    ).toEqual(expect.stringMatching(/repeat/i));
  });

  it("keeps a relevant dealer/sales item", () => {
    const result = keepItem(
      {
        title: "South Africa used-car dealers and SME software buying",
        url: "https://example.com/dealers",
        summary: "Owner-operators and outbound to the principal",
      },
      source,
      ["sa_b2b", "founder_outbound"],
      new Set(),
    );
    expect(result).toBe(true);
  });

  it("parses rss items", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item><title>Hello</title><link>https://x.test/1</link><description>Body</description></item>
      <item><title>Two</title><guid>https://x.test/2</guid><description><![CDATA[More]]></description></item>
    </channel></rss>`;
    const items = parseRss(xml);
    expect(items).toHaveLength(2);
    expect(items[0]?.url).toContain("https://x.test/1");
  });
});
