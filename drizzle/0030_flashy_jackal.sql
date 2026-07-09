CREATE TABLE `scheduled_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`reportTemplateId` int NOT NULL,
	`recipientEmails` text NOT NULL,
	`frequency` enum('weekly','monthly','quarterly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`timeOfDay` varchar(8) NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Johannesburg',
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`scheduleCronTaskUid` varchar(65),
	`lastSentAt` timestamp,
	`nextScheduledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_reports_id` PRIMARY KEY(`id`)
);
