/**
 * Build GrayArx brand assets from the canonical full lockup only.
 *
 * Source of truth: client/public/grayarx-logo-full.png
 * (also mirrored as client/public/logo.png for legacy paths)
 *
 * Run: npm run brand:assets
 *
 * Produces:
 * - logo-crest.png — circular GA crest, ~2% pad, transparent outside ring
 * - favicons 16/32/ico, PWA icons, maskable icons, logo.svg
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const publicDir = join(process.cwd(), "client/public");
const assetsDir = join(process.cwd(), "client/src/assets");
const fullLogoPath = join(publicDir, "grayarx-logo-full.png");
const masterPath = join(publicDir, "logo.png");
const crestPath = join(publicDir, "logo-crest.png");

/** Obsolete variants — removed every rebuild so they cannot resurface */
const OBSOLETE = [
  "grayarx-logo-emblem.png",
  "grayarx-logo-nav.png",
  "logo-icon.png",
  "logo-icon-132.png",
];

function runPowerShellFile(scriptPath: string) {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, {
    stdio: "inherit",
  });
}

function ensureMasterFromFull() {
  if (!existsSync(fullLogoPath)) {
    throw new Error(
      "Missing client/public/grayarx-logo-full.png — copy the official GA lockup there first.",
    );
  }
  copyFileSync(fullLogoPath, masterPath);
  console.log("logo.png ← grayarx-logo-full.png");
}

/**
 * Square crest from full lockup: gold-ring L/R diameter + top, ~2% pad.
 * Transparent outside the circle; dark crest interior preserved.
 */
