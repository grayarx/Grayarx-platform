import { NextResponse } from "next/server";
import {
  importStockCatalog,
  parseStockCsv,
  STOCK_CSV_TEMPLATE,
} from "@/lib/stock/import";
import { listAvailable, getStock } from "@/lib/conversion/stock";

export async function GET(request: Request) {
  const dealershipId =
    new URL(request.url).searchParams.get("dealershipId") || "demo-yard";
  return NextResponse.json({
    csvTemplate: STOCK_CSV_TEMPLATE,
    vehicles: getStock().vehicles.filter((v) => v.dealershipId === dealershipId),
    available: listAvailable(dealershipId),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const dealershipId =
    typeof body.dealershipId === "string" ? body.dealershipId : "demo-yard";

  if (body.action === "import_csv") {
    const csv = typeof body.csv === "string" ? body.csv : "";
    const result = importStockCatalog({
      dealershipId,
      rows: parseStockCsv(csv),
    });
    return NextResponse.json({ ok: true, ...result });
  }

  if (body.action === "import_json") {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const result = importStockCatalog({
      dealershipId,
      rows: rows as Parameters<typeof importStockCatalog>[0]["rows"],
    });
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json(
    { error: "action must be import_csv or import_json" },
    { status: 400 },
  );
}
