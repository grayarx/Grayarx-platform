CREATE TABLE `admin2FAEnforcement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`requirementStatus` enum('not_required','required','setup_in_progress','setup_completed','exempted') NOT NULL DEFAULT 'not_required',
	`gracePeriodEndsAt` timestamp,
	`exemptionReason` text,
	`exemptedBy` int,
	`reminderSentAt` timestamp,
	`reminderCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin2FAEnforcement_id` PRIMARY KEY(`id`)
);
