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
  "Omoda",
  "Jaecoo",
  "Opel",
  "Fiat",
  "Jaguar",
  "Subaru",
  "Mitsubishi",
  "Tesla",
  "BYD",
  "Datsun",
  "Dodge",
  "RAM",
  "Cadillac",
  "Infiniti",
  "Genesis",
  "Alfa Romeo",
  "Maserati",
  "Bentley",
  "Lamborghini",
  "Ferrari",
  "McLaren",
  "Aston Martin",
  "Koenigsegg",
  "Pagani",
  "Bugatti",
  "Rolls-Royce",
  "SsangYong",
  "BAIC",
  "JAC",
  "Proton",
  "MG",
  "DFSK",
  "Ineos",
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
  "great wall": "GWM",
  poer: "GWM",
  cannon: "GWM",
  chery: "Chery",
  omoda: "Omoda",
  jaecoo: "Jaecoo",
  jaeco: "Jaecoo",
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
  lambo: "Lamborghini",
  lamborghini: "Lamborghini",
  ferrari: "Ferrari",
  mclaren: "McLaren",
  koeng: "Koenigsegg",
  koenigsegg: "Koenigsegg",
  pagani: "Pagani",
  bugatti: "Bugatti",
  bentley: "Bentley",
  "rolls royce": "Rolls-Royce",
  rolls: "Rolls-Royce",
  "aston martin": "Aston Martin",
  aston: "Aston Martin",
  maserati: "Maserati",
  "alfa romeo": "Alfa Romeo",
  alfa: "Alfa Romeo",
  dodge: "Dodge",
  ram: "RAM",
  cadillac: "Cadillac",
  infiniti: "Infiniti",
  genesis: "Genesis",
  datsun: "Datsun",
  mg: "MG",
  proton: "Proton",
  ssangyong: "SsangYong",
  "ssang yong": "SsangYong",
  baic: "BAIC",
  jac: "JAC",
  dfsk: "DFSK",
  seres: "DFSK",
  ineos: "Ineos",
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
  Mahindra: [
    "Pik Up",
    "Scorpio",
    "Scorpio-N",
    "XUV300",
    "XUV 3XO",
    "XUV500",
    "XUV700",
    "Bolero",
    "Thar",
  ],
  Isuzu: ["D-Max", "MU-X", "KB"],
  Suzuki: ["Swift", "Baleno", "Ignis", "Vitara", "Jimny", "Ertiga", "Fronx", "S-Presso", "XL6"],
  Mazda: ["Mazda2", "Mazda3", "CX-3", "CX-30", "CX-5", "CX-60", "BT-50"],
  Renault: ["Kwid", "Sandero", "Stepway", "Duster", "Koleos", "Triber", "Oroch"],
  Peugeot: ["208", "2008", "3008", "5008", "Landtrek"],
  "Citroën": ["C3", "C3 Aircross", "C5 Aircross", "Berlingo"],
  Opel: ["Corsa", "Crossland", "Grandland", "Mokka", "Astra"],
  Fiat: ["500", "Panda", "Tipo", "Pulse"],
  Subaru: ["Forester", "XV", "Outback", "WRX", "Impreza"],
  Mitsubishi: ["Triton", "ASX", "Eclipse Cross", "Pajero Sport", "Outlander", "Xpander"],
  Chevrolet: [
    "Spark",
    "Cruze",
    "Trailblazer",
    "Utility",
    "Corvette",
    "Corvette Stingray",
    "Corvette Z06",
    "Camaro",
    "Silverado",
  ],
  Jeep: ["Wrangler", "Grand Cherokee", "Compass", "Renegade", "Gladiator"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "V60", "C40"],
  Tesla: ["Model 3", "Model Y", "Model X", "Model S", "Cybertruck"],
  Haval: ["Jolion", "Jolion Pro", "H6", "H6 GT", "H1", "H2", "H9"],
  GWM: [
    "P-Series",
    "Poer",
    "Cannon",
    "Steed",
    "Tank 300",
    "Tank 500",
    "Ora 03",
    "Ora Good Cat",
  ],
  Chery: [
    "Tiggo 4 Pro",
    "Tiggo 7 Pro",
    "Tiggo 8 Pro",
    "Tiggo 8 Pro Max",
    "Arrizo 5",
    "Arrizo 6",
    "QQ",
  ],
  Omoda: ["C5", "C9", "E5"],
  Jaecoo: ["J7", "J8"],
  BYD: [
    "Atto 3",
    "Seal",
    "Seal U",
    "Sealion 6",
    "Sealion 7",
    "Dolphin",
    "Shark",
    "Han",
    "Tang",
  ],
  Lamborghini: [
    "Huracán",
    "Huracán EVO",
    "Huracán STO",
    "Aventador",
    "Urus",
    "Revuelto",
    "Gallardo",
  ],
  Ferrari: [
    "488",
    "488 GTB",
    "F8 Tributo",
    "Roma",
    "Portofino",
    "SF90",
    "296 GTB",
    "812 Superfast",
    "California",
    "Purosangue",
  ],
  Porsche: ["911", "911 Carrera", "911 Turbo", "Cayenne", "Macan", "Panamera", "Taycan", "Boxster", "Cayman", "718"],
  McLaren: ["570S", "600LT", "720S", "765LT", "Artura", "GT", "P1"],
  Koenigsegg: ["Agera", "Agera RS", "Regera", "Jesko", "Gemera", "CC850"],
  Bentley: ["Continental GT", "Flying Spur", "Bentayga", "Mulsanne"],
  "Rolls-Royce": ["Ghost", "Wraith", "Dawn", "Cullinan", "Phantom", "Spectre"],
  "Aston Martin": ["DB11", "DB12", "Vantage", "DBS", "DBX", "Valkyrie"],
  Maserati: ["Ghibli", "Levante", "Quattroporte", "MC20", "Grecale", "GranTurismo"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "Giulietta", "4C"],
  RAM: ["1500", "2500", "3500"],
  Cadillac: ["Escalade", "CT4", "CT5", "XT4", "XT5", "XT6"],
  Infiniti: ["Q50", "Q60", "QX50", "QX60", "QX80"],
  Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  Jaguar: ["XE", "XF", "F-Pace", "E-Pace", "I-Pace", "F-Type"],
  Lexus: ["UX", "NX", "NX 300", "RX", "ES", "IS", "LX", "LC"],
  Mini: ["Cooper", "Cooper S", "Countryman", "Clubman", "Paceman"],
  Dodge: ["Challenger", "Charger", "Durango"],
  Datsun: ["Go", "Go+", "Cross"],
  MG: ["ZS", "ZS EV", "HS", "MG3", "MG4", "MG5", "Cyberster"],
  SsangYong: ["Korando", "Rexton", "Musso", "Tivoli"],
  BAIC: ["X55", "X55 Pro", "B40", "BJ40", "X7"],
  JAC: ["T8", "T9", "X200", "JS4", "JS6", "e-JS4"],
  Proton: ["X50", "X70", "Saga", "Persona", "Iriz"],
  DFSK: ["Glory 580", "Glory 580 Pro", "ix5", "Seres 3", "C31", "C32"],
  Ineos: ["Grenadier", "Quartermaster"],
  Pagani: ["Huayra", "Zonda"],
  Bugatti: ["Chiron", "Veyron", "Mistral"],
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