async function cropCrestFromFull() {
  const psPath = join(process.cwd(), "scripts/_crop-crest-tmp.ps1");
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = "${fullLogoPath.replace(/\\/g, "\\\\")}"
$crest = "${crestPath.replace(/\\/g, "\\\\")}"
$img = [System.Drawing.Bitmap]::FromFile($src)
$w = $img.Width; $h = $img.Height
$yMax = [int]($h * 0.62)
$xMin = [int]($w * 0.12)
$xMax = [int]($w * 0.88)
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0; $hits = 0
for ($yy = 0; $yy -lt $yMax; $yy++) {
  for ($xx = $xMin; $xx -le $xMax; $xx++) {
    $c = $img.GetPixel($xx, $yy)
    $maxc = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
    if (($maxc -ge 55) -and ($c.R -ge $c.B) -and (($c.R - $c.B) -ge 5)) {
      if ($xx -lt $minX) { $minX = $xx }
      if ($yy -lt $minY) { $minY = $yy }
      if ($xx -gt $maxX) { $maxX = $xx }
      if ($yy -gt $maxY) { $maxY = $yy }
      $hits++
    }
  }
}
if ($hits -lt 1000) { throw "Crest ring not detected in full logo ($hits hits)" }
# Circle diameter from L/R; vertical from ring top (bottom of ring often darker)
$side = $maxX - $minX + 1
$sx = $minX
$sy = $minY
if ($sy + $side -gt $h) { $sy = $h - $side }
if ($sx + $side -gt $w) { $sx = $w - $side }
Write-Output "Ring box=($minX,$minY)-($maxX,$maxY) crop=($sx,$sy) side=$side hits=$hits"

$pad = 0.02
$outPx = 1024
$inner = [int]($outPx * (1 - 2 * $pad))
$offset = [int](($outPx - $inner) / 2)
$square = New-Object System.Drawing.Bitmap $outPx, $outPx
$sg = [System.Drawing.Graphics]::FromImage($square)
$sg.Clear([System.Drawing.Color]::FromArgb(6, 6, 8))
$sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$sg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$sg.DrawImage($img, (New-Object System.Drawing.Rectangle $offset, $offset, $inner, $inner), (New-Object System.Drawing.Rectangle $sx, $sy, $side, $side), [System.Drawing.GraphicsUnit]::Pixel)
$sg.Dispose(); $img.Dispose()

# Transparent outside the circle
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $outPx, $outPx)
$bmp = New-Object System.Drawing.Bitmap $outPx, $outPx
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.SetClip($path)
$g.DrawImage($square, 0, 0)
$g.Dispose(); $square.Dispose(); $path.Dispose()
$bmp.Save($crest, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "logo-crest.png (circular, ~2% pad)"
`;
  writeFileSync(psPath, ps, "utf8");
  try {
    runPowerShellFile(psPath);
  } finally {
    try {
      unlinkSync(psPath);
    } catch {
      /* ignore */
    }
  }
}

/** Favicons / PWA icons from crest — solid dark behind circle for tab readability */
async function buildIconSizes() {
  if (!existsSync(crestPath)) {
    console.warn("Skip favicons — logo-crest.png missing");
    return;
  }

  const sizes: Array<{ name: string; px: number }> = [
    { name: "favicon-16.png", px: 16 },
    { name: "favicon-32.png", px: 32 },
    { name: "icon-96x96.png", px: 96 },
    { name: "icon-192x192.png", px: 192 },
    { name: "icon-512x512.png", px: 512 },
    { name: "icon-maskable-192x192.png", px: 192 },
    { name: "icon-maskable-512x512.png", px: 512 },
  ];

  const outs = sizes.map((s) => join(publicDir, s.name).replace(/\\/g, "\\\\")).join('","');
  const pxs = sizes.map((s) => s.px).join(",");
  const psPath = join(process.cwd(), "scripts/_icon-sizes-tmp.ps1");

  const ps = `
Add-Type -AssemblyName System.Drawing
$src = "${crestPath.replace(/\\/g, "\\\\")}"
$outs = @("${outs}")
$pxs = @(${pxs})
$img = [System.Drawing.Image]::FromFile($src)
$bg = [System.Drawing.Color]::FromArgb(6, 6, 8)
for ($i = 0; $i -lt $outs.Length; $i++) {
  $px = $pxs[$i]
  $bmp = New-Object System.Drawing.Bitmap $px, $px
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear($bg)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $px, $px)
  $bmp.Save($outs[$i], [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
$img.Dispose()
Write-Output "icon sizes"
`;
  writeFileSync(psPath, ps, "utf8");
  try {
    runPowerShellFile(psPath);
  } finally {
    try {
      unlinkSync(psPath);
    } catch {
      /* ignore */
    }
  }

  const favicon32 = join(publicDir, "favicon-32.png");
  const faviconIco = join(publicDir, "favicon.ico");
  if (existsSync(favicon32)) {
    copyFileSync(favicon32, faviconIco);
    console.log("favicon.ico");
  }

  // Bundled crest for any remaining src/assets imports
  if (existsSync(assetsDir)) {
    copyFileSync(join(publicDir, "icon-96x96.png"), join(assetsDir, "logo-icon.png"));
    console.log("client/src/assets/logo-icon.png ← icon-96x96.png");
  }
}

async function syncLogoSvg() {
  execSync("npx tsx scripts/sync-logo-svg.mjs", { cwd: process.cwd(), stdio: "inherit" });
}

function deleteObsolete() {
  for (const name of OBSOLETE) {
    const p = join(publicDir, name);
    if (existsSync(p)) {
      unlinkSync(p);
      console.log(`Deleted obsolete ${name}`);
    }
  }
}

async function downloadAnimatedIfMissing() {
  const dest = join(publicDir, "grayarx-logo-animated.webp");
  if (existsSync(dest) && readFileSync(dest).length >= 5_000) return;
  const url =
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp";
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Skip animated webp download: ${res.status}`);
    return;
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log("Downloaded grayarx-logo-animated.webp");
}

async function main() {
  ensureMasterFromFull();
  await cropCrestFromFull();
  await buildIconSizes();
  await downloadAnimatedIfMissing();
  await syncLogoSvg();
  deleteObsolete();

  console.log("\nDone. Canonical set:");
  console.log("- grayarx-logo-full.png / logo.png = full lockup (source)");
  console.log("- logo-crest.png = circular crest (~2% pad)");
  console.log("- favicon-*/icon-* / logo.svg = derived from crest");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
