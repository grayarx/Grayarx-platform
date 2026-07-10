import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const emblem = join(root, "client/public/grayarx-logo-emblem.png");
const favicon = join(root, "client/public/favicon-32.png");

if (!existsSync(emblem) || !existsSync(favicon)) {
  console.log("Brand assets missing — running npm run brand:assets …");
  execSync("npm run brand:assets", { cwd: root, stdio: "inherit" });
}
