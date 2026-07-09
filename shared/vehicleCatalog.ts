/**
 * SA-focused vehicle make/model catalog with aliases.
 * Shared between trade-in, inventory, showroom chat, and CSV repair.
 */

export const VEHICLE_MAKES = [
  "Toyota",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Ford",
  "Hyundai",
  "Kia",
  "Nissan",
  "Honda",
  "Audi",
  "Mahindra",
  "Isuzu",
  "Suzuki",
  "Mazda",
  "Renault",
  "Peugeot",
  "Citroën",
  "Chevrolet",
  "Jeep",
  "Land Rover",
  "Volvo",
  "Porsche",
  "Lexus",
  "Mini",
  "Haval",
  "GWM",
  "Chery",
  "Opel",
  "Fiat",
  "Jaguar",
  "Subaru",
  "Mitsubishi",
  "Tesla",
  "BYD",
] as const;

export type VehicleMake = (typeof VEHICLE_MAKES)[number];

/** Lowercase alias → canonical make name */
export const MAKE_ALIASES: Record<string, string> = {
  vw: "Volkswagen",
  volks: "Volkswagen",
  "v w": "Volkswagen",
  volkswagen: "Volkswagen",
  bm: "BMW",
  bmw: "BMW",
  merc: "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  "merc benz": "Mercedes-Benz",
  "mercedes benz": "Mercedes-Benz",
  benz: "Mercedes-Benz",
  chevy: "Chevrolet",
  chev: "Chevrolet",
  chevrolet: "Chevrolet",
  toy: "Toyota",
  toyota: "Toyota",
  hyu: "Hyundai",
  hyundai: "Hyundai",
  landrover: "Land Rover",
  "land rover": "Land Rover",
  lr: "Land Rover",
  volvo: "Volvo",
  porsche: "Porsche",
  porche: "Porsche",
  lexus: "Lexus",
  mini: "Mini",
  minicooper: "Mini",
  "mini cooper": "Mini",
  mahindra: "Mahindra",
  isuzu: "Isuzu",
  suzuki: "Suzuki",
  mazda: "Mazda",
  renault: "Renault",
  peugeot: "Peugeot",
  peug: "Peugeot",
  citroen: "Citroën",
  "citroën": "Citroën",
  ford: "Ford",
  nissan: "Nissan",
  honda: "Honda",
  audi: "Audi",
  jeep: "Jeep",
  haval: "Haval",
  gwm: "GWM",
  greatwall: "GWM",
  chery: "Chery",
  opel: "Opel",
  fiat: "Fiat",
  jaguar: "Jaguar",
  jag: "Jaguar",
  subaru: "Subaru",
  mitsubishi: "Mitsubishi",
  mitsu: "Mitsubishi",
  tesla: "Tesla",
  byd: "BYD",
  kia: "Kia",
};

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota: [
    "Corolla",
    "Corolla Cross",
    "Hilux",
    "Fortuner",
    "RAV4",
    "Yaris",
    "Starlet",
    "Land Cruiser",
    "Prado",
    "Camry",
    "C-HR",
    "Urban Cruiser",
    "Quantum",
  ],
  Volkswagen: [
    "Polo",
    "Polo Vivo",
    "Golf",
    "Golf GTI",
    "Golf R",
    "Tiguan",
    "T-Cross",
    "T-Roc",
    "Amarok",
    "Passat",
    "Jetta",
    "Caddy",
    "Touareg",
  ],
  BMW: [
    "1 Series",
    "2 Series",
    "3 Series",
    "320i",
    "320d",
    "4 Series",
    "5 Series",
    "520d",
    "X1",
    "X3",
    "X5",
    "X6",
    "M3",
    "M4",
    "M340i",
  ],
  "Mercedes-Benz": [
    "A-Class",
    "C-Class",
    "C200",
    "E-Class",
    "GLA",
    "GLB",
    "GLC",
    "GLE",
    "Sprinter",
    "V-Class",
    "AMG GT",
  ],
  Ford: [
    "Ranger",
    "Ranger Raptor",
    "Everest",
    "EcoSport",
    "Puma",
    "Mustang",
    "Fiesta",
    "Focus",
    "Territory",
  ],
  Hyundai: [
    "i10",
    "i20",
    "i30",
    "Tucson",
    "Creta",
    "Venue",
    "Kona",
    "Santa Fe",
    "Staria",
    "Palisade",
  ],
  Kia: ["Picanto", "Rio", "Sonet", "Seltos", "Sportage", "Sorento", "Carnival", "EV6"],
  Nissan: ["Navara", "NP200", "Almera", "Magnite", "Qashqai", "X-Trail", "Patrol", "Juke"],
  Honda: ["Ballade", "BR-V", "HR-V", "CR-V", "Civic", "Amaze"],
  Audi: ["A1", "A3", "A4", "A5", "Q2", "Q3", "Q5", "Q7", "Q8", "RS3", "TT"],
  Mahindra: ["Pik Up", "Scorpio", "XUV300", "XUV500", "XUV700", "Bolero"],
  Isuzu: ["D-Max", "MU-X"],
  Suzuki: ["Swift", "Baleno", "Ignis", "Vitara", "Jimny", "Ertiga", "Fronx"],
  Mazda: ["Mazda2", "Mazda3", "CX-3", "CX-30", "CX-5", "CX-60", "BT-50"],
  Renault: ["Kwid", "Sandero", "Stepway", "Duster", "Koleos", "Triber"],
  Chevrolet: ["Spark", "Cruze", "Trailblazer", "Utility"],
  Jeep: ["Wrangler", "Grand Cherokee", "Compass", "Renegade", "Gladiator"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Evoque"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "V60"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan", "Boxster", "Cayman"],
  Lexus: ["UX", "NX", "RX", "ES", "IS", "LX"],
  Mini: ["Cooper", "Cooper S", "Countryman", "Clubman"],
  Tesla: ["Model 3", "Model Y", "Model X", "Model S"],
};

