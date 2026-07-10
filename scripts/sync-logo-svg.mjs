import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "client/public");
const favicon = join(publicDir, "favicon-32.png");

if (!existsSync(favicon)) {
  console.warn("sync-logo-svg: favicon-32.png missing — run npm run brand:assets first");
  process.exit(0);
}

const png = readFileSync(favicon);
const b64 = png.toString("base64");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><image width="32" height="32" xlink:href="data:image/png;base64,${b64}"/></svg>`;
writeFileSync(join(publicDir, "logo.svg"), svg);
console.log("logo.svg synced from favicon-32.png");
