/**
 * Kagiso — Patch Generator (v29 self-improvement loop)
 * -----------------------------------------------------
 *
 * For a narrow allow-list of recurring audit findings, propose a single
 * structured patch (find/replace inside one file). The generator NEVER
 * applies anything; it only produces a `ProposedPatchDraft` that's
 * persisted to `kagiso_proposed_patches` for the founder to one-click
 * approve in the admin UI.
 *
 * Hard constraints:
 *   - One file per patch.
 *   - File path MUST be in `SAFE_PATH_PREFIXES` (no _core/, no drizzle/,
 *     no auth, no payments).
 *   - `findText` must appear EXACTLY ONCE in the file (anchored), else
 *     the patch is skipped — no fuzzy guessing.
 *   - `replaceText` may differ from `findText` by at most 80 lines.
 *   - The recipe is keyed by Kagiso finding hash, so the same generator
 *     can't drift to a different file by accident.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Finding } from "./kagisoFullAudit";
import type { ProposedPatchCategory } from "../db";

// ESM-safe __dirname equivalent (the dev server runs as ES modules under tsx).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ProposedPatchDraft {
  category: ProposedPatchCategory;
  title: string;
  rationale: string;
  filePath: string; // POSIX relative to project root
  findText: string;
  replaceText: string;
  diffPreview: string;
}

/**
 * Project root — generator + applier both compute paths relative to this so
 * a misconfigured CWD can't escape the sandbox.
 */
export const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

/**
 * Only files inside one of these prefixes can be touched. Everything else
 * (server/_core, drizzle, package.json, .env, auth/oauth, payment, storage)
 * is OFF-LIMITS by design.
 */
export const SAFE_PATH_PREFIXES: readonly string[] = Object.freeze([
  "client/src/pages/",
  "client/src/components/",
  "client/index.html",
  "shared/languages.ts",
  "shared/agents.ts",
  "shared/const.ts",
]);

/** Hard cap so a "patch" can never be a rewrite. */
export const MAX_PATCH_LINES_CHANGED = 80;

export function isSafePath(rel: string): boolean {
  const norm = rel.replace(/^\.\//, "").replace(/\\/g, "/");
  if (norm.includes("..")) return false;
  if (norm.startsWith("/")) return false;
  for (const prefix of SAFE_PATH_PREFIXES) {
    if (prefix.endsWith("/")) {
      if (norm.startsWith(prefix)) return true;
    } else {
      if (norm === prefix) return true;
    }
  }
  return false;
}

export function countChangedLines(find: string, replace: string): number {
  return Math.max(find.split("\n").length, replace.split("\n").length);
}

export function renderUnifiedDiff(
  filePath: string,
  find: string,
  replace: string,
): string {
  const findLines = find.split("\n");
  const replaceLines = replace.split("\n");
  const lines = [`--- a/${filePath}`, `+++ b/${filePath}`];
  lines.push(`@@ -1,${findLines.length} +1,${replaceLines.length} @@`);
  for (const l of findLines) lines.push(`- ${l}`);
  for (const l of replaceLines) lines.push(`+ ${l}`);
  return lines.join("\n");
}

/** Recipe = a deterministic blueprint of a single safe patch. */
interface PatchRecipe {
  category: ProposedPatchCategory;
  filePath: string;
  findText: string;
  replaceText: string;
  /** Defaults to the finding title; override if a tighter label helps. */
  titleOverride?: string;
  /** Defaults to the finding rationale; override for patch-specific reasoning. */
  rationaleOverride?: string;
}

/**
 * Allow-list of safe patches, keyed by Kagiso finding hash. Each entry is a
 * single, fully-specified find/replace. Adding new recipes is a deliberate
 * code change — they don't come from the LLM, they come from the founder/
 * agent author committing them here.
 */
export const SAFE_PATCH_RECIPES: Record<string, PatchRecipe> = {
  // Example seed recipe — if Kagiso ever finds stale "7 languages" phrasing
  // anywhere on the homepage, the loop already has a safe correction ready.
  // The recipe is intentionally one we know is idempotent (no-op if the
  // homepage was already corrected, because the findText won't be present).
  "kg-marketing-7-languages-home": {
    category: "stale_copy",
    filePath: "client/src/pages/Home.tsx",
    findText: "7 South African official languages",
    replaceText: "11 South African official languages",
    titleOverride: "Replace stale '7 languages' phrasing on Home",
    rationaleOverride:
      "Public marketing copy must say all 11 SA official languages (plus Portuguese) — anything less under-sells the platform and risks brand trust. Safe single-string replacement, idempotent if already corrected.",
  },
  "kg-marketing-seven-languages-home": {
    category: "stale_copy",
    filePath: "client/src/pages/Home.tsx",
    findText: "seven South African official languages",
    replaceText: "all 11 South African official languages",
    titleOverride: "Replace stale 'seven languages' phrasing on Home",
    rationaleOverride: "Same brand-trust rationale as the numeric variant.",
  },
};

/**
 * For each finding produced by `runKagisoFullAudit`, optionally return a
 * `ProposedPatchDraft` that is safe to enqueue. The function never throws —
 * if the recipe can't apply (file missing, findText not present, etc.) it
 * silently skips that finding.
 */
export async function proposePatchesForFindings(findings: Finding[]): Promise<{
  finding: Finding;
  draft: ProposedPatchDraft;
}[]> {
  const out: { finding: Finding; draft: ProposedPatchDraft }[] = [];
  for (const f of findings) {
    const recipe = SAFE_PATCH_RECIPES[f.hash];
    if (!recipe) continue;
    const draft = await draftFromRecipe(f, recipe);
    if (draft) out.push({ finding: f, draft });
  }
  return out;
}

async function draftFromRecipe(
  finding: Finding,
  recipe: PatchRecipe,
): Promise<ProposedPatchDraft | null> {
  if (!isSafePath(recipe.filePath)) return null;
  if (countChangedLines(recipe.findText, recipe.replaceText) > MAX_PATCH_LINES_CHANGED) {
    return null;
  }

  const abs = path.join(PROJECT_ROOT, recipe.filePath);
  let contents: string;
  try {
    contents = await fs.readFile(abs, "utf8");
  } catch {
    return null;
  }

  // findText MUST appear exactly once — never zero (nothing to do) and never
  // multiple times (ambiguity = unsafe).
  const occurrences = countOccurrences(contents, recipe.findText);
  if (occurrences !== 1) return null;

  // If the file already contains the replacement and not the find, the patch
  // is already applied — skip silently.
  if (!contents.includes(recipe.findText)) return null;

  return {
    category: recipe.category,
    title: recipe.titleOverride ?? finding.title,
    rationale: recipe.rationaleOverride ?? finding.rationale,
    filePath: recipe.filePath,
    findText: recipe.findText,
    replaceText: recipe.replaceText,
    diffPreview: renderUnifiedDiff(recipe.filePath, recipe.findText, recipe.replaceText),
  };
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}
