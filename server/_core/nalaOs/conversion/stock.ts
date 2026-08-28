import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";

export type Vehicle = {
  id: string;
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  colour: string;
  status: "available" | "reserved" | "sold";
  dealershipId: string;
  updatedAt: string;
};

export type StockState = {
  vehicles: Vehicle[];
};

const FILE = "stock.json";

const DEFAULT_STOCK: StockState = {
  vehicles: [
    {
      id: "veh_polo",
      stockNumber: "GA-1001",
      make: "Volkswagen",
      model: "Polo Vivo",
      year: 2022,
      price: 249900,
      mileage: 42000,
      colour: "White",
      status: "available",
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "veh_hilux",
      stockNumber: "GA-1002",
      make: "Toyota",
      model: "Hilux 2.4 GD-6",
      year: 2021,
      price: 429900,
      mileage: 68000,
      colour: "Silver",
      status: "available",
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "veh_i20",
      stockNumber: "GA-1003",
      make: "Hyundai",
      model: "i20",
      year: 2023,
      price: 279900,
      mileage: 18500,
      colour: "Red",
      status: "available",
      dealershipId: "demo-yard",
      updatedAt: new Date().toISOString(),
    },
  ],
};

export function getStock(): StockState {
  return readJsonFile(FILE, DEFAULT_STOCK);
}

export function listAvailable(dealershipId = "demo-yard"): Vehicle[] {
  return getStock().vehicles.filter(
    (v) => v.dealershipId === dealershipId && v.status === "available",
  );
}

export function findVehicle(query: {
  id?: string;
  stockNumber?: string;
  make?: string;
  model?: string;
}): Vehicle | undefined {
  const vehicles = getStock().vehicles;
  if (query.id) return vehicles.find((v) => v.id === query.id);
  if (query.stockNumber) {
    return vehicles.find(
      (v) =>
        v.stockNumber.toLowerCase() === query.stockNumber!.toLowerCase() &&
        v.status === "available",
    );
  }
  if (query.make || query.model) {
    const make = query.make?.toLowerCase();
    const model = query.model?.toLowerCase();
    return vehicles.find(
      (v) =>
        v.status === "available" &&
        (!make || v.make.toLowerCase().includes(make)) &&
        (!model || v.model.toLowerCase().includes(model)),
    );
  }
  return undefined;
}

export function markSold(vehicleId: string): Vehicle | undefined {
  const state = getStock();
  const vehicle = state.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return undefined;
  vehicle.status = "sold";
  vehicle.updatedAt = new Date().toISOString();
  writeJsonFile(FILE, state);
  return vehicle;
}

export function upsertVehicle(
  input: Omit<Vehicle, "id" | "updatedAt"> & { id?: string },
): Vehicle {
  const state = getStock();
  const now = new Date().toISOString();
  if (input.id) {
    const existing = state.vehicles.find((v) => v.id === input.id);
    if (existing) {
      Object.assign(existing, input, { updatedAt: now });
      writeJsonFile(FILE, state);
      return existing;
    }
  }
  const vehicle: Vehicle = {
    ...input,
    id: input.id ?? newId("veh"),
    updatedAt: now,
  };
  state.vehicles.push(vehicle);
  writeJsonFile(FILE, state);
  return vehicle;
}

export function formatVehicleLine(v: Vehicle): string {
  return `${v.year} ${v.make} ${v.model} (${v.colour}) — R${v.price.toLocaleString("en-ZA")} · ${v.mileage.toLocaleString("en-ZA")} km · stock ${v.stockNumber}`;
}
