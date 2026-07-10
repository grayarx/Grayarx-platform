/**
 * Build grayarx-gmail-avatar.gif from animated webp via sharp-cli (55s timeout).
 * Usage: npx tsx scripts/build-gmail-avatar-gif.ts
 */
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const webp = join(process.cwd(), "client/public/grayarx-logo-animated.webp");
const out = join(process.cwd(), "client/public/grayarx-gmail-avatar.gif");

if (!existsSync(webp)) {
  console.error(`Missing ${webp}`);
  process.exit(1);
}

try {
  execSync(
    `npx sharp-cli -i "${webp}" -o "${out}" resize 128 128`,
    { stdio: "inherit", timeout: 55_000, cwd: process.cwd() },
  );
  console.log("Wrote", out);
} catch (e) {
  console.error("GIF build failed:", e instanceof Error ? e.message : e);
  process.exit(1);
}
