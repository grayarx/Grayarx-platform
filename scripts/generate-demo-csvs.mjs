#!/usr/bin/env node
/**
 * Build demo inventory CSVs with make/model-matched Wikimedia photos,
 * ordered to match GrayArx PHOTO_ANGLES (front 3/4 → wheels).
 *
 * The 1000-car file uses a large unique SA fleet (not 8 cars on repeat).
 *
 * Usage: node scripts/generate-demo-csvs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "demo-data");
const CACHE_PATH = path.join(OUT, "photo-cache.json");

const ANGLES = [
  { id: "front_3_4", hint: "front OR exterior OR three-quarter OR 3/4" },
  { id: "rear_3_4", hint: "rear OR back" },
  { id: "side", hint: "side OR profile" },
  { id: "front", hint: "front" },
  { id: "rear", hint: "rear" },
  { id: "interior_front", hint: "interior OR seats OR cabin" },
  { id: "dashboard", hint: "dashboard OR cockpit OR steering" },
  { id: "wheels", hint: "wheel OR alloy OR rim" },
];

const CITIES = [
  "Sandton",
  "Pretoria",
  "Cape Town",
  "Durban",
  "Midrand",
  "Centurion",
  "Boksburg",
  "Umhlanga",
  "Johannesburg",
  "Bloemfontein",
  "Port Elizabeth",
  "Nelspruit",
  "Polokwane",
  "East London",
  "Stellenbosch",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clean(u) {
  try {
    const url = new URL(u);
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

function cacheKey(v) {
  return `${v.make}|${v.model}`.toLowerCase();
}

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

async function commonsSearch(q, limit = 12) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await sleep(320);
    const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1200&format=json&origin=*`;
    const res = await fetch(api, {
      headers: { "User-Agent": "GrayArxDemo/1.2 (contact: grayarx@gmail.com)" },
    });
    const text = await res.text();
    if (text.startsWith("You are making too many") || /rate limit/i.test(text)) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    try {
      const data = JSON.parse(text);
      return Object.values(data.query?.pages || {});
    } catch {
      await sleep(1000 * (attempt + 1));
    }
  }
  return [];
}

function pickUrls(pages, must, badExtra = /$a/) {
  const bad =
    /timeline|cut.?model|race|rally|rx_|wrx|196[0-9]|197[0-9]|198[0-9]|museum|badge|logo|lego|yacht|boat|engine bay|exploded|blueprint|drawing|sketch/i;
  return pages
    .filter((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii?.mime?.startsWith("image/")) return false;
      if ((ii.width || 0) < 700) return false;
      const t = p.title || "";
      if (bad.test(t) || badExtra.test(t)) return false;
      if (must && !must.test(t)) return false;
      return true;
    })
    .map((p) => clean(p.imageinfo[0].thumburl || p.imageinfo[0].url))
    .filter(Boolean);
}

async function photosForVehicle(v) {
  const used = new Set();
  const out = [];
  const poolQ = `filetype:bitmap ${v.commonsQuery}`;
  const poolPages = await commonsSearch(poolQ, 20);
  const pool = pickUrls(poolPages, v.must);

  for (const angle of ANGLES) {
    let urls = [];
    if (["interior_front", "dashboard", "wheels"].includes(angle.id)) {
      const q = `filetype:bitmap ${v.make} ${v.model} ${angle.hint}`;
      const pages = await commonsSearch(q, 12);
      urls = pickUrls(pages, v.must);
    } else {
      const q = `filetype:bitmap ${v.commonsQuery} ${angle.hint}`;
      const pages = await commonsSearch(q, 10);
      urls = pickUrls(pages, v.must);
    }

    let chosen = urls.find((u) => !used.has(u));
    if (!chosen) chosen = pool.find((u) => !used.has(u));
    if (!chosen) chosen = out[0] || pool[0];
    if (!chosen) throw new Error(`No photo for ${v.stock || v.model} / ${angle.id}`);
    used.add(chosen);
    out.push(chosen);
  }
  return out;
}

/** Seed photo packs from already-generated CSVs so re-runs skip Wikimedia. */
function seedCacheFromCsvs(cache) {
  for (const file of [
    "grayarx-demo-mainstream-8photos.csv",
    "grayarx-demo-premium-8photos.csv",
    "grayarx-demo-1000-cars-8photos.csv",
  ]) {
    const p = path.join(OUT, file);
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, "utf8").trim().split("\n").slice(1);
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 12) continue;
      const make = parts[1];
      const model = parts[2];
      const image = parts[9];
      const imgs = image.split("|").filter(Boolean);
      if (imgs.length < 4) continue;
      const key = `${make}|${model}`.toLowerCase();
      if (!cache[key]?.length) cache[key] = imgs.slice(0, 8);
    }
  }
  return cache;
}

