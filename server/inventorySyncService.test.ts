import { describe, expect, it } from "vitest";
import { assertSafeFeedUrl } from "./_core/inventorySyncService";

describe("assertSafeFeedUrl", () => {
  it("accepts https public URLs", () => {
    const u = assertSafeFeedUrl("https://example.com/stock.csv");
    expect(u.hostname).toBe("example.com");
  });

  it("rejects private / local hosts", () => {
    expect(() => assertSafeFeedUrl("http://127.0.0.1/x.csv")).toThrow(/private/i);
    expect(() => assertSafeFeedUrl("http://10.0.0.5/x.csv")).toThrow(/private/i);
    expect(() => assertSafeFeedUrl("http://192.168.1.1/x.csv")).toThrow(/private/i);
    expect(() => assertSafeFeedUrl("http://169.254.169.254/latest")).toThrow(/private/i);
  });

  it("rejects non-http schemes", () => {
    expect(() => assertSafeFeedUrl("file:///etc/passwd")).toThrow(/http/i);
  });
});
