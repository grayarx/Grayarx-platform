-- Add "fix" vehicle status so dealers can flag problem stock
-- (missing/bad data) without putting it on the public showroom.
ALTER TABLE `vehicles`
  MODIFY COLUMN `status` enum('available','reserved','sold','fix') NOT NULL DEFAULT 'available';
