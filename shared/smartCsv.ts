/**
 * Shared CSV brain for every GrayArx importer (parts, stock, inventory, leads, prospects).
 * Dealers paste Excel, DMS exports, and messy notepads — we fix delimiter, quotes,
 * decimal commas, thousands separators, BOM, comments, and misspelt headers.
 */

export type CsvDelimiter = "," | ";" | "\t" | "|";

const HEADER_FUZZY_MIN = 0.74;
const SHORT_EXACT_MAX = 2;

export function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

export function repairCsvText(text: string): string {
  let s = stripBom(text);
  s = s
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/Â/g, "")
    .replace(/\u00a0/g, " ");
  return s;
}

export function normalizeHeaderKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[_\-./()#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Damerau–Levenshtein so a swapped letter (titel/title) counts as one typo. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) d[i]![0] = i;
  for (let j = 0; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

export function headerSimilarity(cell: string, alias: string): number {
  const a = normalizeHeaderKey(cell);
  const b = normalizeHeaderKey(alias);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) {
    const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
    return 0.82 + 0.12 * ratio;
  }
  const dist = levenshtein(a, b);
  return Math.max(0, 1 - dist / Math.max(a.length, b.length));
}

function countUnquoted(line: string, delimiter: string): number {
  let n = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) n++;
  }
  return n;
}

export function detectCsvDelimiter(text: string): CsvDelimiter {
  const sample = repairCsvText(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .slice(0, 8);
  if (sample.length === 0) return ",";
  const candidates: CsvDelimiter[] = [",", ";", "\t", "|"];
  let best: CsvDelimiter = ",";
  let bestScore = -1;
  for (const d of candidates) {
    const counts = sample.map((line) => countUnquoted(line, d));
    const avg = counts.reduce((s, n) => s + n, 0) / counts.length;
    const consistent = counts.every((n) => n === counts[0]);
    const score = avg + (consistent && avg > 0 ? 2 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return bestScore > 0 ? best : ",";
}

export function splitCsvLine(line: string, delimiter: CsvDelimiter = ","): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

/** Character-stream parse so quoted newlines stay in one cell. */
export function parseCsvGrid(text: string): { delimiter: CsvDelimiter; rows: string[][] } {
  const cleaned = repairCsvText(text);
  const delimiter = detectCsvDelimiter(cleaned);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const pushRow = () => {
    currentRow.push(currentCell.trim());
    currentCell = "";
    const joined = currentRow.join("").trim();
    if (!joined) {
      currentRow = [];
      return;
    }
    if (joined.startsWith("#") && currentRow.length === 1) {
      currentRow = [];
      return;
    }
    rows.push(currentRow);
    currentRow = [];
  };

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]!;
    const next = cleaned[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      pushRow();
    } else {
      currentCell += ch;
    }
  }
  if (currentCell || currentRow.length > 0) pushRow();

  return { delimiter, rows };
}

export function resolveHeaderMap(
  headerCells: string[],
  fields: Record<string, readonly string[]>,
): Record<string, number> {
  const used = new Set<number>();
  const map: Record<string, number> = {};

  for (const [canonical, aliases] of Object.entries(fields)) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < headerCells.length; i++) {
      if (used.has(i)) continue;
      const cell = headerCells[i] ?? "";
      let score = 0;
      for (const alias of aliases) {
        const short = normalizeHeaderKey(alias).length <= SHORT_EXACT_MAX;
        const sim = headerSimilarity(cell, alias);
        if (short && sim < 1) continue;
        if (sim > score) score = sim;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestScore >= HEADER_FUZZY_MIN) {
      map[canonical] = bestIdx;
      used.add(bestIdx);
    }
  }
  return map;
}

function mappingScore(map: Record<string, number>): number {
  return Object.keys(map).length;
}

export function mapCsvRows(
  text: string,
  fields: Record<string, readonly string[]>,
  opts?: { defaultOrder?: readonly string[] },
): Array<Record<string, string>> {
  const { rows } = parseCsvGrid(text);
  if (rows.length === 0) return [];

  let headerIdx = 0;
  let mapping = resolveHeaderMap(rows[0] ?? [], fields);
  let best = mappingScore(mapping);

  const scan = Math.min(8, rows.length);
  for (let i = 1; i < scan; i++) {
    const candidate = resolveHeaderMap(rows[i] ?? [], fields);
    const score = mappingScore(candidate);
    if (score > best && score >= 2) {
      headerIdx = i;
      mapping = candidate;
      best = score;
    }
  }

  const hasIdentity = mapping.sku != null || mapping.name != null || mapping.title != null || mapping.make != null;
  if (!hasIdentity && opts?.defaultOrder && (rows[0]?.length ?? 0) >= 3) {
    mapping = {};
    for (let i = 0; i < opts.defaultOrder.length; i++) {
      mapping[opts.defaultOrder[i]!] = i;
    }
    headerIdx = -1;
  }

  if (mappingScore(mapping) === 0) return [];

  const data = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;
  return data
    .filter((cells) => cells.some((c) => c.trim()))
    .map((cells) => {
      const out: Record<string, string> = {};
      for (const [key, idx] of Object.entries(mapping)) {
        out[key] = (cells[idx] ?? "").trim();
      }
      return out;
    });
}

/**
 * Parse dealer numbers: R 1 899 · 1,899.00 · 1899,50 · 1.899,50 · 329k
 */
export function parseFlexibleNumber(raw: string | undefined | null): number | undefined {
  if (raw == null) return undefined;
  let s = String(raw).trim();
  if (!s) return undefined;
  const hasK = /\d\s*k\b/i.test(s);
  s = s.replace(/^(zar|usd|eur|gbp|r|\$|€|£)\s*/i, "");
  s = s.replace(/\s*(zar|usd|eur|gbp|km|kms|cc|ah|units?)\s*$/i, "");
  s = s.replace(/[^\d,.\-\s]/g, "").trim();
  if (!s) return undefined;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      const after = s.length - lastComma - 1;
      normalized =
        after > 0 && after <= 2
          ? s.replace(/\./g, "").replace(",", ".").replace(/\s/g, "")
          : s.replace(/[.,\s]/g, "");
    } else {
      normalized = s.replace(/,/g, "").replace(/\s/g, "");
    }
  } else if (lastComma >= 0) {
    const after = s.length - lastComma - 1;
    const commas = (s.match(/,/g) || []).length;
    normalized =
      commas === 1 && after > 0 && after <= 2
        ? s.replace(",", ".").replace(/\s/g, "")
        : s.replace(/,/g, "").replace(/\s/g, "");
  } else if (lastDot >= 0) {
    const after = s.length - lastDot - 1;
    const dots = (s.match(/\./g) || []).length;
    if (dots > 1) {
      normalized = s.replace(/\./g, "").replace(/\s/g, "");
    } else if (after === 3) {
      const intPart = s.slice(0, lastDot).replace(/\s/g, "");
      normalized = intPart.length >= 3 ? s.replace(/\./g, "").replace(/\s/g, "") : s.replace(/\s/g, "");
    } else {
      normalized = s.replace(/\s/g, "");
    }
  } else {
    normalized = s.replace(/\s/g, "");
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return undefined;
  return hasK && Math.abs(n) < 10_000 ? n * 1000 : n;
}

export function normalizeFitment(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  return raw
    .split(/[|,;/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("|");
}
