CREATE TABLE `emailMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('signup_email_sent','verification_email_sent','verification_email_clicked','verification_email_verified','password_reset_sent','password_reset_completed','email_change_requested','email_change_verified','email_bounced','email_unsubscribed') NOT NULL,
	`emailAddress` varchar(320) NOT NULL,
	`bounceReason` varchar(255),
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marketingEmails` int NOT NULL DEFAULT 1,
	`transactionalEmails` int NOT NULL DEFAULT 1,
	`alertEmails` int NOT NULL DEFAULT 1,
	`weeklyDigest` int NOT NULL DEFAULT 1,
	`dailyDigest` int NOT NULL DEFAULT 0,
	`frequency` enum('never','daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
	`unsubscribeToken` varchar(255),
	`unsubscribedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailPreferences_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `emailPreferences_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('setup_started','setup_completed','verification_success','verification_failed','backup_codes_generated','backup_code_used','disabled','recovery_code_used') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`details` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `twoFactorAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorBackupCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(64) NOT NULL,
	`isUsed` int NOT NULL DEFAULT 0,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `twoFactorBackupCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoFactorBackupCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorSecrets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`secret` varchar(255) NOT NULL,
	`qrCode` text,
	`isEnabled` int NOT NULL DEFAULT 0,
	`enabledAt` timestamp,
	`backupCodesGenerated` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twoFactorSecrets_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoFactorSecrets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`isVerified` int NOT NULL DEFAULT 0,
	`verifiedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `twoFactorSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoFactorSessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
