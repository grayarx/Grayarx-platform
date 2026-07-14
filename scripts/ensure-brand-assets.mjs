import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const full = join(root, "client/public/grayarx-logo-full.png");
const crest = join(root, "client/public/logo-crest.png");
const favicon = join(root, "client/public/favicon-32.png");

if (!existsSync(full) || !existsSync(crest) || !existsSync(favicon)) {
  console.log("Brand assets missing — running npm run brand:assets …");
  execSync("npm run brand:assets", { cwd: root, stdio: "inherit" });
}
