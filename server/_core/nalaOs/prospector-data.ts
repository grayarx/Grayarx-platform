import type { IcpSegment, Prospect } from "@nalaOs/prospector-types";
import type { RegionId } from "@nalaOs/regions/config";

type Seed = {
  id: string;
  name: string;
  regionId: RegionId;
  city: string;
  location: string;
  score: number;
  segment: IcpSegment;
  abilityToPay: Prospect["abilityToPay"];
  stockHint: string;
  status?: Prospect["status"];
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;
};

function build(seed: Seed): Prospect {
  const pay =
    seed.abilityToPay === "enterprise"
      ? "group budget / multi-yard"
      : seed.abilityToPay === "high"
        ? "premium stock / franchise cashflow"
        : "steady used volume";
  return {
    id: seed.id,
    name: seed.name,
    regionId: seed.regionId,
    city: seed.city,
    location: seed.location,
    score: seed.score,
    status: seed.status ?? "scouted",
    segment: seed.segment,
    abilityToPay: seed.abilityToPay,
    stockHint: seed.stockHint,
    contactName: seed.contactName ?? "Sales manager / GM",
    phone: seed.phone,
    email: seed.email,
    website: seed.website,
    researchNote: `${seed.stockHint} · ICP: ${seed.segment.replace(/_/g, " ")} · ${pay}. Fill phone/email from their AutoTrader or site before dialling.`,
    callReason: `I had a look at ${seed.name}'s online stock — curious what happens when a buyer enquires after your team has gone home.`,
  };
}

/**
 * High-ICP pool: yards that feel after-hours lead loss AND can pay Professional+.
 * Phones intentionally blank — paste real switchboard from public listings (compliance).
 */