export const BODY_TYPES = [
  "Sedan",
  "SUV",
  "Bakkie",
  "Hatchback",
  "Coupe",
  "MPV",
  "Wagon",
  "Convertible",
  "Double Cab",
  "Single Cab",
] as const;

export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;

export const TRANSMISSION_TYPES = ["Automatic", "Manual", "DCT", "CVT"] as const;

/** Resolve shorthand/typo to canonical make, or return trimmed input if unknown. */
export function resolveMake(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (MAKE_ALIASES[lower]) return MAKE_ALIASES[lower];
  const exact = VEHICLE_MAKES.find((m) => m.toLowerCase() === lower);
  if (exact) return exact;
  const starts = VEHICLE_MAKES.find((m) => m.toLowerCase().startsWith(lower));
  if (starts && lower.length >= 2) return starts;
  return trimmed;
}

/** Models for a make (resolved), with fallback empty array. */
export function getModelsForMake(make: string): string[] {
  const resolved = resolveMake(make);
  return MODELS_BY_MAKE[resolved] ?? [];
}

/** Search makes by name or alias. */
export function searchMakes(query: string, limit = 12): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...VEHICLE_MAKES].slice(0, limit);

  const aliasHit = MAKE_ALIASES[q];
  if (aliasHit) return [aliasHit];

  const scored: Array<{ make: string; score: number }> = [];
  for (const make of VEHICLE_MAKES) {
    const lower = make.toLowerCase();
    if (lower === q) scored.push({ make, score: 100 });
    else if (lower.startsWith(q)) scored.push({ make, score: 80 });
    else if (lower.includes(q)) scored.push({ make, score: 60 });
  }
  for (const [alias, make] of Object.entries(MAKE_ALIASES)) {
    if (alias.startsWith(q) || alias.includes(q)) {
      if (!scored.some((s) => s.make === make)) scored.push({ make, score: 70 });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.make);
}

/** Search models for a given make. */
export function searchModels(make: string, query: string, limit = 12): string[] {
  const models = getModelsForMake(make);
  const q = query.trim().toLowerCase();
  if (!q) return models.slice(0, limit);
  return models
    .filter((m) => m.toLowerCase().includes(q) || m.toLowerCase().startsWith(q))
    .slice(0, limit);
}

/** Hint shown when user types an alias e.g. vw → Volkswagen */
export function getMakeMatchHint(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const resolved = MAKE_ALIASES[q];
  if (resolved && resolved.toLowerCase() !== q) return resolved;
  const exact = VEHICLE_MAKES.find((m) => m.toLowerCase() === q);
  if (exact) return null;
  const starts = VEHICLE_MAKES.find((m) => m.toLowerCase().startsWith(q) && m.toLowerCase() !== q);
  return starts ?? null;
}

export function resolveModel(make: string, input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  const models = getModelsForMake(make);
  const lower = trimmed.toLowerCase();
  const exact = models.find((m) => m.toLowerCase() === lower);
  if (exact) return exact;
  const starts = models.find((m) => m.toLowerCase().startsWith(lower));
  if (starts && lower.length >= 2) return starts;
  return trimmed;
}
