-- Trade-in dealer network columns (run once on existing DBs)
ALTER TABLE trade_in_quotes
  ADD COLUMN IF NOT EXISTS province VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS photoUrls TEXT NULL,
  ADD COLUMN IF NOT EXISTS networkListed INT NOT NULL DEFAULT 0;