const SEEDS: Seed[] = [
  // ——— South Africa (priority) ———
  {
    id: "za-sandton-prestige",
    name: "Sandton Prestige Motors",
    regionId: "ZA",
    city: "Sandton",
    location: "Sandton, Gauteng, ZA",
    score: 96,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "High-value used German + bakkie mix on AutoTrader",
  },
  {
    id: "za-midrand-auto",
    name: "Midrand Auto Hub",
    regionId: "ZA",
    city: "Midrand",
    location: "Midrand, Gauteng, ZA",
    score: 94,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "Large Cars.co.za footprint — nights/weekends go cold",
  },
  {
    id: "za-centurion-select",
    name: "Centurion Select Cars",
    regionId: "ZA",
    city: "Centurion",
    location: "Centurion, Gauteng, ZA",
    score: 93,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Strong Pretoria East buyer pool; after-hours WhatsApp gap",
  },
  {
    id: "za-fourways-motors",
    name: "Fourways Motor Company",
    regionId: "ZA",
    city: "Fourways",
    location: "Fourways, Gauteng, ZA",
    score: 92,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "Family volume yard — GM feels Monday empty enquiry tray",
  },
  {
    id: "za-randburg-drive",
    name: "Randburg Drive Auto",
    regionId: "ZA",
    city: "Randburg",
    location: "Randburg, Gauteng, ZA",
    score: 90,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Busy Corlett corridor traffic; parts counter optional",
  },
  {
    id: "za-rosebank-luxury",
    name: "Rosebank Luxury Pre-Owned",
    regionId: "ZA",
    city: "Rosebank",
    location: "Rosebank, Gauteng, ZA",
    score: 95,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "R500k+ units — one recovered car pays annual OS",
  },
  {
    id: "za-bedfordview-cars",
    name: "Bedfordview Car Centre",
    regionId: "ZA",
    city: "Bedfordview",
    location: "Bedfordview, Gauteng, ZA",
    score: 89,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "East Rand volume; MotorX likely already in place",
  },
  {
    id: "za-kempton-auto",
    name: "Kempton Park Auto Traders",
    regionId: "ZA",
    city: "Kempton Park",
    location: "Kempton Park, Gauteng, ZA",
    score: 88,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Airport corridor buyers message late",
  },
  {
    id: "za-pretoria-north",
    name: "Pretoria North Motors",
    regionId: "ZA",
    city: "Pretoria",
    location: "Pretoria North, Gauteng, ZA",
    score: 91,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "Large PTA footprint; multi-desk OS fit",
  },
  {
    id: "za-hatfield-motors",
    name: "Hatfield Motor Group (used desk)",
    regionId: "ZA",
    city: "Pretoria",
    location: "Hatfield, Gauteng, ZA",
    score: 94,
    segment: "franchise_dealer",
    abilityToPay: "enterprise",
    stockHint: "Franchise used desk — keep DMS, add Nala conversion",
  },
  {
    id: "za-menlyn-auto",
    name: "Menlyn Auto Gallery",
    regionId: "ZA",
    city: "Pretoria",
    location: "Menlyn, Gauteng, ZA",
    score: 92,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "East PTA premium; WhatsApp is the showroom after 5",
  },
  {
    id: "za-ct-waterfront",
    name: "Cape Town Waterfront Cars",
    regionId: "ZA",
    city: "Cape Town",
    location: "V&A / City Bowl, Western Cape, ZA",
    score: 95,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Tourism + local premium enquiries nights/weekends",
  },
  {
    id: "za-ct-tygervalley",
    name: "Tygervalley Prestige",
    regionId: "ZA",
    city: "Cape Town",
    location: "Tygervalley, Western Cape, ZA",
    score: 93,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Northern suburbs money; AutoTrader heavy",
  },
  {
    id: "za-ct-bellville",
    name: "Bellville Auto Exchange",
    regionId: "ZA",
    city: "Cape Town",
    location: "Bellville, Western Cape, ZA",
    score: 90,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "Volume WC yard — service + parts upsell path",
  },
  {
    id: "za-ct-somerset",
    name: "Somerset West Motors",
    regionId: "ZA",
    city: "Somerset West",
    location: "Somerset West, Western Cape, ZA",
    score: 89,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Helderberg corridor; weekend enquiry spike",
  },
  {
    id: "za-ct-claremont",
    name: "Claremont Select Autos",
    regionId: "ZA",
    city: "Cape Town",
    location: "Claremont, Western Cape, ZA",
    score: 91,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Southern suburbs premium independents",
  },
  {
    id: "za-dbn-umhlanga",
    name: "Umhlanga Prestige Cars",
    regionId: "ZA",
    city: "Umhlanga",
    location: "Umhlanga, KwaZulu-Natal, ZA",
    score: 94,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "KZN coastal premium — high GP units",
  },
  {
    id: "za-dbn-gateway",
    name: "Gateway Auto Mart",
    regionId: "ZA",
    city: "Durban",
    location: "Umhlanga / Gateway, KZN, ZA",
    score: 90,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "Mall traffic + after-hours WhatsApp",
  },
  {
    id: "za-dbn-pieter",
    name: "Pietermaritzburg Motor Traders",
    regionId: "ZA",
    city: "Pietermaritzburg",
    location: "Pietermaritzburg, KZN, ZA",
    score: 87,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Midlands volume; less AI competition",
  },
  {
    id: "za-pe-beach",
    name: "Gqeberha Beach Road Autos",
    regionId: "ZA",
    city: "Gqeberha",
    location: "Gqeberha, Eastern Cape, ZA",
    score: 88,
    segment: "premium_independent",
    abilityToPay: "medium",
    stockHint: "EC coastal — underserved by AI vendors",
  },
  {
    id: "za-pe-prestige",
    name: "PE Prestige Motorworks",
    regionId: "ZA",
    city: "Gqeberha",
    location: "Port Elizabeth, Eastern Cape, ZA",
    score: 90,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Healthy used mix; weekend coverage gap",
    status: "scouted",
  },
  {
    id: "za-bloem-motors",
    name: "Bloemfontein Auto City",
    regionId: "ZA",
    city: "Bloemfontein",
    location: "Bloemfontein, Free State, ZA",
    score: 86,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Regional hub — less chatbot noise",
  },
  {
    id: "za-pta-motors-group",
    name: "Gauteng Multi-Branch Motor Group",
    regionId: "ZA",
    city: "Johannesburg",
    location: "Multi-branch Gauteng, ZA",
    score: 97,
    segment: "multi_branch_group",
    abilityToPay: "enterprise",
    stockHint: "3+ yards — Enterprise OS + group Monday ROI",
  },
  {
    id: "za-jhb-import",
    name: "Johannesburg Import Specialists",
    regionId: "ZA",
    city: "Johannesburg",
    location: "Johannesburg, Gauteng, ZA",
    score: 91,
    segment: "specialty_import",
    abilityToPay: "high",
    stockHint: "JDM/Euro imports — buyers message nights",
  },
  {
    id: "za-stellenbosch",
    name: "Stellenbosch Motor Gallery",
    regionId: "ZA",
    city: "Stellenbosch",
    location: "Stellenbosch, Western Cape, ZA",
    score: 92,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Winelands money; low AI saturation",
  },
  {
    id: "za-polokwane",
    name: "Polokwane Auto Plaza",
    regionId: "ZA",
    city: "Polokwane",
    location: "Polokwane, Limpopo, ZA",
    score: 85,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Regional capital — WhatsApp-first buyers",
  },
  {
    id: "za-nelspruit",
    name: "Mbombela Lowveld Motors",
    regionId: "ZA",
    city: "Mbombela",
    location: "Mbombela, Mpumalanga, ZA",
    score: 85,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Lowveld corridor; bakkie-heavy stock",
  },
  {
    id: "za-kimberley",
    name: "Kimberley Diamond Autos",
    regionId: "ZA",
    city: "Kimberley",
    location: "Kimberley, Northern Cape, ZA",
    score: 82,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Sparse competition for AI conversion",
  },
  {
    id: "za-east-london",
    name: "East London Motor Traders",
    regionId: "ZA",
    city: "East London",
    location: "East London, Eastern Cape, ZA",
    score: 86,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Border region volume yard",
  },
  {
    id: "za-george",
    name: "Garden Route Motors George",
    regionId: "ZA",
    city: "George",
    location: "George, Western Cape, ZA",
    score: 88,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Garden Route tourism + retiree buyers",
  },

  // ——— Australia ———
  {
    id: "au-sydney-prestige",
    name: "Sydney North Shore Prestige",
    regionId: "AU",
    city: "Sydney",
    location: "North Shore, NSW, AU",
    score: 93,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Carsales heavy; after-hours SMS/WA gap",
  },
  {
    id: "au-melbourne-volume",
    name: "Melbourne South-East Auto Group",
    regionId: "AU",
    city: "Melbourne",
    location: "South-East Melbourne, VIC, AU",
    score: 92,
    segment: "multi_branch_group",
    abilityToPay: "enterprise",
    stockHint: "Multi-site used — Enterprise AUD pricing",
  },
  {
    id: "au-brisbane-used",
    name: "Brisbane River City Motors",
    regionId: "AU",
    city: "Brisbane",
    location: "Brisbane, QLD, AU",
    score: 90,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "QLD volume; weekend enquiry spike",
  },
  {
    id: "au-perth-prestige",
    name: "Perth Prestige Pre-Owned",
    regionId: "AU",
    city: "Perth",
    location: "Perth, WA, AU",
    score: 91,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Isolated market — less AI vendor noise",
  },
  {
    id: "au-adelaide",
    name: "Adelaide Hills Auto",
    regionId: "AU",
    city: "Adelaide",
    location: "Adelaide, SA, AU",
    score: 88,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Solid Carsales presence",
  },

  // ——— United Kingdom ———
  {
    id: "gb-london-prestige",
    name: "North London Prestige Cars",
    regionId: "GB",
    city: "London",
    location: "North London, England, GB",
    score: 94,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "AutoTrader UK premium independents",
  },
  {
    id: "gb-manchester",
    name: "Manchester Motor Hub",
    regionId: "GB",
    city: "Manchester",
    location: "Manchester, England, GB",
    score: 91,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "Volume North — PECR-compliant outreach",
  },
  {
    id: "gb-birmingham",
    name: "Birmingham Midlands Autos",
    regionId: "GB",
    city: "Birmingham",
    location: "Birmingham, England, GB",
    score: 90,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "Midlands volume groups",
  },
  {
    id: "gb-edinburgh",
    name: "Edinburgh Capital Cars",
    regionId: "GB",
    city: "Edinburgh",
    location: "Edinburgh, Scotland, GB",
    score: 89,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Scotland premium independents",
  },
  {
    id: "gb-bristol",
    name: "Bristol South West Motors",
    regionId: "GB",
    city: "Bristol",
    location: "Bristol, England, GB",
    score: 88,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "SW England used specialists",
  },

  // ——— UAE ———
  {
    id: "ae-dubai-exotic",
    name: "Dubai Exotic Pre-Owned",
    regionId: "AE",
    city: "Dubai",
    location: "Dubai, AE",
    score: 96,
    segment: "specialty_import",
    abilityToPay: "enterprise",
    stockHint: "dubizzle luxury — WhatsApp is the sale",
  },
  {
    id: "ae-dubai-volume",
    name: "Dubai Auto Trader Yard",
    regionId: "AE",
    city: "Dubai",
    location: "Al Quoz / Dubai, AE",
    score: 93,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "High WA volume; English + Arabic later",
  },
  {
    id: "ae-abu-dhabi",
    name: "Abu Dhabi Capital Motors",
    regionId: "AE",
    city: "Abu Dhabi",
    location: "Abu Dhabi, AE",
    score: 92,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Capital premium used",
  },

  // ——— United States ———
  {
    id: "us-la-indie",
    name: "Los Angeles Indie Pre-Owned",
    regionId: "US",
    city: "Los Angeles",
    location: "Los Angeles, CA, US",
    score: 92,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Cars.com / CarGurus — TCPA-safe outbound only",
  },
  {
    id: "us-dallas-group",
    name: "Dallas Metro Auto Group",
    regionId: "US",
    city: "Dallas",
    location: "Dallas–Fort Worth, TX, US",
    score: 94,
    segment: "multi_branch_group",
    abilityToPay: "enterprise",
    stockHint: "Multi-rooftop used — USD Enterprise",
  },
  {
    id: "us-miami-import",
    name: "Miami Import Specialists",
    regionId: "US",
    city: "Miami",
    location: "Miami, FL, US",
    score: 93,
    segment: "specialty_import",
    abilityToPay: "high",
    stockHint: "Import/export — WhatsApp-friendly buyers",
  },
  {
    id: "us-atlanta",
    name: "Atlanta South Motors",
    regionId: "US",
    city: "Atlanta",
    location: "Atlanta, GA, US",
    score: 90,
    segment: "volume_used",
    abilityToPay: "high",
    stockHint: "SE US volume independents",
  },

  // ——— New Zealand ———
  {
    id: "nz-auckland",
    name: "Auckland North Shore Motors",
    regionId: "NZ",
    city: "Auckland",
    location: "North Shore, Auckland, NZ",
    score: 91,
    segment: "premium_independent",
    abilityToPay: "high",
    stockHint: "Trade Me Motors prestige",
  },
  {
    id: "nz-wellington",
    name: "Wellington City Autos",
    regionId: "NZ",
    city: "Wellington",
    location: "Wellington, NZ",
    score: 88,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "Capital volume independents",
  },
  {
    id: "nz-christchurch",
    name: "Christchurch Canterbury Cars",
    regionId: "NZ",
    city: "Christchurch",
    location: "Christchurch, NZ",
    score: 87,
    segment: "volume_used",
    abilityToPay: "medium",
    stockHint: "South Island — less AI competition",
  },
];

