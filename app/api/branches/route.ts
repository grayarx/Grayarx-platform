import { NextResponse } from "next/server";
import { ensureBranches, listBranches } from "@/lib/branches/store";
import { seedMultiBranchStock } from "@/lib/marketplace/ingest";
import { getStock } from "@/lib/conversion/stock";

export async function GET() {
  ensureBranches();
  seedMultiBranchStock();
  const stock = getStock();
  const branches = listBranches().map((b) => ({
    ...b,
    stockCount: stock.vehicles.filter(
      (v) => v.dealershipId === b.id && v.status === "available",
    ).length,
  }));
  return NextResponse.json({ branches });
}
