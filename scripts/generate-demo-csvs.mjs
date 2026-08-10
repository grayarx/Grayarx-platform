#!/usr/bin/env node
/**
 * Build demo inventory CSVs with make/model-matched Wikimedia photos,
 * ordered to match GrayArx PHOTO_ANGLES (front 3/4 → wheels).
 *
 * Usage: node scripts/generate-demo-csvs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "demo-data");

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

async function commonsSearch(q, limit = 12) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await sleep(350);
    const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1200&format=json&origin=*`;
    const res = await fetch(api, {
      headers: { "User-Agent": "GrayArxDemo/1.1 (contact: grayarx@gmail.com)" },
    });
    const text = await res.text();
    if (text.startsWith("You are making too many") || /rate limit/i.test(text)) {
      await sleep(1800 * (attempt + 1));
      continue;
    }
    const data = JSON.parse(text);
    return Object.values(data.query?.pages || {});
  }
  return [];
}

function pickUrls(pages, must, badExtra = /$a/) {
  const bad =
    /timeline|cut.?model|race|rally|rx_|wrx|196[0-9]|197[0-9]|198[0-9]|museum|badge|logo|lego|yacht|boat|engine bay|exploded/i;
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
  // Pool of exterior shots first (reliable), then fill angles.
  const poolQ = `filetype:bitmap ${v.commonsQuery}`;
  const poolPages = await commonsSearch(poolQ, 20);
  const pool = pickUrls(poolPages, v.must);

  for (const angle of ANGLES) {
    let urls = [];
    if (["interior_front", "dashboard", "wheels"].includes(angle.id)) {
      // Require the model in the filename so we don't pull a random cabin
      // from the same brand (Focus dash on a Ranger, etc.).
      const q = `filetype:bitmap ${v.make} ${v.model} ${angle.hint}`;
      const pages = await commonsSearch(q, 12);
      urls = pickUrls(pages, v.must);
    } else {
      const q = `filetype:bitmap ${v.commonsQuery} ${angle.hint}`;
      const pages = await commonsSearch(q, 10);
      urls = pickUrls(pages, v.must);
    }

    let chosen = urls.find((u) => !used.has(u));
    // Prefer another exterior of THIS model over a wrong interior.
    if (!chosen) chosen = pool.find((u) => !used.has(u));
    if (!chosen) chosen = out[0] || pool[0];
    if (!chosen) throw new Error(`No photo for ${v.stock} / ${angle.id}`);
    used.add(chosen);
    out.push(chosen);
  }
  return out;
}

const vehicles = {
  mainstream: [
    {
      title: "2023 Toyota Hilux 2.8 GD-6 Raider 4x4",
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
    },
    {
      title: "2021 Ford Ranger 2.0 BiTurbo Wildtrak",
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
    },
    {
      title: "2022 Volkswagen Polo 1.0 TSI Life",
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
    },
    {
      title: "2023 Toyota Fortuner 2.8 GD-6 4x4",
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
    },
    {
      title: "2021 Toyota Corolla 1.8 XS Hybrid",
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
    },
    {
      title: "2022 Suzuki Swift 1.2 GL",
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
    },
    {
      title: "2023 Haval Jolion 1.5T Luxury",
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
    },
    {
      title: "2023 Isuzu D-Max 3.0 LSE 4x4",
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
    },
  ],
  premium: [
    {
      title: "2022 BMW 320i M Sport",
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
    },
    {
      title: "2021 Mercedes-Benz C200 AMG Line",
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
    },
    {
      title: "2022 Audi Q5 45 TFSI quattro",
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
    },
    {
      title: "2021 Porsche 911 Carrera S",
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
    },
    {
      title: "2022 Land Rover Range Rover Velar D200",
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
    },
    {
      title: "2023 Ford Mustang 5.0 GT Fastback",
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
    },
  ],
};

const HEADER =
  "title,make,model,year,price,km,fuel,transmission,location,image,stock,status";

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
    "available",
  ].join(",");
}

async function build(list) {
  const lines = [HEADER];
  for (const v of list) {
    const imgs = await photosForVehicle(v);
    console.log(v.stock, v.make, v.model, "→", imgs.length, "angles");
    lines.push(row(v, imgs));
  }
  return lines.join("\n") + "\n";
}

function buildScale(mainstreamCsv, count = 1000) {
  const rows = mainstreamCsv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const parts = line.split(",");
      return {
        make: parts[1],
        model: parts[2],
        price: Number(parts[4]),
        fuel: parts[6],
        transmission: parts[7],
        image: parts[9],
      };
    });
  const cities = [
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
  ];
  const lines = [HEADER];
  for (let i = 1; i <= count; i++) {
    const base = rows[(i - 1) % rows.length];
    const year = 2018 + ((i * 3) % 7);
    const price = Math.round((base.price * (0.75 + (i % 40) / 100)) / 100) * 100;
    const km = 8000 + ((i * 137) % 140000);
    const stock = `SCALE-${String(i).padStart(4, "0")}`;
    const loc = cities[i % cities.length];
    const title = `${year} ${base.make} ${base.model}`;
    lines.push(
      [
        title,
        base.make,
        base.model,
        year,
        price,
        km,
        base.fuel,
        base.transmission,
        loc,
        base.image,
        stock,
        "available",
      ].join(","),
    );
  }
  return lines.join("\n") + "\n";
}

fs.mkdirSync(OUT, { recursive: true });
const main = await build(vehicles.mainstream);
fs.writeFileSync(path.join(OUT, "grayarx-demo-mainstream-8photos.csv"), main);
const prem = await build(vehicles.premium);
fs.writeFileSync(path.join(OUT, "grayarx-demo-premium-8photos.csv"), prem);
const scale = buildScale(main, 1000);
fs.writeFileSync(path.join(OUT, "grayarx-demo-1000-cars-8photos.csv"), scale);
console.log("Wrote demo-data CSVs (mainstream, premium, 1000).");
