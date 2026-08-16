import { describe, expect, it } from "vitest";
import { personFromKnownName } from "../server/_core/principalNameEmailGuess";
import { SA_PROSPECT_POOL } from "../server/_core/saProspectPool";

describe("prospector yield seeds", () => {
  it("accepts known first names for email guess seeding", () => {
    const d = personFromKnownName("Donoven", "Owner");
    expect(d?.firstName).toBe("Donoven");
    expect(d?.lastName).toBeNull();
    expect(personFromKnownName("Dealer Principal (TBD)")).toBeNull();
    expect(personFromKnownName("Owner")).toBeNull();
  });

  it("pool includes principalName seeds for known pilots", () => {
    const named = SA_PROSPECT_POOL.filter((p) => p.principalName);
    expect(named.map((p) => p.name)).toEqual(
      expect.arrayContaining(["SD Auto CC", "Corona Motors", "M5 Auto", "Jubilee Motors"]),
    );
  });
});
