CREATE TABLE `webhook_integrations` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`type` enum('slack','pagerduty','custom') NOT NULL,
	`webhookUrl` text NOT NULL,
	`apiKey` varchar(255),
	`channel` varchar(255),
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_integrations_id` PRIMARY KEY(`id`)
);
