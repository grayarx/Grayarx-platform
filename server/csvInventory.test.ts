import { describe, expect, it } from "vitest";
import { parseInventoryCsv } from "./_core/csvInventory";

describe("parseInventoryCsv", () => {
  it("parses a standard dealer CSV with title + price", () => {
    const csv = [
      "title,price,km,fuel,stock",
      `"2022 Toyota Corolla 1.8",329900,42000,Petrol,STK-001`,
      `"2020 VW Polo 1.0 TSI",224900,68000,Petrol,STK-002`,
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(2);
    expect(res.validRows[0].title).toBe("2022 Toyota Corolla 1.8");
    expect(res.validRows[0].price).toBe(329900);
    expect(res.skippedRows).toHaveLength(0);
  });

  it("synthesises a title from year/make/model when title column is missing", () => {
    const csv = [
      "make,model,year,price",
      "Toyota,Corolla,2022,329900",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(1);
    expect(res.validRows[0].title).toBe("2022 Toyota Corolla");
  });

  it("imports rows with missing/POA/R1 prices but warns (soft pilot import)", () => {
    const csv = [
      "title,price",
      "Ford Fiesta,",
      "Hyundai i20,0",
      "Cheap Car,1",
      "POA Car,POA",
      "BMW 320i,489000",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(5);
    expect(res.validRows.find((r) => r.title === "BMW 320i")?.price).toBe(489000);
    expect(res.validRows.filter((r) => r.price === null).length).toBe(4);
    expect(res.warningRows).toBeGreaterThan(0);
  });

  it("deduplicates by stock/vin/registration number", () => {
    const csv = [
      "title,price,stock",
      "A,100000,STK-1",
      "B,100000,STK-1",
      "C,100000,STK-2",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(2);
    expect(res.duplicateRefs).toContain("STK-1");
  });

  it("returns a clear error when CSV has neither title nor make+model", () => {
    const csv = ["price,km", "100000,10000"].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(0);
    expect(res.skippedRows[0].reason).toMatch(/missing both/i);
  });

  it("handles quoted fields with embedded commas", () => {
    const csv = [
      "title,price,location",
      `"Audi A4 2.0 TFSI, S-Line",549000,"Sandton, Gauteng"`,
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(1);
    expect(res.validRows[0].title).toBe("Audi A4 2.0 TFSI, S-Line");
    expect(res.validRows[0].location).toBe("Sandton, Gauteng");
  });

  it("strips currency symbols and thousands separators from price/km", () => {
    const csv = [
      "title,price,km",
      `"VW Golf 7","R 249,900","42,000 km"`,
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows[0].price).toBe(249900);
    expect(res.validRows[0].km).toBe(42000);
  });

  it("parses Price_ZAR and Mileage_km column headers from DMS exports", () => {
    const csv = [
      "Stock_ID,Make,Model,Year,Mileage_km,Price_ZAR,Image_URL",
      "STK-1,Toyota,Corolla,2022,42000,329900,https://example.com/car.jpg",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(1);
    expect(res.validRows[0].price).toBe(329900);
    expect(res.validRows[0].km).toBe(42000);
    expect(res.validRows[0].imageUrl).toBe("https://example.com/car.jpg");
    expect(res.photoSummary.avgScore).toBeGreaterThan(0);
  });

  it("parses multiple photo URLs separated by pipe", () => {
    const csv = [
      "title,price,image",
      "BMW 320i,500000,https://a.com/1.jpg|https://a.com/2.jpg|https://a.com/3.jpg",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows[0].imageUrls).toHaveLength(3);
    expect(res.validRows[0].photoWarnings.length).toBeGreaterThan(0);
  });

  it("populates vin from a VIN column when the value is valid", () => {
    const csv = [
      "title,price,vin",
      "BMW 320i,500000,WBA8E5G54JNU12345",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(1);
    expect(res.validRows[0].vin).toBe("WBA8E5G54JNU12345");
    expect(res.validRows[0].externalRef).toBe("WBA8E5G54JNU12345");
  });

  it("warns but still imports when VIN column is invalid", () => {
    const csv = [
      "title,price,stock,vin",
      "BMW 320i,500000,STK-9,WBA8E5G55JNU12345",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(1);
    expect(res.validRows[0].vin).toBeNull();
    expect(res.validRows[0].externalRef).toBe("STK-9");
    expect(res.validRows[0].dataWarnings.some((w) => /VIN/i.test(w))).toBe(true);
  });

  it("imports SA Excel semicolon files with misspelt headers and decimal commas", () => {
    const csv = [
      "titel;make;model;year;prce;milage",
      `"2022 Toyota Corolla 1.8";Toyota;Corolla;2022;R 329 900;42 000`,
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows).toHaveLength(1);
    expect(res.validRows[0].title).toBe("2022 Toyota Corolla 1.8");
    expect(res.validRows[0].price).toBe(329900);
    expect(res.validRows[0].km).toBe(42000);
  });

  it("maps fix/pending/problem status values to fix", () => {
    const csv = [
      "title,price,status",
      "Needs work,100000,fix",
      "On hold,100000,pending",
      "Problem car,100000,needs_fix",
      "Ready,100000,available",
    ].join("\n");
    const res = parseInventoryCsv(csv);
    expect(res.validRows.find((r) => r.title === "Needs work")?.status).toBe("fix");
    expect(res.validRows.find((r) => r.title === "On hold")?.status).toBe("fix");
    expect(res.validRows.find((r) => r.title === "Problem car")?.status).toBe("fix");
    expect(res.validRows.find((r) => r.title === "Ready")?.status).toBe("available");
  });
});
