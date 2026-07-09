ALTER TABLE `upgrade_roadmap` ADD `auditSection` varchar(48);--> statement-breakpoint
ALTER TABLE `upgrade_roadmap` ADD `severity` enum('info','low','medium','high','critical') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `upgrade_roadmap` ADD `agentAutonomous` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `upgrade_roadmap` ADD `humanRequired` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `upgrade_roadmap` ADD `rationale` text;--> statement-breakpoint
ALTER TABLE `upgrade_roadmap` ADD `llmTokensEstimate` int;