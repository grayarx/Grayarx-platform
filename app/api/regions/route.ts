import { NextResponse } from "next/server";
import { listRegions, regionById } from "@/lib/regions/config";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("region") ?? "ZA";
  const region = regionById(id);
  return NextResponse.json({
    region,
    regions: listRegions(),
  });
}
