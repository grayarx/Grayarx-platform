CREATE TABLE IF NOT EXISTS market_guide_live (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guideKey VARCHAR(120) NOT NULL,
  year INT NOT NULL,
  tradeInValueZar INT NOT NULL,
  confidence VARCHAR(16) NOT NULL DEFAULT 'medium',
  source VARCHAR(255) NOT NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_market_guide_live_key_year (guideKey, year)
);

CREATE TABLE IF NOT EXISTS market_guide_refresh_meta (
  id INT PRIMARY KEY DEFAULT 1,
  lastRunAt TIMESTAMP NULL,
  lastGuideKey VARCHAR(120) NULL,
  modelsRefreshed INT NOT NULL DEFAULT 0
);

INSERT IGNORE INTO market_guide_refresh_meta (id, modelsRefreshed) VALUES (1, 0);
