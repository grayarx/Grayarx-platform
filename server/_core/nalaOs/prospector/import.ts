import { mapCsvRows, parseFlexibleNumber } from "@shared/smartCsv";
import type { Prospect, ProspectStatus, IcpSegment } from "@nalaOs/prospector-types";
import type { RegionId } from "@nalaOs/regions/config";
import { REGIONS } from "@nalaOs/regions/config";
import { newId } from "@nalaOs/conversion/store";

const SEGMENTS: IcpSegment[] = [
  "premium_independent",
  "franchise_dealer",
  "volume_used",
  "multi_branch_group",
  "specialty_import",
];

const STATUSES: ProspectStatus[] = [
  "scouted",
  "emailed",
  "queued_for_call",
  "called",
  "demo_booked",
  "not_interested",
  "do_not_contact",
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const PROSPECT_CSV_FIELDS: Record<string, readonly string[]> = {
  name: ["name", "dealership", "yard", "company"],
  city: ["city", "town", "suburb"],
  regionId: ["regionid", "region", "country"],
  segment: ["segment", "icp"],
  abilityToPay: ["abilitytopay", "ability to pay", "atp"],
  score: ["score", "rating"],
  stockHint: ["stockhint", "stock hint", "notes"],
  phone: ["phone", "tel", "mobile", "cell"],
  email: ["email", "e-mail", "mail"],
  website: ["website", "url", "web"],
  contactName: ["contactname", "contact", "contact name", "gm"],
  status: ["status"],
};

/**
 * CSV columns (header required):
 * name,city,regionId,segment,abilityToPay,score,stockHint,phone,email,website,contactName,status
 */
export function parseProspectCsv(csv: string): {
  imported: Prospect[];
  skipped: Array<{ row: number; reason: string }>;
} {
  const mapped = mapCsvRows(csv, PROSPECT_CSV_FIELDS, {
    defaultOrder: [
      "name",
      "city",
      "regionId",
      "segment",
      "abilityToPay",
      "score",
      "stockHint",
      "phone",
      "email",
      "website",
      "contactName",
      "status",
    ],
  });
  if (mapped.length === 0) {
    return { imported: [], skipped: [{ row: 0, reason: "Need header + rows" }] };
  }

  const imported: Prospect[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  for (let r = 0; r < mapped.length; r++) {
    const row = mapped[r]!;
    const name = row.name ?? "";
    const city = row.city ?? "";
    const regionRaw = (row.regionId || "ZA").toUpperCase();
    if (!name.trim()) {
      skipped.push({ row: r + 2, reason: "Missing name" });
      continue;
    }
    if (!(regionRaw in REGIONS)) {
      skipped.push({ row: r + 2, reason: `Unknown regionId ${regionRaw}` });
      continue;
    }
    const regionId = regionRaw as RegionId;
    const segmentRaw = (row.segment || "volume_used") as IcpSegment;
    const segment = SEGMENTS.includes(segmentRaw) ? segmentRaw : "volume_used";
    const abilityRaw = (row.abilityToPay || "medium") as Prospect["abilityToPay"];
    const abilityToPay =
      abilityRaw === "high" || abilityRaw === "enterprise" ? abilityRaw : "medium";
    const statusRaw = (row.status || "scouted") as ProspectStatus;
    const status = STATUSES.includes(statusRaw) ? statusRaw : "scouted";
    const score = parseFlexibleNumber(row.score) || 85;
    const stockHint = row.stockHint || "Online stock — after-hours enquiry risk";
    const location = `${city || "Unknown"}, ${REGIONS[regionId].name}`;
    const id = `${regionId.toLowerCase()}-${slug(name)}-${newId("p").slice(-4)}`;

    imported.push({
      id,
      name: name.trim(),
      city: city.trim() || REGIONS[regionId].name,
      location,
      regionId,
      score: Math.min(99, Math.max(50, score)),
      status,
      segment,
      abilityToPay,
      stockHint,
      phone: row.phone || undefined,
      email: row.email || undefined,
      website: row.website || undefined,
      contactName: row.contactName || "Sales manager / GM",
      researchNote: `${stockHint} · ICP: ${segment.replace(/_/g, " ")} · imported CSV.`,
      callReason: `I had a look at ${name.trim()}'s online stock — curious what happens when a buyer enquires after hours.`,
    });
  }

  return { imported, skipped };
}

export const PROSPECT_CSV_TEMPLATE = [
  "name,city,regionId,segment,abilityToPay,score,stockHint,phone,email,website,contactName,status",
  "Example Prestige Motors,Sandton,ZA,premium_independent,high,95,High GP German used,+27115550100,gm@example.com,https://example.com,Sipho Dlamini,scouted",
].join("\n");
