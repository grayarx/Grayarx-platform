/**
 * Kagiso code writer — generates TypeScript/React code patches via LLM
 * for findings that require logic changes, not just text replacement.
 * Patches are stored in kagiso_proposed_patches and await founder approval
 * before application. NEVER auto-applies patches.
 */
import fs from "fs/promises";
import { invokeLLM } from "./llm";

export type CodePatchInput = {
  findingTitle: string;
  findingDescription: string;
  rationale: string;
  /** Relative path from project root. */
  filePath: string;
  /** The relevant section of the file (up to ~200 lines). */
  currentCode: string;
  /** What to change in plain English. */
  instruction: string;
};

export type CodePatchResult = {
  success: boolean;
  patchType: "replace_text" | "insert_after" | "logic_fix";
  findText: string;
  replaceText: string;
  diffPreview: string;
  /** 0–1 confidence the patch is correct and safe. */
  confidence: number;
  explanation: string;
};

/**
 * Generate a code patch using the LLM. The model is given the current code
 * and asked to produce a minimal, safe replacement. Returns null when the
 * LLM fails, the response is unparsable, confidence < 0.6, or findText is empty.
 */
export async function generateCodePatch(
  input: CodePatchInput,
): Promise<CodePatchResult | null> {
  const prompt = `You are a TypeScript/React expert code patch generator for the GrayArx platform.

Finding: ${input.findingTitle}
Description: ${input.findingDescription}
Rationale: ${input.rationale}
File: ${input.filePath}
Instruction: ${input.instruction}

Current code section:
\`\`\`typescript
${input.currentCode.slice(0, 6000)}
\`\`\`

Generate a minimal, safe code patch. Respond ONLY with valid JSON matching this exact schema:
{
  "findText": "the exact string to find (must exist verbatim in the code above, including whitespace)",
  "replaceText": "the replacement string (must be syntactically valid TypeScript)",
  "explanation": "what this patch does and why it is safe",
  "confidence": 0.75,
  "patchType": "replace_text"
}

Rules:
- findText MUST be a unique, verbatim substring of the current code shown above
- replaceText MUST be syntactically valid TypeScript
- confidence: 0.6–1.0 based on certainty (below 0.6 → do not submit)
- patchType: "replace_text" | "insert_after" | "logic_fix"
- Keep the patch minimal — change as few lines as possible
- Do NOT invent functionality not described in the instruction
- If you cannot produce a safe patch, set confidence to 0.0`;

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a code patch generator for a production TypeScript application. Respond ONLY with valid JSON — no markdown fences, no explanation outside the JSON object.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = result.choices?.[0]?.message?.content?.toString() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      findText?: string;
      replaceText?: string;
      explanation?: string;
      confidence?: number;
      patchType?: string;
    };

    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
    const findText = (parsed.findText ?? "").trim();
    const replaceText = parsed.replaceText ?? "";

    if (confidence < 0.6 || !findText || !replaceText) return null;

    const validPatchTypes = ["replace_text", "insert_after", "logic_fix"];
    const patchType = validPatchTypes.includes(parsed.patchType ?? "")
      ? (parsed.patchType as CodePatchResult["patchType"])
      : "replace_text";

    const diffLines = [
      `--- ${input.filePath}`,
      `+++ ${input.filePath}`,
      `@@ patch @@`,
      ...findText.split("\n").map((l) => `-${l}`),
      ...replaceText.split("\n").map((l) => `+${l}`),
    ];
    const diffPreview = diffLines.join("\n");

    return {
      success: true,
      patchType,
      findText,
      replaceText,
      diffPreview,
      confidence,
      explanation: parsed.explanation ?? "",
    };
  } catch (err) {
    console.error("[KagisoCodeWriter] generateCodePatch failed:", err);
    return null;
  }
}

/**
 * Validate a proposed patch:
 * - Checks findText exists verbatim in the file
 * - Checks replaceText is non-empty
 * - Basic bracket balance sanity check on replaceText
 */
export async function validatePatch(
  filePath: string,
  patch: CodePatchResult,
): Promise<{ valid: boolean; reason?: string }> {
  if (!patch.findText || !patch.replaceText) {
    return { valid: false, reason: "findText or replaceText is empty" };
  }

  let fileContent: string;
  try {
    fileContent = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    return { valid: false, reason: `Cannot read file: ${String(err)}` };
  }

  if (!fileContent.includes(patch.findText)) {
    return {
      valid: false,
      reason: "findText not found verbatim in file — patch may be stale",
    };
  }

  // Basic bracket balance: allow ≤ 2 unclosed brackets (e.g. partial block replacement)
  const open = (patch.replaceText.match(/[{[(]/g) ?? []).length;
  const close = (patch.replaceText.match(/[}\])]/g) ?? []).length;
  if (Math.abs(open - close) > 2) {
    return {
      valid: false,
      reason: `Unbalanced brackets in replaceText (open=${open}, close=${close})`,
    };
  }

  return { valid: true };
}

/**
 * Apply a patch to the filesystem. Only called after founder approval.
 * Creates a .bak backup before applying. Restores the original on write failure.
 */
export async function applyPatch(
  filePath: string,
  patch: CodePatchResult,
): Promise<{ applied: boolean; backedUpTo?: string; error?: string }> {
  let fileContent: string;
  try {
    fileContent = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    return { applied: false, error: `Cannot read file: ${String(err)}` };
  }

  if (!fileContent.includes(patch.findText)) {
    return { applied: false, error: "findText not found in file — patch cannot be applied" };
  }

  const backupPath = `${filePath}.bak`;
  try {
    await fs.writeFile(backupPath, fileContent, "utf-8");
  } catch (err) {
    return { applied: false, error: `Cannot create backup at ${backupPath}: ${String(err)}` };
  }

  // Replace only the first occurrence
  const patched = fileContent.replace(patch.findText, patch.replaceText);
  try {
    await fs.writeFile(filePath, patched, "utf-8");
  } catch (err) {
    // Attempt to restore original
    try {
      await fs.writeFile(filePath, fileContent, "utf-8");
    } catch {
      // Ignore restore failure — backup still exists at backupPath
    }
    return {
      applied: false,
      error: `Cannot write patched file: ${String(err)}`,
    };
  }

  return { applied: true, backedUpTo: backupPath };
}
