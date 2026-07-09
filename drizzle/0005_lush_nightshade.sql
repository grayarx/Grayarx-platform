CREATE TABLE `improvement_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('agent_quality','lead_conversion','prospect_cadence','inventory_freshness','language_coverage','booking_followup','calling_followup','general') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`title` varchar(255) NOT NULL,
	`finding` text NOT NULL,
	`suggestedFix` text NOT NULL,
	`impactEstimate` varchar(255),
	`autoApplicable` int NOT NULL DEFAULT 0,
	`status` enum('open','applied','dismissed') NOT NULL DEFAULT 'open',
	`appliedAt` timestamp,
	`payload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `improvement_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`prospectId` int,
	`inboundMessage` text NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`draftText` text NOT NULL,
	`score` decimal(4,2),
	`attempts` int NOT NULL DEFAULT 1,
	`issues` text,
	`status` enum('draft','approved','sent','dismissed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_activity` MODIFY COLUMN `agentId` enum('email','calling','booking','prospector','improvement','whatsapp') NOT NULL;