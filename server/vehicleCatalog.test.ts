import { describe, it, expect } from "vitest";
import {
  resolveMake,
  resolveModel,
  getModelsForMake,
  inferBodyType,
  effectiveBodyType,
} from "../shared/vehicleCatalog";

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

  it("infers SA body types for demo CSV models when bodyType is blank", () => {
    expect(inferBodyType("Toyota", "Hilux")).toBe("Bakkie");
    expect(inferBodyType("Ford", "Ranger")).toBe("Bakkie");
    expect(inferBodyType("Isuzu", "D-Max")).toBe("Bakkie");
    expect(inferBodyType("Volkswagen", "Polo")).toBe("Hatchback");
    expect(inferBodyType("Suzuki", "Swift")).toBe("Hatchback");
    expect(inferBodyType("Toyota", "Corolla")).toBe("Sedan");
    expect(inferBodyType("Toyota", "Fortuner")).toBe("SUV");
    expect(inferBodyType("Haval", "Jolion")).toBe("SUV");
    expect(inferBodyType("Toyota", "Corolla Cross")).toBe("SUV");
  });

  it("uses stored bodyType when present, else infers", () => {
    expect(
      effectiveBodyType({ bodyType: "Sedan", make: "Toyota", model: "Hilux" }),
    ).toBe("Sedan");
    expect(
      effectiveBodyType({ bodyType: "", make: "Toyota", model: "Hilux" }),
    ).toBe("Bakkie");
    expect(
      effectiveBodyType({ bodyType: null, make: "Volkswagen", model: "Polo" }),
    ).toBe("Hatchback");
  });
});
