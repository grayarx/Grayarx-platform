import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const png = readFileSync(join(process.cwd(), "client/public/favicon-32.png"));
const b64 = png.toString("base64");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><image width="32" height="32" xlink:href="data:image/png;base64,${b64}"/></svg>`;
writeFileSync(join(process.cwd(), "client/public/logo.svg"), svg);
console.log("logo.svg synced from favicon-32.png");
