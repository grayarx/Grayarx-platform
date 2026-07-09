CREATE TABLE `whatsapp_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`phoneNumber` varchar(32) NOT NULL,
	`status` enum('open','closed','archived') NOT NULL DEFAULT 'open',
	`leadId` int,
	`vehicleId` int,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`messageType` enum('text','image','document','audio','video') NOT NULL DEFAULT 'text',
	`content` text NOT NULL,
	`mediaUrl` varchar(500),
	`metaMessageId` varchar(128),
	`status` enum('sent','delivered','read','failed') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`phoneNumber` varchar(32) NOT NULL,
	`messageContent` text NOT NULL,
	`messageType` enum('text','image','document','audio','video') NOT NULL DEFAULT 'text',
	`mediaUrl` varchar(500),
	`status` enum('pending','processing','sent','failed','dead_letter') NOT NULL DEFAULT 'pending',
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`nextRetryAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int,
	`eventType` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`processed` tinyint NOT NULL DEFAULT 0,
	`processedAt` timestamp,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_webhooks_id` PRIMARY KEY(`id`)
);
