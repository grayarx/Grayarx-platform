import { NextResponse } from "next/server";
import {
  getStock,
  listAvailable,
  markSold,
  upsertVehicle,
} from "@/lib/conversion/stock";

export async function GET() {
  return NextResponse.json({
    vehicles: getStock().vehicles,
    available: listAvailable(),
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "mark_sold") {
    const id = typeof body.vehicleId === "string" ? body.vehicleId : "";
    const sold = markSold(id);
    if (!sold) {
      return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, vehicle: sold });
  }

  const required = ["stockNumber", "make", "model", "year", "price", "mileage", "colour"] as const;
  for (const key of required) {
    if (body[key] === undefined || body[key] === "") {
      return NextResponse.json(
        { error: `${key} is required to upsert stock.` },
        { status: 400 },
      );
    }
  }

  const vehicle = upsertVehicle({
    stockNumber: String(body.stockNumber),
    make: String(body.make),
    model: String(body.model),
    year: Number(body.year),
    price: Number(body.price),
    mileage: Number(body.mileage),
    colour: String(body.colour),
    status: body.status === "sold" || body.status === "reserved" ? body.status : "available",
    dealershipId:
      typeof body.dealershipId === "string" ? body.dealershipId : "demo-yard",
    id: typeof body.id === "string" ? body.id : undefined,
  });

  return NextResponse.json({ ok: true, vehicle });
}
