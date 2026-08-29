-- Persist Sipho research cooldowns so Railway restarts do not re-scrape
-- the same info@-only dealership sites.
CREATE TABLE IF NOT EXISTS `prospect_research_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `researchKey` varchar(320) NOT NULL,
  `dealershipName` varchar(255) NULL,
  `lastAttemptAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastStatus` varchar(32) NOT NULL,
  `cooldownUntil` timestamp NULL,
  `notes` text NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `researchKey` (`researchKey`)
);
