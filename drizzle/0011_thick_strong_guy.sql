CREATE TABLE `approval_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`agentId` varchar(32) NOT NULL,
	`actionType` enum('send_email','send_whatsapp','make_call','send_invoice','send_reminder','create_booking','update_lead','high_value_invoice','other') NOT NULL,
	`subjectType` varchar(32),
	`subjectId` int,
	`summary` text NOT NULL,
	`payloadJson` json,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`decidedBy` int,
	`decidedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`region` varchar(64),
	`monthlyVolume` int,
	`languages` json,
	`vehicleTypes` json,
	`businessHoursJson` json,
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Johannesburg',
	`status` enum('onboarding','active','paused','suspended') NOT NULL DEFAULT 'onboarding',
	`plan` enum('starter','professional','enterprise') NOT NULL DEFAULT 'starter',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealerships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fallback_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`leadId` int,
	`customerName` varchar(255),
	`customerContact` varchar(320),
	`referenceNumber` varchar(32) NOT NULL,
	`channel` enum('email','whatsapp','call','web_chat') NOT NULL,
	`inboundMessage` text,
	`outboundReply` text NOT NULL,
	`language` varchar(8) DEFAULT 'en',
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fallback_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `fallback_messages_referenceNumber_unique` UNIQUE(`referenceNumber`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipName` varchar(255) NOT NULL,
	`ownerName` varchar(255) NOT NULL,
	`ownerEmail` varchar(320) NOT NULL,
	`ownerPhone` varchar(32) NOT NULL,
	`region` varchar(64),
	`monthlyVolume` int,
	`vehicleTypes` json,
	`languages` json,
	`csvUrl` varchar(500),
	`notes` text,
	`status` enum('new','reviewing','approved','rejected','provisioned') NOT NULL DEFAULT 'new',
	`provisionedDealershipId` int,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboarding_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upgrade_roadmap` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('new_agent','agent_improvement','integration','ui_ux','performance','security','compliance','billing','other') NOT NULL,
	`creditCostEstimate` int NOT NULL,
	`roiEstimateZar` int,
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('pending','approved_for_build','in_progress','completed','dismissed') NOT NULL DEFAULT 'pending',
	`evidenceJson` json,
	`source` varchar(64) DEFAULT 'kagiso_audit',
	`dealershipScope` varchar(64) DEFAULT 'platform',
	`hash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_roadmap_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','founder','dealer_owner','dealer_consultant') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `dealershipId` int;