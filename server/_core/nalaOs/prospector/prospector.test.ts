import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  MOCK_PROSPECTS,
  highAbilityProspects,
  patchProspectContact,
  applyResearchedContact,
} from "@nalaOs/prospector-data";
import { parseProspectCsv } from "@nalaOs/prospector/import";
import { REGIONS, listRegions } from "@nalaOs/regions/config";
import { isOutreachReadyForDealership } from "../../../../shared/prospectEmailQuality";

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

  it("hydrates ZA ICP yards with real research websites", () => {
    const za = MOCK_PROSPECTS.filter((p) => p.regionId === "ZA");
    assert.ok(za.length >= 20);
    assert.ok(za.filter((p) => Boolean(p.website?.trim())).length >= 15);
  });

  it("research apply rejects info@ and keeps a good phone", () => {
    const seed = MOCK_PROSPECTS.find((p) => p.website?.includes("http")) ?? MOCK_PROSPECTS[0]!;
    const site = seed.website?.startsWith("http") ? seed.website : `https://${seed.website ?? "jubileemotors.co.za"}`;
    const host = new URL(site).hostname.replace(/^www\./, "");
    const prevPhone = seed.phone;
    const prevEmail = seed.email;
    applyResearchedContact(seed.id, {
      email: `info@${host}`,
      website: site,
      phone: "0118114008",
    });
    assert.equal(isOutreachReadyForDealership(`info@${host}`, site), false);
    assert.notEqual((seed.email ?? "").toLowerCase(), `info@${host}`);
    assert.equal(seed.phone, "011 811 4008");
    applyResearchedContact(seed.id, {
      email: `thabo@${host}`,
      website: site,
      phone: "",
    });
    assert.equal(seed.email, `thabo@${host}`);
    assert.equal(seed.phone, "011 811 4008", "must not overwrite switchboard with empty");
    patchProspectContact(seed.id, { phone: prevPhone ?? "", email: prevEmail ?? "" });
  });
});
