import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";
import type { Vehicle } from "@nalaOs/conversion/stock";

export type Branch = {
  id: string;
  name: string;
  city: string;
  phone: string;
  active: boolean;
};

type BranchState = { branches: Branch[] };

const FILE = "branches.json";

const DEFAULT: BranchState = {
  branches: [
    {
      id: "demo-yard",
      name: "Sandton Motors",
      city: "Sandton",
      phone: "+27 11 555 0100",
      active: true,
    },
    {
      id: "yard-pta",
      name: "Pretoria Motors",
      city: "Pretoria",
      phone: "+27 12 555 0200",
      active: true,
    },
  ],
};

export function listBranches(): Branch[] {
  return readJsonFile(FILE, DEFAULT).branches.filter((b) => b.active);
}

export function getBranch(id: string): Branch | undefined {
  return listBranches().find((b) => b.id === id);
}

export function ensureBranches(): Branch[] {
  const state = readJsonFile(FILE, DEFAULT);
  writeJsonFile(FILE, state);
  return state.branches;
}

export function ensureMultiBranchStock(vehicles: Vehicle[]): Vehicle[] {
  const hasPta = vehicles.some((v) => v.dealershipId === "yard-pta");
  if (hasPta) return vehicles;

  const extra: Vehicle = {
    id: newId("veh"),
    stockNumber: "PTA-2001",
    make: "Ford",
    model: "Ranger 2.0",
    year: 2022,
    price: 489900,
    mileage: 51000,
    colour: "Blue",
    status: "available",
    dealershipId: "yard-pta",
    updatedAt: new Date().toISOString(),
  };
  return [...vehicles, extra];
}

export function routeBranchByCity(message: string): string {
  const lower = message.toLowerCase();
  if (/\b(pretoria|pta|centurion|hatfield)\b/.test(lower)) return "yard-pta";
  return "demo-yard";
}
