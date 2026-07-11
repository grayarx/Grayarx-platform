CREATE TABLE `compliance_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mailbox` enum('privacy','legal','hello','other') NOT NULL DEFAULT 'other',
	`source` enum('web_form','resend_inbound','manual') NOT NULL DEFAULT 'web_form',
	`senderName` varchar(255),
	`senderEmail` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','read','replied','archived') NOT NULL DEFAULT 'new',
	`externalId` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `compliance_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_guide_live` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guideKey` varchar(120) NOT NULL,
	`year` int NOT NULL,
	`tradeInValueZar` int NOT NULL,
	`confidence` varchar(16) NOT NULL DEFAULT 'medium',
	`source` varchar(255) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `market_guide_live_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_guide_refresh_meta` (
	`id` int NOT NULL DEFAULT 1,
	`lastRunAt` timestamp,
	`lastGuideKey` varchar(120),
	`modelsRefreshed` int NOT NULL DEFAULT 0,
	CONSTRAINT `market_guide_refresh_meta_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_in_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`dealershipName` varchar(255) NOT NULL,
	`inviteMessage` text NOT NULL,
	`indicativeOfferZar` int,
	`leadId` int,
	`smsSent` int NOT NULL DEFAULT 0,
	`emailSent` int NOT NULL DEFAULT 0,
	`whatsappSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_in_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dealerships` ADD `showroomTheme` varchar(32) DEFAULT 'futuristic';--> statement-breakpoint
ALTER TABLE `dealerships` ADD `whatsappPhoneNumberId` varchar(64);--> statement-breakpoint
ALTER TABLE `trade_in_quotes` ADD `province` varchar(64);--> statement-breakpoint
ALTER TABLE `trade_in_quotes` ADD `photoUrls` text;--> statement-breakpoint
ALTER TABLE `trade_in_quotes` ADD `networkListed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `dealershipId` int;