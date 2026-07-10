import { describe, it, expect } from "vitest";
import { resolveMake, resolveModel, getModelsForMake } from "../shared/vehicleCatalog";

describe("vehicleCatalog", () => {
  it("keeps Corvette as a Chevrolet model (never rewrites to another model)", () => {
    expect(resolveModel("Chevrolet", "Corvette")).toBe("Corvette");
    expect(resolveModel("Chevrolet", "Corvette C8 Stingray")).toBe("Corvette C8 Stingray");
    expect(getModelsForMake("Chevrolet")).toContain("Corvette");
  });

  it("does not fuzzy-match short prefixes to the wrong model", () => {
    expect(resolveModel("Volkswagen", "Golf R")).toBe("Golf R");
    expect(resolveModel("Toyota", "Corolla Cross")).toBe("Corolla Cross");
  });

  it("resolves exotic makes from aliases", () => {
    expect(resolveMake("koenigsegg")).toBe("Koenigsegg");
    expect(resolveMake("lambo")).toBe("Lamborghini");
    expect(resolveModel("Koenigsegg", "Jesko")).toBe("Jesko");
  });
});
