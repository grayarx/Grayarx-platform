CREATE TABLE `alert_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`eventTypes` text NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`channels` text NOT NULL,
	`webhookId` varchar(64),
	`cooldownMinutes` int NOT NULL DEFAULT 5,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auto_remediation_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`escalationLevel` int NOT NULL,
	`actions` text NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_remediation_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `global_alert_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`enableDeduplication` int NOT NULL DEFAULT 1,
	`deduplicationWindowMinutes` int NOT NULL DEFAULT 10,
	`autoCreateIncidents` int NOT NULL DEFAULT 1,
	`incidentSeverityThreshold` enum('critical','high','medium','low') NOT NULL DEFAULT 'high',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `global_alert_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `global_alert_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `remediation_action_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` varchar(64) NOT NULL,
	`triggerId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`status` enum('pending','executing','success','failed') NOT NULL DEFAULT 'pending',
	`result` text,
	`executedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `remediation_action_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `websocket_connections` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`connectionId` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastHeartbeatAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `websocket_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `websocket_connections_connectionId_unique` UNIQUE(`connectionId`)
);
--> statement-breakpoint
ALTER TABLE `alert_preferences` ADD CONSTRAINT `alert_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_preferences` ADD CONSTRAINT `alert_preferences_webhookId_webhook_integrations_id_fk` FOREIGN KEY (`webhookId`) REFERENCES `webhook_integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auto_remediation_triggers` ADD CONSTRAINT `auto_remediation_triggers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `global_alert_settings` ADD CONSTRAINT `global_alert_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `remediation_action_log` ADD CONSTRAINT `remediation_action_log_triggerId_auto_remediation_triggers_id_fk` FOREIGN KEY (`triggerId`) REFERENCES `auto_remediation_triggers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `websocket_connections` ADD CONSTRAINT `websocket_connections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;