/**
 * Large unique SA-facing fleet. Each entry is one photo pack.
 * `trims` vary titles so scale rows do not look cloned.
 */
const FLEET = [
  // —— Bakkies ——
  {
    make: "Toyota",
    model: "Hilux",
    year: 2023,
    price: 689900,
    km: 38000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Sandton",
    stock: "STK-2001",
    commonsQuery: "2021 Toyota Hilux Revo Double Cab",
    must: /Hilux/i,
    trims: ["2.8 GD-6 Raider 4x4", "2.4 GD-6 Legend", "2.8 GD-6 Legend RS", "2.0 VVTi Single Cab"],
  },
  {
    make: "Ford",
    model: "Ranger",
    year: 2021,
    price: 559900,
    km: 72000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Centurion",
    stock: "STK-2002",
    commonsQuery: "Ford Ranger Wildtrak",
    must: /Ranger/i,
    trims: ["2.0 BiTurbo Wildtrak", "2.0 SiT XLT", "3.0 V6 Wildtrak", "2.2 TDCi XL"],
  },
  {
    make: "Isuzu",
    model: "D-Max",
    year: 2023,
    price: 724900,
    km: 15000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Durban",
    stock: "STK-2008",
    commonsQuery: "2021 Isuzu D-Max",
    must: /D-?Max/i,
    trims: ["3.0 LSE 4x4", "1.9 Ddi L HR", "3.0 V-Cross", "1.9 Ddi Extended Cab"],
  },
  {
    make: "Volkswagen",
    model: "Amarok",
    year: 2022,
    price: 799900,
    km: 41000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "STK-2010",
    commonsQuery: "Volkswagen Amarok",
    must: /Amarok/i,
    trims: ["3.0 TDI Style", "2.0 TDI Double Cab", "3.0 TDI PanAmericana", "2.0 BiTDI Highline"],
  },
  {
    make: "Nissan",
    model: "Navara",
    year: 2021,
    price: 529900,
    km: 68000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Pretoria",
    stock: "STK-2011",
    commonsQuery: "Nissan Navara NP300",
    must: /Navara/i,
    trims: ["2.5DDTi LE", "2.5DDTi SE", "2.3D Stealth", "2.5DDTi Double Cab"],
  },
  {
    make: "Mitsubishi",
    model: "Triton",
    year: 2022,
    price: 549900,
    km: 45000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Midrand",
    stock: "STK-2012",
    commonsQuery: "Mitsubishi Triton",
    must: /Triton/i,
    trims: ["2.4 DI-D Double Cab", "2.4 DI-D 4x4", "2.4 Aspire", "2.4 GL"],
  },
  {
    make: "Mahindra",
    model: "Pik Up",
    year: 2023,
    price: 429900,
    km: 22000,
    fuel: "Diesel",
    transmission: "Manual",
    location: "Bloemfontein",
    stock: "STK-2013",
    commonsQuery: "Mahindra Pik Up OR Mahindra Scorpio Pik-Up",
    must: /Mahindra|Pik/i,
    trims: ["2.2 mHawk S11", "2.2 mHawk S6", "2.2 Double Cab 4x4", "2.2 Single Cab"],
  },
  {
    make: "GWM",
    model: "P-Series",
    year: 2023,
    price: 489900,
    km: 18000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Boksburg",
    stock: "STK-2014",
    commonsQuery: "GWM Poer OR Great Wall Cannon pickup",
    must: /Poer|Cannon|P-Series|Great Wall/i,
    trims: ["2.0TD DLX", "2.0TD Lux", "2.0TD Ultra", "2.0TD Double Cab"],
  },
  {
    make: "GWM",
    model: "Tank 300",
    year: 2024,
    price: 799900,
    km: 8000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "STK-2015",
    commonsQuery: "GWM Tank 300 OR Tank 300 SUV",
    must: /Tank 300|Tank300/i,
    trims: ["2.0T Lux", "2.0T Ultra", "Hi4-T", "2.0T Super Luxury"],
  },
  {
    make: "Omoda",
    model: "C5",
    year: 2024,
    price: 399900,
    km: 9000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Midrand",
    stock: "STK-2060",
    commonsQuery: "Omoda C5 OR Chery Omoda 5",
    must: /Omoda|C5/i,
    trims: ["1.5T Comfort", "1.5T Luxury", "1.5T Exclusive", "1.6TGDI"],
  },
  {
    make: "Omoda",
    model: "C9",
    year: 2024,
    price: 699900,
    km: 6000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "STK-2061",
    commonsQuery: "Omoda C9 OR Chery Omoda 9",
    must: /Omoda|C9/i,
    trims: ["2.0T Exclusive", "2.0T Luxury", "2.0T AWD", "2.0TGDI"],
  },
  {
    make: "Jaecoo",
    model: "J7",
    year: 2024,
    price: 499900,
    km: 7000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Pretoria",
    stock: "STK-2062",
    commonsQuery: "Jaecoo J7 OR Chery Jaecoo 7",
    must: /Jaecoo|J7/i,
    trims: ["1.6T Vortex", "1.6T Glacier", "1.6T Inferno", "1.6TGDI"],
  },
  {
    make: "BYD",
    model: "Atto 3",
    year: 2024,
    price: 599900,
    km: 11000,
    fuel: "Electric",
    transmission: "Automatic",
    location: "Sandton",
    stock: "STK-2063",
    commonsQuery: "BYD Atto 3 OR BYD Yuan Plus",
    must: /Atto|Yuan Plus|BYD/i,
    trims: ["Standard Range", "Extended Range", "Design", "Comfort"],
  },
  {
    make: "BYD",
    model: "Shark",
    year: 2024,
    price: 849900,
    km: 5000,
    fuel: "Hybrid",
    transmission: "Automatic",
    location: "Durban",
    stock: "STK-2064",
    commonsQuery: "BYD Shark pickup OR BYD Shark 6",
    must: /Shark|BYD/i,
    trims: ["DMO Double Cab", "Premium", "Luxury", "AWD"],
  },
  {
    make: "Chery",
    model: "Tiggo 7 Pro",
    year: 2023,
    price: 429900,
    km: 22000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Johannesburg",
    stock: "STK-2065",
    commonsQuery: "Chery Tiggo 7 Pro",
    must: /Tiggo/i,
    trims: ["1.5T Distinct", "1.5T Executive", "1.5T Distinction", "1.6TGDI"],
  },
  {
    make: "JAC",
    model: "T9",
    year: 2024,
    price: 549900,
    km: 4000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Bloemfontein",
    stock: "STK-2066",
    commonsQuery: "JAC T9 pickup OR JAC Hunter",
    must: /JAC|T9|Hunter/i,
    trims: ["2.0CTI Lux", "2.0CTI Super Lux", "2.0 Double Cab", "2.0 4x4"],
  },
  {
    make: "MG",
    model: "ZS",
    year: 2023,
    price: 329900,
    km: 19000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Centurion",
    stock: "STK-2067",
    commonsQuery: "MG ZS SUV 2019 OR 2020 OR 2021",
    must: /MG ZS|\bZS\b/i,
    trims: ["1.5 Comfort", "1.5 Luxury", "1.0T Exclusive", "ZS EV"],
  },
  {
    make: "Mazda",
    model: "BT-50",
    year: 2022,
    price: 579900,
    km: 41000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Nelspruit",
    stock: "STK-2068",
    commonsQuery: "Mazda BT-50",
    must: /BT-50|BT50/i,
    trims: ["3.0 Individual", "1.9 Dynamic", "3.0 Active", "1.9 SLE"],
  },

  // —— SUVs / crossovers ——
  {
    make: "Toyota",
    model: "Fortuner",
    year: 2023,
    price: 749900,
    km: 29000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Midrand",
    stock: "STK-2004",
    commonsQuery: "2021 Toyota Fortuner",
    must: /Fortuner/i,
    trims: ["2.8 GD-6 4x4", "2.4 GD-6 Raised Body", "2.8 GD-6 VX", "2.4 GD-6 Auto"],
  },
  {
    make: "Toyota",
    model: "RAV4",
    year: 2022,
    price: 599900,
    km: 42000,
    fuel: "Hybrid",
    transmission: "Automatic",
    location: "Sandton",
    stock: "STK-2020",
    commonsQuery: "Toyota RAV4 2019 OR 2020 OR 2021",
    must: /RAV4|RAV 4/i,
    trims: ["2.5 Hybrid VX", "2.0 GX", "2.5 Hybrid GX", "2.0 GX-R"],
  },
  {
    make: "Toyota",
    model: "Corolla Cross",
    year: 2023,
    price: 449900,
    km: 19000,
    fuel: "Hybrid",
    transmission: "Automatic",
    location: "Centurion",
    stock: "STK-2021",
    commonsQuery: "Toyota Corolla Cross",
    must: /Corolla Cross/i,
    trims: ["1.8 XR Hybrid", "1.8 Xi", "1.8 XR", "1.8 XS Hybrid"],
  },
  {
    make: "Haval",
    model: "Jolion",
    year: 2023,
    price: 379900,
    km: 21000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Boksburg",
    stock: "STK-2007",
    commonsQuery: "Haval Jolion",
    must: /Jolion/i,
    trims: ["1.5T Luxury", "1.5T Premium", "1.5T Super Luxury", "1.5T City"],
  },
  {
    make: "Haval",
    model: "H6",
    year: 2022,
    price: 499900,
    km: 35000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Pretoria",
    stock: "STK-2022",
    commonsQuery: "Haval H6",
    must: /H6/i,
    trims: ["2.0T Luxury", "2.0T Premium", "2.0T GT", "1.5T City"],
  },
  {
    make: "Hyundai",
    model: "Tucson",
    year: 2022,
    price: 549900,
    km: 40000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "STK-2023",
    commonsQuery: "Hyundai Tucson 2021 OR 2022",
    must: /Tucson/i,
    trims: ["2.0 Elite", "1.6T Elite", "2.0 Premium", "1.6T N Line"],
  },
  {
    make: "Kia",
    model: "Sportage",
    year: 2023,
    price: 569900,
    km: 16000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Umhlanga",
    stock: "STK-2024",
    commonsQuery: "Kia Sportage 2022 OR 2023",
    must: /Sportage/i,
    trims: ["2.0 CRDi EX", "1.6T GT-Line", "2.0 EX", "1.6T EX"],
  },
  {
    make: "Volkswagen",
    model: "Tiguan",
    year: 2021,
    price: 529900,
    km: 61000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Johannesburg",
    stock: "STK-2025",
    commonsQuery: "Volkswagen Tiguan",
    must: /Tiguan/i,
    trims: ["1.4 TSI Comfortline", "2.0 TSI R-Line", "1.4 TSI Life", "2.0 TDI Comfortline"],
  },
  {
    make: "Nissan",
    model: "X-Trail",
    year: 2022,
    price: 499900,
    km: 38000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Durban",
    stock: "STK-2026",
    commonsQuery: "Nissan X-Trail",
    must: /X-Trail|X Trail/i,
    trims: ["2.5 Acenta", "2.5 Tekna", "1.5T Visia", "2.5 4WD"],
  },
  {
    make: "Mazda",
    model: "CX-5",
    year: 2022,
    price: 519900,
    km: 33000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Stellenbosch",
    stock: "STK-2027",
    commonsQuery: "Mazda CX-5",
    must: /CX-5|CX5/i,
    trims: ["2.0 Dynamic", "2.5 Individual", "2.0 Active", "2.2DE Akera"],
  },
  {
    make: "Honda",
    model: "CR-V",
    year: 2021,
    price: 529900,
    km: 55000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "STK-2028",
    commonsQuery: "Honda CR-V 2018 OR 2019 OR 2020",
    must: /CR-V|CRV/i,
    trims: ["1.5T Executive", "2.0 Comfort", "1.5T Elegance", "2.0 Elegance"],
  },
  {
    make: "Ford",
    model: "Everest",
    year: 2023,
    price: 799900,
    km: 12000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Pretoria",
    stock: "STK-2029",
    commonsQuery: "Ford Everest",
    must: /Everest/i,
    trims: ["2.0 BiTurbo Limited", "2.0 SiT XLT", "3.0 V6 Wildtrak", "2.0 BiTurbo Sport"],
  },
  {
    make: "Suzuki",
    model: "Vitara",
    year: 2022,
    price: 349900,
    km: 28000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Port Elizabeth",
    stock: "STK-2030",
    commonsQuery: "Suzuki Vitara 2019 OR 2020 OR 2021",
    must: /Vitara/i,
    trims: ["1.4T GLX", "1.6 GL", "1.4T GLX AllGrip", "1.6 GLX"],
  },
  {
    make: "Renault",
    model: "Duster",
    year: 2021,
    price: 299900,
    km: 62000,
    fuel: "Petrol",
    transmission: "Manual",
    location: "Nelspruit",
    stock: "STK-2031",
    commonsQuery: "Renault Duster",
    must: /Duster/i,
    trims: ["1.5 dCi TechRoad", "1.6 Expression", "1.5 dCi Dynamique", "1.6 Dynamique"],
  },
  {
    make: "Chery",
    model: "Tiggo 4 Pro",
    year: 2023,
    price: 329900,
    km: 14000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Johannesburg",
    stock: "STK-2032",
    commonsQuery: "Chery Tiggo 4 OR Chery Tiggo 4 Pro",
    must: /Tiggo/i,
    trims: ["1.5T Distinct", "1.5T Comfort", "1.5T LiT", "1.5T Elite"],
  },
  {
    make: "Jeep",
    model: "Wrangler",
    year: 2021,
    price: 899900,
    km: 48000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "STK-2033",
    commonsQuery: "Jeep Wrangler JL",
    must: /Wrangler/i,
    trims: ["2.0T Sahara", "2.0T Rubicon", "3.6 Unlimited", "2.0T Sport"],
  },

  // —— Hatches ——
  {
    make: "Volkswagen",
    model: "Polo",
    year: 2022,
    price: 289900,
    km: 45000,
    fuel: "Petrol",
    transmission: "Manual",
    location: "Pretoria",
    stock: "STK-2003",
    commonsQuery: "Volkswagen Polo 2018 OR 2019 OR 2020",
    must: /Polo/i,
    trims: ["1.0 TSI Life", "1.0 TSI Comfortline", "2.0 GTI", "1.0 TSI Trendline"],
  },
  {
    make: "Volkswagen",
    model: "Golf",
    year: 2021,
    price: 429900,
    km: 52000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "STK-2040",
    commonsQuery: "Volkswagen Golf 8 OR Golf Mk8",
    must: /Golf/i,
    trims: ["1.4 TSI Life", "2.0 GTI", "1.5 TSI R-Line", "2.0 GTD"],
  },
  {
    make: "Suzuki",
    model: "Swift",
    year: 2022,
    price: 229900,
    km: 33000,
    fuel: "Petrol",
    transmission: "Manual",
    location: "Sandton",
    stock: "STK-2006",
    commonsQuery: "2018 Suzuki Swift hatchback",
    must: /Swift/i,
    trims: ["1.2 GL", "1.2 GLX", "1.4 Sport", "1.2 GA"],
  },
  {
    make: "Toyota",
    model: "Yaris",
    year: 2021,
    price: 259900,
    km: 47000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Durban",
    stock: "STK-2041",
    commonsQuery: "Toyota Yaris hatchback 2018 OR 2019 OR 2020",
    must: /Yaris/i,
    trims: ["1.5 Xs", "1.5 Xi", "1.5 Cross", "1.5 Pulse"],
  },
  {
    make: "Hyundai",
    model: "i20",
    year: 2022,
    price: 279900,
    km: 25000,
    fuel: "Petrol",
    transmission: "Manual",
    location: "Centurion",
    stock: "STK-2042",
    commonsQuery: "Hyundai i20 2021 OR 2022",
    must: /\bi20\b/i,
    trims: ["1.2 Motion", "1.0T Fluid", "1.2 Fluid", "1.0T Motion"],
  },
  {
    make: "Ford",
    model: "Fiesta",
    year: 2020,
    price: 239900,
    km: 71000,
    fuel: "Petrol",
    transmission: "Manual",
    location: "Bloemfontein",
    stock: "STK-2043",
    commonsQuery: "Ford Fiesta 2018 OR 2019",
    must: /Fiesta/i,
    trims: ["1.0 EcoBoost Trend", "1.5 TDCi Ambiente", "1.0 EcoBoost Titanium", "1.0 Trend"],
  },
  {
    make: "Renault",
    model: "Clio",
    year: 2021,
    price: 269900,
    km: 39000,
    fuel: "Petrol",
    transmission: "Manual",
    location: "Cape Town",
    stock: "STK-2044",
    commonsQuery: "Renault Clio 2019 OR 2020 OR 2021",
    must: /Clio/i,
    trims: ["1.0 Zen", "1.0 Intens", "1.0 Life", "1.5 dCi Expression"],
  },
  {
    make: "Kia",
    model: "Rio",
    year: 2022,
    price: 259900,
    km: 27000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Midrand",
    stock: "STK-2045",
    commonsQuery: "Kia Rio hatchback",
    must: /Rio/i,
    trims: ["1.4 LX", "1.2 Street", "1.4 EX", "1.2 LX"],
  },
  {
    make: "Honda",
    model: "Jazz",
    year: 2020,
    price: 249900,
    km: 58000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Pretoria",
    stock: "STK-2046",
    commonsQuery: "Honda Jazz OR Honda Fit hatchback",
    must: /Jazz|Fit/i,
    trims: ["1.5 Elegance", "1.5 Comfort", "1.5 Sport", "1.2 Trend"],
  },
  {
    make: "Opel",
    model: "Corsa",
    year: 2021,
    price: 269900,
    km: 44000,
    fuel: "Petrol",
    transmission: "Manual",
    location: "East London",
    stock: "STK-2047",
    commonsQuery: "Opel Corsa F OR Opel Corsa 2020",
    must: /Corsa/i,
    trims: ["1.2 Edition", "1.2 Elegance", "1.2 GS Line", "1.2 Enjoy"],
  },

  // —— Sedans ——
  {
    make: "Toyota",
    model: "Corolla",
    year: 2021,
    price: 379900,
    km: 51000,
    fuel: "Hybrid",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "STK-2005",
    commonsQuery: "2020 Toyota Corolla sedan",
    must: /Corolla/i,
    trims: ["1.8 XS Hybrid", "1.8 Prestige", "2.0 XR", "1.8 Xi"],
  },
  {
    make: "Honda",
    model: "Civic",
    year: 2022,
    price: 449900,
    km: 30000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "STK-2050",
    commonsQuery: "Honda Civic 2022 OR Honda Civic XI",
    must: /Civic/i,
    trims: ["1.5T RS", "2.0 Elegance", "1.5T Sport", "2.0 Comfort"],
  },
  {
    make: "Mazda",
    model: "Mazda3",
    year: 2021,
    price: 399900,
    km: 42000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Stellenbosch",
    stock: "STK-2051",
    commonsQuery: "Mazda3 sedan OR Mazda 3 BP",
    must: /Mazda3|Mazda 3/i,
    trims: ["2.0 Individual", "2.0 Dynamic", "2.0 Astina", "2.0 Active"],
  },
  {
    make: "Volkswagen",
    model: "Jetta",
    year: 2020,
    price: 349900,
    km: 69000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Johannesburg",
    stock: "STK-2052",
    commonsQuery: "Volkswagen Jetta 2019 OR 2020",
    must: /Jetta/i,
    trims: ["1.4 TSI Comfortline", "1.4 TSI Highline", "1.4 TSI Life", "1.6 TDI"],
  },
  {
    make: "Hyundai",
    model: "Elantra",
    year: 2022,
    price: 389900,
    km: 24000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Durban",
    stock: "STK-2053",
    commonsQuery: "Hyundai Elantra 2021 OR 2022",
    must: /Elantra/i,
    trims: ["1.6 Executive", "2.0 Fluid", "1.6 Elite", "2.0 Executive"],
  },
  {
    make: "Nissan",
    model: "Almera",
    year: 2021,
    price: 259900,
    km: 50000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Polokwane",
    stock: "STK-2054",
    commonsQuery: "Nissan Almera",
    must: /Almera/i,
    trims: ["1.5 Acenta", "1.5 Tekna", "1.5 Visia", "1.5 Comfort"],
  },

  // —— Premium ——
  {
    make: "BMW",
    model: "320i",
    year: 2022,
    price: 679900,
    km: 41000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "PRM-3001",
    commonsQuery: "BMW G20 330i OR 320i",
    must: /BMW|G20|3[23]0/i,
    trims: ["M Sport", "Luxury Line", "Sport Line", "M340i xDrive"],
  },
  {
    make: "BMW",
    model: "X3",
    year: 2021,
    price: 799900,
    km: 52000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "PRM-3010",
    commonsQuery: "BMW X3 G01",
    must: /X3/i,
    trims: ["xDrive20d M Sport", "sDrive20i", "xDrive30d", "M40i"],
  },
  {
    make: "Mercedes-Benz",
    model: "C200",
    year: 2021,
    price: 649900,
    km: 55000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Bedfordview",
    stock: "PRM-3002",
    commonsQuery: "MERCEDES-BENZ C-CLASS W206",
    must: /Mercedes|C-CLASS|C-Class|W206|V206/i,
    trims: ["AMG Line", "Avantgarde", "Exclusive", "AMG Line Night"],
  },
  {
    make: "Mercedes-Benz",
    model: "GLC 220d",
    year: 2022,
    price: 899900,
    km: 36000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Umhlanga",
    stock: "PRM-3011",
    commonsQuery: "Mercedes-Benz GLC",
    must: /GLC/i,
    trims: ["4MATIC AMG Line", "4MATIC Progressive", "Coupé 220d", "300d 4MATIC"],
  },
  {
    make: "Audi",
    model: "Q5",
    year: 2022,
    price: 829900,
    km: 38000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "PRM-3003",
    commonsQuery: "Audi Q5 FY",
    must: /Q5/i,
    trims: ["45 TFSI quattro", "40 TDI S line", "45 TFSI S line", "40 TDI Sport"],
  },
  {
    make: "Audi",
    model: "A3",
    year: 2021,
    price: 549900,
    km: 47000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "PRM-3012",
    commonsQuery: "Audi A3 8Y OR Audi A3 Sportback 2021",
    must: /A3/i,
    trims: ["35 TFSI", "35 TFSI S line", "40 TFSI quattro", "30 TDI"],
  },
  {
    make: "Porsche",
    model: "911 Carrera S",
    year: 2021,
    price: 2650000,
    km: 18000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "PRM-3004",
    commonsQuery: "Porsche 911 992 Carrera",
    must: /911|992/i,
    trims: ["Carrera S", "Carrera 4S", "Carrera", "Carrera GTS"],
  },
  {
    make: "Land Rover",
    model: "Range Rover Velar",
    year: 2022,
    price: 1195000,
    km: 32000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Umhlanga",
    stock: "PRM-3005",
    commonsQuery: "Range Rover Velar",
    must: /Velar/i,
    trims: ["D200 S", "P250 R-Dynamic", "D300 HSE", "P400 R-Dynamic"],
  },
  {
    make: "Ford",
    model: "Mustang",
    year: 2023,
    price: 1149900,
    km: 9000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Pretoria",
    stock: "PRM-3006",
    commonsQuery: "2018 Ford Mustang GT",
    must: /Mustang/i,
    trims: ["5.0 GT Fastback", "2.3 EcoBoost", "5.0 GT Convertible", "Mach 1"],
  },
  {
    make: "Volvo",
    model: "XC60",
    year: 2021,
    price: 749900,
    km: 49000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Cape Town",
    stock: "PRM-3013",
    commonsQuery: "Volvo XC60",
    must: /XC60/i,
    trims: ["D4 Inscription", "B5 Momentum", "D5 R-Design", "T6 Inscription"],
  },
  {
    make: "Lexus",
    model: "NX 300",
    year: 2020,
    price: 699900,
    km: 64000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Sandton",
    stock: "PRM-3014",
    commonsQuery: "Lexus NX",
    must: /NX/i,
    trims: ["NX 300 EX", "NX 300 F Sport", "NX 300h SE", "NX 300 SE"],
  },
  {
    make: "Mini",
    model: "Cooper S",
    year: 2022,
    price: 529900,
    km: 21000,
    fuel: "Petrol",
    transmission: "Automatic",
    location: "Stellenbosch",
    stock: "PRM-3015",
    commonsQuery: "Mini Cooper S F56",
    must: /Mini|Cooper/i,
    trims: ["Cooper S", "Cooper S JCW", "Cooper", "Cooper S Clubman"],
  },
  {
    make: "Jaguar",
    model: "F-Pace",
    year: 2021,
    price: 799900,
    km: 43000,
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Johannesburg",
    stock: "PRM-3016",
    commonsQuery: "Jaguar F-Pace",
    must: /F-Pace|F Pace/i,
    trims: ["D200 R-Dynamic", "P250 S", "D300 HSE", "P400 R-Dynamic"],
  },
];

