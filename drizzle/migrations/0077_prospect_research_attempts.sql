-- Persist Sipho research cooldowns so Railway restarts do not re-scrape
-- the same info@-only dealership sites.
-- DATETIME + explicit DEFAULT NULL: a second TIMESTAMP NULL column can fail on
-- MySQL/TiDB with "Invalid default value for 'cooldownUntil'".
CREATE TABLE IF NOT EXISTS `prospect_research_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `researchKey` varchar(320) NOT NULL,
  `dealershipName` varchar(255) NULL,
  `lastAttemptAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastStatus` varchar(32) NOT NULL,
  `cooldownUntil` datetime NULL DEFAULT NULL,
  `notes` text NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `researchKey` (`researchKey`)
);
