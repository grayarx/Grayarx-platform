CREATE TABLE `emailEventWebhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`email` varchar(320) NOT NULL,
	`eventType` enum('delivered','opened','clicked','bounced','complained','unsubscribed','dropped','deferred','failed') NOT NULL,
	`eventData` json,
	`externalId` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `emailEventWebhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`dealershipId` int NOT NULL,
	`criteria` json NOT NULL,
	`subscriberCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `segmentMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`segmentId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `segmentMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`dealershipId` int NOT NULL,
	`status` enum('draft','scheduled','sent','failed') DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`recipientCount` int DEFAULT 0,
	`successCount` int DEFAULT 0,
	`failureCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smsCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsEventWebhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`phoneNumber` varchar(32) NOT NULL,
	`eventType` enum('sent','delivered','failed','unsubscribed') NOT NULL,
	`eventData` json,
	`externalId` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `smsEventWebhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`phoneNumber` varchar(32) NOT NULL,
	`status` enum('pending','sent','failed','bounced') DEFAULT 'pending',
	`externalId` varchar(255),
	`failureReason` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	CONSTRAINT `smsRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookEndpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`provider` enum('sendgrid','resend','twilio') NOT NULL,
	`url` varchar(2048) NOT NULL,
	`secret` varchar(255) NOT NULL,
	`isActive` tinyint DEFAULT 1,
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookEndpoints_id` PRIMARY KEY(`id`)
);
