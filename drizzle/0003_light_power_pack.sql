CREATE TABLE `call_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prospectId` int NOT NULL,
	`provider` varchar(32) NOT NULL DEFAULT 'twilio',
	`providerCallSid` varchar(128),
	`toNumber` varchar(32) NOT NULL,
	`fromNumber` varchar(32),
	`status` enum('queued','initiated','in_progress','completed','failed','no_answer','busy','skipped') NOT NULL DEFAULT 'queued',
	`durationSeconds` int,
	`errorMessage` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_attempts_id` PRIMARY KEY(`id`)
);
