CREATE TABLE `email_sequence_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`sequenceType` enum('welcome','setup_guide','first_lead_tips') NOT NULL,
	`emailSequenceId` int NOT NULL,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`sentAt` timestamp,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sequence_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_signup_email_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`sequenceType` enum('welcome','setup_guide','first_lead_tips') NOT NULL,
	`emailTemplateId` varchar(255) NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`subject` varchar(255) NOT NULL,
	`bodyHtml` text NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`bounceReason` varchar(255),
	`status` enum('scheduled','sent','failed','bounced','opened','clicked') NOT NULL DEFAULT 'scheduled',
	`trackingPixelId` varchar(255),
	`sendgridMessageId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_signup_email_sequences_id` PRIMARY KEY(`id`)
);
