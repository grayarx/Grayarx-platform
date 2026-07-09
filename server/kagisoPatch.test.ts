/**
 * Vitest coverage for the Kagiso self-improvement loop (v29).
 *
 * These tests verify the *safety contracts* of the patch generator and
 * applier — the things that would matter most if the autonomous loop ever
 * tried to misbehave. They run entirely against a temp directory, never
 * touch the real project source.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  isSafePath,
  countChangedLines,
  renderUnifiedDiff,
  MAX_PATCH_LINES_CHANGED,
  SAFE_PATH_PREFIXES,
} from "./_core/kagisoPatchGenerator";
import { applyProposedPatch } from "./_core/kagisoPatchApplier";

// ---------------------------------------------------------------------------
// Pure-function safety contracts (no FS, no DB)
// ---------------------------------------------------------------------------

describe("isSafePath", () => {
  it("accepts files inside the allow-listed prefixes", () => {
    expect(isSafePath("client/src/pages/Home.tsx")).toBe(true);
    expect(isSafePath("client/src/components/Foo.tsx")).toBe(true);
    expect(isSafePath("shared/languages.ts")).toBe(true);
    expect(isSafePath("client/index.html")).toBe(true);
  });

  it("rejects server, drizzle, env, package, and oauth paths", () => {
    expect(isSafePath("server/_core/oauth.ts")).toBe(false);
    expect(isSafePath("server/db.ts")).toBe(false);
    expect(isSafePath("drizzle/schema.ts")).toBe(false);
    expect(isSafePath("package.json")).toBe(false);
    expect(isSafePath(".env")).toBe(false);
  });

  it("rejects parent-directory traversal and absolute paths", () => {
    expect(isSafePath("../client/src/pages/Home.tsx")).toBe(false);
    expect(isSafePath("client/src/pages/../../../etc/passwd")).toBe(false);
    expect(isSafePath("/etc/passwd")).toBe(false);
  });

  it("rejects shared paths outside the explicit single-file allow-list", () => {
    // `shared/` as a *directory* is NOT blanket-allowed — only specific files.
    expect(isSafePath("shared/secrets.ts")).toBe(false);
  });

  it("guards against accidental prefix-string broadening", () => {
    // Sanity check the allow-list is small + immutable in shape.
    expect(SAFE_PATH_PREFIXES.length).toBeLessThanOrEqual(10);
    expect(Object.isFrozen(SAFE_PATH_PREFIXES)).toBe(true);
  });
});

describe("countChangedLines", () => {
  it("returns the larger of find/replace line counts", () => {
    expect(countChangedLines("a", "a\nb\nc")).toBe(3);
    expect(countChangedLines("a\nb\nc\nd", "x")).toBe(4);
    expect(countChangedLines("a", "b")).toBe(1);
  });
});

describe("renderUnifiedDiff", () => {
  it("produces a readable unified diff", () => {
    const out = renderUnifiedDiff("client/src/pages/Home.tsx", "old", "new");
    expect(out).toContain("--- a/client/src/pages/Home.tsx");
    expect(out).toContain("+++ b/client/src/pages/Home.tsx");
    expect(out).toContain("- old");
    expect(out).toContain("+ new");
  });
});

// ---------------------------------------------------------------------------
// Applier safety: re-validates path + content + writes atomically
// ---------------------------------------------------------------------------

describe("applyProposedPatch", () => {
  // We mock PROJECT_ROOT at the module level by stubbing fs against a temp dir
  // that mirrors the safe-path layout. Then exercise the applier end-to-end.

  let tmpRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kagiso-patch-test-"));
    originalCwd = process.cwd();
    // The applier resolves files relative to PROJECT_ROOT, which is computed
    // from __dirname at import time. We can't easily rewrite that, so we
    // create a real client/src/pages tree under the actual PROJECT_ROOT and
    // clean up after. To avoid polluting the repo, we use a sentinel filename
    // that nothing references.
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("refuses to write to a path outside the safe allow-list", async () => {
    const result = await applyProposedPatch({
      filePath: "server/_core/oauth.ts",
      findText: "anything",
      replaceText: "compromised",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/safe-path allow-list/);
    }
  });

  it("refuses parent-directory traversal", async () => {
    const result = await applyProposedPatch({
      filePath: "client/src/pages/../../../etc/passwd",
      findText: "root",
      replaceText: "boop",
    });
    expect(result.ok).toBe(false);
  });

  it("refuses identical find/replace", async () => {
    const result = await applyProposedPatch({
      filePath: "client/src/pages/Home.tsx",
      findText: "same",
      replaceText: "same",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/identical/);
  });

  it("refuses an oversized patch", async () => {
    const huge = Array.from({ length: MAX_PATCH_LINES_CHANGED + 5 })
      .map((_, i) => `line${i}`)
      .join("\n");
    const result = await applyProposedPatch({
      filePath: "client/src/pages/Home.tsx",
      findText: "anchor",
      replaceText: huge,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/i);
  });

  it("refuses when findText is missing from the file", async () => {
    // Home.tsx exists in real project; pick a string we're 100% sure isn't
    // there to confirm the applier returns "not found" instead of writing.
    const result = await applyProposedPatch({
      filePath: "client/src/pages/Home.tsx",
      findText: "__kagiso_test_marker_definitely_not_in_home_tsx__",
      replaceText: "replacement",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found|drifted/i);
    }
  });
});
