#!/usr/bin/env node
/**
 * Render GrayArx Facebook ad HTML templates to JPG via headless Chrome.
 */
import { spawn } from "node:child_process";
import { mkdir, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const templates = join(root, "templates");
const outDir = join(root, "uploads");

const jobs = [
  { file: "feed-1080.html", width: 1080, height: 1080, out: "grayarx-fb-feed-1080.jpg" },
  { file: "landscape-1200x628.html", width: 1200, height: 628, out: "grayarx-fb-landscape-1200x628.jpg" },
  { file: "story-1080x1920.html", width: 1080, height: 1920, out: "grayarx-fb-story-1080x1920.jpg" },
];

function run(cmd, args, extra = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [...extra, ...args], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || (cmd === "timeout" && code === 124)) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

await mkdir(outDir, { recursive: true });

for (const job of jobs) {
  const html = pathToFileURL(join(templates, job.file)).href;
  const png = join(outDir, job.out.replace(".jpg", ".png"));
  const jpg = join(outDir, job.out);
  await run("timeout", [
    "20",
    "google-chrome",
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    `--user-data-dir=/tmp/grayarx-fb-ad-chrome-${job.out}`,
    "--force-device-scale-factor=1",
    `--window-size=${job.width},${job.height}`,
    "--virtual-time-budget=2500",
    `--screenshot=${png}`,
    html,
  ]);
  await run("ffmpeg", ["-y", "-i", png, "-q:v", "1", "-update", "1", "-frames:v", "1", jpg]);
  await unlink(png);
  console.log("wrote", jpg);
}
