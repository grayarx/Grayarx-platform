/**
 * Per-dealership OpenAI model tiers.
 *
 * Plan mapping (DB enum: starter / professional / enterprise):
 *   starter      (Showroom)  → gpt-4o-mini
 *   professional (Growth)    → gpt-4o-mini  (cost-safe; not GPT-4o for all)
 *   enterprise   (Multi-site)→ stronger model (gpt-4o by default)
 *
 * Env overrides (optional):
 *   OPENAI_MODEL           — Showroom / default
 *   OPENAI_MODEL_GROWTH    — Growth tier (defaults to mini)
 *   OPENAI_MODEL_PREMIUM   — Multi-site tier
 *
 * Explicit `llmModel` on the dealership row always wins when set.
 */

export type DealershipPlanId = "starter" | "professional" | "enterprise";

export function resolveOpenAIModelForDealership(opts: {
  plan?: string | null;
  llmModel?: string | null;
}): string {
  const override = opts.llmModel?.trim();
  if (override) return override;

  const plan = (opts.plan || "starter").toLowerCase();

  if (plan === "enterprise" || plan === "premium") {
    return (
      process.env.OPENAI_MODEL_PREMIUM?.trim() ||
      "gpt-4o"
    );
  }

  if (plan === "professional" || plan === "growth") {
    return process.env.OPENAI_MODEL_GROWTH?.trim() || "gpt-4o-mini";
  }

  // starter / pilot / unknown → cheap default
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function defaultModelForPlan(plan: DealershipPlanId): string {
  return resolveOpenAIModelForDealership({ plan, llmModel: null });
}