export const VEHICLE_COLORS = [
  "White",
  "Black",
  "Silver",
  "Grey",
  "Mineral Grey",
  "Blue",
  "Red",
  "Yellow",
  "Orange",
  "Green",
  "Brown",
  "Beige",
  "Gold",
  "Bronze",
  "Purple",
  "Pearl White",
  "Metallic Black",
  "Champagne",
] as const;

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
  if (models.length === 0) return trimmed;
  const lower = trimmed.toLowerCase();
  const exact = models.find((m) => m.toLowerCase() === lower);
  if (exact) return exact;
  // Autocomplete only when the typed prefix uniquely identifies one catalog model.
  if (lower.length >= 2) {
    const prefixMatches = models.filter((m) => m.toLowerCase().startsWith(lower));
    if (prefixMatches.length === 1) return prefixMatches[0];
    const exactAmongPrefixes = prefixMatches.find((m) => m.toLowerCase() === lower);
    if (exactAmongPrefixes) return exactAmongPrefixes;
  }
  // Keep custom / exotic models (Corvette C8, Huracán EVO, etc.) — never guess.
  return trimmed;
}

/**
 * Infer SA body style from make/model/title when CSV/listing omits bodyType.
 * Used by Inventory filters and CSV import so Sedan/Bakkie/etc. actually work.
 */
