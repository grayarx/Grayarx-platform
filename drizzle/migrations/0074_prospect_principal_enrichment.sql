-- Sipho auto principal-email enrichment fields on prospects
ALTER TABLE `prospects` ADD COLUMN `contactName` varchar(255) NULL;
ALTER TABLE `prospects` ADD COLUMN `contactRole` varchar(128) NULL;
ALTER TABLE `prospects` ADD COLUMN `emailVerified` int NOT NULL DEFAULT 0;
ALTER TABLE `prospects` ADD COLUMN `emailSource` varchar(64) NULL;
ALTER TABLE `prospects` ADD COLUMN `enrichedAt` timestamp NULL;
ALTER TABLE `prospects` ADD COLUMN `enrichmentNotes` text NULL;
