/**
 * Per-dealership OpenAI model tiers.
 *
 * Plan mapping (DB enum: starter / professional / enterprise):
 *   starter  (pilot / Showroom) → cheap model
 *   professional (Growth)       → stronger model
 *   enterprise (Premium/Group)  → strongest model
 *
 * Env overrides (optional):
 *   OPENAI_MODEL           — default / starter (also used when unset)
 *   OPENAI_MODEL_GROWTH    — professional tier
 *   OPENAI_MODEL_PREMIUM   — enterprise tier
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
      process.env.OPENAI_MODEL_GROWTH?.trim() ||
      "gpt-4o"
    );
  }

  if (plan === "professional" || plan === "growth") {
    return process.env.OPENAI_MODEL_GROWTH?.trim() || "gpt-4o";
  }

  // starter / pilot / unknown → cheap default
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function defaultModelForPlan(plan: DealershipPlanId): string {
  return resolveOpenAIModelForDealership({ plan, llmModel: null });
}
