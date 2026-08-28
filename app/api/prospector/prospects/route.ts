import { NextResponse } from "next/server";
import {
  parseProspectCsv,
  PROSPECT_CSV_TEMPLATE,
} from "@/lib/prospector/import";
import {
  highAbilityProspects,
  MOCK_PROSPECTS,
  prospectsByRegion,
} from "@/lib/prospector-data";
import { listRegions, regionById } from "@/lib/regions/config";
import type { RegionId } from "@/lib/regions/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const region = url.searchParams.get("region") as RegionId | null;
  const highOnly = url.searchParams.get("highAbility") === "1";
  const template = url.searchParams.get("template") === "1";

  if (template) {
    return new NextResponse(PROSPECT_CSV_TEMPLATE, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="prospects-template.csv"',
      },
    });
  }

  let prospects = MOCK_PROSPECTS;
  if (region) prospects = prospectsByRegion(region);
  if (highOnly) {
    prospects = prospects.filter(
      (p) => p.abilityToPay === "high" || p.abilityToPay === "enterprise",
    );
  }
  prospects = [...prospects].sort((a, b) => b.score - a.score);

  return NextResponse.json({
    count: prospects.length,
    totalSeeded: MOCK_PROSPECTS.length,
    highAbilityCount: highAbilityProspects().length,
    regions: listRegions().map((r) => ({
      id: r.id,
      name: r.name,
      currency: r.currency,
      professional: r.packages.professional.label,
      privacyLaw: r.privacyLaw,
      count: prospectsByRegion(r.id).length,
    })),
    pricingForRegion: region ? regionById(region).packages : null,
    prospects,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { csv?: string };
  if (!body.csv?.trim()) {
    return NextResponse.json({ error: "csv required" }, { status: 400 });
  }
  const result = parseProspectCsv(body.csv);
  return NextResponse.json({
    ok: true,
    imported: result.imported.length,
    skipped: result.skipped,
    prospects: result.imported,
  });
}
