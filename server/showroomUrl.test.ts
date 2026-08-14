import { describe, expect, it } from "vitest";
import { buildShowroomQuery, parseShowroomQuery } from "../shared/showroomUrl";

describe("showroom URL filters", () => {
  it("round-trips shareable filter params", () => {
    const q = buildShowroomQuery({
      shortcode: "jubilee",
      search: "Golf",
      fuel: "Petrol",
      transmission: "Automatic",
      sort: "best_deals",
      maxPrice: 350000,
    });
    expect(q).toContain("shortcode=jubilee");
    expect(q).toContain("q=Golf");
    expect(q).toContain("fuel=Petrol");
    expect(q).toContain("sort=best_deals");
    expect(q).toContain("maxPrice=350000");

    const parsed = parseShowroomQuery(`?${q}`);
    expect(parsed.shortcode).toBe("jubilee");
    expect(parsed.search).toBe("Golf");
    expect(parsed.fuel).toBe("Petrol");
    expect(parsed.transmission).toBe("Automatic");
    expect(parsed.sort).toBe("best_deals");
    expect(parsed.maxPrice).toBe(350000);
  });

  it("omits default / empty values", () => {
    expect(buildShowroomQuery({ fuel: "all", sort: "default" })).toBe("");
    expect(parseShowroomQuery("").fuel).toBeUndefined();
  });
});
