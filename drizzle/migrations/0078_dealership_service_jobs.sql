-- Durable workshop diary + parts booked onto a job (replaces ephemeral service.json)
CREATE TABLE IF NOT EXISTS `dealership_service_jobs` (
  `id` VARCHAR(64) NOT NULL,
  `dealershipId` VARCHAR(64) NOT NULL,
  `buyerName` VARCHAR(255) NOT NULL,
  `buyerPhone` VARCHAR(64) NOT NULL,
  `vehicleDesc` VARCHAR(255) NOT NULL,
  `serviceType` VARCHAR(32) NOT NULL,
  `scheduledAt` TIMESTAMP NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `source` VARCHAR(16) NOT NULL,
  `nalaReply` TEXT NOT NULL,
  `notes` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `dealership_service_jobs_dealer` (`dealershipId`),
  KEY `dealership_service_jobs_sched` (`dealershipId`, `scheduledAt`)
);

CREATE TABLE IF NOT EXISTS `dealership_job_parts` (
  `id` VARCHAR(64) NOT NULL,
  `dealershipId` VARCHAR(64) NOT NULL,
  `serviceJobId` VARCHAR(64) NOT NULL,
  `enquiryId` VARCHAR(64) NULL,
  `partId` VARCHAR(64) NOT NULL,
  `sku` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `qty` INT NOT NULL,
  `retailPrice` DECIMAL(12,2) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `dealership_job_parts_job` (`serviceJobId`),
  KEY `dealership_job_parts_dealer` (`dealershipId`)
);
