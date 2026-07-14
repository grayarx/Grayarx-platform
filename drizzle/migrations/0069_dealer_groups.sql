-- Multi-branch dealer groups. Branches remain separate dealerships rows;
-- dealerships.groupKey matches dealer_groups.key (varchar lookup, no FK).
CREATE TABLE IF NOT EXISTS dealer_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ownerUserId INT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dealer_groups_key (`key`)
);

-- Index for sibling-branch lookups by groupKey.
CREATE INDEX idx_dealerships_groupKey ON dealerships (groupKey);
