ALTER TABLE `vehicles` MODIFY COLUMN `status` enum('available','reserved','sold','fix') NOT NULL DEFAULT 'available';
