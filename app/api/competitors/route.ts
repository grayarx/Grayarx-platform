import { NextResponse } from "next/server";
import {
  BEAT_ROADMAP,
  GRAYARX_PACKAGES,
  PRICE_BANDS,
  battlecardFromMessage,
  buildBattlecard,
  getCompetitor,
  listCompetitors,
  type CompetitorId,
} from "@/lib/competitors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") as CompetitorId | null;
  const q = searchParams.get("q");

  if (q) {
    const card = battlecardFromMessage(q);
    if (!card) {
      return NextResponse.json({ error: "No competitor matched", q }, { status: 404 });
    }
    return NextResponse.json({ card });
  }

  if (id) {
    const competitor = getCompetitor(id);
    if (!competitor) {
      return NextResponse.json({ error: "Unknown competitor" }, { status: 404 });
    }
    return NextResponse.json({ card: buildBattlecard(competitor) });
  }

  return NextResponse.json({
    competitors: listCompetitors().map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      categoryLabel: c.categoryLabel,
      pricing: c.pricing,
      sameAsGrayArx: c.sameAsGrayArx,
      oneLiner: c.oneLiner,
    })),
    packages: GRAYARX_PACKAGES,
    priceBands: PRICE_BANDS,
    beatRoadmap: BEAT_ROADMAP,
  });
}
