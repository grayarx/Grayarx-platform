import { NextResponse } from "next/server";
import {
  importPartsCatalog,
  listAllParts,
  listPartsEnquiries,
  parsePartsCsv,
  quotePart,
  holdPart,
} from "@/lib/os/parts";
import { getDealershipSettings } from "@/lib/dealership/settings";

export async function GET(request: Request) {
  const dealershipId =
    new URL(request.url).searchParams.get("dealershipId") || "demo-yard";
  const settings = getDealershipSettings(dealershipId);
  return NextResponse.json({
    settings: settings.parts,
    modules: settings.modules,
    parts: listAllParts(dealershipId),
    enquiries: listPartsEnquiries(dealershipId).slice(0, 30),
    csvTemplate:
      "sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier",
    howPricingWorks: [
      "GrayArx never invents part prices.",
      "Dealer imports their catalog with retailPrice (what they sell for) and/or costPrice.",
      "If only costPrice is sent, we apply the dealer's defaultMarkupPercent to set retail.",
      "If neither price is present, that row is skipped.",
      "Turn parts module OFF if the yard does not sell parts — Nala will not quote parts.",
    ],
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const dealershipId =
    typeof body.dealershipId === "string" ? body.dealershipId : "demo-yard";

  if (body.action === "import_json") {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const result = importPartsCatalog({
      dealershipId,
      rows: rows as Parameters<typeof importPartsCatalog>[0]["rows"],
      source: "csv_import",
    });
    return NextResponse.json({ ok: true, ...result });
  }

  if (body.action === "import_csv") {
    const csv = typeof body.csv === "string" ? body.csv : "";
    const rows = parsePartsCsv(csv);
    const result = importPartsCatalog({
      dealershipId,
      rows,
      source: "csv_import",
    });
    return NextResponse.json({ ok: true, ...result });
  }

  if (body.action === "quote") {
    const result = quotePart({
      buyerName: String(body.buyerName || ""),
      buyerPhone: String(body.buyerPhone || ""),
      message: String(body.message || ""),
      dealershipId,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  if (body.action === "hold") {
    const result = holdPart(String(body.enquiryId || ""));
    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ ok: true, enquiry: result });
  }

  return NextResponse.json(
    { error: "action must be import_json | import_csv | quote | hold" },
    { status: 400 },
  );
}
