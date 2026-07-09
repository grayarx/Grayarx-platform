ALTER TABLE `improvement_actions` MODIFY COLUMN `status` enum('open','pending_approval','applied','dismissed') NOT NULL DEFAULT 'pending_approval';--> statement-breakpoint
ALTER TABLE `improvement_actions` ADD `confidence` decimal(4,2);--> statement-breakpoint
ALTER TABLE `improvement_actions` ADD `evidence` text;ALTER TABLE `improvement_actions` ADD `evidence` text;
