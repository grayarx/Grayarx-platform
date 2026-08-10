import { describe, expect, it } from "vitest";
import { splitInventoryCsv } from "./csvChunk";

const HEADER = "title,make,model,year,price,km,fuel,transmission,location,image,stock,status";

function row(i: number) {
  return `${2020 + (i % 5)} Toyota Hilux,Toyota,Hilux,${2020 + (i % 5)},500000,10000,Diesel,Automatic,Sandton,https://example.com/a.jpg,SCALE-${i},available`;
}

describe("splitInventoryCsv", () => {
  it("returns original CSV when there are no data rows", () => {
    const csv = `# comment\n${HEADER}\n`;
    expect(splitInventoryCsv(csv, 40)).toEqual([csv]);
  });

  it("chunks 100 rows into batches of 40", () => {
    const lines = [HEADER, ...Array.from({ length: 100 }, (_, i) => row(i + 1))];
    const csv = lines.join("\n") + "\n";
    const chunks = splitInventoryCsv(csv, 40);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toContain(HEADER);
    expect(chunks[0].split("\n").filter((l) => l.startsWith("20")).length).toBe(40);
    expect(chunks[2].split("\n").filter((l) => l.startsWith("20")).length).toBe(20);
  });

  it("supports fast 100-row batches", () => {
    const lines = [HEADER, ...Array.from({ length: 250 }, (_, i) => row(i + 1))];
    const chunks = splitInventoryCsv(lines.join("\n") + "\n", 100);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].split("\n").filter((l) => l.startsWith("20")).length).toBe(100);
  });

  it("keeps comment preamble on every chunk", () => {
    const csv = `# note\n${HEADER}\n${row(1)}\n${row(2)}\n`;
    const chunks = splitInventoryCsv(csv, 1);
    expect(chunks).toHaveLength(2);
    for (const c of chunks) {
      expect(c.startsWith("# note")).toBe(true);
      expect(c).toContain(HEADER);
    }
  });
});
