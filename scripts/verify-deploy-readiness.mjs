import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  isInventoryBulkDeleteConfirm,
} from "../shared/assistantActions.ts";
import { classifyDashboardIntent } from "../shared/dashboardAssistant.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "client/public");

const checks = [];

function ok(label, pass, detail = "") {
  checks.push({ label, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
}

const faviconIco = join(publicDir, "favicon.ico");
const favicon32 = join(publicDir, "favicon-32.png");
const emblem = join(publicDir, "grayarx-logo-emblem.png");
const indexHtml = join(root, "client/index.html");

ok("favicon.ico exists", existsSync(faviconIco));
ok("emblem exists", existsSync(emblem));
if (existsSync(faviconIco) && existsSync(favicon32)) {
  const ico = readFileSync(faviconIco).length;
  const png = readFileSync(favicon32).length;
  ok("favicon.ico matches 32px size", ico === png, `${ico} vs ${png}`);
}
ok("index.html references favicon.ico v=10", readFileSync(indexHtml, "utf8").includes("favicon.ico?v=10"));
ok("index.html references logo-crest cache bust", readFileSync(join(root, "client/src/components/Logo.tsx"), "utf8").includes("logo-crest.png?v=10"));
ok("logo-crest.png exists", existsSync(join(publicDir, "logo-crest.png")));
ok("delete intent", classifyDashboardIntent("delete all my inventory") === "inventory_bulk_delete");
ok("button label confirm", isInventoryBulkDeleteConfirm("Delete all 3 vehicles"));
ok("confirmAction path intent", classifyDashboardIntent("confirm") !== "inventory_bulk_delete_confirm");

const failed = checks.filter((c) => !c.pass);
process.exit(failed.length ? 1 : 0);
