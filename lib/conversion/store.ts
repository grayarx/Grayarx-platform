import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function readJsonFile<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) {
    writeFileSync(path, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile<T>(filename: string, value: T): void {
  ensureDataDir();
  writeFileSync(
    join(DATA_DIR, filename),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
