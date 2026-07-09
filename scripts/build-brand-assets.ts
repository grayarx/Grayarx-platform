/**
 * Build GrayArx brand assets from live master logo.png
 * Run: npx tsx scripts/build-brand-assets.ts
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const publicDir = join(process.cwd(), "client/public");
const assetsDir = join(process.cwd(), "client/src/assets");
const masterPath = join(publicDir, "logo.png");

async function downloadIfMissing(url: string, dest: string) {
  if (existsSync(dest) && readFileSync(dest).length > 10_000) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`Downloaded ${dest}`);
}

function runPowerShell(script: string) {
  execSync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"').replace(/\n/g, "; ")}"`, {
    stdio: "inherit",
  });
}

async function cropLogoIcon() {
  const emblemPath = join(publicDir, "logo-icon.png");
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = "${masterPath.replace(/\\/g, "\\\\")}"
$out = "${emblemPath.replace(/\\/g, "\\\\")}"
$img = [System.Drawing.Image]::FromFile($src)
$size = 680; $x = 284; $y = 30
$crop = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $size, $size), (New-Object System.Drawing.Rectangle $x, $y, $size, $size), [System.Drawing.GraphicsUnit]::Pixel)
$crop.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $crop.Dispose(); $img.Dispose()
Write-Output "logo-icon.png"
`;
  runPowerShell(ps);
}

/** Nav bundle + browser tab favicons from the circuit-board GA emblem */
async function buildIconSizes() {
  const emblemPath = join(publicDir, "logo-icon.png");
  const sizes: Array<{ name: string; px: number }> = [
    { name: "favicon-32.png", px: 32 },
    { name: "icon-96x96.png", px: 96 },
    { name: "icon-192x192.png", px: 192 },
    { name: "icon-512x512.png", px: 512 },
    { name: "icon-maskable-192x192.png", px: 192 },
    { name: "icon-maskable-512x512.png", px: 512 },
  ];

  const outs = sizes.map((s) => join(publicDir, s.name).replace(/\\/g, "\\\\")).join('","');
  const pxs = sizes.map((s) => s.px).join(",");

  const ps = `
Add-Type -AssemblyName System.Drawing
$src = "${emblemPath.replace(/\\/g, "\\\\")}"
$outs = @("${outs}")
$pxs = @(${pxs})
$img = [System.Drawing.Image]::FromFile($src)
for ($i = 0; $i -lt $outs.Length; $i++) {
  $px = $pxs[$i]
  $bmp = New-Object System.Drawing.Bitmap $px, $px
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($img, 0, 0, $px, $px)
  $bmp.Save($outs[$i], [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
$img.Dispose()
Write-Output "icon sizes"
`;
  runPowerShell(ps);

  // Nav bundle — 128px emblem (~15 KB), not the 900 KB master crop
  const navAsset = join(assetsDir, "logo-icon.png");
  copyFileSync(join(publicDir, "icon-96x96.png"), navAsset);
  console.log(`Nav bundle asset: ${navAsset}`);
}

async function main() {
  await downloadIfMissing("https://www.grayarx.com/logo.png", masterPath);
  await downloadIfMissing(
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp",
    join(publicDir, "grayarx-logo-animated.webp"),
  );
  await cropLogoIcon();
  await buildIconSizes();
  console.log("\nDone.");
  console.log("- logo-icon.png = circuit-board GA emblem (email + hosted URL)");
  console.log("- favicon-32.png / icon-192x192.png = browser tab (search bar) icon");
  console.log("- client/src/assets/logo-icon.png = lightweight nav bundle");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
