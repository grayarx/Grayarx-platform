import { describe, expect, it } from "vitest";
import {
  detectCsvDelimiter,
  headerSimilarity,
  mapCsvRows,
  parseCsvGrid,
  parseFlexibleNumber,
  splitCsvLine,
} from "./smartCsv";

describe("smartCsv", () => {
  it("keeps commas inside quoted fields", () => {
    expect(splitCsvLine(`OA-1,04465,"Front pads, Hilux",Toyota`)).toEqual([
      "OA-1",
      "04465",
      "Front pads, Hilux",
      "Toyota",
    ]);
  });

  it("detects SA Excel semicolon delimiter", () => {
    const csv = "sku;name;retailPrice\nBR-1;Pads;1450,00";
    expect(detectCsvDelimiter(csv)).toBe(";");
    const { rows } = parseCsvGrid(csv);
    expect(rows[1]).toEqual(["BR-1", "Pads", "1450,00"]);
  });

  it("skips # comments and a UTF-8 BOM", () => {
    const csv = `\uFEFF# notes\nsku,name,price\nA,Oil,189`;
    const { rows } = parseCsvGrid(csv);
    expect(rows[0]?.[0]).toBe("sku");
    expect(rows).toHaveLength(2);
  });

  it("maps misspelt headers and default column order", () => {
    const fields = {
      sku: ["sku", "part number"],
      name: ["name", "description"],
      retailPrice: ["retail", "price", "retail price"],
      qty: ["qty", "quantity"],
    };
    const misspelt = mapCsvRows(
      "skuu,descripton,retaill price,quanity\nOA-1,Oil filter,189,24",
      fields,
    );
    expect(misspelt[0]?.sku).toBe("OA-1");
    expect(misspelt[0]?.name).toBe("Oil filter");
    expect(misspelt[0]?.retailPrice).toBe("189");
    expect(misspelt[0]?.qty).toBe("24");

    const headerless = mapCsvRows(
      "OA-1,03C,Oil filter,Polo,Volkswagen,Polo,2018,2024,95,189,24,Local",
      fields,
      {
        defaultOrder: [
          "sku",
          "oemNumber",
          "name",
          "fits",
          "make",
          "model",
          "yearFrom",
          "yearTo",
          "costPrice",
          "retailPrice",
          "qty",
          "supplier",
        ],
      },
    );
    expect(headerless[0]?.sku).toBe("OA-1");
    expect(headerless[0]?.name).toBe("Oil filter");
  });

  it("parses ZAR thousands, EU decimals, and k-suffix", () => {
    expect(parseFlexibleNumber("R 249,900")).toBe(249900);
    expect(parseFlexibleNumber("42,000 km")).toBe(42000);
    expect(parseFlexibleNumber("1899,50")).toBe(1899.5);
    expect(parseFlexibleNumber("1.899,50")).toBe(1899.5);
    expect(parseFlexibleNumber("1,899.00")).toBe(1899);
    expect(parseFlexibleNumber("329k")).toBe(329000);
    expect(parseFlexibleNumber("  ")).toBeUndefined();
  });

  it("scores close spelling as a match", () => {
    expect(headerSimilarity("retaill price", "retail price")).toBeGreaterThan(0.8);
    expect(headerSimilarity("quanity", "quantity")).toBeGreaterThan(0.8);
    expect(headerSimilarity("sku", "qty")).toBeLessThan(0.5);
  });
});
