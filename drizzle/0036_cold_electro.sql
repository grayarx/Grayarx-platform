CREATE TABLE `admin_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`targetUserId` int,
	`changesJson` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(10) NOT NULL,
	`method` enum('sms','email','authenticator') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_2fa_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`method` enum('authenticator','sms','email') NOT NULL,
	`secret` varchar(255),
	`backupCodes` text,
	`enabled` tinyint NOT NULL DEFAULT 0,
	`enabledAt` timestamp,
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_2fa_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`resourceType` varchar(64),
	`resourceId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`status` enum('success','failed','2fa_pending') NOT NULL,
	`failureReason` varchar(255),
	`loginMethod` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_login_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('google','apple') NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`email` varchar(320),
	`name` varchar(255),
	`avatarUrl` varchar(500),
	`linkedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_audit_log` ADD CONSTRAINT `admin_audit_log_adminId_users_id_fk` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_audit_log` ADD CONSTRAINT `admin_audit_log_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `otp_codes` ADD CONSTRAINT `otp_codes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_2fa_settings` ADD CONSTRAINT `user_2fa_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_activity_log` ADD CONSTRAINT `user_activity_log_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_login_history` ADD CONSTRAINT `user_login_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_social_accounts` ADD CONSTRAINT `user_social_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;