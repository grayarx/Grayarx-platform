CREATE TABLE `agent_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` enum('email','calling','booking','prospector') NOT NULL,
	`action` varchar(64) NOT NULL,
	`subjectType` varchar(32),
	`subjectId` int,
	`summary` varchar(500) NOT NULL,
	`payload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_activity_id` PRIMARY KEY(`id`)
);