const MAINSTREAM_STOCK = new Set([
  "STK-2001",
  "STK-2002",
  "STK-2003",
  "STK-2004",
  "STK-2005",
  "STK-2006",
  "STK-2007",
  "STK-2008",
]);
const PREMIUM_STOCK = new Set([
  "PRM-3001",
  "PRM-3002",
  "PRM-3003",
  "PRM-3004",
  "PRM-3005",
  "PRM-3006",
]);

const HEADER =
  "title,make,model,year,price,km,fuel,transmission,location,image,stock,status";

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(v, imgs) {
  return [
    v.title,
    v.make,
    v.model,
    v.year,
    v.price,
    v.km,
    v.fuel,
    v.transmission,
    v.location,
    imgs.join("|"),
    v.stock,
    v.status || "available",
  ]
    .map(csvEscape)
    .join(",");
}

async function resolvePhotos(v, cache) {
  const key = cacheKey(v);
  if (cache[key]?.length >= 8) return cache[key].slice(0, 8);
  const imgs = await photosForVehicle(v);
  cache[key] = imgs;
  saveCache(cache);
  return imgs;
}

async function buildList(list, cache) {
  const lines = [HEADER];
  for (const v of list) {
    const imgs = await resolvePhotos(v, cache);
    const title = v.title || `${v.year} ${v.make} ${v.model} ${v.trims?.[0] || ""}`.trim();
    console.log(v.stock, v.make, v.model, "→", imgs.length, "angles");
    lines.push(row({ ...v, title }, imgs));
  }
  return lines.join("\n") + "\n";
}

