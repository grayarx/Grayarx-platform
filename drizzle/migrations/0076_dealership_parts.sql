-- Durable dealer parts catalog + enquiries (replaces ephemeral parts.json on Railway)
CREATE TABLE IF NOT EXISTS `dealership_parts` (
  `id` VARCHAR(64) NOT NULL,
  `dealershipId` VARCHAR(64) NOT NULL,
  `sku` VARCHAR(128) NOT NULL,
  `oemNumber` VARCHAR(128) NULL,
  `name` VARCHAR(255) NOT NULL,
  `fits` JSON NULL,
  `make` VARCHAR(64) NULL,
  `model` VARCHAR(64) NULL,
  `yearFrom` INT NULL,
  `yearTo` INT NULL,
  `costPrice` DECIMAL(12,2) NULL,
  `retailPrice` DECIMAL(12,2) NOT NULL,
  `qty` INT NOT NULL DEFAULT 0,
  `supplier` VARCHAR(255) NULL,
  `source` VARCHAR(32) NOT NULL DEFAULT 'csv_import',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dealership_parts_dealer_sku` (`dealershipId`, `sku`),
  KEY `dealership_parts_dealer` (`dealershipId`)
);

CREATE TABLE IF NOT EXISTS `dealership_parts_enquiries` (
  `id` VARCHAR(64) NOT NULL,
  `dealershipId` VARCHAR(64) NOT NULL,
  `buyerName` VARCHAR(255) NOT NULL,
  `buyerPhone` VARCHAR(64) NOT NULL,
  `message` TEXT NOT NULL,
  `partId` VARCHAR(64) NULL,
  `status` VARCHAR(32) NOT NULL,
  `nalaReply` TEXT NOT NULL,
  `holdUntil` TIMESTAMP NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `dealership_parts_enq_dealer` (`dealershipId`)
);