export function inferBodyType(
  make?: string | null,
  model?: string | null,
  title?: string | null,
): (typeof BODY_TYPES)[number] | null {
  const hay = [make, model, title].filter(Boolean).join(" ").toLowerCase();
  if (!hay.trim()) return null;

  if (/\b(double\s*cab|doublecab)\b/.test(hay)) return "Double Cab";
  if (/\b(single\s*cab|singlecab)\b/.test(hay)) return "Single Cab";
  if (
    /\b(hilux|ranger|d-?max|amarok|navara|triton|bt-?50|canyon|colorado|landcruiser\s*pickup|bakkie|pickup|pick-up|pik\s*up|p-?series|poer|cannon|steed|\bt8\b|\bt9\b|landtrek|oroch|musso|shark)\b/.test(
      hay,
    )
  ) {
    return "Bakkie";
  }
  if (
    /\b(fortuner|pajero|everest|mu-?x|rav4|x-?trail|tucson|sportage|cx-5|q5|q3|q7|x3|x5|x1|glc|gle|jolion|h6|hs|suv|crossover|c-?hr|corolla\s*cross|urban\s*cruiser|velar|range\s*rover|land\s*rover|discovery|defender|omoda|jaecoo|\bc5\b|\bc9\b|\bj7\b|\bj8\b|tiggo|tank\s*300|tank\s*500|atto\s*3|sealion|creta|seltos|magnite|x50|x70)\b/.test(
      hay,
    )
  ) {
    return "SUV";
  }
  if (/\b(mpv|avanza|mobilio|livina|sienna|odyssey|carnival|alphard)\b/.test(hay)) {
    return "MPV";
  }
  if (/\b(coupe|911|cayman|mustang|supra|cayman|brz|tt\b|z4|c.?class\s*coupe)\b/.test(hay)) {
    return "Coupe";
  }
  if (/\b(convertible|cabriolet|roadster|spider|spyder)\b/.test(hay)) {
    return "Convertible";
  }
  if (/\b(wagon|touring|sportback|avant|estate)\b/.test(hay)) {
    return "Wagon";
  }
  if (
    /\b(polo|swift|fiesta|i20|i10|golf|fabia|yaris|jazz|fit|clio|sandero|hatch|hatchback)\b/.test(
      hay,
    )
  ) {
    return "Hatchback";
  }
  if (
    /\b(corolla|civic|accord|camry|mazda3|mazda\s*3|sentra|elantra|jetta|passat|c.?class|3\s*series|320i|c200|a.?class|sedan|saloon)\b/.test(
      hay,
    )
  ) {
    return "Sedan";
  }
  return null;
}

/** Effective body type: stored value, else inferred from make/model/title. */
export function effectiveBodyType(v: {
  bodyType?: string | null;
  make?: string | null;
  model?: string | null;
  title?: string | null;
}): string | null {
  const raw = (v.bodyType ?? "").trim();
  if (raw) return raw;
  return inferBodyType(v.make, v.model, v.title);
}