/** Deterministic pseudo-random from index (stable across regenerations). */
function mix(i, salt = 0) {
  const h = createHash("sha256").update(`${i}:${salt}`).digest();
  return h.readUInt32BE(0) / 0xffffffff;
}

function buildScale(fleetWithImages, count = 1000) {
  const lines = [HEADER];
  const n = fleetWithImages.length;
  const statuses = ["available", "available", "available", "available", "reserved"];

  for (let i = 1; i <= count; i++) {
    // Spread models evenly, then jitter so neighbours rarely match.
    const baseIdx = (i - 1) % n;
    const jitter = Math.floor(mix(i, 1) * 3);
    const v = fleetWithImages[(baseIdx + jitter * 11) % n];
    const trim = v.trims[Math.floor(mix(i, 2) * v.trims.length)];
    const year = 2018 + Math.floor(mix(i, 3) * 7);
    const priceFactor = 0.72 + mix(i, 4) * 0.45;
    const price = Math.round((v.price * priceFactor) / 100) * 100;
    const km = 5000 + Math.floor(mix(i, 5) * 145000);
    const loc = CITIES[Math.floor(mix(i, 6) * CITIES.length)];
    const fuel =
      v.fuel === "Hybrid" && mix(i, 7) > 0.55
        ? "Petrol"
        : v.fuel;
    const transmission =
      mix(i, 8) > 0.78 && v.transmission === "Automatic" ? "Manual" : v.transmission;
    const status = statuses[Math.floor(mix(i, 9) * statuses.length)];
    const stock = `YARD-${String(i).padStart(4, "0")}`;
    const title = `${year} ${v.make} ${v.model} ${trim}`;

    lines.push(
      row(
        {
          title,
          make: v.make,
          model: v.model,
          year,
          price,
          km,
          fuel,
          transmission,
          location: loc,
          stock,
          status,
        },
        v.imgs,
      ),
    );
  }
  return lines.join("\n") + "\n";
}

