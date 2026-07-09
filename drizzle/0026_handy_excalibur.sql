CREATE TABLE `email_campaign_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`templateId` int NOT NULL,
	`leadId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`unsubscribedAt` timestamp,
	`trackingPixelId` varchar(64),
	`status` enum('pending','sent','opened','clicked','bounced','unsubscribed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaign_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` enum('new_lead','demo_request','manual','abandoned_cart') NOT NULL,
	`status` enum('draft','active','paused','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`bodyHtml` text NOT NULL,
	`delayHours` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_campaign_logs` ADD CONSTRAINT `email_campaign_logs_sequenceId_email_sequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `email_sequences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_campaign_logs` ADD CONSTRAINT `email_campaign_logs_templateId_email_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `email_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_campaign_logs` ADD CONSTRAINT `email_campaign_logs_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_templates` ADD CONSTRAINT `email_templates_sequenceId_email_sequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `email_sequences`(`id`) ON DELETE no action ON UPDATE no action;