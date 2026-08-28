import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { MOCK_PROSPECTS, highAbilityProspects, patchProspectContact } from "@nalaOs/prospector-data";
import { parseProspectCsv } from "@nalaOs/prospector/import";
import { REGIONS, listRegions } from "@nalaOs/regions/config";

describe("prospector ICP + regions", () => {
  it("seeds many high-ability dealerships across regions", () => {
    assert.ok(MOCK_PROSPECTS.length >= 45);
    assert.ok(highAbilityProspects().length >= 25);
    const regions = new Set(MOCK_PROSPECTS.map((p) => p.regionId));
    assert.ok(regions.has("ZA"));
    assert.ok(regions.has("AU"));
    assert.ok(regions.has("US"));
  });

  it("imports CSV prospects", () => {
    const csv = [
      "name,city,regionId,segment,abilityToPay,score,stockHint,phone,email,website,contactName,status",
      "Test Yard,Sandton,ZA,premium_independent,high,96,Premium stock,+27110001111,a@b.com,https://x.com,GM,scouted",
    ].join("\n");
    const { imported, skipped } = parseProspectCsv(csv);
    assert.equal(skipped.length, 0);
    assert.equal(imported.length, 1);
    assert.equal(imported[0]!.regionId, "ZA");
    assert.equal(imported[0]!.abilityToPay, "high");
  });

  it("exposes USD and GBP professional list prices", () => {
    assert.ok(listRegions().length >= 5);
    assert.ok(REGIONS.US.packages.professional.amount > 0);
    assert.ok(REGIONS.GB.packages.professional.amount > 0);
    assert.match(REGIONS.US.packages.professional.label, /\$/);
  });

  it("patches phone and email onto a seeded yard", () => {
    const seed = MOCK_PROSPECTS[0]!;
    const prevPhone = seed.phone;
    const prevEmail = seed.email;
    const patched = patchProspectContact(seed.id, {
      phone: "+27115550100",
      email: "gm@example-yard.co.za",
    });
    assert.equal(patched?.phone, "+27115550100");
    assert.equal(patched?.email, "gm@example-yard.co.za");
    patchProspectContact(seed.id, { phone: prevPhone ?? "", email: prevEmail ?? "" });
  });
});