export const MOCK_PROSPECTS: Prospect[] = SEEDS.map(build);

export function findIcpProspect(id: string): Prospect | undefined {
  return MOCK_PROSPECTS.find((p) => p.id === id);
}

/** Paste public switchboard / named email onto a seeded yard (in-memory). */
export function patchProspectContact(
  id: string,
  patch: { phone?: string; email?: string; website?: string; contactName?: string },
): Prospect | undefined {
  const prospect = findIcpProspect(id);
  if (!prospect) return undefined;
  if (patch.phone !== undefined) {
    prospect.phone = patch.phone.trim() || undefined;
  }
  if (patch.email !== undefined) {
    prospect.email = patch.email.trim() || undefined;
  }
  if (patch.website !== undefined) {
    prospect.website = patch.website.trim() || undefined;
  }
  if (patch.contactName !== undefined) {
    prospect.contactName = patch.contactName.trim() || prospect.contactName;
  }
  return prospect;
}

export function addImportedProspects(rows: Prospect[]): number {
  let added = 0;
  for (const row of rows) {
    const existing = MOCK_PROSPECTS.find(
      (p) => p.id === row.id || (p.name === row.name && p.regionId === row.regionId),
    );
    if (existing) {
      existing.phone = row.phone ?? existing.phone;
      existing.email = row.email ?? existing.email;
      existing.website = row.website ?? existing.website;
      existing.contactName = row.contactName ?? existing.contactName;
      existing.stockHint = row.stockHint ?? existing.stockHint;
      existing.score = row.score;
      existing.segment = row.segment;
      existing.abilityToPay = row.abilityToPay;
      continue;
    }
    MOCK_PROSPECTS.push(row);
    added += 1;
  }
  return added;
}

export function prospectsByRegion(regionId: RegionId): Prospect[] {
  return MOCK_PROSPECTS.filter((p) => p.regionId === regionId);
}

export function highAbilityProspects(): Prospect[] {
  return MOCK_PROSPECTS.filter(
    (p) => p.abilityToPay === "high" || p.abilityToPay === "enterprise",
  ).sort((a, b) => b.score - a.score);
}
