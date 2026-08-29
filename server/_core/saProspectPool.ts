import { assessProspectEmail, isOutreachReadyForDealership } from "../../shared/prospectEmailQuality";
import {
  RESEARCH_COOLDOWN_MS,
  hydrateResearchCooldownsFromDb,
  isResearchOnCooldown,
  markResearchAttemptedInMemory,
  persistResearchAttempt,
  researchKeyFrom,
  _clearResearchCooldownsForTests as _clearCooldownMemory,
} from "./prospectResearchCooldown";

export interface SAProspectEntry {
  name: string;
  city: string;
  province: string;
  email: string;
  phone: string;
  brands: string[];
  segment: "luxury" | "volume" | "budget" | "exotic" | "multi-brand";
  estimatedMonthlyVolume: number;
  website?: string;
  /**
   * Known principal / owner first (or full) name when the public mailbox is
   * still info@/sales@. Sipho seeds email-guess with this before cold scrape.
   */
  principalName?: string;
  principalRole?: string;
}

export const SA_PROSPECT_POOL: SAProspectEntry[] = [
  // Named / principal contacts only get picked by pickNextProspects.
  // Seed with the one verified named email from the pilot list.
  {
    name: "Jubilee Motors",
    city: "Springs",
    province: "Gauteng",
    email: "darius@jubileemotors.co.za",
    phone: "0118114008",
    brands: ["Multi-brand used"],
    segment: "volume",
    estimatedMonthlyVolume: 40,
    website: "https://jubileemotors.co.za",
    principalName: "Darius",
    principalRole: "Dealer Principal",
  },
  // Known first names (still on info@) — prioritize for name→email guess
  {
    name: "SD Auto CC",
    city: "Wychwood, Johannesburg",
    province: "Gauteng",
    email: "info@sdautocc.co.za",
    phone: "0116150228",
    brands: ["Multi-brand used"],
    segment: "budget",
    estimatedMonthlyVolume: 30,
    website: "https://sdautocc.co.za",
    principalName: "Donoven",
    principalRole: "Owner",
  },
  {
    name: "Corona Motors",
    city: "Gezina, Pretoria",
    province: "Gauteng",
    email: "info@coronamotors.co.za",
    phone: "0123358359",
    brands: ["Multi-brand used"],
    segment: "volume",
    estimatedMonthlyVolume: 55,
    website: "https://coronamotors.co.za",
    principalName: "Jan",
    principalRole: "Contact",
  },
  {
    name: "M5 Auto",
    city: "Boksburg",
    province: "Gauteng",
    email: "info@m5auto.co.za",
    phone: "0112305220",
    brands: ["Multi-brand used"],
    segment: "volume",
    estimatedMonthlyVolume: 80,
    website: "https://m5auto.co.za",
    principalName: "Ammaar",
    principalRole: "Contact",
  },
  // ─── Gauteng – Johannesburg ───────────────────────────────────────────────
  {
    name: "Northgate Motor Village",
    city: "Roodepoort",
    province: "Gauteng",
    email: "sales@northgatemotorvillage.co.za",
    phone: "0116744800",
    brands: ["Toyota", "Hyundai", "Kia"],
    segment: "volume",
    estimatedMonthlyVolume: 180,
    website: "https://www.northgatemotorvillage.co.za",
  },
  {
    name: "Soweto Auto Exchange",
    city: "Soweto",
    province: "Gauteng",
    email: "info@sowetoauto.co.za",
    phone: "0118523300",
    brands: ["Ford", "Chevrolet", "Nissan"],
    segment: "volume",
    estimatedMonthlyVolume: 145,
    website: "https://www.sowetoauto.co.za",
  },
  {
    name: "Joburg Prestige Cars",
    city: "Johannesburg",
    province: "Gauteng",
    email: "info@joburgprestige.co.za",
    phone: "0117862100",
    brands: ["Bentley", "Rolls-Royce", "Lamborghini"],
    segment: "exotic",
    estimatedMonthlyVolume: 12,
    website: "https://www.joburgprestige.co.za",
  },
  {
    name: "Eastgate Motors",
    city: "Johannesburg",
    province: "Gauteng",
    email: "sales@eastgatemotors.co.za",
    phone: "0116161900",
    brands: ["Volkswagen", "Mazda", "Renault"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 130,
    website: "https://www.eastgatemotors.co.za",
  },
  {
    name: "Crown Mines Auto",
    city: "Johannesburg",
    province: "Gauteng",
    email: "info@crownminesauto.co.za",
    phone: "0118380400",
    brands: ["Isuzu", "Mitsubishi", "Haval"],
    segment: "volume",
    estimatedMonthlyVolume: 115,
    website: "https://www.crownminesauto.co.za",
  },

  // ─── Gauteng – Sandton ────────────────────────────────────────────────────
  {
    name: "Sandton Auto Group",
    city: "Sandton",
    province: "Gauteng",
    email: "enquiries@sandtonautogroup.co.za",
    phone: "0117843600",
    brands: ["Mercedes-Benz", "AMG", "Maybach"],
    segment: "luxury",
    estimatedMonthlyVolume: 95,
    website: "https://www.sandtonautogroup.co.za",
  },
  {
    name: "Rivonia Luxury Autos",
    city: "Sandton",
    province: "Gauteng",
    email: "info@rivonialuxury.co.za",
    phone: "0117801200",
    brands: ["Porsche", "Ferrari", "Maserati"],
    segment: "exotic",
    estimatedMonthlyVolume: 20,
    website: "https://www.rivonialuxury.co.za",
  },
  {
    name: "Katherine Street Motorwerks",
    city: "Sandton",
    province: "Gauteng",
    email: "sales@katherinestreet.co.za",
    phone: "0117819900",
    brands: ["BMW", "MINI"],
    segment: "luxury",
    estimatedMonthlyVolume: 75,
    website: "https://www.katherinestreet.co.za",
  },
  {
    name: "Sandton Audi Prestige",
    city: "Sandton",
    province: "Gauteng",
    email: "prestige@sandtonaudi.co.za",
    phone: "0117807700",
    brands: ["Audi", "Audi Sport"],
    segment: "luxury",
    estimatedMonthlyVolume: 68,
    website: "https://www.sandtonaudi.co.za",
  },

  // ─── Gauteng – Randburg ───────────────────────────────────────────────────
  {
    name: "Randburg Motor Mall",
    city: "Randburg",
    province: "Gauteng",
    email: "info@randburgmotormall.co.za",
    phone: "0117896500",
    brands: ["Toyota", "Nissan", "Kia", "Hyundai"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 220,
    website: "https://www.randburgmotormall.co.za",
  },
  {
    name: "Republic Road Cars",
    city: "Randburg",
    province: "Gauteng",
    email: "contact@republicroadcars.co.za",
    phone: "0117915800",
    brands: ["Ford", "Mahindra", "Isuzu"],
    segment: "volume",
    estimatedMonthlyVolume: 160,
    website: "https://www.republicroadcars.co.za",
  },
  {
    name: "Lexus Sandton North",
    city: "Randburg",
    province: "Gauteng",
    email: "info@lexussandtonnorth.co.za",
    phone: "0117924100",
    brands: ["Lexus"],
    segment: "luxury",
    estimatedMonthlyVolume: 45,
    website: "https://www.lexussandtonnorth.co.za",
  },

  // ─── Gauteng – Roodepoort ─────────────────────────────────────────────────
  {
    name: "Roodepoort Motorpark",
    city: "Roodepoort",
    province: "Gauteng",
    email: "sales@roodepoortmotorpark.co.za",
    phone: "0116722900",
    brands: ["Volkswagen", "Suzuki", "Chery"],
    segment: "volume",
    estimatedMonthlyVolume: 140,
    website: "https://www.roodepoortmotorpark.co.za",
  },
  {
    name: "Westgate Auto Centre",
    city: "Roodepoort",
    province: "Gauteng",
    email: "info@westgateautocentre.co.za",
    phone: "0116753400",
    brands: ["Opel", "Renault", "Datsun"],
    segment: "budget",
    estimatedMonthlyVolume: 110,
    website: "https://www.westgateautocentre.co.za",
  },

  // ─── Gauteng – Pretoria ───────────────────────────────────────────────────
  {
    name: "Hatfield Auto Plaza",
    city: "Pretoria",
    province: "Gauteng",
    email: "sales@hatfieldautoplaza.co.za",
    phone: "0124609900",
    brands: ["Toyota", "Ford", "Mitsubishi"],
    segment: "volume",
    estimatedMonthlyVolume: 195,
    website: "https://www.hatfieldautoplaza.co.za",
  },
  {
    name: "Menlyn BMW Motorrad",
    city: "Pretoria",
    province: "Gauteng",
    email: "info@menlynbmw.co.za",
    phone: "0124607100",
    brands: ["BMW", "BMW Motorrad"],
    segment: "luxury",
    estimatedMonthlyVolume: 58,
    website: "https://www.menlynbmw.co.za",
  },
  {
    name: "Pretoria Porsche Centre",
    city: "Pretoria",
    province: "Gauteng",
    email: "info@pretoriaporsche.co.za",
    phone: "0124605300",
    brands: ["Porsche"],
    segment: "exotic",
    estimatedMonthlyVolume: 18,
    website: "https://www.pretoriaporsche.co.za",
  },
  {
    name: "Capital City Hyundai",
    city: "Pretoria",
    province: "Gauteng",
    email: "sales@capitalcityhyundai.co.za",
    phone: "0124626800",
    brands: ["Hyundai"],
    segment: "volume",
    estimatedMonthlyVolume: 130,
    website: "https://www.capitalcityhyundai.co.za",
  },

  // ─── Gauteng – Centurion ──────────────────────────────────────────────────
  {
    name: "Centurion Motor Hub",
    city: "Centurion",
    province: "Gauteng",
    email: "info@centurionmotorhub.co.za",
    phone: "0126637800",
    brands: ["Kia", "Volkswagen", "Haval"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 175,
    website: "https://www.centurionmotorhub.co.za",
  },
  {
    name: "Midstream Autos",
    city: "Centurion",
    province: "Gauteng",
    email: "enquiries@midstreamautos.co.za",
    phone: "0126649200",
    brands: ["Honda", "Mazda", "Subaru"],
    segment: "volume",
    estimatedMonthlyVolume: 120,
    website: "https://www.midstreamautos.co.za",
  },
  {
    name: "Centurion Lexus & Land Rover",
    city: "Centurion",
    province: "Gauteng",
    email: "info@centurionlexus.co.za",
    phone: "0126651100",
    brands: ["Lexus", "Land Rover"],
    segment: "luxury",
    estimatedMonthlyVolume: 52,
    website: "https://www.centurionlexus.co.za",
  },

  // ─── Western Cape – Cape Town ─────────────────────────────────────────────
  {
    name: "Atlantic Seaboard Motors",
    city: "Cape Town",
    province: "Western Cape",
    email: "sales@atlanticseaboardmotors.co.za",
    phone: "0214348800",
    brands: ["Mercedes-Benz", "Jaguar"],
    segment: "luxury",
    estimatedMonthlyVolume: 70,
    website: "https://www.atlanticseaboardmotors.co.za",
  },
  {
    name: "Cape BMW Motorwerks",
    city: "Cape Town",
    province: "Western Cape",
    email: "info@capebmw.co.za",
    phone: "0214621900",
    brands: ["BMW", "MINI"],
    segment: "luxury",
    estimatedMonthlyVolume: 80,
    website: "https://www.capebmw.co.za",
  },
  {
    name: "Table Bay Toyota",
    city: "Cape Town",
    province: "Western Cape",
    email: "sales@tablebaytoyota.co.za",
    phone: "0214468700",
    brands: ["Toyota"],
    segment: "volume",
    estimatedMonthlyVolume: 210,
    website: "https://www.tablebaytoyota.co.za",
  },
  {
    name: "N1 City Auto Park",
    city: "Cape Town",
    province: "Western Cape",
    email: "info@n1cityautopark.co.za",
    phone: "0219116300",
    brands: ["Ford", "Renault", "Nissan", "Datsun"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 165,
    website: "https://www.n1cityautopark.co.za",
  },
  {
    name: "Tygervalley Prestige Motors",
    city: "Cape Town",
    province: "Western Cape",
    email: "prestige@tygervalleymotors.co.za",
    phone: "0219147400",
    brands: ["Porsche", "Audi", "Lexus"],
    segment: "luxury",
    estimatedMonthlyVolume: 55,
    website: "https://www.tygervalleymotors.co.za",
  },

  // ─── Western Cape – Stellenbosch ──────────────────────────────────────────
  {
    name: "Stellenbosch Auto Traders",
    city: "Stellenbosch",
    province: "Western Cape",
    email: "info@stellenboschautors.co.za",
    phone: "0218832600",
    brands: ["Volkswagen", "Hyundai", "Kia"],
    segment: "volume",
    estimatedMonthlyVolume: 95,
    website: "https://www.stellenboschautors.co.za",
  },
  {
    name: "Winelands Luxury Drives",
    city: "Stellenbosch",
    province: "Western Cape",
    email: "info@winelandsdrives.co.za",
    phone: "0218841300",
    brands: ["BMW", "Mercedes-Benz", "Range Rover"],
    segment: "luxury",
    estimatedMonthlyVolume: 42,
    website: "https://www.winelandsdrives.co.za",
  },

  // ─── KwaZulu-Natal – Durban ───────────────────────────────────────────────
  {
    name: "Gateway Motor Mall",
    city: "Durban",
    province: "KwaZulu-Natal",
    email: "sales@gatewaymotormall.co.za",
    phone: "0313681100",
    brands: ["Toyota", "Ford", "Isuzu", "Volkswagen"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 260,
    website: "https://www.gatewaymotormall.co.za",
  },
  {
    name: "Berea Road BMW",
    city: "Durban",
    province: "KwaZulu-Natal",
    email: "info@bereadbmw.co.za",
    phone: "0313033800",
    brands: ["BMW"],
    segment: "luxury",
    estimatedMonthlyVolume: 65,
    website: "https://www.bereabmw.co.za",
  },
  {
    name: "Durban North Autos",
    city: "Durban",
    province: "KwaZulu-Natal",
    email: "sales@durbannorthautos.co.za",
    phone: "0313038500",
    brands: ["Nissan", "Renault", "Mitsubishi"],
    segment: "volume",
    estimatedMonthlyVolume: 135,
    website: "https://www.durbannorthautos.co.za",
  },
  {
    name: "Phoenix Motorland",
    city: "Durban",
    province: "KwaZulu-Natal",
    email: "info@phoenixmotorland.co.za",
    phone: "0322945500",
    brands: ["Chery", "Haval", "Datsun"],
    segment: "budget",
    estimatedMonthlyVolume: 180,
    website: "https://www.phoenixmotorland.co.za",
  },

  // ─── KwaZulu-Natal – Umhlanga ─────────────────────────────────────────────
  {
    name: "Umhlanga Premium Autos",
    city: "Umhlanga",
    province: "KwaZulu-Natal",
    email: "info@umhlangaautos.co.za",
    phone: "0313114900",
    brands: ["Porsche", "Mercedes-Benz", "Audi"],
    segment: "luxury",
    estimatedMonthlyVolume: 48,
    website: "https://www.umhlangaautos.co.za",
  },
  {
    name: "Ridge Motors Umhlanga",
    city: "Umhlanga",
    province: "KwaZulu-Natal",
    email: "sales@ridgemotorsumhlanga.co.za",
    phone: "0313116200",
    brands: ["Toyota", "Ford", "Kia"],
    segment: "volume",
    estimatedMonthlyVolume: 115,
    website: "https://www.ridgemotors.co.za",
  },

  // ─── Eastern Cape – Gqeberha (Port Elizabeth) ─────────────────────────────
  {
    name: "Gqeberha Auto Centre",
    city: "Gqeberha",
    province: "Eastern Cape",
    email: "info@gqeberhaauto.co.za",
    phone: "0414511200",
    brands: ["Volkswagen", "Ford", "Hyundai"],
    segment: "volume",
    estimatedMonthlyVolume: 150,
    website: "https://www.gqeberhaauto.co.za",
  },
  {
    name: "PE Prestige Motorworks",
    city: "Gqeberha",
    province: "Eastern Cape",
    email: "prestige@peprestige.co.za",
    phone: "0414523800",
    brands: ["BMW", "Mercedes-Benz"],
    segment: "luxury",
    estimatedMonthlyVolume: 40,
    website: "https://www.peprestige.co.za",
  },
  {
    name: "Walmer Auto Traders",
    city: "Gqeberha",
    province: "Eastern Cape",
    email: "sales@walmerauto.co.za",
    phone: "0415811500",
    brands: ["Toyota", "Kia", "Chery"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 125,
    website: "https://www.walmerauto.co.za",
  },

  // ─── Eastern Cape – East London ───────────────────────────────────────────
  {
    name: "East London Motor City",
    city: "East London",
    province: "Eastern Cape",
    email: "info@eastlondonmotorcity.co.za",
    phone: "0437225900",
    brands: ["Toyota", "Nissan", "Ford"],
    segment: "volume",
    estimatedMonthlyVolume: 140,
    website: "https://www.eastlondonmotorcity.co.za",
  },
  {
    name: "Buffalo City Autos",
    city: "East London",
    province: "Eastern Cape",
    email: "sales@buffalocityautos.co.za",
    phone: "0437311400",
    brands: ["Hyundai", "Kia", "Haval"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 110,
    website: "https://www.buffalocityautos.co.za",
  },

  // ─── Free State – Bloemfontein ────────────────────────────────────────────
  {
    name: "Bloem Motor Plaza",
    city: "Bloemfontein",
    province: "Free State",
    email: "info@bloemmotorplaza.co.za",
    phone: "0514479900",
    brands: ["Toyota", "Volkswagen", "Suzuki"],
    segment: "volume",
    estimatedMonthlyVolume: 170,
    website: "https://www.bloemmotorplaza.co.za",
  },
  {
    name: "Rose Garden Motors",
    city: "Bloemfontein",
    province: "Free State",
    email: "sales@rosegardenmotors.co.za",
    phone: "0514481600",
    brands: ["BMW", "Mercedes-Benz", "Audi"],
    segment: "luxury",
    estimatedMonthlyVolume: 45,
    website: "https://www.rosegardenmotors.co.za",
  },
  {
    name: "Southern Cross Auto",
    city: "Bloemfontein",
    province: "Free State",
    email: "contact@southerncrossauto.co.za",
    phone: "0514499200",
    brands: ["Ford", "Isuzu", "Mahindra"],
    segment: "volume",
    estimatedMonthlyVolume: 130,
    website: "https://www.southerncrossauto.co.za",
  },

  // ─── Mpumalanga – Nelspruit ───────────────────────────────────────────────
  {
    name: "Mbombela Motors",
    city: "Nelspruit",
    province: "Mpumalanga",
    email: "info@mbombelamotors.co.za",
    phone: "0137514200",
    brands: ["Toyota", "Ford", "Hyundai"],
    segment: "volume",
    estimatedMonthlyVolume: 120,
    website: "https://www.mbombelamotors.co.za",
  },
  {
    name: "Lowveld Prestige Cars",
    city: "Nelspruit",
    province: "Mpumalanga",
    email: "sales@lowveldprestige.co.za",
    phone: "0137529800",
    brands: ["BMW", "Range Rover", "Porsche"],
    segment: "luxury",
    estimatedMonthlyVolume: 35,
    website: "https://www.lowveldprestige.co.za",
  },
  {
    name: "Nelspruit Auto Mall",
    city: "Nelspruit",
    province: "Mpumalanga",
    email: "contact@nelspruitautomall.co.za",
    phone: "0137543600",
    brands: ["Kia", "Nissan", "Mahindra"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 98,
    website: "https://www.nelspruitautomall.co.za",
  },

  // ─── Limpopo – Polokwane ──────────────────────────────────────────────────
  {
    name: "Polokwane Car Hub",
    city: "Polokwane",
    province: "Limpopo",
    email: "info@polokwanecarhub.co.za",
    phone: "0152913400",
    brands: ["Toyota", "Volkswagen", "Ford"],
    segment: "volume",
    estimatedMonthlyVolume: 145,
    website: "https://www.polokwanecarhub.co.za",
  },
  {
    name: "Savanna Motors Polokwane",
    city: "Polokwane",
    province: "Limpopo",
    email: "sales@savannamotors.co.za",
    phone: "0152927700",
    brands: ["Isuzu", "Mitsubishi", "Haval"],
    segment: "volume",
    estimatedMonthlyVolume: 105,
    website: "https://www.savannamotors.co.za",
  },
  {
    name: "Northern Capital Autos",
    city: "Polokwane",
    province: "Limpopo",
    email: "contact@northerncapitalautos.co.za",
    phone: "0152938100",
    brands: ["BMW", "Mercedes-Benz"],
    segment: "luxury",
    estimatedMonthlyVolume: 32,
    website: "https://www.northerncapitalautos.co.za",
  },

  // ─── Northern Cape – Kimberley ────────────────────────────────────────────
  {
    name: "Diamond Fields Motors",
    city: "Kimberley",
    province: "Northern Cape",
    email: "info@diamondfieldsmotos.co.za",
    phone: "0538326900",
    brands: ["Toyota", "Nissan", "Suzuki"],
    segment: "volume",
    estimatedMonthlyVolume: 85,
    website: "https://www.diamondfieldsmotos.co.za",
  },
  {
    name: "Big Hole Auto",
    city: "Kimberley",
    province: "Northern Cape",
    email: "sales@bigholeauto.co.za",
    phone: "0538341200",
    brands: ["Ford", "Isuzu", "Mahindra"],
    segment: "volume",
    estimatedMonthlyVolume: 70,
    website: "https://www.bigholeauto.co.za",
  },

  // ─── Western Cape – George ────────────────────────────────────────────────
  {
    name: "Outeniqua Motors George",
    city: "George",
    province: "Western Cape",
    email: "info@outeniquamotors.co.za",
    phone: "0448749300",
    brands: ["Toyota", "Ford", "Kia"],
    segment: "volume",
    estimatedMonthlyVolume: 88,
    website: "https://www.outeniquamotors.co.za",
  },
  {
    name: "George Prestige Auto",
    city: "George",
    province: "Western Cape",
    email: "sales@georgeprestige.co.za",
    phone: "0448762100",
    brands: ["BMW", "Audi", "Mercedes-Benz"],
    segment: "luxury",
    estimatedMonthlyVolume: 28,
    website: "https://www.georgeprestige.co.za",
  },
  {
    name: "Lake Pleasure Motors",
    city: "George",
    province: "Western Cape",
    email: "contact@lakepleasuremotors.co.za",
    phone: "0448759800",
    brands: ["Hyundai", "Suzuki", "Renault"],
    segment: "budget",
    estimatedMonthlyVolume: 75,
    website: "https://www.lakepleasuremotors.co.za",
  },

  // ─── More Gauteng spread ──────────────────────────────────────────────────
  {
    name: "Fourways Motor Gallery",
    city: "Johannesburg",
    province: "Gauteng",
    email: "info@fourwaysmotorgallery.co.za",
    phone: "0117086600",
    brands: ["Ferrari", "Lamborghini", "McLaren"],
    segment: "exotic",
    estimatedMonthlyVolume: 8,
    website: "https://www.fourwaysmotorgallery.co.za",
  },
  {
    name: "Midrand Auto Junction",
    city: "Johannesburg",
    province: "Gauteng",
    email: "sales@midrandautojunction.co.za",
    phone: "0118057900",
    brands: ["Volkswagen", "Audi", "Skoda"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 190,
    website: "https://www.midrandautojunction.co.za",
  },
  {
    name: "Braamfontein Budget Cars",
    city: "Johannesburg",
    province: "Gauteng",
    email: "sales@braamfonteincars.co.za",
    phone: "0117166100",
    brands: ["Datsun", "Chery", "Baic"],
    segment: "budget",
    estimatedMonthlyVolume: 200,
    website: "https://www.braamfonteincars.co.za",
  },
  {
    name: "Edenvale Motorwerks",
    city: "Johannesburg",
    province: "Gauteng",
    email: "info@edenvalemotorwerks.co.za",
    phone: "0116096800",
    brands: ["Honda", "Suzuki", "Mazda"],
    segment: "volume",
    estimatedMonthlyVolume: 125,
    website: "https://www.edenvalemotorwerks.co.za",
  },
  {
    name: "Alberton Auto World",
    city: "Johannesburg",
    province: "Gauteng",
    email: "contact@albertonautoworld.co.za",
    phone: "0118699700",
    brands: ["Toyota", "Kia", "Haval", "Chery"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 155,
    website: "https://www.albertonautoworld.co.za",
  },

  // ─── North West – Rustenburg ──────────────────────────────────────────────
  {
    name: "Platinum City Motors",
    city: "Rustenburg",
    province: "North West",
    email: "info@platinumcitymotors.co.za",
    phone: "0142959100",
    brands: ["Toyota", "Ford", "Nissan"],
    segment: "volume",
    estimatedMonthlyVolume: 120,
    website: "https://www.platinumcitymotors.co.za",
  },
  {
    name: "Royal Bafokeng Auto",
    city: "Rustenburg",
    province: "North West",
    email: "sales@royalbafokengauto.co.za",
    phone: "0142964700",
    brands: ["Isuzu", "Mahindra", "Haval"],
    segment: "volume",
    estimatedMonthlyVolume: 90,
    website: "https://www.royalbafokengauto.co.za",
  },

  // ─── Gauteng – more Pretoria area ─────────────────────────────────────────
  {
    name: "Lynnwood Motor Village",
    city: "Pretoria",
    province: "Gauteng",
    email: "sales@lynnwoodmotorvillage.co.za",
    phone: "0124609400",
    brands: ["Volkswagen", "Audi", "Porsche"],
    segment: "luxury",
    estimatedMonthlyVolume: 82,
    website: "https://www.lynnwoodmotorvillage.co.za",
  },
  {
    name: "Silverton Auto Hub",
    city: "Pretoria",
    province: "Gauteng",
    email: "info@silveronautohub.co.za",
    phone: "0124510200",
    brands: ["Ford", "Mahindra", "Isuzu"],
    segment: "volume",
    estimatedMonthlyVolume: 140,
    website: "https://www.silveronautohub.co.za",
  },
  {
    name: "Wonderboom Auto Park",
    city: "Pretoria",
    province: "Gauteng",
    email: "contact@wonderboomautopark.co.za",
    phone: "0125436300",
    brands: ["Toyota", "Nissan", "Datsun"],
    segment: "volume",
    estimatedMonthlyVolume: 155,
    website: "https://www.wonderboomautopark.co.za",
  },

  // ─── KwaZulu-Natal – more spread ──────────────────────────────────────────
  {
    name: "Pinetown Motor Mall",
    city: "Durban",
    province: "KwaZulu-Natal",
    email: "info@pinetownmotormall.co.za",
    phone: "0317023400",
    brands: ["Hyundai", "Kia", "Renault"],
    segment: "volume",
    estimatedMonthlyVolume: 145,
    website: "https://www.pinetownmotormall.co.za",
  },
  {
    name: "Amanzimtoti Auto Village",
    city: "Durban",
    province: "KwaZulu-Natal",
    email: "sales@amanzimtotiauto.co.za",
    phone: "0317034800",
    brands: ["Toyota", "Suzuki", "Chery"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 95,
    website: "https://www.amanzimtotiauto.co.za",
  },

  // ─── Gauteng – multi-brand independents ───────────────────────────────────
  {
    name: "Joburg Auto Collective",
    city: "Johannesburg",
    province: "Gauteng",
    email: "info@joburgautocollective.co.za",
    phone: "0117453300",
    brands: ["BMW", "Audi", "Volkswagen", "Porsche"],
    segment: "multi-brand",
    estimatedMonthlyVolume: 90,
    website: "https://www.joburgautocollective.co.za",
  },
  {
    name: "Southgate Motors",
    city: "Johannesburg",
    province: "Gauteng",
    email: "contact@southgatemotors.co.za",
    phone: "0118691400",
    brands: ["Ford", "Kia", "Haval", "GWM"],
    segment: "volume",
    estimatedMonthlyVolume: 170,
    website: "https://www.southgatemotors.co.za",
  },
];

/**
 * Returns pool entries not yet in DB that have a website to research.
 * Does NOT require a pre-known named email — Sipho enriches from the site.
 * Skips names on short research cooldown (tried recently, no named email yet).
 */
export function pickNextProspectsForResearch(
  existingNames: string[],
  batchSize = 8,
): { batch: SAProspectEntry[]; researchRemaining: number } {
  const existing = new Set(existingNames.map((n) => n.toLowerCase().trim()));
  const available = SA_PROSPECT_POOL.filter(
    (p) =>
      !existing.has(p.name.toLowerCase().trim()) &&
      Boolean(p.website?.trim()) &&
      !isOnResearchCooldown(p.name, p.website),
  );

  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const batch = shuffled.slice(0, batchSize);
  const researchRemaining = Math.max(0, available.length - batch.length);
  return { batch, researchRemaining };
}

/**
 * @deprecated Prefer pickNextProspectsForResearch + website enrichment.
 * Only returns rows that already have named/principal emails.
 */
export function pickNextProspects(
  existingNames: string[],
  batchSize = 8,
): { batch: SAProspectEntry[]; poolRemaining: number } {
  const existing = new Set(existingNames.map((n) => n.toLowerCase().trim()));
  const available = SA_PROSPECT_POOL.filter(
    (p) =>
      !existing.has(p.name.toLowerCase().trim()) &&
      isOutreachReadyForDealership(p.email, p.website),
  );

  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const batch = shuffled.slice(0, batchSize);
  const poolRemaining = Math.max(0, available.length - batch.length);
  return { batch, poolRemaining };
}

/** How many pool dealerships still have a website, are not in the DB, and are not on cooldown. */
export function countResearchableProspects(existingNames: string[]): number {
  const existing = new Set(existingNames.map((n) => n.toLowerCase().trim()));
  return SA_PROSPECT_POOL.filter(
    (p) =>
      !existing.has(p.name.toLowerCase().trim()) &&
      Boolean(p.website?.trim()) &&
      !isOnResearchCooldown(p.name, p.website),
  ).length;
}

/** Pool rows on cooldown (researched recently with no named email). */
export function countCooldownProspects(existingNames: string[]): number {
  const existing = new Set(existingNames.map((n) => n.toLowerCase().trim()));
  return SA_PROSPECT_POOL.filter(
    (p) =>
      !existing.has(p.name.toLowerCase().trim()) &&
      Boolean(p.website?.trim()) &&
      isOnResearchCooldown(p.name, p.website),
  ).length;
}

export function markProspectResearchAttempted(
  name: string,
  website?: string | null,
): void {
  const primary = researchKeyFrom({ name, website });
  markResearchAttemptedInMemory(primary, { status: "no_named_email" });
  const nameKey = researchKeyFrom({ name });
  if (nameKey !== primary) {
    markResearchAttemptedInMemory(nameKey, { status: "no_named_email" });
  }
}

export function isOnResearchCooldown(name: string, website?: string | null): boolean {
  const primary = researchKeyFrom({ name, website });
  if (isResearchOnCooldown(primary)) return true;
  const nameKey = researchKeyFrom({ name });
  return nameKey !== primary && isResearchOnCooldown(nameKey);
}

/** Test helper */
export function _clearResearchCooldownsForTests(): void {
  _clearCooldownMemory();
}

export {
  hydrateResearchCooldownsFromDb,
  persistResearchAttempt,
  researchKeyFrom,
  RESEARCH_COOLDOWN_MS,
};
