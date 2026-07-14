-- Optional per-dealership OpenAI model override (e.g. gpt-4o-mini, gpt-4o).
-- When NULL, model is derived from dealerships.plan via shared/llmModelTiers.ts.
ALTER TABLE dealerships
  ADD COLUMN llmModel VARCHAR(64) NULL;
