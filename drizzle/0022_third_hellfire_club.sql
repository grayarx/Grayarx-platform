CREATE TABLE `lead_followups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`step` enum('day_1','day_3','day_7') NOT NULL,
	`dueAt` timestamp NOT NULL,
	`status` enum('pending','sent','cancelled','failed') NOT NULL DEFAULT 'pending',
	`language` varchar(5) NOT NULL DEFAULT 'en',
	`sentAt` timestamp,
	`errorMessage` text,
	`draftPreview` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_followups_id` PRIMARY KEY(`id`)
);
