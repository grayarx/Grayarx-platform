import type { Prospect, ProspectStatus, IcpSegment } from "@/lib/prospector-types";
import type { RegionId } from "@/lib/regions/config";
import { REGIONS } from "@/lib/regions/config";
import { newId } from "@/lib/conversion/store";

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

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/**
 * CSV columns (header required):
 * name,city,regionId,segment,abilityToPay,score,stockHint,phone,email,website,contactName,status
 */
export function parseProspectCsv(csv: string): {
  imported: Prospect[];
  skipped: Array<{ row: number; reason: string }>;
} {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { imported: [], skipped: [{ row: 0, reason: "Need header + rows" }] };
  }

  const header = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const imported: Prospect[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]!);
    const name = cols[idx("name")] ?? "";
    const city = cols[idx("city")] ?? "";
    const regionRaw = (cols[idx("regionid")] ?? "ZA").toUpperCase();
    if (!name.trim()) {
      skipped.push({ row: r + 1, reason: "Missing name" });
      continue;
    }
    if (!(regionRaw in REGIONS)) {
      skipped.push({ row: r + 1, reason: `Unknown regionId ${regionRaw}` });
      continue;
    }
    const regionId = regionRaw as RegionId;
    const segmentRaw = (cols[idx("segment")] ?? "volume_used") as IcpSegment;
    const segment = SEGMENTS.includes(segmentRaw)
      ? segmentRaw
      : "volume_used";
    const abilityRaw = (cols[idx("abilitytopay")] ?? "medium") as Prospect["abilityToPay"];
    const abilityToPay =
      abilityRaw === "high" || abilityRaw === "enterprise"
        ? abilityRaw
        : "medium";
    const statusRaw = (cols[idx("status")] ?? "scouted") as ProspectStatus;
    const status = STATUSES.includes(statusRaw) ? statusRaw : "scouted";
    const score = Number(cols[idx("score")] ?? 85) || 85;
    const stockHint =
      cols[idx("stockhint")] ?? "Online stock — after-hours enquiry risk";
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
      phone: cols[idx("phone")] || undefined,
      email: cols[idx("email")] || undefined,
      website: cols[idx("website")] || undefined,
      contactName: cols[idx("contactname")] || "Sales manager / GM",
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
