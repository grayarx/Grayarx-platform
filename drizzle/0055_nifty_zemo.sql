CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`scopes` json NOT NULL,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`active` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`resourceType` varchar(32) NOT NULL,
	`resourceId` int NOT NULL,
	`payload` json NOT NULL,
	`status` enum('pending','delivered','failed','retrying') NOT NULL DEFAULT 'pending',
	`retryCount` int NOT NULL DEFAULT 0,
	`nextRetryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookId` int NOT NULL,
	`webhookEventId` int NOT NULL,
	`attempt` int NOT NULL DEFAULT 1,
	`statusCode` int,
	`responseBody` text,
	`errorMessage` text,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`events` json NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`secret` varchar(255) NOT NULL,
	`lastTriggeredAt` timestamp,
	`failureCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
