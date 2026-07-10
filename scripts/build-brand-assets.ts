/**
 * Build GrayArx brand assets from live master logo.png
 * Run: npm run brand:assets
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const publicDir = join(process.cwd(), "client/public");
const assetsDir = join(process.cwd(), "client/src/assets");
const fullLogoPath = join(publicDir, "grayarx-logo-full.png");
const masterPath = join(publicDir, "logo.png");
const emblemPath = join(publicDir, "grayarx-logo-emblem.png");
const navLogoPath = join(publicDir, "grayarx-logo-nav.png");
const iconSourcePath = join(publicDir, "logo-icon.png");

const PRODUCTION = "https://www.grayarx.com";

const LANDING_ASSETS: Array<[string, string]> = [
  ["logo.png", `${PRODUCTION}/logo.png`],
  ["grayarx-logo-full.png", `${PRODUCTION}/grayarx-logo-full.png`],
  ["hero-car.jpg", `${PRODUCTION}/hero-car.jpg`],
  ["corvette-exterior.jpg", `${PRODUCTION}/corvette-exterior.jpg`],
  ["corvette-interior.jpg", `${PRODUCTION}/corvette-interior.jpg`],
  ["dashboard-preview.png", `${PRODUCTION}/dashboard-preview.png`],
];

async function downloadIfMissing(url: string, dest: string, minBytes = 10_000) {
  if (existsSync(dest) && readFileSync(dest).length >= minBytes) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`Downloaded ${dest.replace(process.cwd(), ".")}`);
}

function runPowerShell(script: string) {
  execSync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"').replace(/\n/g, "; ")}"`, {
    stdio: "inherit",
  });
}

/** Square GA emblem — calibrated against the 1248×1248 master logo.png */
async function cropEmblemFromMaster() {
  if (!existsSync(masterPath)) {
    console.warn("Skip emblem crop — logo.png master not found");
    return;
  }
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = "${masterPath.replace(/\\/g, "\\\\")}"
$out = "${emblemPath.replace(/\\/g, "\\\\")}"
$img = [System.Drawing.Image]::FromFile($src)
$w = $img.Width; $h = $img.Height
$size = [int]([Math]::Min($w, $h) * 0.545)
$x = [int](($w - $size) / 2)
$y = [int]($h * 0.024)
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $size, $size), (New-Object System.Drawing.Rectangle $x, $y, $size, $size), [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
Write-Output "grayarx-logo-emblem.png"
`;
  runPowerShell(ps);
  copyFileSync(emblemPath, iconSourcePath);
}

/** Horizontal nav lockup: emblem + GRAYARX (no tagline) */
async function cropNavWordmark() {
  const src = existsSync(masterPath) ? masterPath : fullLogoPath;
  if (!existsSync(src)) {
    console.warn("Skip nav wordmark — no source logo");
    return;
  }
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = "${src.replace(/\\/g, "\\\\")}"
$out = "${navLogoPath.replace(/\\/g, "\\\\")}"
$img = [System.Drawing.Image]::FromFile($src)
$w = $img.Width; $h = $img.Height
$cropH = [int]($h * 0.68)
$bmp = New-Object System.Drawing.Bitmap $w, $cropH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $cropH), (New-Object System.Drawing.Rectangle 0, 0, $w, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
Write-Output "grayarx-logo-nav.png"
`;
  runPowerShell(ps);
}

/** Nav bundle + browser tab favicons from the circuit-board GA emblem */
async function buildIconSizes() {
  const source = existsSync(iconSourcePath)
    ? iconSourcePath
    : existsSync(emblemPath)
      ? emblemPath
      : null;
  if (!source) {
    console.warn("Skip favicons — emblem source missing");
    return;
  }

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
$src = "${source.replace(/\\/g, "\\\\")}"
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

  const navAsset = join(assetsDir, "logo-icon.png");
  copyFileSync(join(publicDir, "icon-96x96.png"), navAsset);
  console.log(`Nav bundle asset: ${navAsset.replace(process.cwd(), ".")}`);
}

async function syncLogoSvg() {
  execSync("npx tsx scripts/sync-logo-svg.mjs", { cwd: process.cwd(), stdio: "inherit" });
}

async function main() {
  for (const [file, url] of LANDING_ASSETS) {
    await downloadIfMissing(url, join(publicDir, file));
  }

  await cropEmblemFromMaster();
  await cropNavWordmark();
  await buildIconSizes();

  await downloadIfMissing(
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp",
    join(publicDir, "grayarx-logo-animated.webp"),
    5_000,
  );

  await syncLogoSvg();

  console.log("\nDone.");
  console.log("- grayarx-logo-nav.png = header/footer wordmark");
  console.log("- grayarx-logo-full.png = auth + onboarding");
  console.log("- grayarx-logo-emblem.png = favicons + compact slots");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
