/**
 * Weekly market guide refresh — updates live trade-in desk values from SA market signals.
 * Rotates through model guides so all 28+ models refresh over ~4 weeks.
 */

import { invokeLLM } from "./llm";
import { TRADE_IN_GUIDES } from "@shared/saMarketGuides";
import {
  getLiveGuideCacheStats,
  listGuideKeysForRefresh,
  pickRepresentativeYears,
  setLiveGuideCache,
  type LiveGuideEntry,
} from "./marketGuideCache";

export const MARKET_GUIDE_REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

const MODELS_PER_RUN = 4;

export type RefreshBatchResult = {
  ok: boolean;
  guideKeys: string[];
  yearsUpdated: number;
  skipped: number;
  errors: string[];
  ranAt: string;
};

async function fetchUpdatedTradeInValue(
  guideKey: string,
  year: number,
  baseline: number,
): Promise<{ value: number; confidence: "high" | "medium" | "low"; source: string } | null> {
  const [make, model] = guideKey.split("|");
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a South African used-car market analyst. Return ONLY JSON: {"tradeInDeskZar":number,"confidence":"high"|"medium"|"low","source":string}.
Use AutoTrader SA and Cars.co.za listing medians for trade-in desk value (what dealers pay before reconditioning).
Baseline desk value for ${year} ${make} ${model} is R${baseline.toLocaleString("en-ZA")}. Only deviate up to ±12% if market clearly moved.`,
        },
        {
          role: "user",
          content: `Current SA trade-in desk value for ${year} ${make} ${model}?`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "market_guide",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tradeInDeskZar: { type: "integer" },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              source: { type: "string" },
            },
            required: ["tradeInDeskZar", "confidence", "source"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    const parsed = JSON.parse(typeof raw === "string" ? raw : "{}") as {
      tradeInDeskZar?: number;
      confidence?: "high" | "medium" | "low";
      source?: string;
    };

    if (!parsed.tradeInDeskZar || parsed.tradeInDeskZar < 10_000) return null;

    const maxDrift = baseline * 0.12;
    const clamped = Math.round(
      Math.max(baseline - maxDrift, Math.min(baseline + maxDrift, parsed.tradeInDeskZar)),
    );

    return {
      value: clamped,
      confidence: parsed.confidence ?? "medium",
      source: parsed.source ?? `Live refresh — ${guideKey} ${year}`,
    };
  } catch (e) {
    console.warn(`[marketGuideRefresh] LLM failed for ${guideKey} ${year}`, e);
    return null;
  }
}

export function nextGuideKeysToRefresh(lastGuideKey: string | null | undefined): string[] {
  const all = listGuideKeysForRefresh();
  if (all.length === 0) return [];
  let start = 0;
  if (lastGuideKey) {
    const idx = all.indexOf(lastGuideKey);
    start = idx === -1 ? 0 : (idx + 1) % all.length;
  }
  const keys: string[] = [];
  for (let i = 0; i < MODELS_PER_RUN && i < all.length; i++) {
    keys.push(all[(start + i) % all.length]!);
  }
  return keys;
}

export async function runMarketGuideRefreshBatch(
  lastGuideKey?: string | null,
): Promise<RefreshBatchResult> {
  const guideKeys = nextGuideKeysToRefresh(lastGuideKey);
  const errors: string[] = [];
  let yearsUpdated = 0;
  let skipped = 0;

  for (const guideKey of guideKeys) {
    const table = TRADE_IN_GUIDES[guideKey];
    if (!table) continue;

    const years = pickRepresentativeYears(table);
    for (const year of years) {
      const baseline = table[year];
      if (!baseline) {
        skipped += 1;
        continue;
      }

      const fetched = await fetchUpdatedTradeInValue(guideKey, year, baseline);
      if (!fetched) {
        skipped += 1;
        errors.push(`${guideKey}:${year}`);
        continue;
      }

      const { upsertMarketGuideLive } = await import("../db");
      await upsertMarketGuideLive({
        guideKey,
        year,
        tradeInValueZar: fetched.value,
        confidence: fetched.confidence,
        source: fetched.source,
      });
      yearsUpdated += 1;
    }
  }

  const lastKey = guideKeys[guideKeys.length - 1] ?? null;
  const { updateMarketGuideRefreshMeta } = await import("../db");
  await updateMarketGuideRefreshMeta({
    lastRunAt: new Date(),
    lastGuideKey: lastKey,
    modelsRefreshed: yearsUpdated,
  });

  await reloadLiveGuideCache();

  return {
    ok: errors.length === 0,
    guideKeys,
    yearsUpdated,
    skipped,
    errors,
    ranAt: new Date().toISOString(),
  };
}

export async function reloadLiveGuideCache(): Promise<void> {
  const { listMarketGuideLive } = await import("../db");
  const rows = await listMarketGuideLive();
  setLiveGuideCache(
    rows.map((r) => ({
      guideKey: r.guideKey,
      year: r.year,
      tradeInValueZar: r.tradeInValueZar,
      confidence: r.confidence as "high" | "medium" | "low",
      source: r.source,
      updatedAt: r.updatedAt,
    })),
  );
}

export async function triggerMarketGuideRefreshIfDue(
  force = false,
): Promise<{ ran: boolean; result?: RefreshBatchResult; reason?: string; stats?: ReturnType<typeof getLiveGuideCacheStats> }> {
  const { getMarketGuideRefreshMeta } = await import("../db");
  const meta = await getMarketGuideRefreshMeta();

  if (!force && meta?.lastRunAt) {
    const elapsed = Date.now() - meta.lastRunAt.getTime();
    if (elapsed < MARKET_GUIDE_REFRESH_INTERVAL_MS) {
      return { ran: false, reason: "fresh", stats: getLiveGuideCacheStats() };
    }
  }

  const result = await runMarketGuideRefreshBatch(meta?.lastGuideKey ?? null);
  return { ran: true, result, stats: getLiveGuideCacheStats() };
}
