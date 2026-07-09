CREATE TABLE `email_change_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentEmail` varchar(320) NOT NULL,
	`newEmail` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`isUsed` int NOT NULL DEFAULT 0,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_change_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_change_requests_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `email_change_requests` ADD CONSTRAINT `email_change_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;