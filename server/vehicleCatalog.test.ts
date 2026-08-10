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
    expect(inferBodyType("GWM", "P-Series")).toBe("Bakkie");
    expect(inferBodyType("JAC", "T9")).toBe("Bakkie");
    expect(inferBodyType("BYD", "Shark")).toBe("Bakkie");
    expect(inferBodyType("Omoda", "C5")).toBe("SUV");
    expect(inferBodyType("Jaecoo", "J7")).toBe("SUV");
    expect(inferBodyType("GWM", "Tank 300")).toBe("SUV");
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

  it("covers new SA Chinese makes and bakkies", () => {
    expect(resolveMake("omoda")).toBe("Omoda");
    expect(resolveMake("jaecoo")).toBe("Jaecoo");
    expect(resolveMake("gwm")).toBe("GWM");
    expect(resolveMake("poer")).toBe("GWM");
    expect(resolveMake("great wall")).toBe("GWM");
    expect(getModelsForMake("Omoda")).toEqual(expect.arrayContaining(["C5", "C9"]));
    expect(getModelsForMake("Jaecoo")).toEqual(expect.arrayContaining(["J7", "J8"]));
    expect(getModelsForMake("GWM")).toEqual(
      expect.arrayContaining(["P-Series", "Tank 300", "Steed"]),
    );
    expect(getModelsForMake("Haval")).toEqual(expect.arrayContaining(["Jolion", "H6"]));
    expect(getModelsForMake("BYD")).toEqual(expect.arrayContaining(["Atto 3", "Shark"]));
    expect(getModelsForMake("JAC")).toEqual(expect.arrayContaining(["T8", "T9"]));
    expect(resolveModel("GWM", "P-Series")).toBe("P-Series");
    expect(resolveModel("Omoda", "C5")).toBe("C5");
  });
});