fs.mkdirSync(OUT, { recursive: true });
let cache = loadCache();
cache = seedCacheFromCsvs(cache);
saveCache(cache);

const mainstream = FLEET.filter((v) => MAINSTREAM_STOCK.has(v.stock));
const premium = FLEET.filter((v) => PREMIUM_STOCK.has(v.stock));

console.log(`Fleet size: ${FLEET.length} unique models`);
console.log(`Cache entries: ${Object.keys(cache).length}`);

const mainCsv = await buildList(mainstream, cache);
fs.writeFileSync(path.join(OUT, "grayarx-demo-mainstream-8photos.csv"), mainCsv);

const premCsv = await buildList(premium, cache);
fs.writeFileSync(path.join(OUT, "grayarx-demo-premium-8photos.csv"), premCsv);

const fleetWithImages = [];
for (const v of FLEET) {
  try {
    const imgs = await resolvePhotos(v, cache);
    fleetWithImages.push({ ...v, imgs });
    console.log(`[fleet] ${v.make} ${v.model} OK`);
  } catch (err) {
    console.warn(`[fleet] SKIP ${v.make} ${v.model}: ${err.message}`);
  }
}

if (fleetWithImages.length < 20) {
  console.error(`Only ${fleetWithImages.length} models with photos — aborting scale CSV.`);
  process.exit(1);
}

const scale = buildScale(fleetWithImages, 1000);
fs.writeFileSync(path.join(OUT, "grayarx-demo-1000-cars-8photos.csv"), scale);

const unique = new Set(fleetWithImages.map((v) => `${v.make} ${v.model}`));
console.log(
  `Wrote demo CSVs: mainstream=${mainstream.length}, premium=${premium.length}, scale=1000 from ${unique.size} unique models.`,
);
