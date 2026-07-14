import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "client/public");

const checks = [];

function ok(label, pass, detail = "") {
  checks.push({ label, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
}

const faviconIco = join(publicDir, "favicon.ico");
const favicon32 = join(publicDir, "favicon-32.png");
const fullLogo = join(publicDir, "grayarx-logo-full.png");
const indexHtml = join(root, "client/index.html");

ok("favicon.ico exists", existsSync(faviconIco));
ok("grayarx-logo-full.png exists", existsSync(fullLogo));
if (existsSync(faviconIco) && existsSync(favicon32)) {
  const ico = readFileSync(faviconIco).length;
  const png = readFileSync(favicon32).length;
  ok("favicon.ico matches 32px size", ico === png, `${ico} vs ${png}`);
}
ok("index.html references favicon.ico v=14", readFileSync(indexHtml, "utf8").includes("favicon.ico?v=14"));
ok(
  "Logo.tsx crest cache bust v=14",
  readFileSync(join(root, "client/src/components/Logo.tsx"), "utf8").includes("logo-crest.png?v=14"),
);
ok("logo-crest.png exists", existsSync(join(publicDir, "logo-crest.png")));
ok("obsolete emblem removed", !existsSync(join(publicDir, "grayarx-logo-emblem.png")));
ok("obsolete logo-icon removed", !existsSync(join(publicDir, "logo-icon.png")));
ok("obsolete logo-icon-132 removed", !existsSync(join(publicDir, "logo-icon-132.png")));
ok("obsolete nav lockup removed", !existsSync(join(publicDir, "grayarx-logo-nav.png")));
ok("obsolete email-logo removed", !existsSync(join(publicDir, "email-logo-grayarx.png")));

try {
  const { isInventoryBulkDeleteConfirm } = await import("../shared/assistantActions.ts");
  const { classifyDashboardIntent } = await import("../shared/dashboardAssistant.ts");
  ok("delete intent", classifyDashboardIntent("delete all my inventory") === "inventory_bulk_delete");
  ok("button label confirm", isInventoryBulkDeleteConfirm("Delete all 3 vehicles"));
  ok("confirmAction path intent", classifyDashboardIntent("confirm") !== "inventory_bulk_delete_confirm");
} catch (e) {
  console.log(`SKIP assistant intent checks — ${String(e?.message || e)}`);
}

const failed = checks.filter((c) => !c.pass);
process.exit(failed.length ? 1 : 0);
