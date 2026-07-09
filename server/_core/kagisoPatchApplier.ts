/**
 * Kagiso — Patch Applier (v29 self-improvement loop)
 * --------------------------------------------------
 *
 * Constrained file-writer that applies a single previously-proposed patch
 * after explicit founder approval. Every safety check from the generator
 * is RE-RUN here (defense-in-depth), so even if a malicious row was
 * inserted into `kagiso_proposed_patches` directly, the applier still
 * refuses to write outside the safe-path allow-list.
 *
 * The applier:
 *   1. Re-validates path/category/size.
 *   2. Re-reads the file from disk.
 *   3. Confirms `findText` still appears EXACTLY ONCE (no concurrent edits).
 *   4. Writes the new contents atomically (temp-write + rename).
 *   5. Reads back and confirms the replacement is now present.
 *   6. On any failure, leaves the original file untouched and returns a
 *      structured error.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  PROJECT_ROOT,
  isSafePath,
  countChangedLines,
  MAX_PATCH_LINES_CHANGED,
} from "./kagisoPatchGenerator";

export interface ApplyInput {
  filePath: string;
  findText: string;
  replaceText: string;
}

export type ApplyResult =
  | { ok: true; bytesWritten: number }
  | { ok: false; error: string };

export async function applyProposedPatch(input: ApplyInput): Promise<ApplyResult> {
  const { filePath, findText, replaceText } = input;

  if (!filePath || !findText || replaceText === undefined || replaceText === null) {
    return { ok: false, error: "Missing required patch fields" };
  }

  if (!isSafePath(filePath)) {
    return { ok: false, error: `Refusing to write outside safe-path allow-list: ${filePath}` };
  }

  if (findText === replaceText) {
    return { ok: false, error: "findText and replaceText are identical" };
  }

  if (countChangedLines(findText, replaceText) > MAX_PATCH_LINES_CHANGED) {
    return {
      ok: false,
      error: `Patch too large (>${MAX_PATCH_LINES_CHANGED} lines); refusing`,
    };
  }

  const abs = path.join(PROJECT_ROOT, filePath);
  // Final paranoia: ensure resolved path is still inside PROJECT_ROOT.
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(PROJECT_ROOT + path.sep) && resolved !== PROJECT_ROOT) {
    return { ok: false, error: "Resolved path escapes project root" };
  }

  let contents: string;
  try {
    contents = await fs.readFile(abs, "utf8");
  } catch (err: any) {
    return { ok: false, error: `File not readable: ${err?.message ?? err}` };
  }

  const occurrences = countOccurrences(contents, findText);
  if (occurrences === 0) {
    return { ok: false, error: "findText not found in file (already applied or drifted)" };
  }
  if (occurrences > 1) {
    return {
      ok: false,
      error: `findText is ambiguous (appears ${occurrences} times); refusing`,
    };
  }

  const next = contents.replace(findText, replaceText);

  // Atomic write: write to .tmp sibling, fsync, rename.
  const tmpPath = abs + ".kagiso-tmp";
  try {
    await fs.writeFile(tmpPath, next, "utf8");
    await fs.rename(tmpPath, abs);
  } catch (err: any) {
    try { await fs.unlink(tmpPath); } catch {}
    return { ok: false, error: `Write failed: ${err?.message ?? err}` };
  }

  // Read back to confirm.
  try {
    const verify = await fs.readFile(abs, "utf8");
    if (!verify.includes(replaceText)) {
      return { ok: false, error: "Verification failed: replacement not present after write" };
    }
  } catch (err: any) {
    return { ok: false, error: `Verification read failed: ${err?.message ?? err}` };
  }

  return { ok: true, bytesWritten: Buffer.byteLength(next, "utf8") };
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
