CREATE TABLE `onboarding_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`step` int NOT NULL DEFAULT 1,
	`dealershipInfo` json,
	`vehicleData` json,
	`teamMembers` json,
	`lastSavedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboarding_drafts_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_drafts_sessionId_unique` UNIQUE(`sessionId`)
);
