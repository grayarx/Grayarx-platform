/**
 * Split a simple inventory CSV into smaller commits so large imports
 * (e.g. 1000 cars) stay under Cloudflare/proxy time limits.
 *
 * Assumes one vehicle per line (GrayArx demo / DMS exports). Header and
 * #-comment lines are preserved on every chunk.
 */

/** Default batch size when photo-save is ON (heavier). */
export const CSV_IMPORT_CHUNK_SIZE = 40;
/** Faster batches when keeping external image links (demo / large files). */
export const CSV_IMPORT_CHUNK_SIZE_FAST = 100;

export function splitInventoryCsv(
  csv: string,
  chunkSize = CSV_IMPORT_CHUNK_SIZE,
): string[] {
  const size = Math.max(1, chunkSize);
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
  const preamble: string[] = [];
  const data: string[] = [];
  let sawHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!sawHeader) {
      preamble.push(line);
      if (!trimmed.startsWith("#")) sawHeader = true;
      continue;
    }
    data.push(line);
  }

  if (data.length === 0) return [csv];

  const prefix = preamble.join("\n");
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += size) {
    chunks.push(`${prefix}\n${data.slice(i, i + size).join("\n")}\n`);
  }
  return chunks;
}
